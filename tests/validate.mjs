// Dependency-free source checks: node tests/validate.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script, runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const html = await read('index.html');
const data = await read('articles.js');
const css = await read('style.css');
new Script(await read('script.js'), { filename: 'script.js' });
new Script(data, { filename: 'articles.js' });
const articles = runInNewContext(`${data}\narticles;`);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique');
for (const [, hash] of html.matchAll(/href="#([^"]+)"/g)) {
  if (hash.startsWith('article-')) assert.ok(articles[hash.slice(8)], `Missing article: ${hash}`);
  else assert.ok(ids.includes(hash), `Missing section: ${hash}`);
}
for (const [, file] of html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css))"/g)) {
  assert.ok((await read(file)).length, `Missing asset: ${file}`);
}
for (const [id, article] of Object.entries(articles)) {
  for (const key of ['title', 'category', 'image', 'alt']) assert.ok(article[key], `Article ${id}: missing ${key}`);
  assert.ok(article.text.length > 0, `Article ${id}: missing text`);
  assert.equal(new URL(article.image).protocol, 'https:');
  assert.ok(html.includes(`href="#article-${id}"`), `Unreachable article: ${id}`);
}
for (const [image] of html.matchAll(/<img\b[^>]*>/g)) {
  for (const attribute of ['alt', 'width', 'height']) assert.match(image, new RegExp(`\\b${attribute}="[^"]+"`));
}
assert.ok(!html.includes('layout-fix.css'), 'Obsolete override stylesheet is still linked');
assert.ok(css.includes('prefers-reduced-motion'), 'Reduced motion must remain supported');
assert.ok(html.indexOf('src="articles.js"') < html.indexOf('src="script.js"'), 'Article data must load first');
console.log(`PASS: scripts parse, local assets resolve, ${ids.length} unique IDs, all fragment links and ${Object.keys(articles).length} articles are valid, images have descriptions and dimensions.`);
