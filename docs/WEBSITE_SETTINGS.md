# Edit the magazine page

Open **Editor login → Website settings → Homepage and branding**. Expand a group to edit it, review the preview, and Save a draft. Use Workflow to review and Publish the change when ready. Publishing updates `main`; GitHub Pages then rebuilds the site. Website settings use the same editorial workflow as stories. Drafts are not shown on the live homepage, but public GitHub branches are not confidential.

Available groups:
- Branding and colours: magazine name, optional uploaded logo, browser title, site description, masthead/edition/footer copy, four six-digit colour values and up to eight HTTPS social links.
- Navigation labels and homepage introduction.
- Spotlight: section labels, story eyebrow, read link text and an optional selected published story. Empty or deleted selection uses the newest story. The journal stays ordered by date.
- Fresh perspectives: section heading, eyebrow and description.
- Scrolling strip text.
- Photography feature: heading with italic words, description, uploaded image, image description, credit/caption and linked published story. Empty/deleted linked story goes to the journal.
- Journal heading.
- About/contact: heading, description, contact link label and email. Clear the email to hide the contact link.
- Show/hide switches for spotlight, stories, photography, journal, about and the scrolling strip. Navigation links to hidden sections are hidden too.

This edits the content and visual settings within the current layout. Moving sections, changing grid structures or adding new kinds of components remains a source-code change. The homepage preview shows text, branding and the feature image; it does not load the complete live story grid.

Source: `_data/website.json` is edited by the CMS. Jekyll compiles it into `website.json`, which `website.js` validates and applies using text/DOM APIs. The homepage retains existing HTML defaults if the settings request fails, with a visible refresh notice. Edited settings need JavaScript; the default fallback homepage is still readable without it. Settings and stories load independently, so unavailable settings do not prevent published stories loading. Story selection affects the spotlight only.

Validation: `node tests/website.mjs` covers the schema, draft configuration, safe paths, invalid colours/links/email and selected/deleted story handling. Existing source/content tests still apply. Verify the Website settings form and preview in the live CMS after the PR is merged. To test the editorial workflow, save a draft and confirm the live site stays unchanged; then publish only the intended changes and wait for the Pages build. No sample text changes are published by the implementation itself.
