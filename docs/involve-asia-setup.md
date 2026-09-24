# Involve Asia setup for Skill Fusion

## What the owner needs to do once

1. Sign in to the Involve Asia Publisher Dashboard.
2. Make sure the Skill Fusion website/property is registered when available.
3. Open Profile -> Tools -> API.
4. Request an API Key.
5. After approval, keep the API Key and API Secret private.
6. Open Promotion -> Datafeed Manager to identify technology/product feeds that match Skill Fusion.
7. Do not paste production secrets into GitHub, README, issues, or source code.

## Environment variables

The application is prepared for:

- INVOLVE_API_KEY
- INVOLVE_API_SECRET
- INVOLVE_API_BASE_URL
- INVOLVE_DATAFEED_URL

Real values should be stored only in the deployment environment / secret manager.

## Planned ingestion

Data Feed/API
-> raw product validation
-> normalization
-> deduplication
-> category mapping
-> quality gate
-> Skill Fusion Score
-> AUTO + APPROVAL queue
-> published catalog

## Conversion analytics

Once traffic starts, configure Involve Asia postback so conversions can be joined back to Skill Fusion click IDs. This will allow optimization for CTR, EPC, conversion rate and revenue per visitor.
