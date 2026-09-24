# Skill Fusion Affiliate Marketplace

Marketplace-style technology discovery website for **Skill Fusion**.

## Commerce scope

**Primary merchant: Blibli Affiliate (Indonesia only).**

The catalog is intended for technology products that:
- are sold on Blibli Indonesia
- are ready stock / eligible for Blibli Affiliate
- use Indonesian Rupiah checkout
- fit Skill Fusion technology categories
- pass Skill Fusion quality and scoring rules

## MVP scope

- Responsive marketplace catalog
- Search and category filters
- Brand filtering
- Min/max price range
- Marketplace rating filter
- Skill Fusion Score filter
- Sorting by recommendation, score, trend, rating and price
- Wishlist and product comparison state
- Demo catalog clearly separated from future live Blibli data

## Roadmap

1. Register / verify Skill Fusion media in Blibli Affiliate
2. Confirm the exact Blibli-approved product-link workflow available to the account
3. Build Blibli catalog adapter without relying on undocumented private APIs
4. Product normalization and deduplication
5. Category/specification mapping
6. Quality gate
7. Skill Fusion scoring engine
8. AUTO + APPROVAL publishing where the source workflow permits
9. Product detail pages
10. Affiliate-link attribution and outbound-click analytics
11. SEO schema, sitemap and index controls
12. Admin dashboard

The long-term optimization target is **revenue per visitor**, not raw catalog size.

## Important integration note

As of the current implementation, Skill Fusion does **not** assume that Blibli exposes a public Affiliate API or product Data Feed. The integration layer is intentionally modular so we can use the officially permitted source available to the account without brittle or unauthorized scraping.
