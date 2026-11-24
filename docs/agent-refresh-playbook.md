# AI Agent Refresh Playbook

This document defines the exact workflow for an AI agent to sweep Grand Rapids rental portals and load matching **duplexes, townhomes, upper/lower flats, and single-family rentals** into `apartment-finder`.

> **Important Scope Rule:** **Exclude large apartment complexes.** Only collect duplexes, townhomes, upper/lower flats, carriage houses, and small residential rentals located near **Bridge Street NW or west of the Grand River (49504 — West Grand, SWAN, Westside Connection, John Ball Park east edge)**.

## Files Owned by the Data Backend

| File | Purpose |
| :--- | :--- |
| `data/search-config.json` | Target area, coordinates, neighborhoods, allowed `propertyTypes`, and criteria. |
| `data/sources.json` | Master list of Grand Rapids property management portals & rental aggregators to sweep. |
| `data/apartments.json` | Canonical dataset of individual rental listings consumed by the future GitHub Pages site. |
| `data/history/price-history.json` | Append-only snapshots of listing rents and counts (managed automatically by `npm run finalize`). |

---

## Workflow 1: Sweep Sources & Load Listings

When the user asks to **refresh** or **scrape/load** listings:

1. Read `data/search-config.json`, `data/sources.json`, and existing `data/apartments.json`.
2. For each active portal (`active: true`) in `data/sources.json`:
   - Check its current available rentals and filter to **Grand Rapids 49504 / Bridge Street / West of the River** (within `searchRadiusMiles` of `center`).
   - **Skip** large apartment complexes; keep only `duplex`, `townhome`, `house`, `flat`, or `condo` listings.
   - Deduplicate across portals by normalized street address + unit number (e.g., if the same duplex appears on both American Realty and Zillow, merge into a single record and prefer the property manager's direct listing details).
   - Extract:
     - `id` (kebab-case address slug, e.g., `412-turner-ave-nw-unit-2`), `name` (e.g., `"412 Turner Ave NW #2"`), `propertyType`, `address`, `neighborhood`, accurate `coordinates` (`lat`, `lng`), `websiteUrl` (direct listing URL), `managementCompany`.
     - **Fees & Utilities:** `application`, `admin`, `deposit`, `monthlyParking`, `monthlyTrash`, `monthlyPet`, `monthlyOther`, and `utilitiesIncluded`.
     - **Policies & Amenities:** `petPolicy`, `parkingSummary` (off-street, garage, driveway, street), `amenities` (`inUnitLaundry`, `ac`, `dishwasher`, `balcony`, plus `highlights` like fenced yard, basement storage, porch).
     - **Unit details (`units[]`):** `unitId`, `beds`, `baths`, `sqft`, `baseRent`, `availableDate`, `leaseTermMonths`, and direct `url`.
     - **Metadata:** `meta.lastUpdated`, `meta.confidence` (`"verified"` from direct PM listing, `"estimated"` from aggregator), and `meta.sourceUrls`.
   - Update `lastCheckedAt` on the swept source in `data/sources.json`.
3. **CRITICAL — Preserve Personal User Data:**
   - If a listing already exists in `data/apartments.json`, **NEVER overwrite** its `user` object (`status`, `rating`, `tourDate`, `notes`, `pros`, `cons`). Keep the existing `user` object verbatim.
   - For brand-new listings, initialize `user` with `{ "status": "new", "rating": null, "tourDate": null, "notes": "", "pros": [], "cons": [] }`.
4. **Do not manually compute** `effectiveMonthlyCost` or `summary` — leave that to the finalize script.

---

## Workflow 2: Finalize & Verify (Always Run Last)

After updating `data/sources.json` or `data/apartments.json`, always run:

```bash
npm run finalize
```

This single command automatically:
1. Computes `effectiveMonthlyCost` (`baseRent + recurring fees - prorated specials`) and `summary` stats for every listing.
2. Sorts listings consistently.
3. Validates all JSON files in `data/` against the strict Zod schemas (`src/schemas/`).
4. Diffs against the previous snapshot, prints a summary of new listings / price drops / removed listings, and appends a new snapshot to `data/history/price-history.json`.

If `npm run finalize` exits non-zero, fix every reported schema error and re-run until it passes cleanly.
