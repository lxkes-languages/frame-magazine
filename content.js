/* Published story loading and rendering. Drafts stay on CMS branches. */
'use strict';

const FRAMEContent = (() => {
  const state = { loaded: false };
  const categories = { 'Art & Culture': 'art', Photography: 'photography', Journal: 'journal', 'Book Reviews': 'books' };

  function imageUrl(value, base = document.baseURI) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, base);
      if (url.username || url.password) return null;
      if (url.protocol === 'https:' && url.origin !== new URL(base).origin) return url.href;
      const uploadPath = new URL('uploads/', base).pathname;
      if (url.origin === new URL(base).origin && url.pathname.startsWith(uploadPath) && /\.(?:jpe?g|png|webp|gif|avif)$/i.test(url.pathname)) return url.href;
    } catch { /* Ignore invalid image URLs. */ }
    return null;
  }

  function normaliseStories(data, base) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid story index');
    return Object.entries(data).flatMap(([id, story]) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !story || typeof story !== 'object') return [];
      const image = imageUrl(story.image, base);
      const text = Array.isArray(story.text) ? story.text.filter(p => typeof p === 'string' && p.trim()) : [];
      if (!image || typeof story.title !== 'string' || !story.title.trim() || typeof story.alt !== 'string' || !story.alt.trim() || !text.length) return [];
      const date = /^\d{4}-\d{2}-\d{2}$/.test(story.date) && Number.isFinite(Date.parse(story.date)) ? story.date : '1970-01-01';
      return [{
        id, title: story.title, image, alt: story.alt, text, date,
        category: Object.hasOwn(categories, story.category) ? story.category : 'Journal',
        description: typeof story.description === 'string' ? story.description : '',
        credit: typeof story.credit === 'string' ? story.credit : '',
        minutes: Number.isInteger(story.minutes) && story.minutes > 0 && story.minutes <= 120 ? story.minutes : 3,
        gallery: Array.isArray(story.gallery) ? story.gallery.flatMap(photo => {
          if (!photo || typeof photo.alt !== 'string' || !photo.alt.trim()) return [];
          const image = imageUrl(photo.image, base);
          return image ? [{ image, alt: photo.alt, caption: typeof photo.caption === 'string' ? photo.caption : '' }] : [];
        }) : []
      }];
    }).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function storyCard(story, index) {
    const card = element('article', index === 0 ? 'story card-large' : 'story');
    const link = element('a', 'image-wrap story-image');
    link.href = `#article-${story.id}`;
    link.setAttribute('aria-label', `Read ${story.title}`);
    const image = element('img');
    Object.assign(image, { src: story.image, alt: story.alt, loading: 'lazy', width: 1200, height: 1500 });
    const arrow = element('span', 'image-arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(image, arrow);
    const meta = element('div', 'story-meta');
    meta.append(element('span', '', story.category), element('span', '', `${story.minutes} min read`));
    const title = element('h3');
    const titleLink = element('a', '', story.title);
    titleLink.href = link.href;
    title.append(titleLink);
    card.append(link, meta, title, element('p', '', story.description));
    return card;
  }

  function journalRow(story, index) {
    const link = element('a', 'journal-item');
    link.href = `#article-${story.id}`;
    link.dataset.category = categories[story.category];
    const arrow = element('span', 'arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(element('span', '', String(index + 1).padStart(2, '0')), element('strong', '', story.title), element('span', '', story.category), arrow);
    return link;
  }

  function renderSpotlight(stories, websiteSettings) {
    const grid = document.querySelector('.spotlight-grid');
    grid.hidden = stories.length === 0;
    if (!stories.length) return;
    const [lead, ...companions] = stories;
    const hero = document.querySelector('.hero');
    const link = hero.querySelector('.hero-image');
    link.href = '#article-' + lead.id;
    link.setAttribute('aria-label', 'Read ' + lead.title);
    const image = link.querySelector('img');
    image.src = lead.image;
    image.alt = lead.alt;
    link.querySelector('.image-label').textContent = lead.category;
    const title = hero.querySelector('h3 a');
    title.href = link.href;
    title.textContent = lead.title;
    const intro = element('p', '', lead.description);
    const more = element('a', 'under-link', `${websiteSettings?.spotlight.link_label || 'Explore the story'} ↗`);
    more.href = link.href;
    intro.append(more);
    hero.querySelector('.hero-caption > p').replaceWith(intro);
    document.querySelectorAll('.side-story').forEach((card, index) => {
      const story = companions[index];
      card.hidden = !story;
      if (!story) return;
      const link = card.querySelector('a.image-wrap');
      link.href = '#article-' + story.id;
      link.setAttribute('aria-label', 'Read ' + story.title);
      const image = link.querySelector('img');
      image.src = story.image;
      image.alt = story.alt;
      const title = card.querySelector('h3 a');
      title.href = link.href;
      title.textContent = story.title;
      card.querySelector('.kicker').textContent = story.category;
    });
  }

  async function load() {
    const status = document.querySelector('#content-status');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(new URL('stories.json', document.baseURI), { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error('Story index unavailable');
      const data = await response.json();
      const stories = normaliseStories(data, document.baseURI);
      if (!stories.length && Object.keys(data).length) throw new Error('No valid published stories');
      // An authoritative manifest also removes deleted articles from the reader.
      Object.keys(articles).forEach(id => delete articles[id]);
      stories.forEach(story => { articles[story.id] = story; });
      const websiteSettings = await FRAMEWebsite.ready;
      renderSpotlight(FRAMEWebsite.selectSpotlight(stories, websiteSettings), websiteSettings);
      FRAMEWebsite.updateStoryLinks(stories, websiteSettings);
      document.querySelector('.story-grid').replaceChildren(...(stories.length ? stories.slice(0, 9).map(storyCard) : [element('p', 'empty-stories', 'New stories are on their way. Check back soon.')]));
      const reviews = stories.filter(story => story.category === 'Book Reviews');
      document.querySelector('.book-grid').replaceChildren(...(reviews.length ? reviews.map(storyCard) : [element('p', 'empty-stories', 'Book reviews will appear here.')]));
      document.querySelector('.journal-list').replaceChildren(...stories.map(journalRow));
      document.querySelector('.filter.active')?.click();
      status.hidden = true;
    } catch {
      status.textContent = 'Showing sample stories. The latest stories could not load. Refresh to try again.';
    } finally {
      clearTimeout(timeout);
      state.loaded = true;
      document.dispatchEvent(new CustomEvent('frame:content-ready'));
    }
  }

  return { state, imageUrl, normaliseStories, load };
})();


