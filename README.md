# FRAME Magazine — v3 + editorial desk

An independent visual journal with a Decap CMS editor for writing stories and uploading photographs. New entries use a draft/review/publish workflow.

**Activation required:** the editor UI is installed, but GitHub sign-in needs a separate OAuth service configured by the owner. See [editor setup](docs/EDITOR_SETUP.md) before merging or using the login link. No OAuth app, proxy deployment or secrets are created by these files.

## Source map

- `index.html`: responsive magazine with sample fallback content and an Editor login footer link.
- `style.css`: numbered visual/layout sections and design tokens.
- `articles.js`: original three sample articles, retained as a network-failure fallback.
- `content.js`: validates the published manifest, updates the spotlight/cards/journal and loads stories into the reader. Uses DOM APIs for text; does not render user HTML.
- `script.js`: mobile menu, reveals, progress, delegated article routing and filters.
- `_data/stories/*.json`: one published article per file, editable in the CMS. Stable filenames are article URL IDs.
- `stories.json`: Jekyll template that compiles published data into the browser's manifest.
- `_config.yml`: GitHub Pages/Jekyll configuration for `/frame-magazine`.
- `admin/`: editor entry page, public CMS settings/schema and pinned Decap loader.
- `uploads/`: photographs saved by the CMS.
- `docs/EDITOR_SETUP.md`: owner activation steps, draft workflow and acceptance checks.

## Preview and validate

Run `node tests/validate.mjs` and `node tests/content.mjs` for dependency-free source and content validation.

GitHub Pages' built-in Jekyll build generates the story manifest. For a full local preview use a supported Ruby/Jekyll installation and run `jekyll serve --baseurl /frame-magazine`. For a static fallback-only preview use `python3 -m http.server 8000`; this does not compile stories.json and intentionally shows a fallback notice.

Keep Pages on `main` / repository root and do not add `.nojekyll`. Review and merge the implementation PR only after considering the outstanding setup/build/integration checks.

## Editing

Once activated, follow the Editor login link, sign in with GitHub, create or edit a story, and Save to keep it as a draft. Publish is a separate explicit step. Drafts are excluded from the main-branch website, but public repository drafts/media are not confidential. Existing sample copy, contact and imagery still need replacing for a real publication.

Change fixed introductory/about text in `index.html` and design tokens in `style.css`. Story title, category, introduction, photographs, descriptions, credits, reading time, paragraphs and galleries are editable through the CMS. New published stories populate the homepage automatically, ordered by date. Google Fonts, Unsplash sample images and the pinned CMS CDN require internet access.

## Preserved features

Responsive magazine sections, mobile navigation, reading progress, scroll reveals, reduced-motion support, journal filters and native modal articles with direct hashes, keyboard dismissal and focus return. Published content also supports photo galleries and credits.
