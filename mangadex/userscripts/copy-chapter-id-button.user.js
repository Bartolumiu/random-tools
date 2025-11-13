// ==UserScript==
// @name         Copy Chapter ID Button
// @namespace    https://mangadex.org/
// @version      1.2
// @description  Adds a button to copy the chapter ID to the clipboard in MangaDex chapter entries.
// @author       Bartolumiu
// @license      GPL-3.0
// @icon         https://mangadex.org/favicon.ico
// @updateURL    https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/copy-chapter-id-button.user.js
// @downloadURL  https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/copy-chapter-id-button.user.js
// @match        https://mangadex.org/*
// @match        https://next.mangadex.org/*
// @match        https://canary.mangadex.dev/*
// @match        https://sandbox.mangadex.dev/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        .copy-chapter-id-btn {
            align-items: center;
            background: none;
            border: none;
            color: rgb(var(--md-primary));
            cursor: pointer;
            display: inline-flex;
            height: 20px;
            justify-content: center;
            margin-left: 10px;
            width: 20px;
        }
    `);
    GM_addStyle(`
        .copy-chapter-id-chapter-title-max-width {
            max-width: calc(100% - 30px);
        }
    `);
    function createSVG(icon) {
        const template = document.createElement('template');
        template.innerHTML = icon.trim();
        return template.content.firstChild;
    }

    const defaultIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                <path d="M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333z"/>
                <path d="M4.012 16.737A2 2 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1"/>
            </g>
        </svg>`;
    const clickedIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                <path d="M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333z"/>
                <path d="M4.012 16.737A2 2 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1M11 14l2 2l4-4"/>
            </g>
        </svg>`;

    function addCopyButtons() {
        const chapterRows = document.querySelectorAll('.chapter');

        chapterRows.forEach(row => {
            if (row.querySelector('.copy-chapter-id-btn')) return;

            const chapterLinks = row.querySelectorAll('a[href^="/chapter/"]');
            if (!chapterLinks.length) return;

            const chapterLink = chapterLinks[1];
            const chapterSpan = chapterLink.querySelector('.chapter-link');
            if (!chapterSpan) return;

            const chapterId = chapterLink.href.split('/chapter/')[1];

            const button = document.createElement('button');
            button.className = 'copy-chapter-id-btn';
            button.appendChild(createSVG(defaultIcon));
            button.addEventListener('click', (e) => {
                e.preventDefault();
                GM_setClipboard(chapterId);

                button.innerHTML = '';
                button.appendChild(createSVG(clickedIcon));

                setTimeout(() => {
                    button.innerHTML = '';
                    button.appendChild(createSVG(defaultIcon));
                }, 3000);
            });

            chapterSpan.appendChild(button);
            button.previousElementSibling.className += ' copy-chapter-id-chapter-title-max-width'
        });
    }

    addCopyButtons();

    const observer = new MutationObserver(() => {
        addCopyButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
