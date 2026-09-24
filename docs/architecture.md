# Skill Fusion architecture

## Product flow

Affiliate feed/API -> normalization -> deduplication -> category mapping -> quality gate -> scoring -> approval -> published catalog.

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
- FULL AUTO (only after filter quality is validated)

## Rating policy

Marketplace/source ratings and Skill Fusion Score are separate concepts and must remain visibly distinct.
