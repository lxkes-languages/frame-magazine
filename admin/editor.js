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
    window.CMS.init({ config: { ...config, load_config_file: false } });
    document.querySelector('#editor-status').hidden = true;
  } catch (error) {
    status.textContent = error.message || 'The editor could not start. Please refresh and try again.';
  }
}

startEditor();
