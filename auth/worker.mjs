/* FRAME's single-owner Decap OAuth bridge. Secrets belong in Cloudflare bindings. */
const WORKER_ORIGIN = 'https://frame-editor-auth.lsellars5.workers.dev';
const EDITOR_ORIGIN = 'https://lxkes-languages.github.io';
const OWNER = 'lxkes-languages';
const REPO = 'lxkes-languages/frame-magazine';
const COOKIE = '__Host-frame_oauth';
const CALLBACK = `${WORKER_ORIGIN}/callback`;
const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const random = () => encode(crypto.getRandomValues(new Uint8Array(32)));
const headers = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};
const cookie = value => `${COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${value ? 600 : 0}`;
const text = (message, status = 200, extra = {}) => new Response(message, { status, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8', ...extra } });

function popup(status, payload) {
  const nonce = random();
  // Escape '<' so token/error data can never terminate a script element.
  const message = JSON.stringify(`authorization:github:${status}:${JSON.stringify(payload)}`).replace(/</g, '\\u003c');
  const origin = JSON.stringify(EDITOR_ORIGIN);
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>FRAME sign-in</title></head><body><p id="status">Completing FRAME sign-in…</p><script nonce="${nonce}">
    (() => {
      const origin = ${origin};
      if (!window.opener) { document.querySelector('#status').textContent = 'Open sign-in from the FRAME editor.'; return; }
      const receive = event => {
        if (event.origin !== origin || event.source !== window.opener || event.data !== 'authorizing:github') return;
        window.removeEventListener('message', receive);
        window.opener.postMessage(${message}, origin);
        document.querySelector('#status').textContent = 'You can close this window.';
      };
      window.addEventListener('message', receive);
      window.opener.postMessage('authorizing:github', origin);
    })();
  </script></body></html>`, {
    headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie(''), 'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'` }
  });
}

export async function handle(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  if (url.origin !== WORKER_ORIGIN) return text('Not found', 404);
  if (request.method !== 'GET') return text('Method not allowed', 405, { Allow: 'GET' });
  if (url.pathname === '/') return text('FRAME editor sign-in service. Open the editor at https://lxkes-languages.github.io/frame-magazine/admin/');
  if (!['/auth', '/callback'].includes(url.pathname)) return text('Not found', 404);
  if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) return text('Sign-in is not configured. Contact the site owner.', 503);

  if (url.pathname === '/auth') {
    if (url.searchParams.get('provider') !== 'github') return text('Unsupported provider', 400);
    const site = url.searchParams.get('site_id');
    if (site && site !== new URL(EDITOR_ORIGIN).hostname) return text('Unsupported editor', 400);
    const state = random();
    const verifier = random();
    const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    const target = new URL('https://github.com/login/oauth/authorize');
    target.search = new URLSearchParams({ client_id: env.GITHUB_OAUTH_ID, redirect_uri: CALLBACK, scope: 'public_repo', state, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
    return new Response(null, { status: 302, headers: { ...headers, Location: target.href, 'Set-Cookie': cookie(`${state}.${verifier}`) } });
  }

  const saved = (request.headers.get('Cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const [state, verifier] = (saved || '').split('.');
  if (!state || !verifier || !/^[A-Za-z0-9_-]{43}$/.test(state) || !/^[A-Za-z0-9_-]{43}$/.test(verifier) || url.searchParams.get('state') !== state) {
    return text('Sign-in expired or could not be verified. Close this window and try again from FRAME.', 400, { 'Set-Cookie': cookie('') });
  }
  if (url.searchParams.has('error')) return popup('error', { message: 'GitHub sign-in was cancelled. Please try again.' });
  const code = url.searchParams.get('code');
  if (!code || code.length > 512) return text('Missing or invalid authorization code', 400, { 'Set-Cookie': cookie('') });

  try {
    const response = await fetcher('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.GITHUB_OAUTH_ID, client_secret: env.GITHUB_OAUTH_SECRET, code, redirect_uri: CALLBACK, code_verifier: verifier }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('Exchange failed');
    const result = await response.json();
    if (typeof result.access_token !== 'string' || !result.access_token || result.error) throw new Error('Token unavailable');
    const apiHeaders = { Authorization: `Bearer ${result.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'FRAME-editor-auth' };
    const identityResponse = await fetcher('https://api.github.com/user', { headers: apiHeaders, signal: AbortSignal.timeout(10000) });
    if (!identityResponse.ok) throw new Error('Identity unavailable');
    const identity = await identityResponse.json();
    if (typeof identity.login !== 'string' || identity.login.toLowerCase() !== OWNER) return popup('error', { message: 'This editor is restricted to the FRAME owner account.' });
    const repoResponse = await fetcher(`https://api.github.com/repos/${REPO}`, { headers: apiHeaders, signal: AbortSignal.timeout(10000) });
    if (!repoResponse.ok || !(await repoResponse.json()).permissions?.push) return popup('error', { message: 'The FRAME repository requires write access.' });
    // Decap receives the short-lived access token; it can ask for sign-in again on expiry.
    // Refresh tokens and the client secret are never sent to the editor.
    return popup('success', { token: result.access_token, provider: 'github' });
  } catch {
    return popup('error', { message: 'Sign-in could not be completed. Close this window and try again.' });
  }
}

export default { fetch(request, env) { return handle(request, env); } };
