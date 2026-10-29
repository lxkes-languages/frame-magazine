/* FRAME v3 — independent enhancements, no build step required. */
'use strict';

function initMenu() {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#nav');

  function setOpen(open) {
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.querySelector('span').textContent = open ? '−' : '＋';
  }

  menu.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setOpen(false);
  });
  window.matchMedia('(max-width: 700px)').addEventListener('change', () => setOpen(false));
}

function initReveals() {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(element => {
    element.classList.add('will-reveal');
    observer.observe(element);
  });
}

function initProgress() {
  const progress = document.querySelector('#progress');
  let scheduled = false;

  function update() {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
    progress.style.transform = `scaleX(${fraction})`;
    scheduled = false;
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  // Filtering, image loading and opening the reader can all change page height.
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  update();
}

function initFilters() {
  const buttons = [...document.querySelectorAll('.filter')];
  const stories = [...document.querySelectorAll('.journal-item')];
  const status = document.querySelector('#filter-status');

  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(candidate => {
      const active = candidate === button;
      candidate.classList.toggle('active', active);
      candidate.setAttribute('aria-pressed', String(active));
    });
    stories.forEach(story => {
      story.hidden = button.dataset.filter !== 'all' && story.dataset.category !== button.dataset.filter;
    });
    const count = stories.filter(story => !story.hidden).length;
    status.textContent = `${count} ${count === 1 ? 'story' : 'stories'}`;
  }));
}

function initArticleReader() {
  const dialog = document.querySelector('#article-dialog');
  const content = document.querySelector('#article-content');
  let returnHash = '#journal';
  let opener = null;

  // Remember where each reading session started, including a filtered journal.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#article-"]');
    if (!link || dialog.open) return;
    opener = link;
    returnHash = location.hash.startsWith('#article-') ? '#journal' : (location.hash || '#spotlight');
  });

  function closeArticle() {
    if (location.hash.startsWith('#article-')) {
      // Replacing the reader URL avoids a back-button loop when dismissing it.
      history.replaceState(null, '', returnHash);
    }
    if (dialog.open) dialog.close();
  }

  function renderArticle(article) {
    const body = document.createElement('div');
    body.className = 'article-body';
    const image = document.createElement('img');
    image.src = article.image;
    image.alt = article.alt;
    image.width = 1400;
    image.height = 824;
    const tag = document.createElement('p');
    tag.className = 'kicker';
    tag.textContent = `${article.category} / FRAME journal`;
    const title = document.createElement('h2');
    title.id = 'article-title';
    title.textContent = article.title;
    body.append(image, tag, title);
    article.text.forEach(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      body.append(paragraph);
    });
    content.replaceChildren(body);
  }

  function route() {
    const match = location.hash.match(/^#article-(\d+)$/);
    const article = match && articles[match[1]];
    if (!article) {
      if (dialog.open) dialog.close();
      return;
    }
    renderArticle(article);
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }

  dialog.querySelector('.close-dialog').addEventListener('click', closeArticle);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeArticle();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeArticle();
  });
  dialog.addEventListener('close', () => {
    if (location.hash.startsWith('#article-')) history.replaceState(null, '', returnHash);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  window.addEventListener('hashchange', route);
  route();
}

document.documentElement.classList.add('js');
document.querySelector('#year').textContent = new Date().getFullYear();
initMenu();
initReveals();
initProgress();
initFilters();
initArticleReader();
