# Skill Fusion Affiliate

Skill Fusion Affiliate now uses a **free-first architecture**:

- **GitHub Pages** — Client + Admin static website
- **Google Sheets** — product database
- **Google Apps Script** — API and Blibli reload/publish actions
- **No Vercel required**
- **No Neon required**

## Live / working paths

- Client source: `/site/index.html`
- Admin source: `/site/admin.html`
- Apps Script source: `/apps-script/Code.gs`
- Database spreadsheet ID: `1V3LTciKM0AAXQAbdk-1eNk6Ie0aXL_ksvSDBzDVjUI0`

Expected GitHub Pages URL after Pages is enabled:

- Client: https://wiliejonathan.github.io/skill-fusion-affiliate/
- Admin: https://wiliejonathan.github.io/skill-fusion-affiliate/admin.html

## Data flow

### Reload DOM
Blibli → Google Sheets **Draft**

This refreshes the product title, canonical Product ID, canonical URL, price/currency when available, features, and product gallery. The Apps Script resolver checks Blibli product HTML plus item/product summary JSON endpoints and keeps the largest coherent gallery.

### Refresh Data
Google Sheets **Draft** → **Published**

The Client only reads Published data, so a Reload never changes the public catalog until Refresh Data is pressed.

### Bulk actions
- **Reload All** — reload every Draft product from Blibli
- **Refresh Data All** — publish all Draft products to Client

## Google Sheets tabs

- `Draft` — Admin working copy
- `Published` — Client catalog
- `Config` — API/admin settings
- `Logs` — reload/publish/delete history

## One-time Google Apps Script deployment

Open the database Sheet → **Extensions → Apps Script**, paste `apps-script/Code.gs`, then deploy as **Web app**:

- Execute as: **Me**
- Who has access: **Anyone**

Copy the `/exec` URL into the Admin Connection panel. The Admin Key is stored in the private `Config` sheet.

## Legacy code

The previous Next.js/Vercel/Neon implementation remains in the repository only as a rollback/reference copy. The active CI no longer builds or depends on it.

See `MIGRATION.md` for the migration details.
