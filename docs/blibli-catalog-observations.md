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
