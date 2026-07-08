// ==UserScript==
// @name         MangaDex - Import NamiComi Draft with Covers
// @namespace    https://mangadex.org
// @icon         https://mangadex.org/favicon.ico
// @version      1.8
// @description  Import entries from NamiComi to MangaDex
// @author       Bartolumiu
// @match        *://mangadex.org/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      api.namicomi.com
// @connect      api.mangadex.org
// @connect      uploads.namicomi.com
// @updateURL    https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_import_namicomi.user.js
// @downloadURL  https://raw.githubusercontent.com/Bartolumiu/random-tools/refs/heads/main/mangadex/userscripts/MD_import_namicomi.user.js
// ==/UserScript==

(function() {
    'use strict';

    // NamiComi tag ID <=> MangaDex tag ID
    const tagMap = {
        "4-koma": "b11fda93-8f1d-4bef-b2ed-8803d3733170",
        "action": "391b0423-d847-456f-aff0-8b0cfc03066b",
        "adaptation": "f4122d1c-3b44-44d0-9936-ff7502c39ad3",
        "adventure": "87cc87cd-a395-47af-b27a-93258283bbc6",
        "aliens": "e64f6742-c834-471d-8d72-dd51fc02b835",
        "animals": "3de8c75d-8ee3-48ff-98ee-e20a65c86451",
        "anthology": "51d83883-4103-437c-b4b1-731cb73d786c",
        "award-winning": "0a39b5a1-b235-4886-a747-1d05d216532d",
        "boys-love": "5920b825-4181-4a17-beeb-9918b0ff7a30",
        "comedy": "4d32cc48-9f00-4cca-9b5a-a839f0764984",
        "cooking": "ea2bc92d-1c26-4930-9b7c-d5c0dc1b6869",
        "crime": "5ca48985-9a9d-4bd8-be29-80dc0303db72",
        "crossdressing": "9ab53f92-3eed-4e9b-903a-917c86035ee3",
        "delinquents": "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea",
        "demons": "39730448-9a5f-48a2-85b0-a70db87b1233",
        "drama": "b9af3a63-f058-46de-a9a0-e0c13906197a",
        "fantasy": "cdc58593-87dd-415e-bbc0-2ec27bf404cc",
        "full-color": "f5ba408b-0e7a-484d-8d49-4e9125ac96de",
        "genderswap": "2bd2e8d0-f146-434a-9b51-fc9ff2c5fe6a",
        "ghosts": "3bb26d85-09d5-4d2e-880c-c34b974339e9",
        "girls-love": "a3c67850-4684-404e-9b7f-c69850ee5da6",
        "gore": "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d",
        "gyaru": "fad12b5e-68ba-460e-b933-9ae8318f5b65",
        "harem": "aafb99c1-7f60-43fa-b75f-fc9502ce29c7",
        "historical": "33771934-028e-4cb3-8744-691e866a923e",
        "horror": "cdad7e68-1419-41dd-bdce-27753074a640",
        "isekai": "ace04997-f6bd-436e-b261-779182193d3d",
        "mafia": "85daba54-a71c-4554-8a28-9901a8b0afad",
        "magic": "a1f53773-c69a-4ce5-8cab-fffcd90b1565",
        "magical-girls": "81c836c9-914a-4eca-981a-560dad663e73",
        "martial-arts": "799c202e-7daa-44eb-9cf7-8a3c0441531e",
        "mecha": "50880a9d-5440-4732-9afb-8f457127e836",
        "medical": "c8cbe35b-1b2b-4a3f-9c37-db84c4514856",
        "military": "ac72833b-c4e9-4878-b9db-6c8a4a99444a",
        "monster-girls": "dd1f77c5-dea9-4e2b-97ae-224af09caf99",
        "monsters": "36fd93ea-e8b8-445e-b836-358f02b3d33d",
        "music": "f42fbf9e-188a-447b-9fdc-f19dc1e4d685",
        "mystery": "ee968100-4191-4968-93d3-f82d72be7e46",
        "ninja": "489dd859-9b61-4c37-af75-5b18e88daafc",
        "office-workers": "92d6d951-ca5e-429c-ac78-451071cbf064",
        "oneshot": "0234a31e-a729-4e28-9d6a-3f87c4966b9e",
        "philosophical": "b1e97889-25b4-4258-b28b-cd7f4d28ea9b",
        "police": "df33b754-73a3-4c54-80e6-1a74a8058539",
        "post-apocalyptic": "9467335a-1b83-4497-9231-765337a00b96",
        "psychological": "3b60b75c-a2d7-4860-ab56-05f391bb889c",
        "reincarnation": "0bc90acb-ccc1-44ca-a34a-b9f3a73259d0",
        "reverse-harem": "65761a2a-415e-47f3-bef2-a9dababba7a6",
        "romance": "423e2eae-a7a2-4a8b-ac03-a8351462d71d",
        "samurai": "81183756-1453-4c81-aa9e-f6e1b63be016",
        "school-life": "caaa44eb-cd40-4177-b930-79d3ef2afe87",
        "sci-fi": "256c8bd9-4904-4360-bf4f-508a76d67183",
        "slice-of-life": "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
        "sports": "69964a64-2f90-4d33-beeb-f3ed2875eb4c",
        "superhero": "7064a261-a137-4d3a-8848-2d385de3a99c",
        "supernatural": "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
        "survival": "5fff9cde-849c-4d78-aab0-0d52b2ee1d25",
        "thriller": "07251805-a27e-4d59-b488-f0bfbec15168",
        "time-travel": "292e862b-2d17-4062-90a2-0356caa4ae27",
        "traditional-games": "31932a7e-5b8e-49a6-9f12-2afa39dc544c",
        "tragedy": "f8f62932-27da-4fe4-8ee1-6779a8c5edba",
        "vampires": "d7d1730f-6eb0-4ba6-9437-602cac38664c",
        "video-games": "9438db5a-7e2a-4ac0-b39e-e0d95a34b8a8",
        "villainess": "d14322ac-4d6f-4e9b-afd9-629d5f4d8a41",
        "virtual-reality": "8c86611e-fab7-4986-9dec-d1a2f44acdd5",
        "wuxia": "acc803a4-c95a-4c22-86fc-eb6b582d82a2",
        "zombies": "631ef465-9aba-4afb-b0fc-ea10efe274a8",
        "sexual-abuse": "97893a4c-12af-4dac-b6be-0dffb353568e" // Mapped to MD's Sexual Violence
    };

    const localeMap = {
        'es-419': 'es-la',
        'zh-hant': 'zh-hk',
        'pt-br': 'pt-br'
    };

    function mapLocale(locale) {
        return localeMap[locale] || locale;
    }

    function extractTitleId(input) {
        input = input.trim();
        if (/^[a-zA-Z0-9]{8}$/.test(input)) return input;
        let match = input.match(/(?:namicomi\.com|nami\.moe)\/t\/([a-zA-Z0-9]{8})/);
        if (match) return match[1];
        match = input.match(/namicomi\.com(?:\/[a-z-]+)?\/title\/([a-zA-Z0-9]{8})/);
        if (match) return match[1];

        return null;
    }

    function getMangaDexToken() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('oidc.user:')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data?.access_token) return data.access_token;
                } catch(e) {}
            }
        }
        return null;
    }

    function buildMangaDexPayload(namiData, hasEnglishChapters) {
        const attr = namiData.attributes;
        const origLang = mapLocale(attr.originalLanguage || 'en');
        const rawTitles = attr.title || {};

        let mainTitle = {};
        let altTitles = [];

        const mainTitleRawLang = rawTitles[attr.originalLanguage] ? attr.originalLanguage : Object.keys(rawTitles)[0];

        if (mainTitleRawLang) {
            mainTitle[mapLocale(mainTitleRawLang)] = rawTitles[mainTitleRawLang];
        }

        for (const [lang, text] of Object.entries(rawTitles)) {
            if (lang !== mainTitleRawLang) {
                let alt = {};
                alt[mapLocale(lang)] = text;
                altTitles.push(alt);
            }
        }

        let mdDescription = {};
        if (attr.description) {
            for (const [lang, text] of Object.entries(attr.description)) {
                mdDescription[mapLocale(lang)] = text;
            }
        }

        let demographic = attr.demographic;
        if (!['shounen', 'shoujo', 'seinen', 'josei'].includes(demographic)) {
            demographic = null;
        }

        const mappedTags = [
            "891cf039-b895-47f0-9229-bef4c96eccd4" // Always inject Self-Published tag
        ];

        // Inject Long Strip tag if readingMode is 'vls'
        if (attr.readingMode === 'vls') {
            mappedTags.push("3e2b8dae-350e-4ab8-a8ce-016e844b9f0d");
        }

        if (namiData.relationships) {
            namiData.relationships.forEach(rel => {
                if (rel.type === 'tag' || rel.type === 'primary_tag' || rel.type === 'secondary_tag') {
                    if (rel.attributes && rel.attributes.slug) {
                        const mdTagId = tagMap[rel.attributes.slug];
                        if (mdTagId && !mappedTags.includes(mdTagId)) {
                            mappedTags.push(mdTagId);
                        }
                    }
                }
            });
        }

        // Link Generation Logic
        const namiLink = `https://namicomi.com/t/${namiData.id}?utm_source=md`;
        let links = {};

        if (origLang === 'en') {
            links.engtl = namiLink;
        } else {
            links.raw = namiLink;
            if (hasEnglishChapters) {
                links.engtl = namiLink;
            }
        }

        return {
            title: mainTitle,
            altTitles: altTitles,
            description: mdDescription,
            authors: [],
            artists: [],
            links: links,
            originalLanguage: origLang,
            publicationDemographic: demographic,
            status: ['ongoing', 'completed', 'hiatus', 'cancelled'].includes(attr.publicationStatus) ? attr.publicationStatus : 'ongoing',
            year: attr.year || null,
            contentRating: ['safe', 'suggestive', 'erotica', 'pornographic'].includes(attr.contentRating) ? attr.contentRating : 'safe',
            chapterNumbersResetOnNewVolume: true,
            tags: mappedTags,
            version: 1
        };
    }

    // Secondary fetch to check if the NamiComi title has English chapters
    function fetchChapterLanguages(titleId) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://api.namicomi.com/chapter/languages?titleIds[]=${titleId}`,
                onload: (res) => {
                    if (res.status === 200) {
                        try {
                            const json = JSON.parse(res.responseText);
                            const count = json.data?.aggregatedLanguageCounts?.en || 0;
                            resolve(count > 0);
                        } catch(e) {
                            resolve(false);
                        }
                    } else {
                        resolve(false);
                    }
                },
                onerror: () => resolve(false)
            });
        });
    }

    // Fetches image as Blob directly via Userscript API to bypass CORS
    function fetchImageBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: "blob",
                onload: (res) => {
                    if (res.status === 200) {
                        resolve(res.response);
                    } else {
                        reject(new Error(`Status ${res.status}`));
                    }
                },
                onerror: (err) => reject(err)
            });
        });
    }

    // Updates the button text
    function updateButtonText(text) {
        const textSpan = document.getElementById('namicomi-btn-text');
        if (textSpan) textSpan.innerText = text;
    }

    async function processNamiComiImport() {
        const input = prompt("Enter the NamiComi Title URL or ID:\n(e.g., nami.moe/t/Vx5jXEba or just Vx5jXEba)");
        if (!input) return;

        const titleId = extractTitleId(input);
        if (!titleId) {
            alert("Could not extract a valid NamiComi ID from your input.");
            return;
        }

        updateButtonText('Importing Data...');

        GM_xmlhttpRequest({
            method: "GET",
            url: `https://api.namicomi.com/title/${titleId}?includes[]=tag&includes[]=primary_tag&includes[]=secondary_tag&includes[]=cover_art`,
            onload: async function(response) {
                try {
                    const json = JSON.parse(response.responseText);
                    if (json.result !== "ok" || !json.data) throw new Error("Invalid NamiComi response.");

                    // Query the auxiliary endpoint to check for English chapters
                    const hasEnglishChapters = await fetchChapterLanguages(titleId);

                    const payload = buildMangaDexPayload(json.data, hasEnglishChapters);
                    const token = getMangaDexToken();

                    if (!token) {
                        GM_setClipboard(JSON.stringify(payload, null, 2));
                        alert("MangaDex Auth Token not found.\n\nThe JSON payload has been copied to your clipboard instead.");
                        updateButtonText('Import from NamiComi');
                        return;
                    }

                    // 1. Create the Manga Draft
                    const mdResponse = await fetch('https://api.mangadex.org/manga', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    const mdJson = await mdResponse.json();

                    if (!mdResponse.ok || mdJson.result !== "ok" || !mdJson.data || !mdJson.data.id) {
                        console.error("MangaDex Draft Error:", mdJson);
                        GM_setClipboard(JSON.stringify(payload, null, 2));
                        alert(`MangaDex API rejected the draft.\n\nError: ${mdJson.errors?.[0]?.detail || 'Unknown'}\n\nThe raw JSON payload was copied to your clipboard to use manually.`);
                        updateButtonText('Import from NamiComi');
                        return;
                    }

                    const newMangaId = mdJson.data.id;
                    let successfulCovers = 0;

                    // 2. Fetch and Upload Covers
                    if (json.data.relationships) {
                        const covers = json.data.relationships.filter(rel => rel.type === 'cover_art');

                        if (covers.length > 0) updateButtonText(`Uploading ${covers.length} Covers...`);

                        for (const cover of covers) {
                            try {
                                const attr = cover.attributes;

                                // Map and validate Locale for MD requirements
                                let mdLocale = mapLocale(attr.locale) || payload.originalLanguage || "en";
                                if (!/^[a-z]{2}(-[a-z]{2})?$/.test(mdLocale)) {
                                    mdLocale = "en"; // Safe fallback
                                }

                                const baseFilename = attr.fileName;
                                let blob = null;

                                // Attempt Original Image
                                try {
                                    blob = await fetchImageBlob(`https://uploads.namicomi.com/covers/${titleId}/${baseFilename}`);
                                } catch (e) {
                                    // Fallback to compressed format if original fails
                                    blob = await fetchImageBlob(`https://uploads.namicomi.com/covers/${titleId}/${baseFilename}.512.jpg`);
                                }

                                if (blob) {
                                    const formData = new FormData();
                                    const ext = blob.type === 'image/png' ? 'png' : 'jpg';

                                    formData.append("file", blob, `cover.${ext}`);
                                    formData.append("locale", mdLocale);

                                    // Default volume to "0" if missing/empty
                                    const vol = (attr.volume !== null && attr.volume !== undefined && attr.volume !== "") ? String(attr.volume) : "0";
                                    formData.append("volume", vol);

                                    if (attr.description) formData.append("description", attr.description);

                                    const coverRes = await fetch(`https://api.mangadex.org/cover/${newMangaId}`, {
                                        method: "POST",
                                        headers: {
                                            "Authorization": `Bearer ${token}`
                                        },
                                        body: formData
                                    });

                                    if (coverRes.ok) successfulCovers++;
                                }
                            } catch (coverErr) {
                                console.warn("Skipped a cover due to fetch/upload failure:", coverErr);
                            }
                        }
                    }

                    alert(`Draft successfully created!\nUploaded ${successfulCovers} cover(s).`);
                    window.location.reload();

                } catch (error) {
                    console.error("NamiComi Import Error:", error);
                    alert("Failed to process the NamiComi entry. Check console for details.");
                } finally {
                    updateButtonText('Import from NamiComi');
                }
            },
            onerror: function(err) {
                console.error("GM_xmlhttpRequest Error:", err);
                alert("Network error while reaching NamiComi API.");
                updateButtonText('Import from NamiComi');
            }
        });
    }

    function injectButton() {
        if (!window.location.pathname.includes('/titles/drafts')) return;
        if (document.getElementById('namicomi-import-wrapper')) return;

        const newDraftBtn = document.querySelector('a[href="/create/title"]');
        if (!newDraftBtn || !newDraftBtn.parentElement) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'relative mt-2';
        wrapper.id = 'namicomi-import-wrapper';

        const button = document.createElement('button');
        button.className = 'rounded custom-opacity relative md-btn flex items-center px-3 overflow-hidden accent text px-4';
        button.style.minHeight = '40px';
        button.style.minWidth = '100%';
        button.addEventListener('click', processNamiComiImport);

        const span = document.createElement('span');
        span.className = 'flex relative items-center justify-center font-medium select-none w-full pointer-events-none';
        span.style.justifyContent = 'center';

        span.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="feather feather-download icon size-6 mr-4" viewBox="0 0 24 24" style="color: currentcolor;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span id="namicomi-btn-text">Import from NamiComi</span>
        `;

        button.appendChild(span);
        wrapper.appendChild(button);

        newDraftBtn.parentElement.after(wrapper);
    }

    const DRAFTS_REGEX = /^\/titles\/drafts\/?$/;

    function tryInitButton() {
        if (!DRAFTS_REGEX.test(location.pathname)) return;
        let tries = 0;
        const iv = setInterval(() => {
            if (document.querySelector('a[href="/create/title"]') || tries++ > 10) {
                clearInterval(iv);
                injectButton();
            }
        }, 300);
    }

    let currentPath = location.pathname;
    const observer = new MutationObserver(() => {
        if (location.pathname !== currentPath) {
            currentPath = location.pathname;
            if (DRAFTS_REGEX.test(location.pathname)) tryInitButton();
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        if (DRAFTS_REGEX.test(location.pathname)) tryInitButton();
    });

})();
