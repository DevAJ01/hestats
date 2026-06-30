# HEStats — Expanded Institution Universe + Open-Source / Donations

## Context

Two requests:

1. **Expand the institutional universe** to cover every UK higher-education institution with the latest available financial data.
2. **Add donation/support features** so visitors can contribute to the platform — it's open-source, free, and built by a student.

### Important constraint on real-time data

HEStats is a static React + Vite frontend with no backend, no scraper, and no server-side fetch. We cannot literally pull live data from 285 OfS-registered providers — per the research brief in the repo, that's a 150–240 person-hour data-collection effort involving PDF parsing, OfS register downloads, HESA API queries, Companies House lookups, and FOI escalations. None of that is possible inside the Make frontend environment.

What we **can** do in code:

- Expand `src/app/data/institutions.ts` from the current 25 entries to a comprehensive seed of **~140 UK higher-education providers** (every Russell Group + post-92 university + recognised body in England, Scotland, Wales, and Northern Ireland — covering essentially every "university" by common definition).
- Generate realistic latest-year financial estimates for all of them, calibrated against the existing audited figures we already have for the top 25.
- Mark each row's data confidence (`verified` for the 25 institutions with audited PDF-sourced figures; `estimated` for the rest) so users always know what they're looking at, and so future real data can replace estimates row-by-row.
- Add a "data status" indicator in the UI so this is visible everywhere, not hidden.

This gives the platform the breadth the user is asking for while being honest about provenance.

---

## Part 1 — Expanded Institution Universe

### Data files to expand

**`src/app/data/institutions.ts`** — grow from 25 → ~140 entries covering:

- All 24 Russell Group + remaining English pre-92 universities (~40 total)
- English post-92 / modern universities (~70: Manchester Met, Sheffield Hallam, Northumbria, Coventry, Westminster, Greenwich, Brunel, Brighton, Plymouth, Portsmouth, Hertfordshire, Kingston, etc.)
- Scotland recognised bodies (18 from the research doc's seed list)
- Wales recognised bodies (~10)
- Northern Ireland recognised bodies (~4)
- Specialist institutions (Conservatoires, SOAS, Goldsmiths, Birkbeck, LBS, IoE/UCL parts, etc.)

Source for the canonical name + UKPRN + nation + website + city: the seed tables already documented in `src/imports/deep-research-report__8_-1.md` plus public OfS Register knowledge. Mission group annotated where applicable (Russell Group, MillionPlus, University Alliance, GuildHE).

**`src/app/data/financials.ts`** — for each newly added institution, generate **one latest-year (2024-25) entry** seeded from realistic ranges based on institution size tier (Tier 1: large research, Tier 2: mid civic, Tier 3: small/specialist). Keep the existing 95 verified entries untouched. Reuse `FinancialYear` shape from `src/app/data/types.ts`.

### New `data_source` field

Extend `FinancialYear` in `src/app/data/types.ts` with:

```ts
data_source: 'verified' | 'estimated' | 'pending'
```

- `verified` — the 95 existing entries with `source_pdf` populated.
- `estimated` — newly added rows where we've derived a plausible figure but it isn't from an audited PDF.
- `pending` — no data yet (future placeholder).

### UI changes for data confidence

- New `DataSourceBadge` component at `src/app/components/institutions/DataSourceBadge.tsx` (alongside the existing `RiskBadge` and `NationBadge` — same style language).
- Render the badge on:
  - `InstitutionCard.tsx` (header strip, next to the UKPRN/nation badge)
  - `InstitutionRow.tsx` (after the nation badge column)
  - `InstitutionProfilePage.tsx` header
  - `Sources` tab — show a clear callout for `estimated` rows ("Awaiting audited source — figures shown are sector-tier estimates")
- Add an "estimated" / "verified" filter to `InstitutionsPage.tsx` next to the existing nation / mission group / risk filters.
- Status bar on `HomePage.tsx` shows count of `verified` vs `estimated` ("25 verified · 115 estimated").

### Reuse — do not re-implement

- `getAllLatestFinancials()`, `getFinancialsByInstitution()`, `getLatestFinancial()` in `src/app/data/financials.ts` already do the right thing and will work unchanged after the dataset grows.
- The `byYear` aggregation logic in `HomePage.tsx` already iterates the full `financials` array.
- All charts (`MetricTrendChart`, `IncomeBreakdownChart`, `SurplusBarChart`, `Sparkline`) are dataset-agnostic.

---

## Part 2 — Open Source / Donations / "Built by a student"

### New `/support` page

**`src/app/pages/SupportPage.tsx`** — a new route registered in `src/app/App.tsx`. Bloomberg-aesthetic, matching the rest of the app (dark panels, thin borders, tabular numerals where applicable). Sections:

1. **Status-bar header** — `OPEN SOURCE · FREE FOREVER · STUDENT BUILT`
2. **"About this project"** — short paragraph: open-source, free, built by a student in their spare time during university. No tracking, no paywall, no enterprise upsell.
3. **Why support** — three short cards: domain & hosting costs, time spent on data collection/normalisation, keeping the platform free for researchers/journalists/students.
4. **Donation tier** — three side-by-side panels (matching popular options confirmed by user):
   - **GitHub Sponsors** — link `https://github.com/sponsors/REPLACE_ME` (placeholder)
   - **Ko-fi** — link `https://ko-fi.com/REPLACE_ME`
   - **Buy Me a Coffee** — link `https://buymeacoffee.com/REPLACE_ME`
   Each panel: platform name, one-line description, primary action button. Links open in a new tab. Placeholders documented in code comments so the user can swap in real handles in one place.
5. **Contribute code** — link to GitHub repo (placeholder), brief instructions ("file an issue, open a PR, suggest an institution"), call out the data-collection effort specifically since that's the bottleneck.
6. **Contribute data** — instructions for sector folk who can supply audited figures we don't yet have. Email mailto link placeholder.
7. **Acknowledgements / Thanks** — small section listing data source providers (OfS, HESA, Companies House) — reuses content already on `AboutPage.tsx`.

### Navbar / footer updates

- Add `Support` link to `Navbar.tsx` (between Methodology and the search bar, or in place of one of the existing items).
- Add a small `★ Star on GitHub` link or `Support →` link to the right side of `Footer.tsx`.
- Add a single subtle status-bar pill on `HomePage.tsx` (next to "LIVE"): `OPEN SOURCE` or `FREE · OPEN SOURCE`, linking to `/support`.

### Reuse

- The `Panel` component pattern (header strip + body) already used on `HomePage.tsx` should be lifted into a shared `src/app/components/layout/Panel.tsx` so `SupportPage.tsx` can use the same look without duplicating code. (Currently `Panel` is defined inline at the bottom of `HomePage.tsx`.)
- All button/link styles, badge styles, and color tokens already exist in `src/styles/theme.css`.

### Placeholder convention

All donation/repo URLs and the support email use a single constants file:

**`src/app/data/links.ts`** (new):

```ts
export const SUPPORT_LINKS = {
  github_sponsors: 'https://github.com/sponsors/REPLACE_ME',
  kofi: 'https://ko-fi.com/REPLACE_ME',
  bmac: 'https://buymeacoffee.com/REPLACE_ME',
  github_repo: 'https://github.com/REPLACE_ME/hestats',
  contact_email: 'hello@hestats.co.uk',
}
```

One file to edit when the user has real handles.

---

## Files to modify (summary)

| File | Change |
|---|---|
| `src/app/data/types.ts` | Add `data_source` field to `FinancialYear` |
| `src/app/data/institutions.ts` | Grow 25 → ~140 entries |
| `src/app/data/financials.ts` | Add ~115 estimated 2024-25 entries; mark all 95 existing as `data_source: 'verified'` |
| `src/app/data/links.ts` | **New** — central support/repo URL constants |
| `src/app/components/institutions/DataSourceBadge.tsx` | **New** — verified/estimated badge |
| `src/app/components/layout/Panel.tsx` | **New** — extract from HomePage for reuse |
| `src/app/components/institutions/InstitutionCard.tsx` | Show DataSourceBadge |
| `src/app/components/institutions/InstitutionRow.tsx` | Show DataSourceBadge column |
| `src/app/pages/InstitutionsPage.tsx` | Add verified/estimated filter |
| `src/app/pages/InstitutionProfilePage.tsx` | Show DataSourceBadge in header; warning in Sources tab for estimated rows |
| `src/app/pages/HomePage.tsx` | Verified/estimated counts in status bar; "OPEN SOURCE" pill; use shared `Panel` |
| `src/app/pages/SupportPage.tsx` | **New** — full support/donations page |
| `src/app/components/layout/Navbar.tsx` | Add Support link |
| `src/app/components/layout/Footer.tsx` | Add Support / GitHub link |
| `src/app/App.tsx` | Register `/support` route |

---

## Verification

1. Run the app and visit `/` — status bar should show "X verified · Y estimated" counts that sum to the new total. Featured institutions still render. No console errors.
2. Visit `/institutions` — total count reflects ~140. The new `Data` filter works (verified/estimated/all). Cards and table rows both show the `DataSourceBadge`.
3. Visit `/institutions/oxford` — still shows verified data with all 5 years.
4. Visit `/institutions/<a newly-added one>` — shows the single 2024-25 estimated row with a clear "Awaiting audited source" notice in the Sources tab.
5. Visit `/rankings` — league tables now include the newly-added institutions; sparklines fall back gracefully (single point) for estimated-only rows.
6. Visit `/compare` — can pick any of the ~140 institutions; comparison handles single-year vs multi-year entries.
7. Visit `/support` — three donation cards render with the placeholder links (clicking opens in a new tab to the `REPLACE_ME` URLs). Navbar/footer/HomePage pill all link to it.
8. Search `REPLACE_ME` in the repo — should only return matches inside `src/app/data/links.ts`, confirming the swap-in is one-file.
