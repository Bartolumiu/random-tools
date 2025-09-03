// ==UserScript==
// @name         MangaDex Alternative Title Reorder
// @namespace    https://mangadex.org/
// @description  Add controls to reorder alternative titles on the title edit page
// @icon         https://mangadex.org/favicon.ico
// @version      0.2.2
// @updateURL    https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_title_reorder.user.js
// @downloadURL  https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_title_reorder.user.js
// @author       Bartolumiu
// @match        https://mangadex.org/*
// @match        https://canary.mangadex.dev/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const EDIT_TITLE_REGEX = /^\/title\/edit\/[a-f0-9-]+$/;

    const LANGUAGES = [
        { code: 'en', name: 'English', flag: '/img/flags/gb.svg', script: null },
        { code: 'ja', name: 'Japanese', flag: '/img/flags/jp.svg', script: '/img/scripts/kanji.svg' },
        { code: 'ja-ro', name: 'Japanese (Romanized)', flag: '/img/flags/jp.svg', script: '/img/scripts/latin.svg' },
        { code: 'ko', name: 'Korean', flag: '/img/flags/kr.svg', script: '/img/scripts/kanji.svg' },
        { code: 'ko-ro', name: 'Korean (Romanized)', flag: '/img/flags/kr.svg', script: '/img/scripts/latin.svg' },
        { code: 'zh', name: 'Chinese (Simplified)', flag: '/img/flags/cn.svg', script: '/img/scripts/kanji.svg' },
        { code: 'zh-hk', name: 'Chinese (Traditional)', flag: '/img/flags/hk.svg', script: '/img/scripts/kanji.svg' },
        { code: 'zh-ro', name: 'Chinese (Romanized)', flag: '/img/flags/cn.svg', script: '/img/scripts/latin.svg' },
        { code: 'af', name: 'Afrikaans', flag: '/img/flags/za.svg', script: null },
        { code: 'sq', name: 'Albanian', flag: '/img/flags/sq.svg', script: null },
        { code: 'ar', name: 'Arabic', flag: '/img/flags/sa.svg', script: null },
        { code: 'az', name: 'Azerbaijani', flag: '/img/flags/az.svg', script: null },
        { code: 'eu', name: 'Basque', flag: '/img/flags/eu.svg', script: null },
        { code: 'be', name: 'Belarusian', flag: '/img/flags/by.svg', script: null },
        { code: 'bn', name: 'Bengali', flag: '/img/flags/bd.svg', script: null },
        { code: 'bg', name: 'Bulgarian', flag: '/img/flags/bg.svg', script: null },
        { code: 'my', name: 'Burmese', flag: '/img/flags/mm.svg', script: null },
        { code: 'ca', name: 'Catalan', flag: '/img/flags/ad.svg', script: null },
        { code: 'cv', name: 'Chuvash', flag: '/img/flags/ru-cu.svg', script: null },
        { code: 'hr', name: 'Croatian', flag: '/img/flags/hr.svg', script: null },
        { code: 'cs', name: 'Czech', flag: '/img/flags/cz.svg', script: null },
        { code: 'da', name: 'Danish', flag: '/img/flags/dk.svg', script: null },
        { code: 'nl', name: 'Dutch', flag: '/img/flags/nl.svg', script: null },
        { code: 'eo', name: 'Esperanto', flag: '/img/flags/eo.svg', script: null },
        { code: 'et', name: 'Estonian', flag: '/img/flags/et.svg', script: null },
        { code: 'tl', name: 'Filipino', flag: '/img/flags/ph.svg', script: null },
        { code: 'fi', name: 'Finnish', flag: '/img/flags/fi.svg', script: null },
        { code: 'fr', name: 'French', flag: '/img/flags/fr.svg', script: null },
        { code: 'ka', name: 'Georgian', flag: '/img/flags/ka.svg', script: null },
        { code: 'de', name: 'German', flag: '/img/flags/de.svg', script: null },
        { code: 'el', name: 'Greek', flag: '/img/flags/gr.svg', script: null },
        { code: 'he', name: 'Hebrew', flag: '/img/flags/il.svg', script: null },
        { code: 'hi', name: 'Hindi', flag: '/img/flags/in.svg', script: null },
        { code: 'hu', name: 'Hungarian', flag: '/img/flags/hu.svg', script: null },
        { code: 'id', name: 'Indonesian', flag: '/img/flags/id.svg', script: null },
        { code: 'ga', name: 'Irish', flag: '/img/flags/ie.svg', script: null },
        { code: 'it', name: 'Italian', flag: '/img/flags/it.svg', script: null },
        { code: 'jv', name: 'Javanese', flag: '/img/flags/id.svg', script: null },
        { code: 'kk', name: 'Kazakh', flag: '/img/flags/kz.svg', script: null },
        { code: 'la', name: 'Latin', flag: '/img/flags/ri.svg', script: null },
        { code: 'lt', name: 'Lithuanian', flag: '/img/flags/lt.svg', script: null },
        { code: 'ms', name: 'Malay', flag: '/img/flags/my.svg', script: null },
        { code: 'mn', name: 'Mongolian', flag: '/img/flags/mn.svg', script: null },
        { code: 'ne', name: 'Nepali', flag: '/img/flags/np.svg', script: null },
        { code: 'no', name: 'Norwegian', flag: '/img/flags/no.svg', script: null },
        { code: 'fa', name: 'Persian', flag: '/img/flags/ir.svg', script: null },
        { code: 'pl', name: 'Polish', flag: '/img/flags/pl.svg', script: null },
        { code: 'pt', name: 'Portuguese', flag: '/img/flags/pt.svg', script: null },
        { code: 'pt-br', name: 'Portuguese (Br)', flag: '/img/flags/br.svg', script: null },
        { code: 'ro', name: 'Romanian', flag: '/img/flags/ro.svg', script: null },
        { code: 'ru', name: 'Russian', flag: '/img/flags/ru.svg', script: null },
        { code: 'sr', name: 'Serbian', flag: '/img/flags/rs.svg', script: null },
        { code: 'sk', name: 'Slovak', flag: '/img/flags/sk.svg', script: null },
        { code: 'sl', name: 'Slovenian', flag: '/img/flags/si.svg', script: null },
        { code: 'es', name: 'Spanish', flag: '/img/flags/es.svg', script: null },
        { code: 'es-la', name: 'Spanish (LATAM)', flag: '/img/flags/mx.svg', script: null },
        { code: 'sv', name: 'Swedish', flag: '/img/flags/se.svg', script: null },
        { code: 'ta', name: 'Tamil', flag: '/img/flags/tam.svg', script: null },
        { code: 'te', name: 'Telugu', flag: '/img/flags/tel.svg', script: null },
        { code: 'th', name: 'Thai', flag: '/img/flags/th.svg', script: null },
        { code: 'tr', name: 'Turkish', flag: '/img/flags/tr.svg', script: null },
        { code: 'uk', name: 'Ukrainian', flag: '/img/flags/ua.svg', script: null },
        { code: 'ur', name: 'Urdu', flag: '/img/flags/pk.svg', script: null },
        { code: 'uz', name: 'Uzbek', flag: '/img/flags/uz.svg', script: null },
        { code: 'vi', name: 'Vietnamese', flag: '/img/flags/vn.svg', script: null }
    ];
    // No outer language helpers needed; language resolution is done in the page-injected sandbox

    // outer collect function not needed outside page-injected scope

    /**
     * Log a message once per unique key.
     * @param {string} key Unique key to identify the message
     * @param  {...any} args Arguments to log 
     */
    function logOnce(key, ...args) {
        if (!logOnce.seen) logOnce.seen = {};
        if (!logOnce.seen[key]) {
            console.info('[AltReorder]', ...args);
            logOnce.seen[key] = true;
        }
    }

    // Snapshot (kept updated as user edits/reorders) to ensure we always have last known order
    let altTitlesSnapshot = [];
    let snapshotTimer = null;

    /**
     * Remove duplicate alternative titles from an array.
     * @param {Array<{[langCode: string]: string}>} arr Array of alternative title objects
     * @returns {Array<{[langCode: string]: string}>} Array of unique alternative titles
     */
    function dedupeAltTitles(arr) {
        const seen = new Set();
        const out = [];
        for (const obj of arr) {
            const key = Object.keys(obj)[0];
            const valRaw = obj[key];
            if (typeof valRaw !== 'string') continue;
            const val = valRaw.trim();
            if (!val) continue;
            const sig = key + '||' + val.toLowerCase();
            if (seen.has(sig)) continue;
            seen.add(sig);
            out.push({ [key]: val });
        }
        return out;
    }

    /**
     * Update the index badges for the alternative titles.
     * @returns {void} Nothing
     */
    function updateIndexBadges() {
        const list = findAltTitlesContainer();
        if (!list) return;
        const rows = Array.from(list.querySelectorAll('.text-item-container'));
        rows.forEach((row, idx) => {
            let badge = row.querySelector('.md-alt-index-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'md-alt-index-badge';
                badge.style.cssText = 'display:inline-block;min-width:1.8em;text-align:center;font-size:11px;font-weight:600;color:var(--md-icon-contrast,#666);background:var(--md-secondary-bg,#eee);border-radius:4px;padding:2px 4px;margin-right:6px;vertical-align:middle;';
                // insert at start of row
                row.insertBefore(badge, row.firstChild);
            }
            badge.textContent = String(idx + 1);
        });
    }

    /**
     * Build a snapshot of the current alternative titles from the DOM.
     * @returns {void} Nothing
     */
    function buildSnapshotFromDOM() {
        const list = findAltTitlesContainer();
        if (!list) {
            console.warn('[AltReorder] snapshot: list not found');
            return;
        }
        const fresh = dedupeAltTitles(collectAltTitlesOrdered());
        if (fresh.length) {
            altTitlesSnapshot = fresh;
            console.info('[AltReorder] snapshot updated', { count: fresh.length });
        } else {
            // Do not wipe existing snapshot if new build is empty; just log
            console.info('[AltReorder] snapshot rebuild produced empty array; keeping previous');
        }
        updateIndexBadges();
    }

    /**
     * Schedule an update of the alternative titles snapshot with a small debounce.
     */
    function scheduleSnapshotUpdate() {
        if (snapshotTimer) clearTimeout(snapshotTimer);
        snapshotTimer = setTimeout(buildSnapshotFromDOM, 120); // small debounce
    }

    /**
     * Get a copy of the current snapshot of alternative titles.
     * @returns {Array<{[langCode: string]: string}>} A copy of the current snapshot of alternative titles
     */
    function getSnapshotAltTitles() {
        if (altTitlesSnapshot.length) return altTitlesSnapshot.slice();
        return collectAltTitlesOrdered();
    }

    /**
     * Collect alternative titles from the DOM in the current order.
     * @returns {Array<{[langCode: string]: string}>} Array of objects with single key-value pairs representing language code and title
     */
    function collectAltTitlesOrdered() {
        const list = findAltTitlesContainer();
        if (!list) {
            console.warn('[AltReorder] alt list container not found');
            return [];
        }
        // Language name -> code map
        const NAME_TO_CODE = Object.fromEntries(LANGUAGES.map(l => [l.name, l.code]));
        const FLAG_TO_CODE = (() => {
            const out = {};
            LANGUAGES.forEach(l => {
                const m = /\/flags\/([^/.]+)\.svg$/.exec(l.flag || '');
                if (m) out[m[1]] = l.code;
            });
            return out;
        })();

        /**
         * Get the language code from a row element.
         * @param {HTMLElement} row The row element to inspect.
         * @returns {string|null} The language code, or null if not found.
         */
        function getLangCodeFromRow(row) {
            // Prefer the selected flag image shown in the collapsed md-select button
            const flagImg = row.querySelector('.md-select .relative img[src*="/img/flags/"]') || row.querySelector('.md-select img[src*="/img/flags/"]');
            const byName = flagImg?.title && NAME_TO_CODE[flagImg.title.trim()];
            if (byName) return byName;
            const src = flagImg?.getAttribute('src') || '';
            const m = /\/flags\/([^/.]+)\.svg$/.exec(src);
            if (m && FLAG_TO_CODE[m[1]]) return FLAG_TO_CODE[m[1]];
            // Fallback: read visible text from the md-select button/value area
            const selectText = row.querySelector('.md-select button, .md-select .selected, .md-select .md-select__value')?.textContent?.trim();
            if (selectText && NAME_TO_CODE[selectText]) return NAME_TO_CODE[selectText];
            return null;
        }
        const rows = Array.from(list.querySelectorAll('.text-item-container'));
        const results = [];
        const debug = [];
        for (const row of rows) {
            const inp = row.querySelector('input.inline-input');
            const text = (inp?.value || '').trim();
            const code = getLangCodeFromRow(row);
            debug.push({ text, code, hasInput: !!inp });
            if (!text || !code) continue;
            results.push({ code, text });
        }
        if (!results.length) {
            console.warn('[AltReorder] No alt titles collected', { rows: rows.length, rowsDebug: debug.slice(0, 5) });
        }
        return results.map(e => ({ [e.code]: e.text }));
    }

    // Patch fetch like MD_main_title_lang_select
    const origFetch = window.fetch;
    window.fetch = function (resource, init) {
        logOnce('fetch-patched', 'fetch override active');
        if (
            init?.method === 'PUT' &&
            typeof resource === 'string' &&
            resource.includes('/api.mangadex.org/manga/')
        ) {
            logOnce('fetch-caught', 'caught manga PUT via fetch');
            try {
                const body = JSON.parse(init.body);
                let altTitles = getSnapshotAltTitles();
                altTitles = dedupeAltTitles(altTitles);
                if (altTitles.length) {
                    body.altTitles = altTitles;
                    console.info('[AltReorder] [fetch] injecting altTitles', altTitles);
                    init.body = JSON.stringify(body);
                } else {
                    console.info('[AltReorder] [fetch] altTitles empty; payload unchanged');
                }
            } catch (e) {
                console.error('[AltReorder] [fetch] error patching body', e);
            }
        }
        return origFetch(resource, init);
    };

    /**
     * Patch XHR requests to include alternative titles.
     */
    (function () {
        const oOpen = XMLHttpRequest.prototype.open;
        const oSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method, url) {
            this._method = method;
            this._url = url;
            return oOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function (body) {
            logOnce('xhr-patched', 'XHR override active');
            if (
                this._method === 'PUT' &&
                typeof this._url === 'string' &&
                this._url.includes('/api.mangadex.org/manga/') &&
                typeof body === 'string'
            ) {
                logOnce('xhr-caught', 'caught manga PUT via XHR');
                try {
                    const payload = JSON.parse(body);
                    let altTitles = getSnapshotAltTitles();
                    altTitles = dedupeAltTitles(altTitles);
                    if (altTitles.length) {
                        payload.altTitles = altTitles;
                        console.info('[AltReorder] [XHR] injecting altTitles', altTitles);
                        body = JSON.stringify(payload);
                    } else {
                        console.info('[AltReorder] [XHR] altTitles empty; payload unchanged');
                    }
                } catch (e) {
                    console.error('[AltReorder] [XHR] error patching body', e);
                }
            }
            return oSend.call(this, body);
        };
    })();

    /**
     * Create a new HTML element.
     * @param {string} tag The tag name of the element to create.
     * @param {Object} attrs The attributes to set on the element.
     * @param {Array<HTMLElement>} children The child elements to append to the element.
     * @returns {HTMLElement} The created element.
     */
    function createEl(tag, attrs = {}, children = []) {
        let el = document.createElement(tag);
        for (let [k, v] of Object.entries(attrs)) {
            if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
            else if (k in el) el[k] = v;
            else el.setAttribute(k, v);
        }
        children.forEach(c => el.appendChild(c));
        return el;
    }

    /**
     * Find the container element for alternative titles.
     * @returns {HTMLElement|null} The container element for alternative titles, or null if not found.
     */
    function findAltTitlesContainer() {
        // Simple original approach: find label 'Alternative Titles' and then its grid list
        const labels = Array.from(document.querySelectorAll('div.label'));
        for (const lab of labels) {
            if ((lab.textContent || '').trim().startsWith('Alternative Titles')) {
                const inputContainer = lab.closest('.input-container');
                if (!inputContainer) continue;
                const list = inputContainer.querySelector('.grid.grid-cols-1');
                if (list) return list;
            }
        }
        return null;
    }

    /**
     * Enable the Save button if it is currently disabled.
     */
    function enableSaveButton() {
        // Try to enable the primary Save button if it is disabled
        const btnCandidates = Array.from(document.querySelectorAll('button'));
        for (const b of btnCandidates) {
            const txt = (b.textContent || '').trim();
            if (/^save$/i.test(txt)) {
                b.classList.remove('disabled');
                b.disabled = false;
            }
        }
    }

    /**
     * Get the wrapper element for a specific row within the list container.
     * @param {HTMLElement} row The row element to find the wrapper for.
     * @param {HTMLElement} listContainer The list container element.
     * @returns {HTMLElement|null} The wrapper element if found, otherwise null.
     */
    function getRowWrapper(row, listContainer) {
        let el = row;
        while (el?.parentElement && el.parentElement !== listContainer) {
            el = el.parentElement;
        }
        return (el && el.parentElement === listContainer) ? el : row;
    }

    /**
     * Initialise the reordering controls for a specific row.
     * @param {HTMLElement} row The row element to attach controls to.
     * @param {HTMLElement} listContainer The list container element.
     * @returns {boolean} true if initialisation was done
     */
    function makeControlsForRow(row, listContainer) {
        if (row._reorderInjected) return;
        row._reorderInjected = true;

        const rowWrapper = getRowWrapper(row, listContainer);

        const controls = createEl('div', { className: 'md-alt-reorder-controls', style: { display: 'inline-flex', gap: '6px', marginLeft: '8px' } });

        const up = createEl('button', { type: 'button', className: 'md-btn', title: 'Move up' }, [document.createTextNode('\u25B2')]);
        const down = createEl('button', { type: 'button', className: 'md-btn', title: 'Move down' }, [document.createTextNode('\u25BC')]);
        const drag = createEl('span', { className: 'md-drag-handle', title: 'Drag to reorder', style: { cursor: 'grab', padding: '4px 6px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '4px' } }, [document.createTextNode('\u2630')]);

        up.addEventListener('click', (e) => {
            e.preventDefault();
            const prev = rowWrapper.previousElementSibling;
            if (prev) {
                listContainer.insertBefore(rowWrapper, prev);
                enableSaveButton();
                scheduleSnapshotUpdate();
                updateIndexBadges();
            }
        });

        down.addEventListener('click', (e) => {
            e.preventDefault();
            const next = rowWrapper.nextElementSibling;
            if (next) {
                listContainer.insertBefore(next, rowWrapper);
                enableSaveButton();
                scheduleSnapshotUpdate();
                updateIndexBadges();
            }
        });

        // Setup HTML5 drag-and-drop on the row
        rowWrapper.draggable = true;
        rowWrapper.addEventListener('dragstart', (ev) => {
            rowWrapper.classList.add('dragging');
            try { ev.dataTransfer.setData('text/plain', 'md-alt-row'); } catch { }
            ev.dataTransfer.effectAllowed = 'move';
        });
        rowWrapper.addEventListener('dragend', () => {
            rowWrapper.classList.remove('dragging');
            enableSaveButton();
            scheduleSnapshotUpdate();
            updateIndexBadges();
        });

        // click on drag handle focuses row to start drag for better UX
        drag.addEventListener('mousedown', () => row.focus());

        controls.appendChild(drag);
        controls.appendChild(up);
        controls.appendChild(down);

        // place controls into row: try to insert after the md-select or at end
        const insertPoint = row.querySelector('.relative.flex-grow') || row.querySelector('.inline-input') || row;
        if (insertPoint?.parentElement) {
            insertPoint.parentElement.insertBefore(controls, insertPoint.nextElementSibling);
        } else {
            row.appendChild(controls);
        }

        // Listen to text input changes to refresh snapshot
        const titleInput = row.querySelector('input.inline-input');
        if (titleInput && !titleInput._altReorderListener) {
            const handler = () => scheduleSnapshotUpdate();
            titleInput.addEventListener('input', handler);
            titleInput.addEventListener('change', handler);
            titleInput._altReorderListener = true;
        }
    }

    /**
     * Get the element that should be placed after the dragged element.
     * @param {HTMLElement} container The list container
     * @param {number} y The vertical position of the mouse
     * @returns {HTMLElement|null}
     */
    function getDragAfterElement(container, y) {
        // Consider only immediate children of the container that represent rows
        const draggableElements = [...container.children].filter(el => el.querySelector('.text-item-container') && !el.classList.contains('dragging'));
        let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
        for (const child of draggableElements) {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                closest = { offset, element: child };
            }
        }
        return closest.element;
    }

    /**
     * Initialise the reordering functionality.
     * @returns {boolean} true if initialisation was done
     */
    function initReorder() {
        if (!EDIT_TITLE_REGEX.test(location.pathname)) return false;
    const list = findAltTitlesContainer();
    if (!list) return false;

    // Each alt title is rendered inside an element with class 'text-item-container'
    const rows = Array.from(list.querySelectorAll('.text-item-container'));
    if (!rows.length) return false;

    rows.forEach(r => makeControlsForRow(r, list));
    scheduleSnapshotUpdate();
    updateIndexBadges();

        // Attach single dragover handler for the list (once)
        if (!list._dragHandlerAttached) {
            list.addEventListener('dragover', (ev) => {
                ev.preventDefault();
                const dragging = [...list.children].find(el => el?.classList?.contains('dragging'));
                if (!dragging) return;
                const after = getDragAfterElement(list, ev.clientY);
                if (!after) {
                    list.appendChild(dragging);
                } else if (after !== dragging && after.parentElement === list) {
                    list.insertBefore(dragging, after);
                }
                // live visual update while dragging (optional minimal overhead)
                updateIndexBadges();
            });
            list._dragHandlerAttached = true;
        }

        // Observe list for structural changes (adds/removals/language changes)
        if (!list._altSnapshotObserver) {
            const obs = new MutationObserver(muts => {
                for (const m of muts) {
                    if (m.type === 'childList' || m.type === 'attributes') { scheduleSnapshotUpdate(); break; }
                }
            });
            obs.observe(list, { childList: true, subtree: true, attributes: true });
            list._altSnapshotObserver = obs;
        }

        // Hook save button to force last-moment snapshot
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => /^save$/i.test((b.textContent||'').trim()));
        if (saveBtn && !saveBtn._altSnapshotHook) {
            saveBtn.addEventListener('click', () => { buildSnapshotFromDOM(); });
            saveBtn._altSnapshotHook = true;
        }

        // add a helper toolbar with a small hint and a 'Reset to original order' button
        if (!document.querySelector('.md-alt-reorder-toolbar')) {
            const toolbar = createEl('div', { className: 'md-alt-reorder-toolbar', style: { margin: '8px 0', display: 'flex', gap: '8px', alignItems: 'center' } });
            const hint = createEl('div', { style: { color: 'var(--md-icon-contrast, #666)', fontSize: '12px' } }, [document.createTextNode('Drag or use ▲/▼ to reorder alt titles. Click Save to persist.')]);
            const resetBtn = createEl('button', { type: 'button', className: 'md-btn', title: 'Reload original order' }, [document.createTextNode('Reload original')]);
            resetBtn.addEventListener('click', () => location.reload());
            toolbar.appendChild(hint);
            toolbar.appendChild(resetBtn);

            // insert toolbar before the list
            list.parentElement.insertBefore(toolbar, list);
        }

        console.info('[AltReorder] initialised');
        return true;
    }

    /**
     * Initialise the reordering functionality.
     * @returns {void} Nothing
     */
    function tryInitReorder() {
        if (!EDIT_TITLE_REGEX.test(location.pathname)) return;
        let tries = 0;
        const iv = setInterval(() => {
            if (initReorder() || tries++ > 20) clearInterval(iv);
        }, 300);
    }

    // start
    tryInitReorder();

    // also try when navigation occurs (single page app route change)
    window.addEventListener('popstate', tryInitReorder);
    new MutationObserver((mutations) => {
        // small debounce: try to init when DOM changes and we are on the edit page
        if (EDIT_TITLE_REGEX.test(location.pathname)) tryInitReorder();
    }).observe(document.documentElement, { childList: true, subtree: true });

})();
