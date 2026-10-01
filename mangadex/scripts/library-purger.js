(async () => {
  const API_BASE = 'https://api.mangadex.org';
  const BATCH_SIZE = 100;
  const DELAY_MS = 250; // 4 req/sec to stay safely within MangaDex's 5 req/sec limit for regular user accounts (sequential fetch so should be fine anyways)

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const RATING_MAP = {
    1: { key: 'safe', label: 'Safe' },
    2: { key: 'suggestive', label: 'Suggestive' },
    3: { key: 'erotica', label: 'Erotica' },
    4: { key: 'pornographic', label: 'Mature' }, // FE "Mature" = API "pornographic"
  };

  // --- Token Retrieval ---
  const storageKey = 'oidc.user:https://auth.mangadex.org/realms/mangadex:mangadex-frontend-stable';
  let token = null;

  try {
    token = JSON.parse(localStorage.getItem(storageKey))?.access_token;
  } catch {}

  if (!token) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('oidc.user:')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key));
          if (parsed?.access_token) {
            token = parsed.access_token;
            break;
          }
        } catch {}
      }
    }
  }

  if (!token) {
    console.error('Couldn\'t find access token. Make sure you are logged into MangaDex.');
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  async function apiFetch(url, options = {}, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const res = await fetch(url, options);
      if (res.status === 429) {
        const retrySec = parseInt(res.headers.get('Retry-After') || '2', 10);
        console.warn(`Rate limited (429). Waiting ${retrySec}s...`);
        await sleep(retrySec * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    }
    throw new Error('Exceeded max retries from rate limiting.');
  }

  // --- Input Parser (Handles 0, 1-4, 5, ranges, and comma lists) ---
  function parseSelection(input) {
    if (!input || input.trim() === '0') return null; // Cancel
    const clean = input.trim();

    if (clean === '5' || clean === '1-4') {
      return Object.values(RATING_MAP).map((r) => r.key);
    }

    const selectedNumbers = new Set();
    const tokens = clean.split(/[\s,]+/);

    for (const token of tokens) {
      if (!token) continue;
      if (token === '5') {
        [1, 2, 3, 4].forEach((n) => selectedNumbers.add(n));
        continue;
      }
      if (token.includes('-')) {
        const [startStr, endStr] = token.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= 4) selectedNumbers.add(i);
          }
        }
      } else {
        const num = parseInt(token, 10);
        if (num >= 1 && num <= 4) selectedNumbers.add(num);
      }
    }

    if (selectedNumbers.size === 0) return [];
    return Array.from(selectedNumbers).sort().map((n) => RATING_MAP[n].key);
  }

  // --- Scan Library ---
  console.log('Fetching user library statuses...');
  const statusRes = await apiFetch(`${API_BASE}/manga/status`, { headers });
  const statuses = statusRes.statuses || {};
  const allIds = Object.keys(statuses);

  console.log(`Found ${allIds.length} titles in library. Categorising...`);

  const library = {
    safe: [],
    suggestive: [],
    erotica: [],
    pornographic: [],
  };

  const chunks = [];
  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    chunks.push(allIds.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const params = new URLSearchParams({ limit: String(BATCH_SIZE) });
    ['safe', 'suggestive', 'erotica', 'pornographic'].forEach((r) => params.append('contentRating[]', r));
    chunk.forEach((id) => params.append('ids[]', id));

    const mangaRes = await apiFetch(`${API_BASE}/manga?${params.toString()}`, { headers });
    const items = mangaRes.data || [];

    for (const manga of items) {
      const rating = manga.attributes?.contentRating;
      const title = manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || 'Unknown Title';

      if (library[rating]) {
        library[rating].push({
          id: manga.id,
          title,
          status: statuses[manga.id],
          contentRating: rating,
        });
      }
    }

    console.log(`Scanning: ${Math.min((i + 1) * BATCH_SIZE, allIds.length)} / ${allIds.length}`);
    if (i < chunks.length - 1) await sleep(DELAY_MS);
  }

  // Display breakdown
  console.log('Scanning complete! Here is your current library:');
  console.table({
    '1: Safe': library.safe.length,
    '2: Suggestive': library.suggestive.length,
    '3: Erotica': library.erotica.length,
    '4: Mature': library.pornographic.length,
    'Total Library': allIds.length,
  });

  // --- Interactive Removal Wizard ---
  async function runCleanupWizard() {
    const promptMessage = [
      'Select which ratings to REMOVE from your library:',
      '  0   <- Cancel',
      '  1   <- Safe',
      '  2   <- Suggestive',
      '  3   <- Erotica',
      '  4   <- Mature',
      '  5   <- Everything',
      '',
      'Examples: "3,4" (Erotica + Mature) | "2-4" (Suggestive to Mature) | "1-2"',
    ].join('\n');

    const input = prompt(promptMessage);
    const selectedRatings = parseSelection(input);

    if (selectedRatings === null) {
      console.log('Cleanup cancelled. No changes were made.');
      return;
    }

    if (selectedRatings.length === 0) {
      alert('Invalid selection. Please enter numbers like 3,4 or 2-4.');
      return;
    }

    const readableLabels = selectedRatings.map((key) => {
      const found = Object.values(RATING_MAP).find((r) => r.key === key);
      return found ? found.label : key;
    });

    const targetManga = selectedRatings.flatMap((r) => library[r] || []);

    if (targetManga.length === 0) {
      alert(`No titles found matching: ${readableLabels.join(', ')}.`);
      return;
    }

    const confirmed = confirm(
      `CONFIRM DELETION:\n\n` +
      `You selected: ${readableLabels.join(', ')}\n` +
      `Total titles to permanently unfollow: ${targetManga.length}\n\n` +
      `Proceed?`
    );

    if (!confirmed) {
      console.log('Cleanup aborted by user. You can start it again by running window.cleanLibrary()');
      return;
    }

    console.log(`Starting unfollow of ${targetManga.length} titles...`);
    let count = 0;

    for (const item of targetManga) {
      count++;
      try {
        await apiFetch(`${API_BASE}/manga/${item.id}/status`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ status: null }),
        });
        console.log(`[${count}/${targetManga.length}] Removed: "${item.title}" (${item.contentRating})`);
      } catch (err) {
        console.error(`Failed removing "${item.title}" (${item.id}):`, err);
      }
      await sleep(DELAY_MS);
    }

    console.log(`Done! Successfully removed ${count} titles from your library.`);
  }

  // Attach to window so it can be re-run at any time without re-scanning
  window.mangaDexLibrary = library;
  window.cleanLibrary = runCleanupWizard;

  // Launch prompt immediately
  await runCleanupWizard();
})();
