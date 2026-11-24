// Generates the complete static site into dist/.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, parse } from 'node:path';
import sharp from 'sharp';
import { loadCatalogue, ROOT, splitLabel } from './content.mjs';

const DIST = join(ROOT, process.env.BUILD_DIR || 'dist');
const PHONE = '+92 3045666404';
const TEL = 'tel:+923045666404';
const EMAIL = 'sales@apexfiresafety.pk';
const ADDRESS = 'Plot #41, Street 116, G-13/1, Islamabad';
const WA_NUMBER = '923045666404';
const GENERAL_MSG = "Hello Apex Fire Safety, I'd like to enquire about your products.";

const { categories, subcategories, products, settings, pageSeo, redirects } = loadCatalogue();
const SITE = (settings.siteUrl || 'https://apexfiresafety.pk').replace(/\/+$/, '');
const seoOf = (seo, title, description) => ({
  title: seo?.title || title,
  description: seo?.description || description,
  noindex: !!seo?.noindex,
});

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const wa = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
const productMsg = (name) => `Hello Apex Fire Safety, I'm interested in: ${name}. Please share availability and a quotation.`;
const categoryMsg = (name) => `Hello Apex Fire Safety, I'd like to enquire about: ${name}.`;

// Routes, relative to the site root and always ending in a slash.
const routes = {
  home: '',
  products: 'products/',
  category: (c) => `products/${c.slug}/`,
  sub: (s) => `products/${s.category.slug}/${s.slug}/`,
  product: (p) => `product/${p.slug}/`,
};

const icon = (body, size = 20, extra = '') =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${body}</svg>`;
const I = {
  wa: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  office: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  factory: '<path d="M2 20V8l6 4V8l6 4V4h4v16zM2 20h20"/>',
  home: '<path d="m3 11 9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>',
  book: '<path d="M2 5h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
};

/* ---------- Assets ---------- */

const imageInfo = {};

async function buildAssets() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, 'assets', 'fonts'), { recursive: true });
  mkdirSync(join(DIST, 'assets', 'products'), { recursive: true });

  const fontDir = join(ROOT, 'node_modules', '@fontsource', 'poppins', 'files');
  const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  let fontCss = '';
  for (const weight of [400, 500, 600, 700]) {
    for (const [subset, range] of [['latin', LATIN], ['latin-ext', LATIN_EXT]]) {
      const file = `poppins-${subset}-${weight}-normal.woff2`;
      copyFileSync(join(fontDir, file), join(DIST, 'assets', 'fonts', file));
      fontCss += `@font-face{font-family:Poppins;font-style:normal;font-display:swap;font-weight:${weight};src:url(fonts/${file}) format("woff2");unicode-range:${range}}\n`;
    }
  }
  writeFileSync(join(DIST, 'assets', 'styles.css'), fontCss + readFileSync(join(ROOT, 'src', 'styles.css'), 'utf8'));
  copyFileSync(join(ROOT, 'src', 'main.js'), join(DIST, 'assets', 'main.js'));

  await sharp(join(ROOT, 'assets', 'hero.webp')).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 66 }).toFile(join(DIST, 'assets', 'hero-1920.webp'));
  await sharp(join(ROOT, 'assets', 'hero.webp')).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 62 }).toFile(join(DIST, 'assets', 'hero-900.webp'));
  const logo = await sharp(join(ROOT, 'assets', 'logo-for-dark-background.png')).resize({ height: 120, withoutEnlargement: true }).webp({ quality: 90 }).toFile(join(DIST, 'assets', 'logo.webp'));
  imageInfo.logo = logo;
  await sharp(join(ROOT, 'assets', 'logo.png')).resize(64, 64, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(join(DIST, 'favicon.png'));
  await sharp(join(ROOT, 'assets', 'logo.png')).resize(1200, 630, { fit: 'contain', background: '#ffffff' }).jpeg({ quality: 82 }).toFile(join(DIST, 'assets', 'share.jpg'));

  const srcDir = join(ROOT, 'src', 'images', 'products');
  writeFileSync(join(DIST, 'assets', 'placeholder.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f6f6f6"/><path d="M150 150h100v100H150z M150 225l30-30 25 25 15-15 30 30" fill="none" stroke="#bdbdbd" stroke-width="6" stroke-linejoin="round"/><circle cx="222" cy="175" r="9" fill="#bdbdbd"/></svg>');
  const allFiles = [...new Set(products.flatMap((p) => p.images.map((i) => i.file)))];
  await Promise.all(allFiles.map(async (file) => {
    const path = join(srcDir, file);
    if (!existsSync(path)) throw new Error(`Missing image file: ${file}`);
    const input = readFileSync(path);
    const meta = await sharp(input).metadata();
    const stem = parse(file).name;
    const unique = [...new Set([...[400, 800].filter((w) => w < meta.width), Math.min(meta.width, 800)])];
    for (const w of unique) {
      await sharp(input).rotate().flatten({ background: '#ffffff' }).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(DIST, 'assets', 'products', `${stem}-${w}.webp`));
    }
    imageInfo[file] = { stem, widths: unique.sort((a, b) => a - b), original: `${meta.width}x${meta.height}` };
  }));
}

function imageUrls(file, prefix) {
  const { stem, widths } = imageInfo[file];
  const url = (w) => `${prefix}assets/products/${stem}-${w}.webp`;
  const largest = widths[widths.length - 1];
  return { src: url(largest), small: url(widths[0]), largest, srcset: widths.map((w) => `${url(w)} ${w}w`).join(', ') };
}

function productImg(p, prefix, sizes, { eager = false } = {}) {
  const image = p.images[0];
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"';
  if (!image) return `<img src="${prefix}assets/placeholder.svg" width="400" height="400" alt="${esc(p.name)}" ${loading}>`;
  const { src, srcset, largest } = imageUrls(image.file, prefix);
  return `<img src="${src}" srcset="${srcset}" sizes="${sizes}" width="${largest}" height="${largest}" alt="${esc(image.alt || p.name)}" ${loading}>`;
}

function productGallery(p, prefix) {
  const main = `<div class="product-img">${productImg(p, prefix, '(max-width:1100px) 92vw, 640px', { eager: true })}</div>`;
  if (p.images.length < 2) return `<div class="product-media">${main}</div>`;
  const thumbs = p.images.map((image, i) => {
    const { src, srcset, small } = imageUrls(image.file, prefix);
    return `<button type="button" class="thumb${i ? '' : ' is-active'}" aria-label="Show image ${i + 1} of ${p.images.length}" aria-pressed="${i ? 'false' : 'true'}" data-src="${src}" data-srcset="${srcset}" data-alt="${esc(image.alt || p.name)}"><img src="${small}" width="72" height="72" alt="" loading="lazy"></button>`;
  }).join('');
  return `<div class="product-media">${main}<div class="thumbs">${thumbs}</div></div>`;
}

/* ---------- Shared layout ---------- */

function header(prefix, active, waHref) {
  const link = (route) => prefix + route;
  const catLinks = categories.map((c) => {
    if (!c.subs.length) return `<a href="${link(routes.category(c))}"><span>${esc(c.name)}</span></a>`;
    const fly = c.subs.map((s) => `<a href="${link(routes.sub(s))}">${esc(s.name)}</a>`).join('');
    return `<div class="dd-sub"><a href="${link(routes.category(c))}"><span>${esc(c.name)}</span>${icon(I.right, 14)}</a><div class="dd-fly">${fly}</div></div>`;
  }).join('');
  const cls = (name) => `nav-link${active === name ? ' is-active' : ''}`;
  const current = (name) => (active === name ? ' aria-current="page"' : '');
  return `<a class="skip" href="#main">Skip to content</a>
<div class="strip on-dark"><div class="wrap">
  <div class="strip-group">
    <a class="strip-item" href="${TEL}">${icon(I.phone, 15)}<span>${PHONE}</span></a>
    <a class="strip-item" href="mailto:${EMAIL}">${icon(I.mail, 15)}<span>${EMAIL}</span></a>
  </div>
  <div class="strip-item strip-address">${icon(I.pin, 15)}<span>${esc(ADDRESS)}</span></div>
</div></div>
<header class="site-header"><div class="wrap header-row">
  <a class="logo" href="${prefix || './'}" aria-label="Apex Fire Safety home"><img src="${prefix}assets/logo.webp" alt="Apex Fire Safety" width="${imageInfo.logo.width}" height="${imageInfo.logo.height}"></a>
  <nav class="main-nav" id="main-nav" aria-label="Main">
    <a class="${cls('home')}" href="${prefix || './'}"${current('home')}>Home</a>
    <div class="dd">
      <a class="${cls('products')}" href="${link(routes.products)}">Our Products ${icon(I.down, 12)}</a>
      <div class="dd-menu">${catLinks}</div>
    </div>
    <a class="nav-link" href="${prefix || './'}#about">About Us</a>
    <a class="nav-link" href="${prefix || './'}#contact">Contact Us</a>
  </nav>
  <a class="header-wa" href="${esc(waHref)}" target="_blank" rel="noopener">${icon(I.wa)}<span>Chat on WhatsApp</span></a>
  <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="main-nav">${icon(I.menu, 22)}</button>
</div></header>`;
}

const footer = (waHref) => `<footer class="site-footer"><div class="wrap">
  <span>Apex Fire Safety 2026 All Rights Reserved</span>
  <span>Developed By <a href="https://agapeglobal.co/" target="_blank" rel="noopener">AGAPÈ GLOBAL</a></span>
</div></footer>
<a class="float-wa" href="${esc(waHref)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${icon(I.wa)}<span>Chat on WhatsApp</span></a>`;

function layout({ route, title, description, active, waHref, body, preload = '', noindex = false, ogImage = '' }) {
  const depth = route ? route.split('/').filter(Boolean).length : 0;
  const prefix = '../'.repeat(depth);
  const url = `${SITE}/${route}`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`}
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Apex Fire Safety">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(ogImage || `${SITE}/assets/share.jpg`)}">
<link rel="icon" type="image/png" href="${prefix}favicon.png">
<link rel="preload" href="${prefix}assets/fonts/poppins-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${prefix}assets/fonts/poppins-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
${preload.replaceAll('{prefix}', prefix)}<link rel="stylesheet" href="${prefix}assets/styles.css">
<script src="${prefix}assets/main.js" defer></script>
</head>
<body>
${header(prefix, active, waHref)}
<main id="main">
${typeof body === 'function' ? body(prefix) : body}
</main>
${footer(waHref)}
</body>
</html>
`;
  return { route, html, noindex };
}

const crumbs = (prefix, items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([t, r], i) =>
  i === items.length - 1
    ? `<li><span aria-current="page">${esc(t)}</span></li>`
    : `<li><a href="${r === '' ? prefix || './' : prefix + r}">${esc(t)}</a></li>`).join('')}</ol></nav>`;

const priceLabel = (p) => p.price || 'Price on request';
const count = (n, noun = 'product') => `${n} ${noun}${n === 1 ? '' : 's'}`;
const CARD_SIZES = '(max-width:640px) 46vw, (max-width:1280px) 30vw, 300px';

function productCard(p, prefix) {
  return `<a class="p-card" href="${prefix}${routes.product(p)}">
  <div class="frame">${productImg(p, prefix, CARD_SIZES)}</div>
  <div class="p-body">
    <span class="p-name">${esc(p.name)}</span>
    <span class="p-price">${esc(priceLabel(p))}</span>
    ${p.desc ? `<span class="p-desc">${esc(p.desc)}</span>` : ''}
    <span class="p-cta">View product <span class="arrow" aria-hidden="true">&rarr;</span></span>
  </div>
</a>`;
}

/* ---------- Pages ---------- */

function homePage() {
  const services = ['Fire Safety Solutions', 'Security &amp; Surveillance', 'Safety Consultancy', 'Installation &amp; Maintenance'];
  const steps = ['Consultancy', 'Supply', 'Installation', 'Maintenance'];
  const industries = [[I.office, 'Offices'], [I.factory, 'Industrial facilities &amp; warehouses'], [I.home, 'Residential properties'], [I.book, 'Hospitals &amp; educational institutions'], [I.bag, 'Retail centers']];
  const stats = [['500+', 'Fire extinguishers installed'], ['100+', 'Alarm and detection systems deployed'], ['50+', 'Industrial and commercial facilities secured'], ['24/7', 'Support teams']];
  const values = [['Safety &amp; Security First', 'Every product and service is designed to protect what matters most.'], ['Integrity', 'Transparent processes and honest communication.'], ['Innovation', 'Modern surveillance and fire technologies for evolving safety needs.'], ['Commitment', 'Long-term client relationships built through service and support.']];
  const waHref = wa(GENERAL_MSG);
  const pad = (n) => String(n + 1).padStart(2, '0');

  return layout({
    route: routes.home,
    ...seoOf(pageSeo.home?.seo, 'Apex Fire Safety | Fire & Safety Equipment Catalogue, Islamabad', 'Certified fire extinguishers, advanced CCTV, and alarm systems, with reliable products and professional services.'),
    active: 'home',
    waHref,
    preload: '<link rel="preload" as="image" type="image/webp" href="{prefix}assets/hero-1920.webp" imagesrcset="{prefix}assets/hero-900.webp 900w, {prefix}assets/hero-1920.webp 1920w" imagesizes="100vw" fetchpriority="high">\n',
    body: (prefix) => `<section class="hero">
  <img class="hero-img" src="${prefix}assets/hero-1920.webp" srcset="${prefix}assets/hero-900.webp 900w, ${prefix}assets/hero-1920.webp 1920w" sizes="100vw" alt="" fetchpriority="high">
  <div class="wrap"><div class="hero-copy">
    <span class="eyebrow">Fire &amp; safety equipment catalogue</span>
    <h1>Complete Fire &amp; Safety Solutions for Homes and Businesses.</h1>
    <p>Certified fire extinguishers, advanced CCTV, and alarm systems, with reliable products and professional services.</p>
    <div class="btn-row">
      <a class="btn btn-white" href="${routes.products}">Browse the catalogue</a>
      <a class="btn btn-red" href="${esc(waHref)}" target="_blank" rel="noopener">${icon(I.wa)}<span>Chat on WhatsApp</span></a>
    </div>
  </div></div>
</section>
<section class="stats" aria-label="Apex Fire Safety at a glance"><div class="wrap">
${stats.map(([n, l]) => `  <div><div class="stat-n">${n}</div><div class="stat-l">${l}</div></div>`).join('\n')}
</div></section>
<section class="services"><div class="wrap">
  <h2 class="h2">What we do</h2>
  <div class="grid-4">${services.map((s, i) => `<div class="card"><span>${pad(i)}</span><h3>${s}</h3></div>`).join('')}</div>
  <div class="stack-56">
    <div class="stack-28">
      <h3 class="h3-lg">Our process</h3>
      <div class="process">
        <ol class="steps">${steps.map((s, i) => `<li><span class="step-n">${pad(i)}</span><span>${s}</span></li>`).join('')}</ol>
        <div class="note">${icon(I.check, 20, ' style="flex:none;color:#E00700"')}<span>Customized fire safety packages are also available.</span></div>
      </div>
    </div>
    <div class="stack-28">
      <h3 class="h3-lg">Industries we serve</h3>
      <div class="industries">${industries.map(([ic, t]) => `<div class="industry"><span class="industry-icon">${icon(ic, 26)}</span><span>${t}</span></div>`).join('')}</div>
    </div>
  </div>
</div></section>
<section class="about" id="about"><div class="wrap">
  <div class="about-copy">
    <div class="rule"></div>
    <h2 class="h2">About Apex Fire Safety</h2>
    <p>Apex Fire Safety is dedicated to protecting lives, property and businesses from fire and security risks, with fire protection systems, safety equipment and CCTV surveillance.</p>
    <div class="about-block"><h3>Our mission</h3><p>To provide reliable, innovative and cost-effective fire and safety solutions that protect communities and businesses. Protection is not an option, it is a responsibility.</p></div>
    <div class="about-block"><h3>Our vision</h3><p>To become the region's most trusted partner in fire safety and security, known for quality, integrity and excellence in every project.</p></div>
  </div>
  <div class="values">${values.map(([h, p]) => `<div class="value"><h3>${h}</h3><p>${p}</p></div>`).join('')}</div>
</div></section>
<section class="contact on-dark" id="contact"><div class="wrap">
  <div class="contact-copy">
    <h2>Need a quotation or advice?</h2>
    <p>Tell us what you need on WhatsApp and our team will get back to you with availability and pricing.</p>
    <a class="btn btn-red" href="${esc(waHref)}" target="_blank" rel="noopener">${icon(I.wa)}<span>Chat on WhatsApp</span></a>
  </div>
  <div class="contact-list">
    <a class="contact-row" href="${TEL}"><small>Phone</small><span>${PHONE}</span></a>
    <a class="contact-row" href="mailto:${EMAIL}"><small>Email</small><span>${EMAIL}</span></a>
    <div class="contact-row"><small>Address</small><span>${esc(ADDRESS)}</span></div>
  </div>
</div></section>`,
  });
}

function productsPage() {
  const cover = (c) => c.products.find((p) => p.id === c.cover) || c.products[0];
  return layout({
    route: routes.products,
    ...seoOf(pageSeo.products?.seo, 'Our Products | Apex Fire Safety', 'Browse the Apex Fire Safety catalogue: fire extinguishers, industrial safety, fire alarms, PPE, CCTV cameras and emergency lights.'),
    active: 'products',
    waHref: wa(GENERAL_MSG),
    body: (prefix) => `${crumbs(prefix, [['Home', ''], ['Our Products']])}
<section class="cat-head"><div class="wrap">
  <h1>Our Products</h1>
  <p class="cat-count">${categories.length} categories</p>
</div></section>
<section class="cat-body"><div class="wrap"><div class="grid">
${categories.map((c) => `<a class="p-card" href="${prefix}${routes.category(c)}">
  <div class="frame">${productImg(cover(c), prefix, CARD_SIZES)}</div>
  <div class="p-body">
    <span class="p-name">${esc(c.name)}</span>
    <span class="p-desc">${count(c.products.length)}</span>
    <span class="p-cta">Browse category <span class="arrow" aria-hidden="true">&rarr;</span></span>
  </div>
</a>`).join('\n')}
</div></div></section>`,
  });
}

function categoryPage(c) {
  const description = c.intro || `${c.name} from Apex Fire Safety, Islamabad. ${count(c.products.length)}. Enquire on WhatsApp for availability and a quotation.`;
  return layout({
    route: routes.category(c),
    ...seoOf(c.seo, `${c.name} | Apex Fire Safety`, description),
    active: 'products',
    waHref: wa(categoryMsg(c.name)),
    body: (prefix) => `${crumbs(prefix, [['Home', ''], ['Our Products', routes.products], [c.name]])}
<section class="cat-head"><div class="wrap">
  <h1>${esc(c.name)}</h1>
  <p class="cat-count">${count(c.products.length)}</p>
  ${c.intro ? `<p class="cat-intro">${esc(c.intro)}</p>` : ''}
  ${c.subs.length ? `<div class="pills">${c.subs.map((s) => `<a class="pill" href="${prefix}${routes.sub(s)}">${esc(s.name)}</a>`).join('')}</div>` : ''}
</div></section>
<section class="cat-body"><div class="wrap">
${c.groups.map((g) => `<div>
  ${g.title ? `<h2 class="group-title">${g.sub ? `<a href="${prefix}${routes.sub(g.sub)}">${esc(g.title)}</a>` : esc(g.title)}</h2>` : ''}
  <div class="grid">${g.products.map((p) => productCard(p, prefix)).join('\n')}</div>
</div>`).join('\n')}
</div></section>`,
  });
}

function subcategoryPage(s) {
  const c = s.category;
  return layout({
    route: routes.sub(s),
    ...seoOf(s.seo, `${s.name} | ${c.name} | Apex Fire Safety`, `${s.name} in the ${c.name} range from Apex Fire Safety, Islamabad. ${count(s.group.products.length)}. Enquire on WhatsApp for availability and a quotation.`),
    active: 'products',
    waHref: wa(categoryMsg(s.name)),
    body: (prefix) => `${crumbs(prefix, [['Home', ''], ['Our Products', routes.products], [c.name, routes.category(c)], [s.name]])}
<section class="cat-head"><div class="wrap">
  <h1>${esc(s.name)}</h1>
  <p class="cat-count">${count(s.group.products.length)}</p>
</div></section>
<section class="cat-body"><div class="wrap">
  <div class="grid">${s.group.products.map((p) => productCard(p, prefix)).join('\n')}</div>
</div></section>`,
  });
}

function renderBlocks(blocks) {
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.k === 'h') out.push(`<h3${b.warn ? ' class="warn-h"' : ''}>${esc(b.t)}</h3>`);
    else if (b.k === 'p') out.push(`<p>${esc(b.t)}</p>`);
    else if (b.k === 'li') out.push(`<div class="li${b.warn ? ' warn' : ''}"><div>${b.label ? `<strong>${esc(b.label)}: </strong>` : ''}<span>${esc(b.t)}</span></div></div>`);
    else if (b.k === 'tr') {
      const rows = [];
      while (i < blocks.length && blocks[i].k === 'tr') rows.push(blocks[i++]);
      i--;
      const [head, ...tail] = rows;
      out.push(`<div class="table-scroll"><table class="price-table"><thead><tr>${head.cells.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${tail.map((r) => `<tr>${r.cells.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    }
  }
  return out.join('\n');
}

function productPage(p) {
  const c = p.category;
  const page = p.page || { lead: [], specs: [], features: [], blocks: [] };
  const firstText = page.lead[0] || p.desc || page.blocks.find((b) => b.k === 'p')?.t || `${p.name} from Apex Fire Safety, Islamabad.`;
  const description = firstText.length > 158 ? `${firstText.slice(0, 155).replace(/\s+\S*$/, '')}...` : firstText;
  const waHref = wa(productMsg(p.name));

  return layout({
    route: routes.product(p),
    ...seoOf(p.seo, `${p.name} | Apex Fire Safety`, description),
    ogImage: p.images[0] ? `${SITE}/${imageUrls(p.images[0].file, '').src}` : '',
    active: 'products',
    waHref,
    body: (prefix) => `${crumbs(prefix, [['Home', ''], ['Our Products', routes.products], [c.name, routes.category(c)], [p.name]])}
<section class="product"><div class="wrap">
  ${productGallery(p, prefix)}
  <div class="product-info">
    <span class="chip">${esc(c.name)}</span>
    <h1>${esc(p.name)}</h1>
    ${p.price ? `<div class="price"><small>Price</small><strong>${esc(p.price)}</strong></div>` : '<div class="price-request">Price on request</div>'}
    ${page.lead.length ? `<div class="lead">${page.lead.map((l) => `<p>${esc(l)}</p>`).join('')}</div>` : p.desc ? `<p class="short-desc">${esc(p.desc)}</p>` : ''}
    <div class="btn-row">
      <a class="btn btn-red" href="${esc(waHref)}" target="_blank" rel="noopener">${icon(I.wa)}<span>Enquire on WhatsApp</span></a>
      <a class="btn btn-outline" href="${TEL}">${icon(I.phone)}<span>Call us</span></a>
    </div>
    <p class="help">Message us for availability, a quotation and installation or refilling services.</p>
    <a class="back" href="${prefix}${routes.products}">${icon(I.left, 18)}<span>Back to all products</span></a>
  </div>
</div></section>
${page.specs.length ? `<section class="section"><div class="wrap">
  <h2>${esc(page.specsTitle || 'Specifications')}</h2>
  <div class="table-scroll"><table class="spec"><tbody>${page.specs.map((r) => `<tr><th scope="row">${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join('')}</tbody></table></div>
</div></section>` : ''}
${page.features.length ? `<section class="section"><div class="wrap">
  <h2>${esc(page.featuresTitle || 'Key features')}</h2>
  <div class="features">${page.features.map((f) => {
    const { label, value } = splitLabel(f);
    return `<div class="feature">${icon(I.check)}<div>${label ? `<strong>${esc(label)}: </strong>` : ''}<span>${esc(value)}</span></div></div>`;
  }).join('')}</div>
</div></section>` : ''}
${page.blocks.length ? `<section class="long"><div class="wrap"><div class="long-inner">
  <h2>${esc(page.descTitle || 'Description')}</h2>
  <div class="blocks">${renderBlocks(page.blocks)}</div>
</div></div></section>` : ''}
${p.related.length ? `<section class="related"><div class="wrap">
  <h2>More in ${esc(c.name)}</h2>
  <div class="grid grid-related">${p.related.map((r) => `<a class="p-card" href="${prefix}${routes.product(r)}">
    <div class="frame">${productImg(r, prefix, CARD_SIZES)}</div>
    <div class="p-body"><span class="p-name">${esc(r.name)}</span><span class="p-price">${esc(priceLabel(r))}</span></div>
  </a>`).join('\n')}</div>
</div></section>` : ''}`,
  });
}

function notFoundPage() {
  // Served from any depth, so its links must be root-absolute.
  const page = layout({
    route: '',
    title: 'Page not found | Apex Fire Safety',
    description: 'This page could not be found.',
    active: '',
    waHref: wa(GENERAL_MSG),
    noindex: true,
    body: `<section class="notfound"><div class="wrap">
  <h1 class="h2">Page not found</h1>
  <p>The page you are looking for is not here. Browse the catalogue or message us on WhatsApp.</p>
  <a class="btn btn-red" href="products/">Browse the catalogue</a>
</div></section>`,
  });
  const html = page.html
    .replace(/(href|src)="(?!https?:|tel:|mailto:|#|\/)(\.\/)?/g, '$1="/')
    .replace(/<link rel="canonical"[^>]*>\n?/, '');
  return html;
}

/* ---------- Write ---------- */

await buildAssets();

const pages = [
  homePage(),
  productsPage(),
  ...categories.map(categoryPage),
  ...subcategories.map(subcategoryPage),
  ...products.map(productPage),
];

for (const { route, html } of pages) {
  const file = join(DIST, route, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
writeFileSync(join(DIST, '404.html'), notFoundPage());
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter((p) => !p.noindex).map((p) => `  <url><loc>${esc(`${SITE}/${p.route}`)}</loc></url>`).join('\n')}\n</urlset>\n`);

// Old URLs of renamed products keep working and pass visitors to the new address.
const liveRoutes = new Set(pages.map((p) => p.route));
for (const [from, to] of Object.entries(redirects)) {
  if (liveRoutes.has(from) || !liveRoutes.has(to)) continue;
  const up = '../'.repeat(from.split('/').filter(Boolean).length);
  const file = join(DIST, from, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page moved</title><link rel="canonical" href="${esc(`${SITE}/${to}`)}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${esc(up + to)}"></head><body><a href="${esc(up + to)}">This page has moved.</a></body></html>\n`);
}

const small = products.filter((p) => p.images[0] && parseInt(imageInfo[p.images[0].file].original, 10) < 500).map((p) => `${p.name} (${imageInfo[p.images[0].file].original})`);
writeFileSync(join(ROOT, 'image-report.txt'), `Product images under 500 px wide (${small.length} of ${products.length}). Upload a larger photo for these in the admin panel.\n\n${small.join('\n')}\n`);

console.log(`Built ${pages.length} pages: 1 home, 1 products, ${categories.length + subcategories.length} category, ${products.length} product. ${small.length} main images under 500 px.`);
