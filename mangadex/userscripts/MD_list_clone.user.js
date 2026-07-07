// ==UserScript==
// @name         MangaDex MDList Cloning Tool
// @namespace    https://mangadex.org
// @icon         https://mangadex.org/favicon.ico
// @version      2.4.1
// @description  MDList Cloning Tool
// @author       Bartolumiu
// @match        https://mangadex.org/*
// @match        https://canary.mangadex.dev/*
// @updateURL    https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_list_clone.user.js
// @downloadURL  https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_list_clone.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration & Constants ---

    const SPECIAL_LISTS = {
        '/titles/recommended': '805ba886-dd99-4aa4-b460-4bd7c7b71352',
        '/titles/selfpublished': 'f66ebc10-ef89-46d1-be96-bb704559e04a',
        '/titles/seasonal': '68ab4f4e-6f01-4898-9038-c5eee066be27'
    };

    const ICONS = {
        CLONE: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon size-6 mr-4"><path fill="currentColor" d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zM3.288 7.713Q3 7.425 3 7t.288-.712T4 6t.713.288T5 7t-.288.713T4 8t-.712-.288m0 3.5Q3 10.926 3 10.5t.288-.712T4 9.5t.713.288T5 10.5t-.288.713T4 11.5t-.712-.288m0 3.5Q3 14.426 3 14t.288-.712T4 13t.713.288T5 14t-.288.713T4 15t-.712-.288m0 3.5Q3 17.926 3 17.5t.288-.712T4 16.5t.713.288T5 17.5t-.288.713T4 18.5t-.712-.288m0 3.5Q3 21.426 3 21t.288-.712T4 20t.713.288T5 21t-.288.713T4 22t-.712-.288m3.5 0Q6.5 21.426 6.5 21t.288-.712T7.5 20t.713.288T8.5 21t-.288.713T7.5 22t-.712-.288m3.5 0Q10 21.426 10 21t.288-.712T11 20t.713.288T12 21t-.288.713T11 22t-.712-.288m3.5 0Q13.5 21.426 13.5 21t.288-.712T14.5 20t.713.288t.287.712t-.288.713T14.5 22t-.712-.288"></path></svg>`,
        CLONE_SM: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon size-6 mr-2"><path fill="currentColor" d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zM3.288 7.713Q3 7.425 3 7t.288-.712T4 6t.713.288T5 7t-.288.713T4 8t-.712-.288m0 3.5Q3 10.926 3 10.5t.288-.712T4 9.5t.713.288T5 10.5t-.288.713T4 11.5t-.712-.288m0 3.5Q3 14.426 3 14t.288-.712T4 13t.713.288T5 14t-.288.713T4 15t-.712-.288m0 3.5Q3 17.926 3 17.5t.288-.712T4 16.5t.713.288T5 17.5t-.288.713T4 18.5t-.712-.288m0 3.5Q3 21.426 3 21t.288-.712T4 20t.713.288T5 21t-.288.713T4 22t-.712-.288m3.5 0Q6.5 21.426 6.5 21t.288-.712T7.5 20t.713.288T8.5 21t-.288.713T7.5 22t-.712-.288m3.5 0Q10 21.426 10 21t.288-.712T11 20t.713.288T12 21t-.288.713T11 22t-.712-.288m3.5 0Q13.5 21.426 13.5 21t.288-.712T14.5 20t.713.288t.287.712t-.288.713T14.5 22t-.712-.288"></path></svg>`,
        EXPORT: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon size-6 mr-4"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>`,
        IMPORT: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon size-6 mr-4"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>`,
        CLOSE: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" class="icon size-6 med" style="color: currentcolor;"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6 6 18M6 6l12 12"></path></svg>`
    };

    // --- State Management ---

    let currentConfirmHandler = null;
    let currentCancelHandler = null;
    let currentKeydownHandler = null;
    let currentAction = 'clone';
    let importPayload = null;
    let userOwnedListsCache = [];

    // --- Utilities ---

    function getSourceListId() {
        const path = window.location.pathname;
        if (path.startsWith('/list/')) {
            return path.split('/')[2].split('?')[0];
        }
        for (const [route, id] of Object.entries(SPECIAL_LISTS)) {
            if (path.startsWith(route)) return id;
        }
        return null;
    }

    function getAuthToken() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('oidc.user'));
        if (keys.length === 0) return null;
        try {
            const data = JSON.parse(localStorage.getItem(keys[0]));
            return data?.access_token || null;
        } catch (e) {
            return null;
        }
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }

    function isPayloadTooLarge(name, visibility, version, mangaIds) {
        const payload = JSON.stringify({ name, visibility, manga: mangaIds, version });
        return new Blob([payload]).size > 8000;
    }

    // --- API Interactions ---

    async function fetchList(listId, token = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`https://api.mangadex.org/list/${listId}`, { headers });
        if (!res.ok) throw new Error(`Failed to fetch list. Status: ${res.status}`);
        return await res.json();
    }

    async function fetchUserLists(token) {
        const res = await fetch('https://api.mangadex.org/user/list?limit=100', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch user lists.');
        const data = await res.json();
        return data.data || [];
    }

    async function createList(name, visibility, token) {
        const res = await fetch('https://api.mangadex.org/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: name, visibility: visibility || 'private' })
        });
        if (!res.ok) throw new Error(`Failed to create a new list: ${name}`);
        return await res.json();
    }

    async function updateList(listId, name, visibility, version, mangaIds, token, retryCount = 0) {
        const res = await fetch(`https://api.mangadex.org/list/${listId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: name, visibility: visibility, manga: mangaIds, version: version })
        });

        if (res.status === 409 && retryCount < 3) {
            console.warn(`[MDList Cloner] HTTP 409 Conflict. Refetching list version and retrying (Attempt ${retryCount + 1})...`);
            const latestList = await fetchList(listId, token);
            const latestVersion = latestList.data.attributes.version;
            return await updateList(listId, name, visibility, latestVersion, mangaIds, token, retryCount + 1);
        }

        if (!res.ok) throw new Error(`Failed to update list. (Status: ${res.status})`);
        return await res.json();
    }

    // --- Dynamic Modal & UI System ---

    function showToast(msg, type = 'success') {
        let toastContainer = document.getElementById('md-custom-toast');
        if (!toastContainer) {
            const html = `
                <div id="md-custom-toast" class="md-snackbar__container" style="z-index: 10001; --opacity: 0.9; display: none; position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); transition: opacity 0.2s ease;">
                    <div id="md-custom-toast-bg" class="backdrop-blur-xl md-snackbar p-4 rounded text-white shadow-lg flex items-center gap-4">
                        <span id="md-custom-toast-msg" class="text-sm font-medium"></span>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
            toastContainer = document.getElementById('md-custom-toast');
        }
        const bg = document.getElementById('md-custom-toast-bg');
        const msgEl = document.getElementById('md-custom-toast-msg');

        msgEl.innerText = msg;
        bg.className = `backdrop-blur-xl md-snackbar px-6 py-3 rounded text-white shadow-lg flex items-center gap-4 ${type === 'success' ? 'bg-status-green' : 'bg-danger'}`;

        toastContainer.style.display = 'block';
        toastContainer.style.opacity = '1';

        setTimeout(() => {
            toastContainer.style.opacity = '0';
            setTimeout(() => { toastContainer.style.display = 'none'; }, 200);
        }, 2500);
    }

    function initDynamicModal() {
        if (document.getElementById('md-dynamic-modal')) return;

        const modalHtml = `
            <div id="md-dynamic-modal" class="md-modal self-center justify-center fixed inset-0 z-[10000]" style="align-items: center; display: none;">
                <div id="md-dynamic-shade" class="md-modal__shade fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                <div class="md-modal__box flex-grow relative z-10" style="max-width: 470px; max-height: calc(100% - 3rem);">
                    <div id="md-dynamic-bg" class="bg-background rounded border border-primary">
                        <div class="flex text-xl px-6 py-4 font-bold">
                            <span id="md-dynamic-title">Title</span>
                            <button id="md-dynamic-close" class="ml-auto flex-shrink-0 rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden accent text rounded-full !px-0" style="min-height: 2rem; min-width: 2rem;" data-v-0082f4a3="">
                                <span class="flex relative items-center justify-center font-medium select-none w-full pointer-events-none">
                                    ${ICONS.CLOSE}
                                </span>
                            </button>
                        </div>
                        <div id="md-dynamic-body" class="text-sm px-6 pb-5 first:pt-4 text-color">
                            <!-- Dynamic Content Injected Here -->
                        </div>
                        <div class="flex flex-wrap gap-4 items-end p-4 pt-0">
                            <div class="flex flex-row ml-auto gap-4">
                                <button id="md-dynamic-cancel" class="rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden" style="min-height: 2.5rem; min-width: 2.5rem;" data-v-0082f4a3="">
                                    <span id="md-dynamic-cancel-text" class="flex relative items-center justify-center font-medium select-none w-full pointer-events-none">Cancel</span>
                                </button>
                                <button id="md-dynamic-confirm" class="rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden" style="min-height: 2.5rem; min-width: 2.5rem;" data-v-0082f4a3="">
                                    <span id="md-dynamic-confirm-text" class="flex relative items-center justify-center font-medium select-none w-full pointer-events-none">Confirm</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    function handleModalKeydown(e) {
        if (e.key === 'Escape') {
            currentCancelHandler && currentCancelHandler();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const confirmBtn = document.getElementById('md-dynamic-confirm');
            if (!confirmBtn.disabled) confirmBtn.click();
        }
    }

    function bindListeners() {
        document.getElementById('md-dynamic-confirm').addEventListener('click', currentConfirmHandler);
        document.getElementById('md-dynamic-cancel').addEventListener('click', currentCancelHandler);
        document.getElementById('md-dynamic-close').addEventListener('click', currentCancelHandler);
        document.getElementById('md-dynamic-shade').addEventListener('click', currentCancelHandler);

        currentKeydownHandler = handleModalKeydown;
        document.addEventListener('keydown', currentKeydownHandler);
    }

    function cleanListeners() {
        if (currentConfirmHandler) document.getElementById('md-dynamic-confirm').removeEventListener('click', currentConfirmHandler);
        if (currentCancelHandler) {
            document.getElementById('md-dynamic-cancel').removeEventListener('click', currentCancelHandler);
            document.getElementById('md-dynamic-close').removeEventListener('click', currentCancelHandler);
            document.getElementById('md-dynamic-shade').removeEventListener('click', currentCancelHandler);
        }
        if (currentKeydownHandler) {
            document.removeEventListener('keydown', currentKeydownHandler);
            currentKeydownHandler = null;
        }
    }

    function hideModal() {
        document.getElementById('md-dynamic-modal').style.display = 'none';
        cleanListeners();
    }

    function renderModal(type, options = {}) {
        const titleText = document.getElementById('md-dynamic-title');
        const body = document.getElementById('md-dynamic-body');
        const cancelBtn = document.getElementById('md-dynamic-cancel');
        const cancelBtnSpan = document.getElementById('md-dynamic-cancel-text');
        const confirmBtn = document.getElementById('md-dynamic-confirm');
        const confirmBtnSpan = document.getElementById('md-dynamic-confirm-text');
        const bgContainer = document.getElementById('md-dynamic-bg');

        confirmBtn.disabled = false;

        if (type === 'loading') {
            bgContainer.className = 'bg-background rounded border border-primary';
            titleText.className = '';
            titleText.innerText = 'Loading...';
            body.innerHTML = `<div class="mb-4 text-midTone text-center py-4">Fetching your lists...</div>`;
            cancelBtn.style.display = 'none';
            confirmBtn.style.display = 'none';
            document.getElementById('md-dynamic-modal').style.display = 'flex';
            return;
        }

        cancelBtn.style.display = 'flex';
        confirmBtn.style.display = 'flex';

        if (type === 'input') {
            bgContainer.className = 'bg-background rounded border border-primary';
            titleText.className = '';
            titleText.innerText = currentAction === 'import' ? 'Import MDList' : 'Clone MDList';

            const selectOptions = userOwnedListsCache.map(l => `<option value="${l.id}">${escapeHtml(l.attributes.name)}</option>`).join('');

            body.innerHTML = `
                <div class="mb-4 text-midTone">Select a destination list. You can create a new list or append to an existing one.</div>

                <div class="relative w-full">
                    <select id="md-clone-select" class="text-color block w-full rounded-md bg-accent outline-1 outline-transparent focus:outline-primary transition-[outline-color] p-3 text-sm cursor-pointer">
                        <option value="new">-- Create New List --</option>
                        ${selectOptions}
                    </select>
                </div>

                <label id="md-clone-merge-label" class="items-center gap-2 mt-4 cursor-pointer text-sm text-midTone hover:text-color transition-colors select-none" style="display: none;">
                    <input type="checkbox" id="md-clone-merge-checkbox" class="w-4 h-4 rounded accent-primary cursor-pointer" />
                    <span>Merge with existing list (Append new titles)</span>
                </label>

                <div id="md-clone-error" class="text-danger hidden font-medium mt-3 whitespace-pre-wrap"></div>
            `;

            document.getElementById('md-clone-select').addEventListener('change', (e) => {
                const mergeLabel = document.getElementById('md-clone-merge-label');
                mergeLabel.style.display = e.target.value === 'new' ? 'none' : 'flex';
            });

            cancelBtn.className = "rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden accent text";
            cancelBtnSpan.innerText = 'Cancel';

            confirmBtn.className = "rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden primary glow";
            confirmBtnSpan.innerText = 'Continue';

            setTimeout(() => document.getElementById('md-clone-input')?.focus(), 100);

        } else if (type === 'confirm') {
            const { targetName, mangaCount, isMerge, diffNew, diffDups } = options;

            if (isMerge) {
                bgContainer.className = 'bg-background rounded border border-primary';
                titleText.className = 'text-primary';
                titleText.innerText = 'Merge Confirmation';

                body.innerHTML = `
                    <div>
                        You are about to securely <b class="text-primary">MERGE</b> the contents of this list into "<b id="md-clone-target-name">${escapeHtml(targetName)}</b>".<br><br>
                        No existing entries will be deleted. <br>
                        • <b>${diffNew}</b> new titles will be added.<br>
                        • <b>${diffDups}</b> duplicates will be skipped.<br><br>
                        The resulting list will contain <b>${mangaCount}</b> unique titles.<br><br>
                        Are you sure you want to proceed?
                    </div>
                    <div id="md-clone-error" class="text-danger hidden font-medium mt-2 whitespace-pre-wrap"></div>
                `;

                cancelBtn.className = "rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden accent text";
                cancelBtnSpan.innerText = 'Cancel';

                confirmBtn.className = "rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden primary glow";
                confirmBtnSpan.innerText = 'Merge List';
            } else {
                bgContainer.className = 'bg-background rounded border border-danger';
                titleText.className = 'text-danger';
                titleText.innerText = 'Security Check';

                body.innerHTML = `
                    <div>
                        You are about to <b class="text-danger">COMPLETELY OVERWRITE</b> "<b id="md-clone-target-name">${escapeHtml(targetName)}</b>".<br><br>
                        All existing entries will be erased and replaced with the <b id="md-clone-manga-count">${mangaCount}</b> titles from this list.<br><br>
                        Are you sure you want to permanently delete its old contents?
                    </div>
                    <div id="md-clone-error" class="text-danger hidden font-medium mt-2 whitespace-pre-wrap"></div>
                `;

                cancelBtn.className = "rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden primary glow";
                cancelBtnSpan.innerText = 'No';

                confirmBtn.className = "rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden accent text-danger text";
                confirmBtnSpan.innerText = 'Yes';
            }
        }

        document.getElementById('md-dynamic-modal').style.display = 'flex';
    }

    function showError(msg, defaultBtnText = 'Continue') {
        const errEl = document.getElementById('md-clone-error');
        if (errEl) {
            errEl.innerText = msg;
            errEl.classList.remove('hidden');
        } else {
            showToast(msg, 'error');
        }
        const confirmSpan = document.getElementById('md-dynamic-confirm-text');
        if (confirmSpan) confirmSpan.innerText = defaultBtnText;
        document.getElementById('md-dynamic-confirm').disabled = false;
    }

    // --- State Handlers ---

    async function showInputModal(action = 'clone') {
        currentAction = action;
        cleanListeners();

        const token = getAuthToken();
        if (!token) {
            showToast('You must be logged in to do this.', 'error');
            return;
        }

        renderModal('loading');

        try {
            userOwnedListsCache = await fetchUserLists(token);
            renderModal('input');
            currentConfirmHandler = handleAction;
            currentCancelHandler = hideModal;
            bindListeners();
        } catch (error) {
            hideModal();
            showToast('Failed to load your lists.', 'error');
        }
    }

    function askConfirmation(options) {
        return new Promise((resolve) => {
            cleanListeners();
            renderModal('confirm', options);

            currentConfirmHandler = () => { resolve(true); };
            currentCancelHandler = () => { hideModal(); resolve(false); };

            bindListeners();
        });
    }

    async function handleAction() {
        document.getElementById('md-dynamic-confirm-text').innerText = 'Processing...';
        document.getElementById('md-dynamic-confirm').disabled = true;
        document.getElementById('md-clone-error').classList.add('hidden');

        const token = getAuthToken();
        if (!token) return showError('Authentication lost.');

        let sourceName, sourceVisibility, sourceMangaIds;

        if (currentAction === 'clone') {
            const sourceId = getSourceListId();
            if (!sourceId) return showError('Could not determine source list ID.');
            try {
                const sourceData = await fetchList(sourceId, token);
                sourceName = sourceData.data.attributes.name;
                sourceVisibility = sourceData.data.attributes.visibility;
                sourceMangaIds = sourceData.data.relationships.filter(rel => rel.type === 'manga').map(rel => rel.id);
            } catch (error) {
                return showError(error.message);
            }
        } else if (currentAction === 'import') {
            sourceName = importPayload.name;
            sourceVisibility = importPayload.visibility || 'private';
            sourceMangaIds = importPayload.manga;
        }

        const selectedVal = document.getElementById('md-clone-select')?.value;
        const isMerge = document.getElementById('md-clone-merge-checkbox')?.checked || false;

        try {
            if (selectedVal !== 'new') {
                const targetId = selectedVal;
                const targetData = await fetchList(targetId, token);

                // Ownership validation check
                const ownerRel = targetData.data.relationships.find(rel => rel.type === 'user');
                const ownerId = ownerRel ? ownerRel.id : null;
                const tokenPayload = parseJwt(token);
                const currentUserId = tokenPayload ? tokenPayload.sub : null;

                if (!currentUserId || !ownerId || currentUserId !== ownerId) {
                    return showError('You do not own the target list. Action aborted.');
                }

                const tName = targetData.data.attributes.name;
                const tVis = targetData.data.attributes.visibility;
                const tVer = targetData.data.attributes.version;

                const existingMangaIds = targetData.data.relationships.filter(rel => rel.type === 'manga').map(rel => rel.id);
                let finalMangaIds, diffNew, diffDups;

                if (isMerge) {
                    const newIds = sourceMangaIds.filter(id => !existingMangaIds.includes(id));
                    diffNew = newIds.length;
                    diffDups = sourceMangaIds.length - diffNew;
                    finalMangaIds = [...existingMangaIds, ...newIds];
                } else {
                    finalMangaIds = sourceMangaIds;
                }

                if (isPayloadTooLarge(tName, tVis, tVer, finalMangaIds)) {
                    return showError("The resulting list exceeds MangaDex's 8KB payload limit.\nPlease select another list or create a new one.");
                }

                const confirmAction = await askConfirmation({
                    targetName: tName,
                    mangaCount: finalMangaIds.length,
                    isMerge: isMerge,
                    diffNew: diffNew,
                    diffDups: diffDups
                });

                if (!confirmAction) return;

                document.getElementById('md-dynamic-confirm-text').innerText = 'Saving...';
                document.getElementById('md-dynamic-confirm').disabled = true;

                await updateList(targetId, tName, tVis, tVer, finalMangaIds, token);

                hideModal();
                showToast(`List successfully ${isMerge ? 'merged' : 'overwritten'}!`, 'success');
                setTimeout(() => window.location.href = `/list/${targetId}`, 1500);

            } else {
                const newName = `${sourceName}${currentAction === 'import' ? ' (Imported)' : ' (Clone)'}`;
                if (isPayloadTooLarge(newName, sourceVisibility, 1, sourceMangaIds)) {
                    return showError("The source list exceeds MangaDex's 8KB payload limit.\nPlease select fewer items.");
                }

                const newList = await createList(newName, sourceVisibility, token);
                const newId = newList.data.id;
                const newVer = newList.data.attributes.version;

                await updateList(newId, newName, sourceVisibility, newVer, sourceMangaIds, token);

                hideModal();
                showToast(`List successfully ${currentAction === 'import' ? 'imported' : 'cloned'}!`, 'success');
                setTimeout(() => window.location.href = `/list/${newId}`, 1500);
            }

        } catch (error) {
            const isConfirming = document.getElementById('md-dynamic-title').innerText.includes('Confirmation') || document.getElementById('md-dynamic-title').innerText.includes('Check');
            showError(error.message, isConfirming ? 'Yes' : 'Continue');
        }
    }

    // --- JSON Backup System ---

    async function handleExport() {
        const sourceId = getSourceListId();
        if (!sourceId) return showToast('Could not find list ID to export.', 'error');

        const token = getAuthToken();

        try {
            const sourceData = await fetchList(sourceId, token);
            const name = sourceData.data.attributes.name;
            const visibility = sourceData.data.attributes.visibility;
            const mangaIds = sourceData.data.relationships.filter(r => r.type === 'manga').map(r => r.id);

            const exportData = { name: name, visibility: visibility, manga: mangaIds };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `MDList_${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            a.click();

            URL.revokeObjectURL(url);
            showToast('List exported successfully!', 'success');
        } catch (err) {
            showToast(`Export failed: ${err.message}`, 'error');
        }
    }

    async function handleExportAll() {
        const token = getAuthToken();
        if (!token) return showToast('You must be logged in to export lists.', 'error');

        showToast('Fetching all lists... this may take a moment.', 'success');

        try {
            const lists = await fetchUserLists(token);
            if (lists.length === 0) return showToast('You have no lists to export.', 'error');

            const fullLists = await Promise.all(lists.map(l => fetchList(l.id, token)));

            const exportData = {
                type: "mdlist_backup",
                timestamp: new Date().toISOString(),
                lists: fullLists.map(listResp => ({
                    name: listResp.data.attributes.name,
                    visibility: listResp.data.attributes.visibility,
                    manga: listResp.data.relationships.filter(r => r.type === 'manga').map(r => r.id)
                }))
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            a.download = `MDLists_Backup_${dateStr}.json`;
            a.click();

            URL.revokeObjectURL(url);
            showToast(`Successfully exported ${fullLists.length} lists!`, 'success');
        } catch (err) {
            showToast(`Bulk export failed: ${err.message}`, 'error');
        }
    }

    function handleImportClick() {
        const token = getAuthToken();
        if (!token) return showToast('You must be logged in to import lists.', 'error');

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);

                    // Route 1: Bulk Backup Restoration
                    if (data.type === 'mdlist_backup' && Array.isArray(data.lists)) {
                        showToast(`Restoring ${data.lists.length} lists... please wait.`, 'success');
                        let successCount = 0;

                        for (const list of data.lists) {
                            try {
                                let uniqueManga = [...new Set(list.manga)];
                                const visibility = list.visibility || 'private';

                                // Trim down if it hits the 8KB limit
                                while (isPayloadTooLarge(list.name, visibility, 1, uniqueManga) && uniqueManga.length > 0) {
                                    uniqueManga.pop();
                                }

                                const newList = await createList(list.name, visibility, token);
                                await updateList(newList.data.id, list.name, visibility, newList.data.attributes.version, uniqueManga, token);
                                successCount++;
                            } catch (err) {
                                console.error(`Failed to restore list: ${list.name}`, err);
                            }
                        }

                        showToast(`Restored ${successCount}/${data.lists.length} lists! Refreshing...`, 'success');
                        setTimeout(() => location.reload(), 2000);
                        return;
                    }

                    // Route 2: Single List Import
                    if (!data.name || !Array.isArray(data.manga)) throw new Error("Invalid MDList JSON format.");

                    const uniqueManga = [...new Set(data.manga)];
                    const visibility = data.visibility || 'private';

                    if (isPayloadTooLarge(data.name, visibility, 1, uniqueManga)) {
                        throw new Error(`File contains too many titles. The payload limit is 8KB.`);
                    }

                    importPayload = { name: data.name, visibility: visibility, manga: uniqueManga };
                    showInputModal('import');

                } catch (err) {
                    showToast(`Import parsing failed: ${err.message}`, 'error');
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    }

    // --- Injector ---

    function createInjectableButton(text, iconSvg, handler, styleType) {
        const btn = document.createElement('button');

        btn.classList.add('md-injected-btn', 'rounded', 'custom-opacity', 'relative', 'md-btn', 'flex', 'items-center', 'px-3', 'overflow-hidden', 'accent');
        btn.setAttribute('data-v-0082f4a3', '');

        if (styleType === 'list-page') {
            btn.classList.add('px-4', 'flex-grow', 'sm:order-last');
            btn.style.minHeight = '3rem';
            btn.style.minWidth = '100%';
        } else if (styleType === 'special-page') {
            btn.classList.add('ml-auto', 'flex-shrink-0');
            btn.style.minHeight = '2.5rem';
        }

        btn.innerHTML = `
            <span class="flex relative items-center justify-center font-medium select-none w-full pointer-events-none">
                ${iconSvg} <span class="hidden sm:inline">${text}</span>
            </span>
        `;
        btn.addEventListener('click', handler);
        return btn;
    }

    function injectUI() {
        const path = window.location.pathname;

        // Route: /my/lists (Import and Export All)
        if (path === '/my/lists') {
            if (document.querySelector('.md-bulk-tools-injected')) return;
            const newBtn = document.querySelector('a[href="/create/list"]');

            if (newBtn && newBtn.parentElement) {
                const parentDiv = newBtn.parentElement;

                const wrapper = document.createElement('div');
                wrapper.className = "md-bulk-tools-injected flex gap-2 w-full mt-2";

                // Import Button
                const importWrap = document.createElement('div');
                importWrap.className = "relative flex-1";
                Array.from(parentDiv.attributes).forEach(attr => { if (attr.name.startsWith('data-v-')) importWrap.setAttribute(attr.name, attr.value); });

                const importGlow = document.createElement('div');
                importGlow.className = "new-button";
                const origGlow = parentDiv.querySelector('.new-button');
                if (origGlow) Array.from(origGlow.attributes).forEach(attr => { if (attr.name.startsWith('data-v-')) importGlow.setAttribute(attr.name, attr.value); });

                const importBtn = document.createElement('button');
                importBtn.className = "rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden accent text w-full";
                importBtn.style.minHeight = '40px';
                importBtn.setAttribute('data-v-0082f4a3', '');
                importBtn.innerHTML = `<span class="flex relative items-center justify-center font-medium select-none w-full pointer-events-none">${ICONS.IMPORT} <span>Import</span></span>`;
                importBtn.addEventListener('click', handleImportClick);

                importWrap.appendChild(importGlow);
                importWrap.appendChild(importBtn);

                // Export All Button
                const exportWrap = document.createElement('div');
                exportWrap.className = "relative flex-1";
                Array.from(parentDiv.attributes).forEach(attr => { if (attr.name.startsWith('data-v-')) exportWrap.setAttribute(attr.name, attr.value); });

                const exportGlow = document.createElement('div');
                exportGlow.className = "new-button";
                if (origGlow) Array.from(origGlow.attributes).forEach(attr => { if (attr.name.startsWith('data-v-')) exportGlow.setAttribute(attr.name, attr.value); });

                const exportBtn = document.createElement('button');
                exportBtn.className = "rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden accent text w-full";
                exportBtn.style.minHeight = '40px';
                exportBtn.setAttribute('data-v-0082f4a3', '');
                exportBtn.innerHTML = `<span class="flex relative items-center justify-center font-medium select-none w-full pointer-events-none">${ICONS.EXPORT} <span>Export All</span></span>`;
                exportBtn.addEventListener('click', handleExportAll);

                exportWrap.appendChild(exportGlow);
                exportWrap.appendChild(exportBtn);

                wrapper.appendChild(importWrap);
                wrapper.appendChild(exportWrap);

                parentDiv.after(wrapper);
            }
            return;
        }

        const listId = getSourceListId();
        if (!listId) return;

        if (document.querySelector('.md-injected-btn')) return;

        // Route: /list/:id (Clone and Export as siblings in the left column)
        if (path.startsWith('/list/')) {
            const btnContainer = document.querySelector('div[style*="grid-area: buttons"] > div');
            if (btnContainer) {
                btnContainer.classList.add('flex-wrap');

                const toolsWrapper = document.createElement('div');
                toolsWrapper.className = "md-injected-btn flex flex-col gap-2 w-full sm:order-last";

                toolsWrapper.appendChild(createInjectableButton('Clone', ICONS.CLONE, () => showInputModal('clone'), 'list-page'));
                toolsWrapper.appendChild(createInjectableButton('Export', ICONS.EXPORT, handleExport, 'list-page'));

                btnContainer.appendChild(toolsWrapper);
            }
        } else {
            // Route: Special Lists (Clone only, aligned right in header)
            const headerContainer = document.querySelector('.page-container.wide .flex.items-center.mb-6.mt-2');
            if (headerContainer) {
                headerContainer.appendChild(createInjectableButton('Clone', ICONS.CLONE_SM, () => showInputModal('clone'), 'special-page'));
            }
        }
    }

    initDynamicModal();
    setInterval(injectUI, 500);

})();
