# Verified Blibli Affiliate catalog observations

Evidence captured from the owner's Blibli Affiliate app on 25 Sep 2026.

## Confirmed UI signals

Blibli Affiliate exposes a Gadget discovery area with subcategories such as:

- Kartu Perdana
- Kabel Data
- Aksesoris Wearable
- Baterai Handphone
- Aksesoris Handphone & Tablet Lainnya
- Handphone Lainnya
- Tablet Android
- True Wireless
- Charger
- Powerbank
- Smart Watch
- Android

Some subcategory pages are explicitly labeled **Terlaris di 30 hari terakhir**.

Product rows visibly expose:

- product image
- product title
- price in IDR
- sold count
- marketplace rating
- rank/order inside the subcategory list
- "Komisi s.d." maximum commission in IDR
- Affiliate share button

The product share UI exposes a **Copy link / Salin link** action.

## Skill Fusion implications

These fields are useful for ranking:

### Trend
Use:
- 30-day category rank
- sold count
- recency of the ranking page

### Buyer confidence
Use:
- marketplace rating
- review count when available
- seller/brand confidence when available

### Affiliate economics
Use:
- maximum affiliate commission in IDR
- product price

### Relevance
Use:
- Gadget subcategory
- product title/brand/specification classification

## Important limitation

The screenshots prove that these fields exist in the Affiliate app UI, but they do not prove the existence of a public bulk API or Data Feed.

Before any automated ingestion is implemented, inspect the exact copied affiliate URL and determine whether the public product page exposes stable product identifiers/metadata through an officially permitted source.


## Verified affiliate-link pattern

A real Affiliate "Salin link" URL from the owner's account:

`https://s.blibli.com/GNtk/dwtoylcx`

Observed structure:

- host: `s.blibli.com`
- route/template segment: `GNtk`
- shortlink token: `dwtoylcx`

The short URL itself does **not** expose a Blibli product ID or SKU. Public examples show the same `/GNtk/<token>` pattern being used for Blibli product links, and some publishers also expose the equivalent `blibli.onelink.me/GNtk/<token>` form.

### Engineering consequence

Do not attempt to parse a product ID from the shortlink token.

Instead:

1. Resolve the shortlink through an officially permitted HTTP redirect flow.
2. Capture the final public Blibli product URL.
3. Extract the stable product identifier from the final URL when present (for example a `ps--...` identifier).
4. Join that canonical product ID to the Affiliate short URL.
5. Preserve the original Affiliate short URL for outbound clicks/attribution.

If automated redirect resolution is restricted, provide a manual "Resolve URL" import step where the owner pastes the final browser URL alongside the Affiliate shortlink.


## Verified final product URL structure

A real Affiliate shortlink resolved to:

`https://www.blibli.com/p/silicone-strap-tali-jam-silikon-rubber-for-xiaomi-redmi-smart-band-2-mi-band-8-active-silicon-karet-smartband/is--HOM-70013-01243-00006?pickupPointCode=PP-3177877&share_link=1&utm_campaign=affiliate_share&utm_content=salin_link&utm_medium=aff_6ab567e244d6d2a8c322863d&utm_source=affiliates`

Parsed fields:

- canonical product ID: `HOM-70013-01243-00006`
- product slug: `silicone-strap-tali-jam-silikon-rubber-for-xiaomi-redmi-smart-band-2-mi-band-8-active-silicon-karet-smartband`
- pickup point code: `PP-3177877`
- affiliate medium / tracking value: `aff_6ab567e244d6d2a8c322863d`
- campaign: `affiliate_share`
- content: `salin_link`
- source: `affiliates`

Canonical URL for deduplication should omit query parameters:

`https://www.blibli.com/p/silicone-strap-tali-jam-silikon-rubber-for-xiaomi-redmi-smart-band-2-mi-band-8-active-silicon-karet-smartband/is--HOM-70013-01243-00006`

The original affiliate URL must still be preserved for outbound clicks so attribution parameters are not lost.
