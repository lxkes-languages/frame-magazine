# FRAME GitHub login bridge

Cloudflare Worker source for the single-owner FRAME editor. Deploy `worker.mjs` to the existing `frame-editor-auth` Worker after reviewing it. The `admin/settings.json` activation change belongs with a successfully deployed Worker, not with the Hello World placeholder.

Production address: https://frame-editor-auth.lsellars5.workers.dev
GitHub OAuth callback: https://frame-editor-auth.lsellars5.workers.dev/callback
Editor: https://lxkes-languages.github.io/frame-magazine/admin/

Cloudflare bindings:
- `GITHUB_OAUTH_ID`: the GitHub OAuth application's client ID, as a text variable.
- `GITHUB_OAUTH_SECRET`: that application's client secret, stored as an encrypted Secret. Never commit it.

This implementation uses an HttpOnly Secure ten-minute OAuth state cookie, PKCE S256, a fixed callback URL, exact-origin popup messaging and no-store responses. It requests `public_repo` access because Decap writes public repository content and editorial PRs; GitHub OAuth scopes are broader than a single repository. It releases a token to the editor only for the `lxkes-languages` account after checking write permission on `lxkes-languages/frame-magazine`. Adding collaborators requires an explicit code change and review.

The OAuth token is handed to Decap in the browser. The client secret and refresh token are never returned. With expiring OAuth tokens enabled, users may need to log out and sign in again after expiry; this bridge does not implement automatic refresh. Do not disable token expiry to work around that.

Run `node auth/tests/worker.mjs` from the repository root. Local tests use only fake credentials and mocked GitHub responses. They do not prove the live integration is working.

After deployment and merging the configuration PR, check the Worker root, OAuth redirect, owner sign-in, restricted-account rejection, editor load, image upload and draft save/reload. Verify that drafts do not appear on the published magazine. Publish a disposable test only when the owner authorizes that test publication.

If a secret was displayed as a plain variable or copied into logs/screenshots, replace it in the GitHub OAuth app and save the replacement as a Cloudflare Secret. Never send a replacement through chat.
