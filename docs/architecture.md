# Skill Fusion architecture

## Merchant scope

Skill Fusion currently targets **Blibli Affiliate only** for the Indonesian market.

## Product flow

Blibli-approved product source
-> raw product validation
-> technology-category filter
-> normalization
-> deduplication
-> category/specification mapping
-> ready-stock / affiliate eligibility check
-> quality gate
-> Skill Fusion scoring
-> approval
-> published catalog.

The source adapter must not depend on undocumented private APIs. If Blibli later provides an official feed/API or an account-specific bulk export, the adapter can be replaced without changing the catalog/scoring layer.

## Scoring

The first scoring model combines:
- niche relevance
- buyer intent
- value for money
- demand/trend
- affiliate economics
- product confidence
- freshness
- content potential

Real CTR, conversion rate, EPC and revenue-per-visitor data will replace heuristic weights once sufficient observations exist.

## Publishing modes

- MANUAL
- AUTO + APPROVAL
- FULL AUTO only when the Blibli-approved source workflow supports reliable freshness and eligibility checks

## Rating policy

Marketplace/source ratings and Skill Fusion Score are separate concepts and must remain visibly distinct.

## Indonesia gate

Published products should satisfy:
- merchant = Blibli Indonesia
- currency = IDR
- ready stock
- affiliate eligible
- physical technology product
- not in excluded affiliate categories/programs
