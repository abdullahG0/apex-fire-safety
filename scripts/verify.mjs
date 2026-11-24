// Checks the built site: page counts, internal links, assets, source text, prices and WhatsApp links.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { loadCatalogue, ROOT } from './content.mjs';

const DIST = join(ROOT, process.env.BUILD_DIR || 'dist');
const { categories, subcategories, products } = loadCatalogue();
const errors = [];

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const htmlFiles = walk(DIST).filter((f) => f.endsWith('index.html') && !readFileSync(f, 'utf8').includes('http-equiv="refresh"'));
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const read = (route) => decode(readFileSync(join(DIST, route, 'index.html'), 'utf8'));

const expected = 2 + categories.length + subcategories.length + products.length;
if (htmlFiles.length !== expected) errors.push(`Expected ${expected} pages, got ${htmlFiles.length}`);

let links = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const name = relative(DIST, file);
  if (/apexfiresafety\.pk\/wp-content/.test(html)) errors.push(`${name}: hotlinked image`);
  if (/\.dc\.html/.test(html)) errors.push(`${name}: design-file link`);
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|tel:|mailto:|#)/.test(url)) continue;
    links++;
    const clean = url.split('#')[0];
    let target = resolve(dirname(file), clean || '.');
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) errors.push(`${name}: broken link ${url}`);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const target = resolve(dirname(file), part.trim().split(' ')[0]);
      if (!existsSync(target)) errors.push(`${name}: broken srcset ${part}`);
    }
  }
}

for (const p of products) {
  const html = read(`product/${p.slug}/`);
  const must = [p.name, p.price || 'Price on request'];
  if (p.related.length) must.push(`More in ${p.category.name}`);
  const page = p.page;
  if (page) {
    must.push(...page.lead, ...page.features.map((f) => f.slice(f.indexOf(': ') > 0 && f.indexOf(': ') <= 60 ? f.indexOf(': ') + 2 : 0)));
    for (const s of page.specs) must.push(s.value);
    for (const b of page.blocks) must.push(...[b.t, b.label, ...(b.cells || [])].filter(Boolean));
  }
  if (!page.lead.length && p.desc) must.push(p.desc);
  for (const text of must) if (!html.includes(text)) errors.push(`${p.name}: missing "${text.slice(0, 60)}"`);
  const msg = encodeURIComponent(`Hello Apex Fire Safety, I'm interested in: ${p.name}. Please share availability and a quotation.`);
  if (!html.includes(`https://wa.me/923045666404?text=${msg}`)) errors.push(`${p.name}: WhatsApp link does not name the product`);
}
for (const c of categories) {
  const html = read(`products/${c.slug}/`);
  for (const p of c.products) if (!html.includes(`product/${p.slug}/`)) errors.push(`${c.name}: missing ${p.name}`);
}
for (const s of subcategories) {
  const html = read(`products/${s.category.slug}/${s.slug}/`);
  for (const p of s.group.products) if (!html.includes(`product/${p.slug}/`)) errors.push(`${s.name}: missing ${p.name}`);
}

const size = walk(DIST).reduce((n, f) => n + statSync(f).size, 0);
console.log(`Pages ${htmlFiles.length}, internal links checked ${links}, site size ${(size / 1048576).toFixed(1)} MB`);
if (errors.length) {
  console.error(`${errors.length} problems:\n${errors.slice(0, 40).join('\n')}`);
  process.exit(1);
}
console.log('All checks passed');
