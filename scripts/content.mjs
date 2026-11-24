// Loads the catalogue from data/ into one normalised structure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const readData = (file) => readFileSync(join(ROOT, 'data', file), 'utf8').replace(/^﻿/, '');

// "Label: value" splitter used by the design's product template.
export function splitLabel(line) {
  const i = line.indexOf(': ');
  if (i > 0 && i <= 60) return { label: line.slice(0, i), value: line.slice(i + 2) };
  return { label: '', value: line };
}

export function parsePageContent(text) {
  const pages = {};
  let page = null;
  let warn = false;
  let prevTable = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('@@ ')) {
      page = { lead: [], specs: [], specsTitle: '', features: [], featuresTitle: '', descTitle: '', blocks: [] };
      pages[line.slice(3)] = page;
      warn = false;
      prevTable = false;
      continue;
    }
    if (!page) throw new Error(`Content before first product: ${line}`);

    const isTable = line.startsWith('| ');
    if (line.startsWith('specs: ')) page.specsTitle = line.slice(7);
    else if (line.startsWith('features: ')) page.featuresTitle = line.slice(10);
    else if (line.startsWith('title: ')) page.descTitle = line.slice(7);
    else if (line.startsWith('lead: ')) page.lead.push(line.slice(6));
    else if (line.startsWith('> ')) {
      const { label, value } = splitLabel(line.slice(2));
      page.specs.push({ label: label || 'Note', value });
    } else if (line.startsWith('+ ')) page.features.push(line.slice(2));
    else if (line.startsWith('## ')) {
      warn = false;
      page.blocks.push({ k: 'h', t: line.slice(3), warn: false });
    } else if (line.startsWith('!! ')) {
      warn = true;
      page.blocks.push({ k: 'h', t: line.slice(3), warn: true });
    } else if (line.startsWith('- ')) {
      const { label, value } = splitLabel(line.slice(2));
      page.blocks.push({ k: 'li', label, t: value, warn });
    } else if (isTable) {
      const cells = line.replace(/^\|\s*|\s*\|$/g, '').split(/\s+\|\s+/);
      page.blocks.push({ k: 'tr', cells, head: !prevTable });
    } else {
      page.blocks.push({ k: 'p', t: line });
    }
    prevTable = isTable;
  }
  return pages;
}

export const CONTENT_FILE = join(ROOT, 'content', 'catalogue.json');
export const readContent = () => JSON.parse(readFileSync(CONTENT_FILE, 'utf8'));
export const emptyPage = () => ({ lead: [], specs: [], specsTitle: '', features: [], featuresTitle: '', descTitle: '', blocks: [] });

// The admin edits long descriptions as simple text: ## heading, !! warning heading, - list item, | table | row |.
export function parseBlocks(text) {
  const blocks = [];
  let warn = false;
  let prevTable = false;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { prevTable = false; continue; }
    const isTable = line.startsWith('|');
    if (line.startsWith('## ')) { warn = false; blocks.push({ k: 'h', t: line.slice(3).trim(), warn: false }); }
    else if (line.startsWith('!! ')) { warn = true; blocks.push({ k: 'h', t: line.slice(3).trim(), warn: true }); }
    else if (line.startsWith('- ')) {
      const { label, value } = splitLabel(line.slice(2).trim());
      blocks.push({ k: 'li', label, t: value, warn });
    } else if (isTable) {
      const cells = line.replace(/^\|\s*|\s*\|$/g, '').split(/\s*\|\s*/);
      blocks.push({ k: 'tr', cells, head: !prevTable });
    } else blocks.push({ k: 'p', t: line });
    prevTable = isTable;
  }
  return blocks;
}

export function blocksToText(blocks) {
  const lines = [];
  for (const b of blocks || []) {
    if (b.k === 'h') { if (lines.length) lines.push(''); lines.push(`${b.warn ? '!!' : '##'} ${b.t}`); }
    else if (b.k === 'li') lines.push(`- ${b.label ? `${b.label}: ` : ''}${b.t}`);
    else if (b.k === 'tr') lines.push(`| ${b.cells.join(' | ')} |`);
    else lines.push(b.t);
  }
  return lines.join('\n');
}

// The site is generated from content/catalogue.json, which the admin panel edits.
export function loadCatalogue() {
  const raw = readContent();
  const categories = [];
  const subcategories = [];
  const products = [];

  for (const source of raw.categories) {
    const groups = source.groups.filter((g) => g.items.length);
    if (!groups.length) continue; // Empty categories stay hidden until they have a product.
    const cat = { ...source, slug: source.id, groups: [], products: [], subs: [] };
    for (const g of groups) {
      const group = { ...g, products: [] };
      if (g.isSub) {
        const sub = { name: g.title, slug: g.slug, category: cat, group, seo: g.seo || {} };
        cat.subs.push(sub);
        subcategories.push(sub);
        group.sub = sub;
      }
      group.products = g.items.map((item) => {
        const product = { ...item, images: item.images || [], seo: item.seo || {}, category: cat, group, page: { ...emptyPage(), ...item.page } };
        products.push(product);
        cat.products.push(product);
        return product;
      });
      cat.groups.push(group);
    }
    categories.push(cat);
  }

  for (const p of products) {
    const sameGroup = p.group.products.filter((o) => o !== p);
    const rest = p.category.products.filter((o) => o !== p && o.group !== p.group);
    p.related = [...sameGroup, ...rest].slice(0, 4);
  }

  return { settings: raw.settings || {}, pageSeo: raw.pages || {}, redirects: raw.redirects || {}, categories, subcategories, products };
}

// Original data files, used once to create content/catalogue.json.
export function loadSeedCatalogue() {
  const categories = JSON.parse(readData('products-and-categories.json'));
  const pages = parsePageContent(readData('product-page-content.txt'));
  const images = JSON.parse(readData('image-urls.json'));
  const fullBySlug = Object.fromEntries(Object.entries(images.full).map(([k, v]) => [slug(k), v]));
  const thumbBySlug = Object.fromEntries(Object.entries(images.thumb).map(([k, v]) => [slug(k), v]));

  const products = [];
  const subcategories = [];

  for (const cat of categories) {
    cat.slug = cat.id;
    cat.products = [];
    cat.subs = [];
    cat.groups.forEach((group, groupIndex) => {
      // On Fire Alarms every titled group after the first is a sub-category page.
      if (cat.id === 'fire-alarms' && groupIndex > 0) {
        const sub = { name: group.title, slug: slug(group.title), category: cat, group };
        cat.subs.push(sub);
        subcategories.push(sub);
        group.sub = sub;
      }
      group.products = group.items.map((item) => {
        const productSlug = slug(item.name);
        const product = {
          ...item,
          slug: productSlug,
          category: cat,
          group,
          image: fullBySlug[productSlug] || '',
          thumb: thumbBySlug[productSlug] || '',
          page: pages[item.name] || null,
        };
        products.push(product);
        cat.products.push(product);
        return product;
      });
    });
  }

  const known = new Set(products.map((p) => p.name));
  const orphaned = Object.keys(pages).filter((n) => !known.has(n));
  if (orphaned.length) throw new Error(`Page content without a product: ${orphaned.join(', ')}`);

  // Same group first, then the rest of the category, in catalogue order.
  for (const p of products) {
    const sameGroup = p.group.products.filter((o) => o !== p);
    const rest = p.category.products.filter((o) => o !== p && o.group !== p.group);
    p.related = [...sameGroup, ...rest].slice(0, 4);
  }

  return { categories, subcategories, products, pages };
}
