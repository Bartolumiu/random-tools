// ==UserScript==
// @name         MangaDex Main Title Language Selector
// @namespace    https://mangadex.org/
// @description  Add language selector dropdown
// @icon         https://mangadex.org/favicon.ico
// @version      0.14
// @updateURL    https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_main_title_lang_select.user.js
// @downloadURL  https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_main_title_lang_select.user.js
// @author       Bartolumiu
// @match        https://mangadex.org/*
// @match        https://canary.mangadex.dev/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const EDIT_TITLE_REGEX = /^\/title\/edit\/[a-f0-9-]+$/;
    // View route: /title/{uuid} or /title/{uuid}/{slug}
    const VIEW_TITLE_REGEX = /^\/title\/[a-f0-9-]+(?:\/[^/]+)?\/?$/;

    // --- STATE ---
    let selectedLang = null;
    let currentTitleText = null;
    let fetchedTitleCache = {}; // cache mangaId -> { titleMap, detectedLang }

    // --- LOG UTILITY ---
    function logOnce(key, ...args) {
        if (!logOnce.seen) logOnce.seen = {};
        if (!logOnce.seen[key]) {
            console.info('[LangSelector]', ...args);
            logOnce.seen[key] = true;
        }
    }

    // --- PATCH fetch ---
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
                const titleText = currentTitleText || '';
                logOnce('fetch-injecting', `trying to inject the new title locale (selectedLang: ${selectedLang}, titleText: ${titleText})`);
                if (selectedLang && titleText) {
                    body.title = { [selectedLang]: titleText };
                    console.info(`[LangSelector] [fetch] injecting title { ${selectedLang}: "${titleText}" }`);
                    init.body = JSON.stringify(body);
                }
            } catch (e) {
                console.error('[LangSelector] [fetch] error patching body', e);
            }
        }
        return origFetch(resource, init);
    };

    // --- PATCH XHR ---
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
                    const titleText = currentTitleText || '';
                    logOnce('xhr-injecting', `trying to inject the new title locale (selectedLang: ${selectedLang}, titleText: ${titleText})`);
                    if (selectedLang && titleText) {
                        payload.title = { [selectedLang]: titleText };
                        console.info(`[LangSelector] [XHR] injecting title { ${selectedLang}: "${titleText}" }`);
                        body = JSON.stringify(payload);
                    }
                } catch (e) {
                    console.error('[LangSelector] [XHR] error patching body', e);
                }
            }
            return oSend.call(this, body);
        };
    })();

    // --- LANG DROPDOWN --- (damn, didn't think we'd have so many languages)
    const LANGUAGES = [
        { code: 'en', name: 'English', flag: '/img/flags/gb.svg', script: null },
        { code: 'jp', name: 'Japanese', flag: '/img/flags/jp.svg', script: '/img/scripts/kanji.svg' },
        { code: 'ja-ro', name: 'Japanese (Romanized)', flag: '/img/flags/jp.svg', script: '/img/scripts/latin.svg' },
        { code: 'kr', name: 'Korean', flag: '/img/flags/kr.svg', script: '/img/scripts/kanji.svg' },
        { code: 'ko-ro', name: 'Korean (Romanized)', flag: '/img/flags/kr.svg', script: '/img/scripts/latin.svg' },
        { code: 'zh', name: 'Chinese (Simplified)', flag: '/img/flags/cn.svg', script: '/img/scripts/kanji.svg' },
        { code: 'zh-tw', name: 'Chinese (Traditional)', flag: '/img/flags/hk.svg', script: '/img/scripts/kanji.svg' },
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

    /**
     * Create a DOM element with the specified tag, attributes, and children.
     * @param {string} tag The tag name for the element.
     * @param {Object} attrs An object representing the attributes to set on the element.
     * @param {Array<Node>} children An array of child nodes to append to the element.
     * @returns {HTMLElement} The created DOM element.
     */
    function createEl(tag, attrs = {}, children = []) {
        let el;
        const SVG_NS = 'http://www.w3.org/2000/svg';
        if (tag === 'svg' || tag === 'path') {
            el = document.createElementNS(SVG_NS, tag);
        } else {
            el = document.createElement(tag);
        }
        for (let [k, v] of Object.entries(attrs)) {
            if (k === 'style') Object.assign(el.style, v);
            else if (k.startsWith('data-')) el.setAttribute(k, v);
            else if (tag === 'svg' || tag === 'path') el.setAttribute(k, v);
            else if (k in el) el[k] = v;
            else el.setAttribute(k, v);
        }
        children.forEach(c => el.appendChild(c));
        return el;
    }

    /**
     * Initialize the language dropdown.
     * @returns {boolean} True if the dropdown was initialized, false otherwise.
     */
    function initDropdown() {
        // Strictly only run on /title/edit/:id
        if (!EDIT_TITLE_REGEX.test(location.pathname)) return false;

        const container = Array.from(document.querySelectorAll('.input-container'))
            .find(c => c.querySelector('.required')?.textContent.trim().startsWith('Title'));
        if (!container) return false;
        const textItem = container.querySelector('.text-item-container');
        if (!textItem || textItem._init) return false;
        textItem._init = true;

        const inp = textItem.querySelector('input.inline-input');
        if (!inp) return false;

        const btnFlagImg = createEl('img', {
            src: LANGUAGES[0].flag, width: 24, height: 24,
            title: LANGUAGES[0].name, alt: LANGUAGES[0].name,
            style: { minWidth: '25px', minHeight: '24px' },
            className: 'select-none'
        });

        const btnScriptImg = createEl('img', {
            src: '', width: 12, height: 12,
            style: {
                marginLeft: '-12px',
                marginTop: '12px',
                display: 'none'
            },
            className: 'select-none'
        });

        const chevronSvg = createEl('svg', {
            xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24,
            fill: 'none',
            stroke: 'currentColor',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            class: 'feather feather-chevron-down icon text-icon-contrast text-undefined rotating-arrow ml-1',
            viewbox: '0 0 24 24',
            style: { transition: 'transform 0.2s ease' }
        }, [
            createEl('path', {
                d: 'm6 9 6 6 6-6',
                stroke: 'currentColor',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                'stroke-width': '2'
            })
        ]);

        const btnInner = createEl('div', {
            className: 'relative whitespace-nowrap flex items-center cursor-pointer select-none'
        }, [
            btnFlagImg,
            btnScriptImg,
            chevronSvg
        ]);
        const btn = createEl('div', {
            className: 'md-select focus:outline-none md-select--no-label select-none',
            tabindex: 0
        }, [btnInner]);

        const match = RegExp(/\/title\/edit\/([a-f0-9-]+)/).exec(location.pathname);
        const mangaId = match?.[1];

        if (mangaId) {
            fetch(`https://api.mangadex.org/manga/${mangaId}`)
                .then(res => res.json())
                .then(data => {
                    const titleMap = data?.data?.attributes?.title;
                    if (titleMap && typeof titleMap === 'object') {
                        const [lang, title] = Object.entries(titleMap)[0];
                        if (LANGUAGES.some(l => l.code === lang)) {
                            selectedLang = lang;
                            currentTitleText = title;
                            const langMeta = LANGUAGES.find(l => l.code === selectedLang);
                            btnFlagImg.src = langMeta.flag;
                            btnFlagImg.title = langMeta.name;
                            btnFlagImg.alt = langMeta.name;
                            if (langMeta.script) {
                                btnScriptImg.src = langMeta.script;
                                btnScriptImg.style.display = 'inline';
                            } else {
                                btnScriptImg.style.display = 'none';
                            }
                            inp.value = title;
                            inp.dispatchEvent(new Event('input', { bubbles: true }));
                            console.info(`[LangSelector] Detected language from API: ${selectedLang}`)
                        }
                    }
                })
                .catch(err => console.error('[LangSelector] Failed to fetch manga title info', err));
        }

        inp.addEventListener('input', () => {
            currentTitleText = inp.value;
        });

        const list = createEl('div', {
            className: 'absolute overflow-x-hidden overscroll-contain z-10 bg-accent shadow rounded-b hidden',
            style: { 
                display: 'none', 
                top: '100%', 
                left: '0', 
                minWidth: '250px',
                maxHeight: '300px',
                overflowY: 'auto'
            }
        });

        LANGUAGES.forEach(lang => {
            const item = createEl('div', {
                className: 'select-none',
                style: {
                    display: 'flex', alignItems: 'center',
                    padding: '6px 8px', cursor: 'pointer'
                }
            }, [
                createEl('img', {
                    src: lang.flag, width: 24, height: 24,
                    title: lang.name, alt: lang.name,
                    style: { marginRight: '12px' },
                    className: 'select-none'
                }),
                ...(lang.script ? [createEl('img', {
                    src: lang.script, width: 12, height: 12,
                    title: lang.name, alt: lang.name,
                    style: { marginLeft: '-20px', marginTop: '12px', marginRight: '8px' },
                    className: 'select-none'
                })] : []),
                document.createTextNode(' ' + lang.name)
            ]);

            item.addEventListener('click', () => {
                selectedLang = lang.code;
                btnFlagImg.src = lang.flag;
                btnFlagImg.title = lang.name;
                btnFlagImg.alt = lang.name;
                if (lang.script) {
                    btnScriptImg.src = lang.script;
                    btnScriptImg.style.display = 'inline';
                } else {
                    btnScriptImg.style.display = 'none';
                }
                list.style.display = 'none';
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                document.querySelector('.actions .primary.disabled')?.classList.remove('disabled');
                console.info(`[LangSelector] language set to ${lang.code}`);
            });

            item.addEventListener('mouseover', () => item.style.background = 'rgba(0,0,0,0.05)');
            item.addEventListener('mouseout', () => item.style.background = 'transparent');

            list.appendChild(item);
        });

    const dd = createEl('div', { className: 'relative' }, [btn, list]);
        btn.addEventListener('click', () => {
            const isHidden = list.style.display === 'none';
            list.style.display = isHidden ? 'block' : 'none';
            // Toggle chevron rotation
            chevronSvg.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dd.contains(e.target)) {
                list.style.display = 'none';
                chevronSvg.style.transform = 'rotate(0deg)';
            }
        });

        // Close dropdown when scrolling outside
        document.addEventListener('scroll', () => {
            list.style.display = 'none';
            chevronSvg.style.transform = 'rotate(0deg)';
        });

        const divider = textItem.querySelector('.bg-current');
        textItem.insertBefore(dd, divider || textItem.firstChild);
        if (!textItem.querySelector('.bg-current')) {
            const shade = createEl('div', {
                className: 'bg-current opacity-30',
                style: { minWidth: '1px', height: '24px' }
            });
            textItem.insertBefore(shade, dd.nextSibling);
        }

        console.info('[LangSelector] dropdown injected');
        return true;
    }

    /**
     * Try to initialize the language dropdown with retries.
     * This is to be able to handle cases where the DOM is not fully loaded yet.
     * It will attempt to initialize the dropdown every 300ms for up to 10 tries.
     * If it succeeds, it will stop trying.
     * @returns {void} Nothing at all
     */
    function tryInitDropdown() {
        if (!EDIT_TITLE_REGEX.test(location.pathname)) return; // don't even schedule tries if route doesn't match
        let tries = 0;
        const iv = setInterval(() => {
            if (initDropdown() || tries++ > 10) clearInterval(iv);
        }, 300);
    }

    /**
     * Initialize the flag icon on /title/:id view pages (not edit pages).
     * @returns {boolean}
     */
    function initViewTitleFlag() {
        // Only run on /title/{uuid} (no trailing slash or extra path segments)
        if (!VIEW_TITLE_REGEX.test(location.pathname)) {
            return false;
        }

        console.info('[LangSelector] Attempting to initialize view title flag');
        const container = document.querySelector('div.title');
        if (!container) return false;
        const mainTitleEl = container.querySelector('p.mb-1');
        if (!mainTitleEl || mainTitleEl._flagInit) return false;

        console.info('[LangSelector] Found main title element:', mainTitleEl);
        const match = /\/title\/([a-f0-9-]+)/.exec(location.pathname);
        const mangaId = match?.[1];
        if (!mangaId) return false;

        mainTitleEl._flagInit = true; // prevent duplicate attempts

        const displayedTitle = (mainTitleEl.textContent || '').trim();

        const applyFlag = (langCode) => {
            if (!langCode) return;
            const langMeta = LANGUAGES.find(l => l.code === langCode);
            if (!langMeta) return;
            // Avoid duplicating flag
            if (container.querySelector('img.__md-main-title-flag')) return;
            // Wrapper for flag + optional script overlay to keep title layout stable
            const wrapper = createEl('span', {
                className: '__md-main-title-flag-wrapper',
                style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginRight: '12px',
                    verticalAlign: 'middle'
                }
            });

            const flagImg = createEl('img', {
                src: langMeta.flag,
                width: 28,
                height: 28,
                title: `${langMeta.name} (${langCode})`,
                alt: langCode,
                className: '__md-main-title-flag select-none',
                style: {
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    position: 'relative',
                    top: '4px'
                }
            });
            wrapper.appendChild(flagImg);

        // Add script icon for any language entry that declares a script asset (zh, zh-hk, zh-ro, ja, ja-ro, ko, ko-ro)
        if (langMeta.script) {
                const scriptImg = createEl('img', {
                    src: langMeta.script,
                    width: 12,
                    height: 12,
                    alt: 'script',
            title: `${langMeta.name} script`,
                    className: '__md-main-title-script select-none',
                    style: {
                        marginLeft: '-10px',
                        marginTop: '18px',
                        position: 'relative'
                    }
                });
                wrapper.appendChild(scriptImg);
            }

            // Insert wrapper at the beginning of the <p>
            mainTitleEl.insertBefore(wrapper, mainTitleEl.firstChild);
        };

        const processTitleMap = (titleMap) => {
            if (!titleMap || typeof titleMap !== 'object') return;
            // Try to find exact match (case sensitive), then case-insensitive.
            let found = Object.entries(titleMap).find(([code, title]) => title === displayedTitle);
            if (!found) {
                found = Object.entries(titleMap).find(([code, title]) => title.toLowerCase() === displayedTitle.toLowerCase());
            }
            const langCode = found ? found[0] : Object.keys(titleMap)[0];
            applyFlag(langCode);
            fetchedTitleCache[mangaId] = { titleMap, detectedLang: langCode };
        };

        console.info('[LangSelector] Attempting to fetch manga info for flag:', mangaId);

        // Use cache if present
        if (fetchedTitleCache[mangaId]) {
            applyFlag(fetchedTitleCache[mangaId].detectedLang);
            return true;
        }

        fetch(`https://api.mangadex.org/manga/${mangaId}`)
            .then(r => r.json())
            .then(data => {
                const titleMap = data?.data?.attributes?.title;
                processTitleMap(titleMap);
            })
            .catch(err => console.error('[LangSelector] Failed to fetch manga info for flag', err));

        return true; // We've set up processing
    }

    function tryInitViewTitleFlag() {
        if (!VIEW_TITLE_REGEX.test(location.pathname)) return; // don't schedule on non-view routes
        let tries = 0;
        const iv = setInterval(() => {
            if (initViewTitleFlag() || tries++ > 10) clearInterval(iv);
        }, 300);
    }

    // Initial attempt when DOM is ready
    document.addEventListener('DOMContentLoaded', tryInitDropdown);

    // Monitor for route changes in SPA
    let currentPath = location.pathname;
    const observer = new MutationObserver(() => {
        if (location.pathname !== currentPath) {
            currentPath = location.pathname;
            console.info('[LangSelector] Route changed to:', currentPath);
            // Small delay to let the new page content load
            setTimeout(() => {
                if (EDIT_TITLE_REGEX.test(location.pathname)) {
                    tryInitDropdown();
                } else if (VIEW_TITLE_REGEX.test(location.pathname)) {
                    tryInitViewTitleFlag();
                }
            }, 100);
        }
    });

    // Start observing when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        // Attempt only the relevant initializer on first load
        if (EDIT_TITLE_REGEX.test(location.pathname)) {
            tryInitDropdown();
        } else if (VIEW_TITLE_REGEX.test(location.pathname)) {
            tryInitViewTitleFlag();
        }
    });

})();
