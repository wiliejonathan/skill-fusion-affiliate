# Skill Fusion Affiliate Marketplace

Skill Fusion is split into **two deployable websites** that share one future catalog/database layer.

## 1. Client website

The repository root is the public marketplace for visitors.

Responsibilities:
- product catalog
- search, category and brand filters
- price/rating/Skill Fusion Score filters
- wishlist and compare
- product detail pages
- outbound Blibli affiliate links

## 2. Admin website

The `/admin` project is a separate private Next.js application.

Responsibilities:
- bulk paste Blibli affiliate links
- parse canonical Blibli Product IDs
- duplicate detection before import
- review/approval queue
- future metadata extraction/editing
- publish/unpublish
- catalog maintenance and analytics

The admin website is intended to be deployed separately from the public client website.

## Commerce scope

**Primary merchant: Blibli Affiliate (Indonesia only).**

The catalog is intended for technology products that:
- are sold on Blibli Indonesia
- are ready stock / eligible for Blibli Affiliate
- use Indonesian Rupiah checkout
- fit Skill Fusion technology categories
- pass Skill Fusion quality and scoring rules

## Duplicate policy

Exact duplicates are blocked before catalog creation using this priority:

1. Blibli canonical Product ID, for example `HOM-70013-01243-00006`
2. canonical product URL
3. exact affiliate URL
4. normalized title + brand is a review signal for a possible duplicate

A second affiliate link for the same canonical product should update the existing product's affiliate link rather than create a second catalog record.

## Roadmap

1. Register / verify Skill Fusion media in Blibli Affiliate
2. Confirm the Blibli-approved product-link workflow
3. Bulk affiliate-link importer
4. Product normalization + duplicate detection
5. Metadata extraction and category/specification mapping
6. Quality gate
7. Skill Fusion scoring engine
8. Approval queue + publish workflow
9. Shared production database/API
10. Product detail pages
11. Affiliate outbound-click analytics
12. SEO schema, sitemap and index controls

The long-term optimization target is **revenue per visitor**, not raw catalog size.

## Important integration note

Skill Fusion does not assume that Blibli exposes a public Affiliate API or Product Data Feed. The integration layer remains modular so it can move to an official API/feed later without changing the catalog identity, deduplication, scoring, client website or admin workflow.
