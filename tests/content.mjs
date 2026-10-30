import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { runInNewContext, Script } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');
const base = 'https://lxkes-languages.github.io/frame-magazine/';
const source = await read('content.js');
const content = runInNewContext(`${source}\nFRAMEContent;`, { URL, document: { baseURI: base } });
const records = {};
for (const name of await readdir(new URL('_data/stories/', root))) {
  records[name.replace(/\.json$/, '')] = JSON.parse(await read('_data/stories/' + name));
}
const stories = content.normaliseStories(records, base);
assert.equal(stories.length, Object.keys(records).length);
const seed = { title: 'Fixture', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e', alt: 'A lake', text: ['A paragraph'], category: 'Journal', date: '2026-01-01' };
for (const story of stories) assert.ok(story.text.length && story.image && story.alt);
assert.equal(content.imageUrl('/frame-magazine/uploads/new-photo.webp', base), base + 'uploads/new-photo.webp');
assert.equal(content.imageUrl('uploads/new-photo.jpg', base), base + 'uploads/new-photo.jpg');
for (const url of ['javascript:alert(1)', 'data:image/svg+xml,test', '/frame-magazine/uploads/../../private.png', '/uploads/missing-prefix.jpg', 'http://other.example/image.jpg', 'https://name:secret@example.com/image.jpg']) {
  assert.equal(content.imageUrl(url, base), null, `Unexpected image URL: ${url}`);
}
const published = {
  ...records,
  'a-new-story': { ...seed, date: '9999-12-31', title: '<script>text stays text</script>', gallery: [null, { image: 'javascript:alert(1)', alt: 'unsafe' }, { image: 'uploads/gallery.jpg', alt: 'A gallery image', caption: 'Photo credit' }] },
  'bad/id': seed,
  broken: { title: 'No image or text' }
};
const result = content.normaliseStories(published, base);
assert.equal(result.length, stories.length + 1);
assert.equal(result[0].id, 'a-new-story');
assert.equal(result[0].title, '<script>text stays text</script>');
assert.equal(result[0].gallery.length, 1);
assert.equal(result[0].gallery[0].image, base + 'uploads/gallery.jpg');
assert.throws(() => content.normaliseStories([], base));

const config = JSON.parse(await read('admin/config.json'));
assert.equal(config.publish_mode, 'editorial_workflow', 'Drafts must use review branches');
assert.equal(config.backend.branch, 'main');
assert.equal(config.collections[0].folder, '_data/stories');
assert.equal(config.public_folder, '/frame-magazine/uploads');
assert.equal(config.collections[0].format, 'json');
for (const field of ['title', 'image', 'alt', 'text', 'gallery']) assert.ok(config.collections[0].fields.some(candidate => candidate.name === field));
for (const file of ['content.js', 'admin/editor.js', 'script.js', 'articles.js']) new Script(await read(file), { filename: file });

// Unconfigured or invalid auth must never inject a remote CMS or begin login.
const editor = await read('admin/editor.js');
for (const authBaseUrl of ['', 'http://unsafe.example', 'https://name:secret@example.com', 'https://example.com/auth']) {
  const status = { textContent: '' };
  await runInNewContext(editor, {
    URL,
    document: { querySelector: () => status, createElement: () => { throw new Error('Should not load a script'); } },
    fetch: async () => ({ ok: true, json: async () => ({ authBaseUrl }) })
  });
  assert.ok(status.textContent.includes('owner') || status.textContent.includes('HTTPS origin'));
}
console.log('PASS: existing content, new story ordering, upload subpaths, invalid records/URLs, gallery validation, draft workflow and unconfigured/invalid login states.');

