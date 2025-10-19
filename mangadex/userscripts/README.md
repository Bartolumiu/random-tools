# MangaDex Userscripts

A collection of UserScripts for MangaDex and related sites.

## Requirements

- Tampermonkey or Greasemonkey browser extension

## Scripts

- `copy-chapter-id-button.user.js`: Quick copy of chapter UUID.
  - Features:
    - Adds a “Copy ID” button on chapter pages
    - Visual feedback on success (copy icon changes temporarily)
- `MD_main_title_lang_select.user.js`: Language selector for main title.
  - Features:
    - Detects current main title language from API
    - Dropdown to switch language code without manual retyping
    - Injects proper `title` object into PUT save request
    - Remembers last chosen language during session
    - Plays nicely with `MD_title_reorder.user.js`
- `MD_title_reorder.user.js`: Reorder Alternative Titles with UI helpers.
  - Features:
    - Drag-and-drop + ▲/▼ buttons per row
    - Live snapshot of current order (injected on Save PUT)
  - Dedupe by (language, case-insensitive trimmed title)
  - Auto-updating numeric index badges
  - Works alongside main title language selector script

## Installation

1. Install Tampermonkey/Greasemonkey.
2. Import the `.user.js` file into your extension or click the corresponding links below.

## Quick Install

Click any link below (Tampermonkey should prompt to install):

| Script                    | Installation Link                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| copy-chapter-id-button    | [Install](https://raw.githubusercontent.com/Bartolumiu/random-tools/main/mangadex/userscripts/copy-chapter-id-button.user.js)    |
| MD_main_title_lang_select | [Install](https://raw.githubusercontent.com/Bartolumiu/random-tools/main/mangadex/userscripts/MD_main_title_lang_select.user.js) |
| MD_title_reorder          | [Install](https://raw.githubusercontent.com/Bartolumiu/random-tools/main/mangadex/userscripts/MD_title_reorder.user.js)          |

## License

GPL-3.0
