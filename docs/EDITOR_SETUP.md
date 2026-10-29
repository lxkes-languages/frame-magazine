# FRAME editor: one-time activation

The editor UI and content pipeline are prepared. GitHub sign-in is **not active** until the owner connects an OAuth service. Do not treat merging this PR as completion of login setup.

## What you will use

Once activated, open `https://lxkes-languages.github.io/frame-magazine/admin/` or use **Editor login** in the magazine footer. Sign in with the GitHub account that has write access to this repository.

1. Open **Stories → New Story**.
2. Add the title, category, date, short introduction, cover photograph, image description and paragraphs. Optionally add photo credits and a gallery.
3. Choose **Save** to save a draft. Decap's editorial workflow keeps it on a separate CMS branch/pull request. It does not update the published magazine.
4. Review the draft in **Workflow**, move it to Ready when appropriate, then choose **Publish**. Publication merges that story's changes into `main`; GitHub Pages rebuilds the magazine.
5. Refresh the magazine after the Pages deployment finishes. New stories appear in the spotlight, Fresh perspectives and Latest stories, newest first. Dates are editorial ordering dates; this does not schedule publication.

A repository collaborator with write access can also publish. Drafts are unpublished on the website, but this is a public GitHub repository: draft branches, pull requests and committed media can be publicly readable. They are not confidential storage. The standalone Media library can commit uploads independently of a story; upload from the draft editor when working on a draft.

## Connect GitHub sign-in

GitHub Pages cannot keep an OAuth client secret. Use a Decap-compatible OAuth service separate from the static website. Decap's official backend guide describes this architecture and links to a maintained Cloudflare Worker template:

- https://decapcms.org/docs/backends-overview/#using-github-with-an-oauth-proxy
- https://github.com/sterlingwes/decap-proxy

Follow the template's current instructions to create a GitHub OAuth app and deploy its proxy in your Cloudflare account. The OAuth app callback is the deployed proxy origin plus `/callback`. The proxy must handle `/auth` and `/callback`, validate OAuth state, and restrict message delivery to `https://lxkes-languages.github.io`. Configure its allowed editor origin according to the template's documentation. Keep the OAuth secret only in the service's secret storage, never in this repository or a chat message.

After the service is deployed, set `authBaseUrl` in `admin/settings.json` to its HTTPS origin, for example `https://your-editor-auth.your-account.workers.dev`. Use your real deployed origin, with no `/auth` path. `admin/editor.js` reads this setting and injects `backend.base_url` into the CMS configuration. With an empty setting it shows an honest setup message and does not load the CMS or begin login.

The Cloudflare account and GitHub OAuth app require an account-owner setup step; they are not created by this PR. There is no new production hosting subscription or deployment in this change. A hosted Decap authentication provider is another option, but may need a different backend configuration; check that provider's current instructions first.

## GitHub Pages build

Keep Pages configured as **Deploy from a branch → main → /(root)**. Pages runs its built-in Jekyll builder; no npm install or custom Actions workflow is required. Do not add `.nojekyll`.

Each published entry is a JSON file under `_data/stories/`. `stories.json` has Jekyll front matter and compiles that directory to a single JSON manifest. The homepage fetches that manifest; there are no public GitHub API requests or API rate limits for readers. Draft branches are not part of the main-branch Pages build.

The original three records keep filenames `1.json`, `2.json`, `3.json`, preserving existing `#article-1` through `#article-3` URLs. New files use title-based slugs. Keep filenames stable after publishing. Image uploads use `/frame-magazine/uploads/` so they work under this repository's Pages subpath. Change those paths and `baseurl` if you add a custom domain later.

The homepage retains sample HTML/data as a fallback if the manifest cannot load. It displays a visible fallback notice in that case. This fallback does not include new uploads. It is not a draft preview or an offline publishing system.

## Before merging / activation acceptance check

Run `node tests/validate.mjs` and `node tests/content.mjs`. Build with Jekyll in a suitable environment and ensure the generated `stories.json` is valid JSON containing all published records. A plain static file server cannot compile the source manifest; it will show the documented fallback instead. For a full local build, install a supported Ruby/Jekyll environment and use `jekyll serve --baseurl /frame-magazine`.

After OAuth setup, sign in, create a draft with a test image and gallery, save it, reload the editor and confirm persistence. Confirm the live homepage and manifest do not include the draft. Publish it, wait for the Pages deployment, then check the spotlight/card/journal, article text, credit, gallery, category filtering and direct URL. Confirm an account without repository write access cannot save or publish. Delete the test entry through the editor when finished.

This PR has source/unit checks only. Live OAuth, upload persistence, editorial workflow, Pages compilation and responsive browser verification require activation/integration testing. Do not mark these checked until exercised.
