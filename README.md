# Lorem Ipsum Checker

A Chrome extension that finds leftover **lorem ipsum placeholder text** on a web page, or across an entire website, before it goes live.

## Features

- **Scan this page**: checks the page you're on, using its live rendered DOM (so JavaScript-rendered content is included).
- **Scan entire website**: crawls the whole site and reports every page containing placeholder text.
  - Discovers pages from `robots.txt` and `sitemap.xml` (including sitemap indexes).
  - Follows internal links, 5 pages at a time.
  - Shows flagged pages live, with the matched text highlighted.
  - Configurable page limit, a Stop button, and **CSV export**.
- **No data leaves your browser.** Everything runs locally; nothing is collected or sent anywhere.

## What it checks

| Location | Examples |
| --- | --- |
| Visible body text | paragraphs, headings, buttons |
| Page title and meta tags | `<title>`, meta description, `og:title`, `og:description` |
| Attributes | `alt`, `title`, `placeholder`, `aria-label` |

Scripts, styles, `<noscript>` and `<template>` content are ignored to reduce false positives.

It looks for common lorem ipsum phrases such as `lorem ipsum`, `dolor sit amet`, `consectetur adipiscing`, `sed do eiusmod` and `ut labore et dolore`. The full list is in [`detect.js`](detect.js).

## Installation

The extension isn't on the Chrome Web Store, so install it manually:

1. Clone or download this repository (use **Code → Download ZIP** and extract it).
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder that **directly contains `manifest.json`**.
5. Click the puzzle-piece icon in the toolbar and pin **Lorem Ipsum Checker**.

Works in other Chromium browsers (Edge, Brave) using the same steps from their extensions page.

> **"Manifest file is missing or unreadable"?** You selected the wrong folder. Pick the folder that has `manifest.json` immediately inside it, not a parent folder and not the zip file.

## Usage

### Scan a single page

1. Open a normal `http://` or `https://` page.
2. Click the extension icon, then **Scan this page**.
3. The popup shows either a green "No lorem ipsum found" message or a list of matches with surrounding text.

### Scan a whole site

1. Open any page on the site you want to check.
2. Click the extension icon, then **Scan entire website**.
3. A report tab opens and the scan starts automatically.
4. Adjust **Max pages** (default 300) and click **Start scan** to rescan with a different limit.
5. Click **Export CSV** when finished for the full list of pages, match locations and snippets.

## Project structure

```
├── manifest.json   # Extension manifest (Manifest V3)
├── detect.js       # Shared detection logic and phrase list
├── popup.html      # Toolbar popup UI
├── popup.js        # Single-page scan logic
├── report.html     # Site-scan report page
└── report.js       # Crawler, results rendering, CSV export
```

## Customizing

To detect other placeholder text (for example `TODO`, `Your text here`, or `Coming soon`), add phrases to the `PHRASES` array in `detect.js`, then click the reload icon on the extension's card in `chrome://extensions`.

## Limitations

- **The site crawl reads raw HTML.** Text that only appears after JavaScript runs (React, Vue and other single-page apps) won't be seen by the crawler. Use **Scan this page** on those pages.
- **Same origin only.** Subdomains (`blog.example.com` vs `example.com`) are treated as separate sites.
- **Logged-in pages** are fetched with your browser's cookies, so they usually work if you're signed in, but this isn't guaranteed.
- **Browser-internal pages** (`chrome://`, the Chrome Web Store) can't be scanned.
- Pages that exist but aren't linked or listed in a sitemap won't be discovered.

## Permissions

| Permission | Why it's needed |
| --- | --- |
| `scripting` | Run the detector on the current tab for **Scan this page** |
| `activeTab` | Access the tab you click the extension on |
| Host access (`<all_urls>`) | Fetch pages of the site you choose to crawl |

## Privacy

The extension has no server, analytics, or tracking. Pages are fetched and analyzed entirely inside your browser, and results are never transmitted.

## Contributing

Issues and pull requests are welcome. For changes, edit the files directly and reload the extension from `chrome://extensions` to test.

## License

MIT License

Copyright (c) [2026] [Thanuja Fernando]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
