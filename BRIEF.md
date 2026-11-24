# Apex Fire Safety: build the website from this design

Give this whole folder to Claude Code and ask it to read BRIEF.md first.

## What this is
A product-catalogue website (not an online shop) for Apex Fire Safety, Islamabad. It replaces https://apexfiresafety.pk/. Visitors browse products and contact the business by WhatsApp, phone or email. There is no cart or checkout.

## Pages to build
1. **Home**: header, hero (photo + red headline + 2 buttons), stats, "What we do" cards, process steps, industries, About (mission, vision, 4 value cards), contact band, footer.
2. **Our Products**: 6 category cards.
3. **Category pages** (6): Fire Extinguishers, Industrial Safety, Fire Alarms, PPE, CCTV Cameras, Emergency Lights.
4. **Fire Alarms sub-category pages** (6): Zone Panels, Loop Panel, Heat Detectors, Sounders & Flashers, Smoke Detectors, Call Points.
5. **Product pages** (49): one per product, from one shared template.

## Where things are
- design-files/Main.dc.html is the home page. products.dc.html, CategoryPage.dc.html and ProductPage.dc.html are the three templates. The c-*.dc.html and p-*.dc.html files only hold the data for each page. The .dc.html format is a design-canvas format, so treat these as a visual and structural reference to recreate, not code to ship.
- data/products-and-categories.json: all categories, sub-categories, products, prices, short descriptions.
- data/product-page-content.txt: full original page text for the 30 products that have detailed pages (specs, features, price tables, warnings).
- data/image-urls.json: product name to original image path on apexfiresafety.pk (/wp-content/uploads/...). Download these and host them on the new site. Several are small (about 225 px); better photos should replace them.
- assets/: logo.png, logo-for-dark-background.png (black parts turned white, used on the black header) and the hero photo.

## Design rules
- Brand red is #E00700 (measured from the logo). Use it for headings, card top edges, buttons and prices. Black #141414, header #0a0a0a, white, soft grey #f6f6f6, borders #e7e7e7. Font: Poppins.
- Header: black bar, logo left, uppercase white menu in the middle (HOME underlined in red, OUR PRODUCTS with a hover dropdown; Fire Alarms has a side flyout with its 6 sub-categories), red "Chat on WhatsApp" button on the right. Sticky.
- Hero: full-width photo with a dark overlay, white small heading, red headline, white "Browse the catalogue" button, red WhatsApp button.
- Product images: equal square frames, image fitted without cropping on white.
- Red WhatsApp button everywhere, plus a floating one bottom-right. Link: https://wa.me/923045666404?text=<URL-encoded message naming the product>.
- Product page: breadcrumb, image, category chip, name, price (or "Price on request"), Enquire on WhatsApp, Call us, bordered specification table (label column grey), key-features grid, long description sections, red-tinted safety-warning boxes, "More in <category>" cards.
- Contact: phone +92 3045666404, email sales@apexfiresafety.pk, Plot #41, Street 116, G-13/1, Islamabad. Footer: "Apex Fire Safety 2026 All Rights Reserved", "Developed By AGAPÈ GLOBAL" (https://agapeglobal.co/).
- Keep all text, prices and categories exactly as in the data files. Do not invent claims, clients or certifications.

## Known source inconsistencies (kept as-is, worth fixing by the owner)
- AFFF header price (3,500 to 4,500) differs from its size table.
- Some spec lists and descriptions give different capacities and pressures.
- Alarm-panel pages say "2, 4 or 8 zone circuits" whatever the model.
- 19 products (general alarm types, PPE, CCTV, emergency lighting) had no detail page originally and only show a short description.
- The alarm-type images (conventional panels vs addressable) were matched by order on the old site and may be swapped.

## Suggested prompt for Claude Code
"Read BRIEF.md. Build this as a fast static website (or Next.js) with the pages and data described. Generate all 49 product pages and 12 category pages from the JSON and text files. Match design-files/Main.dc.html visually. Download the product images into the project."
