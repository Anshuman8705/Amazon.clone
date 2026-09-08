# NimbusMart India — source update / review package

Prepared 8 September 2026.

**This ZIP is a CHANGES-ONLY package, not a standalone copy of the whole application.**
Apply it to the existing `Anshuman8705/Amazon.clone` source folder. Existing product
images, dependencies, authentication pages, admin pages and other unchanged files
come from that repository. No GitHub commit or deployment is included.

**Release status: local-development review draft. Not deployment validated.**
This is the first NimbusMart code package, not completion of every item in the earlier audit.

## Included

- Sample INR catalogue prices (explicit sample values, not dollar-to-rupee conversions).
- Indian number formatting, rupee price labels and rupee filter ranges.
- Indian state/union-territory selection and six-digit PIN format validation.
- Demo-only checkout: no card, CVV, UPI PIN or bank information is requested.
- Shared checkout validation on client and server. No arbitrary 8% tax is added.
- Totals calculated through integer paise; demo shipping is consistently free.
- Category-driven homepage tiles, clearer demonstration wording and corrected shelf links.
- Fresh seed data no longer invents thousands of customer ratings.
- Filter/sort values are read from and written to the URL; price-limited links work.
- Outdated search requests are cancelled to avoid stale suggestions.
- “Buy now” is relabelled “Add and go to checkout” to match its existing behaviour.
- Invalid fractional order quantities and duplicate product lines are rejected.
- Order statuses cannot move backwards; delivered orders cannot be cancelled and restocked.
- Random UUID order identifiers; production startup rejects weak/missing secrets.
- The API advertises its INR release. The updated client rejects an old, unmarked API
  rather than mislabelling old dollar values as rupees.

## Important database boundary

**This package does NOT migrate existing USD accounts/orders into an INR database.**
It starts a separate demo database, `server/data/store-inr.db`. Your original
`server/data/store.db` and its records are not rewritten, deleted or renamed.
Existing accounts/orders are not imported into the new demo. A later, tested migration
must preserve original order currencies and amounts and reconcile account/catalogue IDs.

The database guard refuses to open an existing unmarked/legacy database. Do not add an
INR marker manually, point `DB_PATH` to an old USD file, or simply change the symbol on
historical orders. That would corrupt the meaning of stored monetary amounts.

The updated browser uses separate INR token/cart storage keys so an old session is
not silently reused against the separate demo database. Existing browser storage is
not deleted. This namespace separation is NOT a complete fix for account-to-account
cart synchronization; see remaining work below.

## Apply to your existing source (Windows)

Make a separate copy of the existing project folder for this review. Stop its dev server.
Extract this ZIP into its own folder, then open a terminal in the extracted update folder.

```powershell
py apply_update.py "C:\path\to\Amazon.clone" --check
py apply_update.py "C:\path\to\Amazon.clone" --apply
```

Use your actual project path. `--check` only checks compatibility. The updater verifies
Git blob hashes against the reviewed source before writing anything. It refuses to
overwrite newer edits. It saves the previous source under `.nimbus-update-backups/`
and creates a receipt listing changed and new files. It never copies a database.

Then open the **project** folder:

```powershell
cd "C:\path\to\Amazon.clone"
npm ci
npm run dev
```

Node.js 22 is recommended, matching the existing project. Open the URL printed by Vite.
If `.env` defines `DB_PATH`, use a new, unused path:

```dotenv
DB_PATH=server/data/store-inr.db
```

Keep secrets in your own environment, not in source control or this chat. This update
adds no npm dependencies. The original project package.json and lockfile are retained.

Before production, both frontend and backend must be tested together with the same
release. Updating only the frontend will intentionally show an INR API mismatch.

## Run the checks supplied with this ZIP

From the **update package** folder, without installing any npm dependencies:

```powershell
node --test tests/india.test.mjs
py -m unittest discover -s tests -p "test_*.py" -v
```

The Node tests use Node 22's built-in SQLite. An experimental-feature warning is normal.
See TEST_RESULTS.txt and VALIDATION.md for the actual scope and results.

## Free hosting — not implemented by this package

No paid service is selected or activated. Durable free cloud database integration
(e.g. a compatible external database free tier) is still required before a persistent
Render deployment. The existing synchronous SQLite driver has NOT been converted into
a remote Turso driver; setting a Turso URL alone will not make this application use it.

For safety, this release blocks Render production startup with local SQLite unless
`ALLOW_EPHEMERAL_DEMO=true` is explicitly set. That exception is ONLY for disposable
sample data and permits resets; it is not a persistence fix. Do NOT use that exception
for accounts/orders that need to be retained. Leave the current live site untouched.

Render's free-service documentation states that local filesystem data is lost on
redeploy, restart or spin-down. Source checked 8 September 2026:
https://render.com/docs/free

## Work still required from the audit

- Durable free cloud storage, backups and a tested legacy USD/INR data migration.
- Account-isolated cart state, safe initial merge/write sequencing, and visible sync errors.
- Server-side order idempotency for lost-response/retry cases. The UI submit lock only
  prevents duplicate clicks while a request is in flight; it is not API idempotency.
- Complete keyboard search/navigation and mobile filter focus trapping/restoration.
- Product image galleries, deeper accessibility checks and broader admin improvements.
- Update the older card/US-price test fixtures and run the complete existing API/UI suite.
- Full production build, responsive browser testing, and staging verification.

## Rollback

Stop the application. Use the receipt in `.nimbus-india-update.json` to locate the source
backup. Restore the backed-up source files and remove only the source files listed in
`createdFiles`. Do not remove either database as part of source rollback. Keep both
copies until a tested migration or an explicit data-retention decision has been made.

## Reviewed source

Repository: https://github.com/Anshuman8705/Amazon.clone
Base commit: feaa8bee544ec952849cccbacda19f0c85669f8f
Expected source-file hashes are in patches.py. Package checksums are in MANIFEST.json.
