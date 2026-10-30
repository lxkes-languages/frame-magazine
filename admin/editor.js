/* The OAuth service URL is public configuration. Never put a secret here. */
'use strict';

async function startEditor() {
  const status = document.querySelector('#status-message');
  try {
    const response = await fetch('settings.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Editor settings could not be loaded.');
    const settings = await response.json();
    if (!settings.authBaseUrl) {
      status.textContent = 'Your editor is installed. The owner needs to connect GitHub sign-in before editing is available.';
      return;
    }
    const auth = new URL(settings.authBaseUrl);
    if (auth.protocol !== 'https:' || auth.username || auth.password || auth.search || auth.hash || auth.pathname !== '/') {
      throw new Error('The sign-in service must be an HTTPS origin.');
    }

    const configResponse = await fetch('config.json', { cache: 'no-store' });
    if (!configResponse.ok) throw new Error('Editor configuration could not be loaded.');
    const config = await configResponse.json();
    config.backend.base_url = auth.origin;
    window.CMS_MANUAL_INIT = true;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/decap-cms@3.17.3/dist/decap-cms.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('The editor could not load. Check your connection and refresh.'));
      document.head.append(script);
    });
    window.CMS.registerPreviewStyle(new URL('../style.css', location.href).href);
    window.CMS.registerPreviewTemplate('stories', function StoryPreview(props) {
      const h = window.h;
      const story = props.entry.get('data').toJS();
      const asset = value => value ? props.getAsset(value).toString() : '';
      return h('article', { className: 'article-body', style: { maxWidth: '780px', margin: '40px auto' } },
        story.image ? h('img', { src: asset(story.image), alt: story.alt || '' }) : null,
        h('p', { className: 'kicker' }, story.category || 'Journal'),
        h('h2', {}, story.title || 'Untitled story'),
        story.credit ? h('p', { className: 'image-credit' }, story.credit) : null,
        ...(story.text || []).map((text, index) => h('p', { key: 'paragraph-' + index }, text)),
        ...(story.gallery || []).map((photo, index) => h('figure', { key: 'photo-' + index },
          photo.image ? h('img', { src: asset(photo.image), alt: photo.alt || '' }) : null,
          photo.caption ? h('figcaption', {}, photo.caption) : null
        ))
      );
    });
    window.CMS.registerPreviewTemplate('homepage', function HomepagePreview(props) {
      const h = window.h;
      const data = props.entry.get('data').toJS();
      const brand = data.branding || {};
      const colours = brand.colours || {};
      const colour = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
      const section = (name, title) => {
        const value = data[name] || {};
        if (data.visibility && data.visibility[{ stories: 'art', feature: 'photography' }[name] || name] === false) return null;
        return h('section', { key: name, style: { borderTop: '1px solid #c9c9bd', padding: '24px 0' } },
          h('p', { className: 'kicker' }, value.kicker || title),
          h('h2', { style: { fontSize: '32px', whiteSpace: 'pre-line', margin: '12px 0' } }, value.heading || '', value.emphasis ? h('em', {}, ' ' + value.emphasis) : null, value.ending ? '\n' + value.ending : ''),
          value.image ? h('img', { src: props.getAsset(value.image).toString(), alt: value.alt || '', style: { height: '280px', objectFit: 'cover' } }) : null,
          value.caption ? h('p', {}, value.caption) : null,
          h('p', { style: { whiteSpace: 'pre-line', lineHeight: 1.7 } }, value.description || '')
        );
      };
      return h('main', { style: { padding: '30px', maxWidth: '900px', backgroundColor: colour(colours.paper, '#f3f1eb'), color: colour(colours.ink, '#20221e') } },
        brand.logo ? h('img', { src: props.getAsset(brand.logo).toString(), alt: brand.name || '', style: { width: '220px', height: '90px', objectFit: 'contain' } }) : h('h1', { style: { fontSize: '54px', overflowWrap: 'anywhere' } }, brand.name || 'FRAME'),
        h('p', {}, brand.tagline || ''), h('p', { className: 'kicker' }, brand.edition || ''),
        h('h2', { style: { fontSize: '34px' } }, data.intro?.headline || '', h('em', {}, ' ' + (data.intro?.emphasis || ''))),
        h('p', {}, data.intro?.description || ''),
        section('spotlight', 'Spotlight'), section('stories', 'Fresh perspectives'), section('feature', 'Photography'), section('journal', 'Journal'), section('about', 'About'),
        h('p', {}, data.about?.email || ''),
        h('footer', {}, brand.footer || '')
      );
    });
    window.CMS.init({ config: { ...config, load_config_file: false } });
    document.querySelector('#editor-status').hidden = true;
  } catch (error) {
    status.textContent = error.message || 'The editor could not start. Please refresh and try again.';
  }
}

startEditor();

