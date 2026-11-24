// Downloads each product's original image into src/images/products/.
// Existing files are kept, so a better photo placed there is never overwritten.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { loadSeedCatalogue as loadCatalogue, ROOT } from './content.mjs';

const BASE = 'https://apexfiresafety.pk/wp-content/uploads/';
const OUT = join(ROOT, 'src', 'images', 'products');
mkdirSync(OUT, { recursive: true });

async function fetchImage(path) {
  const res = await fetch(BASE + path, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(45000) });
  const type = res.headers.get('content-type') || '';
  if (!res.ok || !type.startsWith('image/')) throw new Error(`${res.status} ${type}`);
  return Buffer.from(await res.arrayBuffer());
}

const { products } = loadCatalogue();
const queue = [...products];
const failed = [];
let saved = 0;
let kept = 0;

async function worker() {
  for (let p = queue.shift(); p; p = queue.shift()) {
    const file = join(OUT, p.slug + extname(p.image).toLowerCase());
    if (existsSync(file)) { kept++; continue; }
    try {
      let data;
      try { data = await fetchImage(p.image); }
      catch (err) { if (!p.thumb || p.thumb === p.image) throw err; data = await fetchImage(p.thumb); }
      writeFileSync(file, data);
      saved++;
    } catch (err) {
      failed.push(`${p.name}: ${err.message}`);
    }
  }
}

await Promise.all(Array.from({ length: 5 }, worker));
console.log(`Saved ${saved}, already present ${kept}, failed ${failed.length}`);
if (failed.length) { console.error(failed.join('\n')); process.exit(1); }
