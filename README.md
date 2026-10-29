# FRAME Magazine — v3

An independent visual journal built with semantic HTML, responsive CSS and vanilla JavaScript. Ready for GitHub Pages; no build step or dependencies.

## Local preview

From the repository root, run `python3 -m http.server 8000` and open http://localhost:8000. Use HTTP rather than opening the HTML file directly.

## Source map

- `index.html`: masthead, spotlight, curated stories, visual archive, filterable journal, about and native article dialog. Existing section anchors and `#article-1` through `#article-3` URLs are retained.
- `style.css`: numbered foundation, navigation, spotlight, stories, journal, reader and responsive sections. Design tokens live at the top. The former `layout-fix.css` is consolidated here and removed.
- `articles.js`: sample article data, keyed by stable article IDs. Loaded before the interaction script using ordered deferred scripts.
- `script.js`: separate initializers for the mobile menu, reveals, reading progress, filters and hash-based article reader. Article text uses DOM APIs rather than HTML injection.

## Edit content

Change homepage text and image descriptions in `index.html`. Change reader text and images in `articles.js`; keep the homepage links and article IDs in sync. Set colours, spacing and type in `:root` in `style.css`.

The articles, reading-time labels and `hello@example.com` contact are sample content retained from v2. Replace them with edited stories, accurate reading times and your contact before launching a real publication. External Unsplash images and Google Fonts require an internet connection; system font fallbacks are provided. Use original or appropriately licensed photography and add photographer credits for production. No imagery or text is copied from Pornoligero.

## Features

- Image-led editorial spotlight, staggered story grid and full-width visual archive.
- Responsive mobile menu with expanded state, Escape dismissal and navigation without JavaScript.
- Three native modal articles with shareable hashes, Escape/backdrop dismissal and focus return.
- Journal category filters with pressed states and announced result counts.
- Scroll reveals, reading progress, image hover treatment and animated editorial strip.
- Reduced-motion support, visible keyboard focus, skip link, descriptive images and labelled reader.
- Flexible grid tracks, wrapping metadata and locally contained marquee prevent horizontal page overflow without hiding it globally.

## Review and publish

Review the FRAME v3 pull request before merging. With GitHub Pages configured for `main` / repository root, merging redeploys the site. The v3 branch does not change Pages settings.

## Manual regression checklist

Check 320, 375, 390, 700, 768, 1024 and 1440px widths plus 200% zoom. Verify there is no page-level horizontal scroll, navigation is usable, all four filters work, every article opens, and close button, Escape, backdrop, browser Back/Forward and direct article URLs behave correctly. Check keyboard focus and reduced-motion mode. Disable JavaScript to confirm homepage content and navigation remain visible.

## Source validation

With Node.js installed, run `node tests/validate.mjs`. This checks JavaScript syntax, local assets, unique IDs, section links, article links/data, image metadata and script order. It does not replace browser layout or interaction testing.
