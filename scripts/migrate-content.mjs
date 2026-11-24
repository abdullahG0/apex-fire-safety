// One-time step: creates content/catalogue.json from the original data files.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { CONTENT_FILE, emptyPage, loadSeedCatalogue, ROOT, slug } from './content.mjs';

if (existsSync(CONTENT_FILE)) {
  console.error('content/catalogue.json already exists. Nothing was changed.');
  process.exit(1);
}

const { categories } = loadSeedCatalogue();
const files = Object.fromEntries(readdirSync(join(ROOT, 'src', 'images', 'products')).map((f) => [parse(f).name, f]));

const doc = {
  revision: 1,
  settings: { siteUrl: 'https://apexfiresafety.pk' },
  pages: { home: { seo: {} }, products: { seo: {} } },
  redirects: {},
  categories: categories.map((c) => ({
    id: c.id,
    name: c.name,
    intro: c.intro,
    seo: {},
    groups: c.groups.map((g, i) => ({
      id: slug(g.title) || 'general',
      title: g.title,
      slug: slug(g.title),
      isSub: c.id === 'fire-alarms' && i > 0,
      seo: {},
      items: g.products.map((p) => {
        if (!files[p.slug]) throw new Error(`No image for ${p.name}`);
        return {
          id: p.slug,
          slug: p.slug,
          name: p.name,
          price: p.price,
          desc: p.desc,
          details: p.details,
          images: [{ file: files[p.slug], alt: p.name }],
          seo: {},
          page: p.page ? { ...emptyPage(), ...p.page } : emptyPage(),
        };
      }),
    })),
  })),
};

mkdirSync(dirname(CONTENT_FILE), { recursive: true });
writeFileSync(CONTENT_FILE, `${JSON.stringify(doc, null, 1)}\n`);
console.log(`Created content/catalogue.json with ${doc.categories.flatMap((c) => c.groups).flatMap((g) => g.items).length} products.`);
