# Skill Fusion: original UI, Apps Script backend

The client and admin retain their original React components and CSS. GitHub Pages
exports both applications; Apps Script + Google Sheets are their shared backend.
The simplified `site/` pages are retained for reference but are no longer deployed.
Retired Next server routes are archived under `legacy-server/` and are excluded
from both builds. Neither Vercel nor Neon is needed for this deployment.

## Build

Use Node 24, `npm ci`, `npm run test:backend`, then `npm run build:pages` at the
repository root. Both applications use the root package-lock. Publish `pages-dist/`.
The existing manual Deploy GitHub Pages workflow performs these same steps.
Default path: `/skill-fusion-affiliate`; override `NEXT_PUBLIC_BASE_PATH` at build
if the repository/custom domain changes.

- Client: `/skill-fusion-affiliate/`
- Admin: `/skill-fusion-affiliate/admin/`
- Existing `/admin.html` redirects to `/admin/`.
- Product details: `/product/?id=PRODUCT_ID`, including newly imported products.
- Existing snapshot product paths are also exported. Wishlist keeps its original UI.

## Deploy backend before activating frontend

1. Open the existing Sheet `1V3LTciKM0AAXQAbdk-1eNk6Ie0aXL_ksvSDBzDVjUI0`.
2. Extensions → Apps Script; replace Code.gs with `apps-script/Code.gs`.
3. Deploy → Manage deployments → edit the existing Web app → New version → Deploy.
   Keep the existing execute-as-owner and visitor access settings.
4. Confirm the existing /exec endpoint with `?action=health` returns `ok:true`
   and `version:2`, then confirm `?action=catalog` reads Published.
5. Deploy GitHub Pages. The Admin requests ADMIN_KEY from the existing Config tab
   if no prior key is present in that browser. It keeps new keys for the tab session.
   Never commit or paste ADMIN_KEY into GitHub configuration or source code.

Existing /exec URL is in `shared/apps-script.ts`. If a NEW deployment changes it,
update that constant and rebuild both applications. Do not use the editor /dev URL.

## Data behavior

- Public GET: health, Published catalog only. JSONP is limited to these public reads.
- Admin POST: authenticated using Config.ADMIN_KEY in the request body.
- Import: resolve and validate link, save Draft and Published, deduplicate product IDs.
- Reload DOM: refresh one existing Draft product. Does not publish it to Client.
- Refresh Data: publish the selected local Draft product.
- Reload All: sequential per-product requests, preserving per-product errors.
- Refresh Data All: publish the current workspace; never remove unrelated rows.
- Delete: remove Draft and Published only after server acknowledgment.
- Shared Draft overrides stale browser caches on startup, preventing deleted rows
  from being restored by another device. An empty Published array clears Client.
- Client refreshes every 30 seconds while visible, and when returning to the tab.
- Apps Script serializes mutations with a script lock and validates batches before
  writing. Writes are not an ACID database transaction; Sheets service failures can
  still interrupt a batch, which can be safely retried as identity-based upserts.

Apps Script uses HTTP metadata retrieval; it does not run a Chromium browser.
Blibli may restrict metadata retrieval. Live import/reload and CORS verification
must be completed with the deployed Web app before marking migration complete.

## Validation / current activation blocker

Local production exports succeed for both applications. Mocked Apps Script tests
cover authorization, public read-only access, duplicate/import/publish/delete,
Draft separation, invalid batches, and lock release. CSS and main render markup
were compared with commit 04f23dccc402d52375b55a50d0bbcf14bf9bc4b0.

On 2026-09-26 the live endpoint still returned "Fungsi skrip tidak ditemukan:
doGet". The connected browser has no signed-in Google editor session. Until the
backend is deployed and live checks pass, this migration remains a prepared change.
