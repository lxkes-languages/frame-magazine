import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext, Script } from 'node:vm';
const root = new URL('../', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');
const base = 'https://lxkes-languages.github.io/frame-magazine/';
const source = await read('website.js');
const website = runInNewContext(`${source}\nFRAMEWebsite;`, { URL, document: { baseURI: base } });
const data = JSON.parse(await read('_data/website.json'));
const settings = website.normalise(data, base);
assert.equal(settings.texts['branding.name'], 'FRAME');
assert.equal(settings.feature.story, '2');
assert.equal(settings.feature.alt, data.feature.alt);
assert.equal(settings.email, 'hello@example.com');
assert.equal(Object.keys(settings.colours).length, 4);
assert.equal(Object.keys(settings.visibility).length, 6);
assert.equal(website.safeUrl('/frame-magazine/uploads/logo.webp', base, true), base+'uploads/logo.webp');
for (const url of ['javascript:alert(1)', 'data:image/png,test', 'http://unsafe.example/logo.jpg', 'https://user:password@example.com/logo.jpg', '/frame-magazine/uploads/../outside.jpg']) {
  assert.equal(website.safeUrl(url, base, true), '', url);
}
const unsafe = website.normalise({
  branding: { name: 'A long magazine name that would overflow', colours: { paper: '#fff; display:none', ink:'#123456', accent:'url(https://example.com)' }, logo:'javascript:alert(1)', socials:[null,{label:'Bad',url:'javascript:alert(1)'},{label:'Instagram',url:'https://instagram.com/example'}] },
  spotlight:{story:'../bad'},feature:{story:'test'},about:{email:'hello@example.com?bcc=other@example.com'},visibility:{about:false,art:'false'},intro:{headline:'<img src=x onerror=alert(1)>'}
}, base);
assert.equal(unsafe.texts['branding.name'].length, 20);
assert.equal(unsafe.texts['intro.headline'], '<img src=x onerror=alert(1)>'); // Rendered as text, never HTML.
assert.equal(Object.keys(unsafe.colours).length, 1);
assert.equal(unsafe.logo, '');
assert.equal(unsafe.socials.length, 1);
assert.equal(unsafe.email, '');
assert.equal(unsafe.visibility.about, false);
assert.equal(unsafe.visibility.art, undefined);
assert.equal(unsafe.spotlight.story, '');
assert.throws(()=>website.normalise([]));
const stories=[{id:'newest'},{id:'test'},{id:'2'}];
assert.equal(website.selectSpotlight(stories, settings)[0].id, 'newest');
assert.equal(website.selectSpotlight(stories, {spotlight:{story:'test'}})[0].id, 'test');
assert.equal(website.selectSpotlight(stories, {spotlight:{story:'removed'}})[0].id, 'newest');
assert.equal(stories[0].id, 'newest', 'Spotlight selection must not reorder the journal');
const config=JSON.parse(await read('admin/config.json'));
assert.equal(config.publish_mode,'editorial_workflow');
assert.equal(config.media_library,undefined,'Use the built-in uploader, not a nonexistent external library');
const file=config.collections.find(collection=>collection.name==='website').files[0];
assert.equal(file.file,'_data/website.json');
assert.equal(file.format,'json');
const allFields=new Set();
function fields(entries,prefix='') {for(const field of entries){const path=prefix+field.name;allFields.add(path);if(field.fields)fields(field.fields,path+'.');}}
fields(file.fields);
function checkFields(object,prefix='') {for(const [key,value] of Object.entries(object)){const path=prefix+key;assert.ok(allFields.has(path),`Uneditable setting: ${path}`);if(value && typeof value==='object' && !Array.isArray(value)) checkFields(value,path+'.');}}
checkFields(data);
for(const filename of ['website.js','content.js','script.js','admin/editor.js'])new Script(await read(filename),{filename});
const html=await read('index.html');
assert.ok(html.indexOf('src="website.js')<html.indexOf('src="content.js"'));
assert.ok((await read('website.json')).includes('site.data.website | jsonify'));
console.log('PASS: website settings, schema coverage, draft workflow, upload subpaths, unsafe links/colours/email, selected/deleted spotlight and script order.');

assert.ok(!html.includes('mailto:hello@example.com'), 'No email-app fallback should remain');
assert.ok(html.includes('site.data.website.about.contact_url'), 'Build the contact link from published settings');
assert.ok(html.includes('website.js?v='), 'Refresh the settings script on deployment');
