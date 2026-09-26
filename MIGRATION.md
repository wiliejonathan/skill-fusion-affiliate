# Skill Fusion Affiliate — Free Architecture

The project has been migrated away from Vercel/Neon.

## Architecture
- **GitHub Pages**: Client + Admin static website
- **Google Sheets**: Draft, Published, Config, Logs database
- **Google Apps Script**: public catalog API + admin actions
- **Blibli**: source for product metadata/gallery refresh

## Google Sheet
Spreadsheet ID: `1V3LTciKM0AAXQAbdk-1eNk6Ie0aXL_ksvSDBzDVjUI0`

Tabs:
- `Draft`: Admin workspace. Reload DOM writes here.
- `Published`: Client catalog. Refresh Data copies Draft → Published.
- `Config`: API/admin configuration.
- `Logs`: reload/publish/delete history.

## Button semantics
- Reload DOM: Blibli → Draft
- Refresh Data: Draft product → Published
- Reload All: Blibli → all Draft rows
- Refresh Data All: Draft → all Published rows

## Apps Script deployment
1. Open the Google Sheet.
2. Extensions → Apps Script.
3. Replace Code.gs with `apps-script/Code.gs`.
4. Project Settings → ensure V8 runtime.
5. Deploy → New deployment → Web app.
6. Execute as: Me.
7. Who has access: Anyone.
8. Copy the /exec URL.
9. Open GitHub Pages Admin → Connection, paste the URL and ADMIN_KEY from the Config sheet.

The Admin stores the Apps Script URL and key only in that browser's localStorage.

## Public site
The static site always has a bundled fallback snapshot so it still renders if Apps Script is temporarily unavailable. Once the Web App URL is configured in `site/config.js`, all visitors receive live Published data.
