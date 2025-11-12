// ==UserScript==
// @version      0.2.0
// @author       Bartolumiu
// @name         MangaDex Title Views
// @description  Adds view counts to MangaDex titles and chapters using a custom API.
// @updateURL    https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_views.user.js
// @downloadURL  https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_views.user.js
// @namespace    https://mangadex.org/
// @match        https://mangadex.org/title/*
// @match        https://canary.mangadex.dev/title/*
// @match        https://beta.mangadex.dev/title/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    /*
     * Disclaimer:
     * The data shown by this userscript is provided by a third-party API and not the official MangaDex API.
     * View counts may not be accurate or up-to-date. Use at your own discretion.
     * So Kakao, if you see this, shoo away, this is just a joke script made for fun. (data ain't real)
     */

    const SCRIPT_VERSION = '0.2.0';
    const ROUTE_REGEX = /^\/title\/([a-f0-9-]+)(?:\/[^/]*)?\/?$/i;
    const API_BASE_URL = 'https://mdviewsapi.tr25.es/api/';
    const AUTO_INCREMENT_ENABLED = true;
    const INCREMENT_COOLDOWN_MS = 30 * 60 * 1000;

    const MAX_CHAPTER_CONCURRENCY = 6;

    const state = {
        mangaId: null,
        stats: null,
        statsPromise: null,
        chapterCache: new Map(),
        chapterScanScheduled: false,
        titleUpdateScheduled: false,
        chapterFetchQueue: [],
        activeChapterFetches: 0,
        domObserver: null,
        currentToken: Symbol('mdviews-init'),
        lastIncrementAt: new Map(),
    };

    ensureStyle();
    observeRouteChanges();
    handleRouteChange(location.pathname);
    function ensureStyle() {
        if (document.getElementById('mdviews-inline-style')) return;
        const style = document.createElement('style');
        style.id = 'mdviews-inline-style';
        style.textContent = `
            .mdviews-inline {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                color: inherit;
                font-size: inherit;
                font-variant-numeric: tabular-nums;
            }

            .mdviews-inline.mdviews-inline--loading::after {
                content: '';
                width: 0.75em;
                height: 0.75em;
                border: 2px solid currentColor;
                border-radius: 999px;
                border-top-color: transparent;
                animation: mdviews-spin 0.8s linear infinite;
            }

            @keyframes mdviews-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .mdviews-inline--muted {
                opacity: 0.65;
            }
        `;
        document.head.appendChild(style);
    }

    function ensureDomObserver() {
        if (state.domObserver) return;
        const root = document.getElementById('__nuxt') || document.body;
        if (!root) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', ensureDomObserver, { once: true });
            }
            return;
        }

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    if (mutation.addedNodes.length || mutation.removedNodes.length) {
                        scheduleTitleUpdate();
                        scheduleChapterScan();
                        break;
                    }
                } else if (mutation.type === 'attributes') {
                    scheduleTitleUpdate();
                    scheduleChapterScan();
                    break;
                }
            }
        });

        observer.observe(root, { childList: true, subtree: true, attributes: true });
        state.domObserver = observer;
    }

    function observeRouteChanges() {
        ensureDomObserver();
        let lastPath = location.pathname;
        const observer = new MutationObserver(() => {
            if (location.pathname !== lastPath) {
                lastPath = location.pathname;
                handleRouteChange(lastPath);
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        globalThis.addEventListener('popstate', () => handleRouteChange(location.pathname));
        globalThis.addEventListener('mdviews:refresh', () => {
            if (!state.mangaId) return;
            state.stats = null;
            state.chapterCache.clear();
            scheduleTitleUpdate();
            scheduleChapterScan();
        });
    }

    function handleRouteChange(pathname) {
        ensureDomObserver();
        const match = ROUTE_REGEX.exec(pathname);
        if (!match) {
            resetStateForManga(null);
            return;
        }

        const mangaId = match[1];
        if (mangaId === state.mangaId) {
            scheduleTitleUpdate();
            scheduleChapterScan();
            return;
        }

        resetStateForManga(mangaId);
        maybeIncrementView(mangaId);
        scheduleTitleUpdate();
        scheduleChapterScan();
    }

    function resetStateForManga(mangaId) {
        state.mangaId = mangaId || null;
        state.stats = null;
        state.statsPromise = null;
        state.chapterCache.clear();
        state.chapterFetchQueue.length = 0;
        state.activeChapterFetches = 0;
        state.chapterScanScheduled = false;
        state.titleUpdateScheduled = false;
        state.currentToken = Symbol(`mdviews:${mangaId ?? 'none'}:${Date.now()}`);
    }

    function scheduleTitleUpdate() {
        if (state.titleUpdateScheduled) return;
        state.titleUpdateScheduled = true;
        const token = state.currentToken;
        requestAnimationFrame(() => flushTitleUpdate(token));
    }

    async function flushTitleUpdate(token) {
        state.titleUpdateScheduled = false;
        if (!state.mangaId || token !== state.currentToken) return;

        const container = findTitleViewContainer();
        if (!container) return;

        container.classList.remove('opacity-40');

        const slot = ensureInlineSlot(container);

        try {
            applyInlineState(slot, { status: 'loading', text: '' });
            const stats = await ensureMangaStats(false, token);
            if (token !== state.currentToken) return;
            if (stats && typeof stats.views === 'number') {
                applyInlineState(slot, { status: 'value', text: formatNumber(stats.views) });
            } else {
                applyInlineState(slot, { status: 'muted', text: '—' });
            }
        } catch (error) {
            if (token !== state.currentToken) return;
            console.warn('[MDViews] Failed to load title views', error);
            applyInlineState(slot, { status: 'error', text: '—' });
        }
    }

    function findTitleViewContainer() {
        const candidates = document.querySelectorAll('span.flex.items-center.opacity-40');
        for (const candidate of candidates) {
            if (candidate.querySelector('svg.feather-eye')) {
                return candidate;
            }
        }
        return null;
    }

    function scheduleChapterScan() {
        if (state.chapterScanScheduled) return;
        state.chapterScanScheduled = true;
        const token = state.currentToken;
        requestAnimationFrame(() => flushChapterScan(token));
    }

    function flushChapterScan(token) {
        state.chapterScanScheduled = false;
        if (token !== state.currentToken || !state.mangaId) return;
        const containers = collectChapterViewContainers();
        for (const container of containers) bindChapterNode(container, token);
        processChapterQueue();
    }

    function collectChapterViewContainers() {
        const nodes = document.querySelectorAll('[style*="grid-area: views"]');
        return Array.from(nodes).filter((node) => node.querySelector('svg.feather-eye'));
    }

    function bindChapterNode(container, token) {
        const chapterLink = container.closest('a.chapter-grid') || container.querySelector('a[href*="/chapter/"]');
        const chapterId = extractChapterId(chapterLink?.getAttribute('href'));
        if (!chapterId) return;

        if (container._mdviewsToken === token && container._mdviewsChapterId === chapterId) {
            return;
        }

        container._mdviewsToken = token;
        container._mdviewsChapterId = chapterId;

        const slot = ensureInlineSlot(container);
        container._mdviewsSlot = slot;

        if (state.chapterCache.has(chapterId)) {
            applyChapterValue(slot, state.chapterCache.get(chapterId));
            return;
        }

        enqueueChapterFetch({ chapterId, slot, token });
    }

    function enqueueChapterFetch(job) {
        if (state.chapterCache.has(job.chapterId)) {
            applyChapterValue(job.slot, state.chapterCache.get(job.chapterId));
            return;
        }

        const duplicate = state.chapterFetchQueue.some((entry) => entry.slot === job.slot && entry.chapterId === job.chapterId);
        if (duplicate) return;

        state.chapterFetchQueue.push(job);
        applyInlineState(job.slot, { status: 'loading', text: '' });
    }

    function processChapterQueue() {
        while (state.activeChapterFetches < MAX_CHAPTER_CONCURRENCY && state.chapterFetchQueue.length) {
            const job = state.chapterFetchQueue.shift();
            if (!job || job.token !== state.currentToken) {
                continue;
            }

            if (!document.contains(job.slot)) {
                continue;
            }

            state.activeChapterFetches += 1;

            fetchChapterStats(job.chapterId)
                .then((data) => {
                    state.chapterCache.set(job.chapterId, data);
                    if (job.token === state.currentToken) {
                        applyChapterValue(job.slot, data);
                    }
                })
                .catch((error) => {
                    console.warn('[MDViews] Failed to load chapter views', error);
                    if (job.token === state.currentToken) {
                        applyInlineState(job.slot, { status: 'error', text: '—' });
                    }
                })
                .finally(() => {
                    state.activeChapterFetches = Math.max(0, state.activeChapterFetches - 1);
                    if (job.token === state.currentToken) {
                        processChapterQueue();
                    }
                });
        }
    }

    async function ensureMangaStats(force, token) {
        const mangaId = state.mangaId;
        if (!mangaId) return null;

        if (!force && state.stats && state.stats.mangaId === mangaId) {
            return state.stats;
        }

        if (!force && state.statsPromise) {
            return state.statsPromise;
        }

        const promise = (async () => {
            const result = await fetchMangaStats(mangaId, force);
            if (token === state.currentToken) {
                state.stats = result;
            }
            return result;
        })();

        state.statsPromise = promise;

        try {
            return await promise;
        } finally {
            if (state.statsPromise === promise) {
                state.statsPromise = null;
            }
        }
    }

    function applyChapterValue(slot, data) {
        if (!data || typeof data.views !== 'number') {
            applyInlineState(slot, { status: 'muted', text: '—' });
            return;
        }
        applyInlineState(slot, { status: 'value', text: formatNumber(data.views) });
    }

    function applyInlineState(slot, { status, text }) {
        if (!slot) return;
        slot.classList.remove('mdviews-inline--loading', 'mdviews-inline--error', 'mdviews-inline--value', 'mdviews-inline--muted');
        if (status === 'loading') {
            slot.classList.add('mdviews-inline--loading', 'mdviews-inline--muted');
        } else if (status === 'error') {
            slot.classList.add('mdviews-inline--error');
        } else if (status === 'value') {
            slot.classList.add('mdviews-inline--value');
        } else {
            slot.classList.add('mdviews-inline--muted');
        }
        slot.textContent = text;
    }

    function ensureInlineSlot(container) {
        if (!container) return null;

        for (const node of Array.from(container.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
                node.remove();
            }
        }

        const ensureSpaceBefore = (node) => {
            if (!node.previousSibling || node.previousSibling.nodeType !== Node.TEXT_NODE) {
                container.insertBefore(document.createTextNode(' '), node);
            } else {
                node.previousSibling.textContent = ' ';
            }
        };

        let slot = container.querySelector('.mdviews-inline');
        if (slot && container.contains(slot)) {
            ensureSpaceBefore(slot);
            return slot;
        }

        const findSpanCandidate = () => {
            for (const child of Array.from(container.children)) {
                if (child.tagName === 'SPAN' && child !== container) {
                    return child;
                }
            }
            return null;
        };

        let candidate = findSpanCandidate();
        if (!candidate) {
            candidate = document.createElement('span');
            container.appendChild(candidate);
        }

        ensureSpaceBefore(candidate);

        candidate.textContent = '';
        candidate.classList.add('mdviews-inline');
        return candidate;
    }

    function extractChapterId(href) {
        if (!href) return null;
        try {
            const url = new URL(href, location.origin);
            const match = /\/chapter\/([^/?#]+)/i.exec(url.pathname);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    }

    async function fetchMangaStats(mangaId, force) {
        const url = buildUrl(`/api/views/manga/${mangaId}`, force ? { forceRefresh: '1' } : {});
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache',
        });
        if (!response.ok) {
            throw new Error(`Stats request failed (${response.status})`);
        }
        return response.json();
    }

    async function fetchChapterStats(chapterId) {
        const url = buildUrl(`/api/views/chapter/${chapterId}`, {});
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache',
        });
        if (!response.ok) {
            throw new Error(`Chapter stats request failed (${response.status})`);
        }
        return response.json();
    }


    function buildUrl(path, params) {
        const base = API_BASE_URL;
        const url = new URL(path, base.endsWith('/') ? base : `${base}/`);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, String(value));
                }
            }
        }
        url.searchParams.set('_', Date.now().toString());
        return url.toString();
    }

    async function maybeIncrementView(mangaId) {
        if (!AUTO_INCREMENT_ENABLED) return;
        const last = state.lastIncrementAt.get(mangaId) || 0;
        if (Date.now() - last < INCREMENT_COOLDOWN_MS) {
            return;
        }

        state.lastIncrementAt.set(mangaId, Date.now());

        try {
            const response = await fetch(buildUrl(`/api/views/manga/${mangaId}`, {}), {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    delta: 1,
                    event: 'title_opened',
                    metadata: {
                        source: 'userscript',
                        scriptVersion: SCRIPT_VERSION,
                        userAgent: navigator.userAgent,
                    },
                }),
            });
            if (!response.ok) {
                throw new Error(`Increment failed (${response.status})`);
            }
            const data = await response.json();
            if (state.mangaId === mangaId) {
                state.stats = data;
                scheduleTitleUpdate();
            }
        } catch (error) {
            console.warn('[MDViews] Failed to record view increment', error);
        }
    }

    function formatNumber(input) {
        if (typeof input !== 'number') input = Number(input) || 0;
        if (input >= 1000000) return `${(input / 1000000).toFixed(1)}M`;
        if (input >= 1000) return `${(input / 1000).toFixed(1)}K`;
        return input.toLocaleString();
    }

})();
