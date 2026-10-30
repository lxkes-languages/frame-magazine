/* Website settings: safe text, images and colour tokens; layout stays in CSS. */
'use strict';

const FRAMEWebsite = (() => {
  const textFields = {
    'branding.tagline': '.edition [data-tagline]', 'branding.edition': '.edition [data-edition]',
    'branding.header_link': '.header-contact', 'branding.nav_note': '.nav-note',
    'branding.footer': '[data-footer-label]', 'intro.description': '.intro > p',
    'spotlight.heading': '#spotlight-title', 'spotlight.label': '.section-label > span',
    'spotlight.kicker': '.hero-caption .kicker', 'stories.kicker': '#art .kicker',
    'stories.description': '#art .section-head > p', 'feature.kicker': '.feature-text .kicker',
    'feature.description': '.feature-text > p:not(.kicker)', 'feature.caption': '.feature-photo figcaption',
    'books.kicker': '#books .kicker', 'books.description': '#books .books-description',
    'journal.kicker': '#journal .kicker', 'about.kicker': '#about > .kicker',
    'about.description': '#about div > p'
  };
  const get = (data, path) => path.split('.').reduce((value, key) => value && typeof value === 'object' && Object.hasOwn(value, key) ? value[key] : undefined, data);
  const string = value => typeof value === 'string' ? value.trim().slice(0, 5000) : undefined;
  const slug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : '';

  function safeUrl(value, base = document.baseURI, image = false) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value, base);
      if (url.username || url.password || url.protocol !== 'https:') return '';
      if (image && url.origin === new URL(base).origin) {
        if (!url.pathname.startsWith(new URL('uploads/', base).pathname) || !/\.(?:jpe?g|png|webp|gif|avif)$/i.test(url.pathname)) return '';
      }
      return url.href;
    } catch { return ''; }
  }

  function normalise(data, base = document.baseURI) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid website settings');
    const result = { texts: {}, colours: {}, socials: [], spotlight: {}, feature: {}, visibility: {} };
    const paths = [...Object.keys(textFields), 'branding.name', 'branding.title', 'branding.description', 'intro.headline', 'intro.emphasis', 'stories.heading', 'books.heading', 'journal.heading', 'feature.heading', 'feature.emphasis', 'feature.ending', 'about.heading', 'about.emphasis', 'about.ending', 'about.contact_label', 'marquee'];
    Object.keys(data.navigation || {}).forEach(key => {
      if (['home', 'spotlight', 'art', 'photography', 'books', 'journal', 'about'].includes(key)) paths.push(`navigation.${key}`);
    });
    paths.forEach(path => {
      const value = string(get(data, path));
      if (value !== undefined) result.texts[path] = path === 'branding.name' ? value.slice(0, 20) : value;
    });
    for (const key of ['paper', 'ink', 'accent', 'sage']) {
      const value = get(data, `branding.colours.${key}`);
      if (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) result.colours[key] = value;
    }
    result.logo = safeUrl(get(data, 'branding.logo'), base, true);
    const email = get(data, 'about.email');
    result.email = typeof email === 'string' && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email) ? email : '';
    result.emailProvided = typeof email === 'string';
    const contactUrl = get(data, 'about.contact_url');
    result.contactProvided = typeof contactUrl === 'string' || result.emailProvided;
    result.contactHref = typeof contactUrl === 'string' ? safeUrl(contactUrl, base) : (result.email ? `mailto:${result.email}` : '');
    const socials = get(data, 'branding.socials');
    if (Array.isArray(socials)) result.socials = socials.slice(0, 8).flatMap(social => {
      if (!social || typeof social.label !== 'string' || !social.label.trim()) return [];
      const url = safeUrl(social.url, base);
      return url ? [{ label: social.label.slice(0, 60), url }] : [];
    });
    result.spotlight.story = slug(get(data, 'spotlight.story'));
    result.spotlight.link_label = string(get(data, 'spotlight.link_label')) || 'Explore the story';
    result.feature.story = slug(get(data, 'feature.story'));
    result.feature.link_label = string(get(data, 'feature.link_label')) || 'Inside the visual journal';
    result.feature.image = safeUrl(get(data, 'feature.image'), base, true);
    result.feature.alt = string(get(data, 'feature.alt'));
    for (const key of ['spotlight', 'art', 'photography', 'books', 'journal', 'about', 'marquee']) {
      const value = get(data, `visibility.${key}`);
      if (typeof value === 'boolean') result.visibility[key] = value;
    }
    return result;
  }

  function text(selector, value) {
    if (value === undefined) return;
    document.querySelectorAll(selector).forEach(node => { node.textContent = value; });
  }

  function heading(selector, before, emphasis, ending = '') {
    if (before === undefined) return;
    const node = document.querySelector(selector);
    node.replaceChildren(document.createTextNode(before));
    if (emphasis) {
      const em = document.createElement('em');
      em.textContent = emphasis;
      node.append(document.createTextNode(' '), em);
    }
    if (ending) node.append(document.createTextNode('\n' + ending));
  }

  function dottedHeading(selector, value) {
    if (value === undefined) return;
    const node = document.querySelector(selector);
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.textContent = '.';
    node.replaceChildren(document.createTextNode(value), dot);
  }

  function apply(settings) {
    const values = settings.texts;
    Object.entries(textFields).forEach(([path, selector]) => text(selector, values[path]));
    for (const section of ['home', 'spotlight', 'art', 'photography', 'books', 'journal', 'about']) text(`.nav a[href="#${section}"]`, values[`navigation.${section}`]);
    if (values['branding.title']) document.title = values['branding.title'];
    if (values['branding.description']) document.querySelector('meta[name="description"]').content = values['branding.description'];
    Object.entries(settings.colours).forEach(([name, colour]) => document.documentElement.style.setProperty(`--${name}`, colour));
    if (settings.colours.paper) document.querySelector('meta[name="theme-color"]').content = settings.colours.paper;
    const name = values['branding.name'];
    if (name) document.querySelectorAll('.wordmark, footer .logo').forEach(link => {
      link.setAttribute('aria-label', `${name} home`);
      if (settings.logo) {
        const image = document.createElement('img');
        Object.assign(image, { src: settings.logo, alt: name, width: 420, height: 120 });
        image.className = 'brand-image';
        link.replaceChildren(image);
      } else {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.textContent = '.';
        link.replaceChildren(document.createTextNode(name), dot);
      }
    });
    if (name) {
      document.documentElement.style.setProperty('--wordmark-size', `${Math.min(12.4, 64 / name.length)}vw`);
      document.documentElement.style.setProperty('--wordmark-mobile-size', `${Math.min(18, 84 / name.length)}vw`);
    }
    heading('#intro-title', values['intro.headline'], values['intro.emphasis']);
    heading('#photography-title', values['feature.heading'], values['feature.emphasis'], values['feature.ending']);
    heading('#about-title', values['about.heading'], values['about.emphasis'], values['about.ending']);
    dottedHeading('#art-title', values['stories.heading']);
    dottedHeading('#books-title', values['books.heading']);
    dottedHeading('#journal-title', values['journal.heading']);
    if (values.marquee !== undefined) text('.marquee span', `${values.marquee} `);
    const featureImage = document.querySelector('.feature-photo img');
    if (settings.feature.image) featureImage.src = settings.feature.image;
    if (settings.feature.alt !== undefined) featureImage.alt = settings.feature.alt;
    const contact = document.querySelector('#about .under-link');
    if (values['about.contact_label'] !== undefined) {
      const arrow = document.createElement('span');
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      contact.replaceChildren(document.createTextNode(values['about.contact_label']), arrow);
    }
    if (settings.contactProvided) {
      contact.hidden = !settings.contactHref;
      if (settings.contactHref) {
        contact.href = settings.contactHref;
        contact.removeAttribute('title');
      }
    }
    const socialNav = document.querySelector('.social-links');
    socialNav.replaceChildren(...settings.socials.map(social => {
      const link = document.createElement('a');
      link.href = social.url;
      link.textContent = social.label;
      return link;
    }));
    socialNav.hidden = !settings.socials.length;
    Object.entries(settings.visibility).forEach(([section, visible]) => {
      document.querySelector(section === 'marquee' ? '.marquee' : `#${section}`).hidden = !visible;
      document.querySelectorAll(`.nav a[href="#${section}"]`).forEach(link => { link.hidden = !visible; });
    });
    const aboutHidden = settings.visibility.about === false;
    document.querySelector('.header-contact').hidden = aboutHidden;
  }

  function selectSpotlight(stories, settings) {
    const selected = stories.find(story => story.id === settings?.spotlight.story);
    return selected ? [selected, ...stories.filter(story => story !== selected)] : stories;
  }

  function updateStoryLinks(stories, settings) {
    const link = document.querySelector('.feature-text .under-link');
    const id = settings?.feature.story;
    link.href = stories.some(story => story.id === id) ? `#article-${id}` : '#journal';
    link.textContent = `${settings?.feature.link_label || 'Inside the visual journal'} ↗`;
  }

  async function load() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(new URL('website.json', document.baseURI), { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error('Website settings unavailable');
      const settings = normalise(await response.json());
      apply(settings);
      return settings;
    } catch {
      const notice = document.querySelector('#website-status');
      notice.hidden = false;
      notice.textContent = 'Some page updates could not load. Refresh to try again.';
      return null;
    } finally { clearTimeout(timer); }
  }

  return { normalise, safeUrl, apply, selectSpotlight, updateStoryLinks, ready: null, load };
})();


