# HEStats v6 — Redesign Brief Implementation Plan

## Context

The redesign brief (`hestats-redesign-brief.md`) asks to expand and professionalise the existing HEStats platform into a Bloomberg-grade intelligence system. This is an **incremental improvement — not a rewrite**. The platform already has 11 routes, a 16-KPI homepage, a 7-tab institution profile, 5-institution comparison with radar chart, a sector observatory, reports registry, UK map, API page, and methodology page. The brief identifies specific gaps to fill:

- Homepage intelligence feed replacing static alert cards
- Global year selector affecting Rankings, Sector, and Institutions
- Four new institution profile tabs (Outcomes, Staff, Timeline, Estates)
- Compare expanded to 6 institutions + share/export modal
- Open Data downloads page (`/downloads`)
- Sector Observatory refresh with sparklines and health clusters
- Navigation update adding "Open Data" link

---

## Implementation Areas (in execution order)

### 1 · Global Year Context — `src/app/context/YearContext.tsx` (NEW)

Mirrors the existing `ThemeContext.tsx` pattern exactly. Exports `YearProvider` and `useYear()`.

```ts
// YearContext.tsx — exports:
export function YearProvider({ children }: { children: React.ReactNode })
export function useYear(): { selectedYear: string; setSelectedYear: (y: string) => void }
```

**Wired in:**
- `src/app/App.tsx` — wrap `<RouterProvider>` with `<YearProvider>`
- `src/app/components/layout/Navbar.tsx` — add compact `<select>` between search and theme toggle (`lg:block hidden`), consuming `useYear()`
- `src/app/pages/RankingsPage.tsx` — replace `useState(AVAILABLE_YEARS[0])` with `useYear()` (already has the UI, just lift state to context)
- `src/app/pages/SectorPage.tsx` — replace `AVAILABLE_YEARS[0]` with `useYear().selectedYear`

**New utility** added to `src/app/data/financials.ts`:
```ts
export function getFinancialsByYear(year: string): FinancialYear[]
export function aggregateSectorByYear(): Map<string, SectorAggregate>
```
`aggregateSectorByYear` extracts the identical `aggregateByYear` function currently inlined in `HomePage.tsx` — reused by both HomePage and SectorPage.

---

### 2 · Downloads / Open Data Page — `src/app/pages/DownloadsPage.tsx` (NEW)

New `/downloads` route. All downloads use native `Blob + URL.createObjectURL` — same pattern as `RankingsPage.downloadCsv()`. No new npm packages.

**Page structure:**
- Status bar: `OPEN DATA CATALOGUE │ 138 institutions │ 10 fiscal years │ MIT licence │ API available`
- **Dataset catalog** (`Panel`, `padded={false}`): 5-row table — Institutions Directory, Financial Data All Years, Financial Data (selected year), Health Scores, Source Provenance Registry. Each row: name, format badges (CSV/JSON), record count, last updated, download buttons.
- **Citation generator** (`Panel`): APA/BibTeX/Chicago tabs with pre-formatted text + "Copy" button (`navigator.clipboard.writeText`).
- **Licence notice** (`Panel`): MIT licence for HEStats code; HESA OGL note for derived data.
- **API teaser** card → `/api`.

Download functions use existing exports: `institutions`, `financials`, `getAllHealthScores()`, `PROVENANCE`.

**Files changed:**
- `src/app/pages/DownloadsPage.tsx` — new
- `src/app/routes.tsx` — add `{ path: 'downloads', Component: DownloadsPage }`

---

### 3 · Navigation Update — `src/app/components/layout/Navbar.tsx`

- Add `{ href: '/downloads', label: 'Open Data' }` to `PRIMARY_NAV` (after Reports, before Map) — now 10 items
- Reduce nav item `px-2.5 → px-2` and font size `12 → 11.5` to fit 10 items
- Add `{ icon: <Download/>, label: 'Open Data Downloads', type: 'Downloads', href: '/downloads' }` to `SEARCH_SUGGESTIONS`
- Year selector added to right controls (Area 1)

---

### 4 · Homepage Intelligence Feed — `src/app/pages/HomePage.tsx`

**Status bar**: Add three new `│`-separated segments:
- `"11M financial records"` (static)
- `"{reportsIndexed} reports indexed"` (compute as `financials.filter(f => f.source_pdf).length`)
- API status pill with green dot: `"API Operational"`

**Replace Observatory Feed**: Replace the 4-item `OBSERVATORY_FEED` const and its 4-column grid with a 10-item `INTELLIGENCE_FEED` array rendered as a scrollable `Panel` (`max-h-[340px] overflow-y-auto`, `padded={false}`).

```ts
interface IntelligenceItem {
  id: string
  level: 'warning' | 'info' | 'positive' | 'critical'
  category: 'Regulatory' | 'Markets' | 'Research' | 'Students' | 'Policy' | 'Estates'
  title: string
  text: string
  href: string
  date: string
  affectedIds?: string[]  // institution IDs to link
  isNew?: boolean
}
```

10 realistic items: OfS financial review (warning), sector borrowing record (critical), research income growth (positive), PGT enrolment softening (warning), HESA data release (info), OfS registration conditions (warning), CapEx surge (positive), tuition fee review (info), UCAS applications decline (warning), REF 2029 consultation (info).

Each item renders as a horizontal row: 3px left border by level colour, category pill, optional `NEW` badge, title + 2-line text, date, up to 2 institution link chips.

---

### 5 · Institution Profile — 4 New Tabs — `src/app/pages/InstitutionProfilePage.tsx`

Expand `TABS` to 11: insert `'Outcomes' | 'Staff' | 'Timeline' | 'Estates'` before `'Sources'`.

Tab bar wrapper: `overflow-x-auto whitespace-nowrap` to handle 11-tab overflow.

**Four deterministic mock data generators** (seed on `institution.id.charCodeAt(0)`):

```ts
getMockOutcomes(id: string)  // NSS 75-94%, TEF Gold/Silver/Bronze, REF GPA 2.5-4.0, grad employment
getMockStaff(fin: FinancialYear)  // academic/professional headcount from staff_costs_gbp_m, female %, casualisation %
getMockTimeline(id: string, financials: FinancialYear[])  // events from real data (deficits, large CapEx) + KNOWN_EVENTS lookup for major institutions
getMockEstates(fin: FinancialYear)  // campus area (ha), GIFA m², carbon, net-zero year, maintenance backlog
```

**Tab UIs:**
- **Outcomes**: 2-col — NSS horizontal bars + TEF badge (left); graduate outcomes + REF GPA (right). Disclaimer: `"Indicative data — NSS 2023, TEF 2023"`
- **Staff**: horizontal academic/professional split bar + stats table + `MetricTrendChart` for `staff_costs_gbp_m`
- **Timeline**: vertical list with left-border spine; year `font-num`, coloured dot, event text, category badge. Real financial events (deficit years, high-CapEx years) + hardcoded KNOWN_EVENTS for major institutions (Oxford AZ vaccine, Cambridge Zero, etc.)
- **Estates**: 2-col — campus stats table (left); sustainability metrics + renewable % bar (right). Disclaimer: `"Indicative — HESA Estates Management Statistics"`

---

### 6 · Compare — 6 Institutions + Share Modal — `src/app/pages/ComparePage.tsx`

**Expand to 6:**
- Add 6th colour `'#e8a87c'` to `COLORS`
- Change all `< 5` guards to `< 6`; update "Maximum 5" message

**ShareModal component** (defined inline above `ComparePage`, same pattern as `SpotlightModal` in Navbar):
- Triggered by existing `Share2` button; add `const [shareOpen, setShareOpen] = useState(false)`
- Overlay + centred modal (`fixed inset-0 z-[100]`)
- **Preview card** (`ref={cardRef}`, 600×360px, dark bg): HEStats logo, institution chips with coloured dots, 4-metric mini table (Income, Surplus Margin, Research, Health), footer `data.hestats.co.uk`
- **"Copy Link"**: `navigator.clipboard.writeText(window.location.href)`
- **"Download PNG"**: Canvas 2D API draws the card directly (background rect, text, institution rows, metric columns, footer) — avoids `foreignObject` SVG which fails with custom fonts. Hidden `<canvas ref={canvasRef}>` in DOM. Export via `canvas.toDataURL('image/png')`.

---

### 7 · Sector Observatory Refresh — `src/app/pages/SectorPage.tsx`

**7a. Consume global year** (Area 1): `const { selectedYear: latestYear } = useYear()`, replace `getAllLatestFinancials()` with `getFinancialsByYear(latestYear)`.

**7b. Sector sparklines row**: New compact `Panel` inserted between status bar and alerts grid — 4-column grid of labelled sparklines (Total Income, Research Income, Avg Surplus Margin, Avg Liquidity) computed over all 10 years using `aggregateSectorByYear()` (Area 1 utility). Use existing `Sparkline` component at 80×24 size with YoY delta label beneath.

**7c. Health grade clusters**: Replace the flat 7-cell grade distribution row with 3 collapsible cluster sections — `Excellent (AAA+AA)`, `Stable (A+BBB)`, `Stressed (BB+B+CCC)`. Each: summary header (count, avg score, avg income) + expandable grid of institution chips (name, NationBadge, HealthBadge). Reuses existing computed `healthScores` and `finMap`.

---

## Files Modified (v6 — complete list)

| File | Type | Change |
|---|---|---|
| `src/app/context/YearContext.tsx` | NEW | Global year state |
| `src/app/pages/DownloadsPage.tsx` | NEW | /downloads page |
| `src/app/routes.tsx` | EDIT | Add /downloads route |
| `src/app/data/financials.ts` | EDIT | Add `getFinancialsByYear` + `aggregateSectorByYear` |
| `src/app/App.tsx` | EDIT | Wrap with YearProvider |
| `src/app/components/layout/Navbar.tsx` | EDIT | Year selector + Open Data link + nav compression |
| `src/app/pages/HomePage.tsx` | EDIT | Intelligence feed + enhanced status bar |
| `src/app/pages/InstitutionProfilePage.tsx` | EDIT | 4 new tabs with mock data generators |
| `src/app/pages/ComparePage.tsx` | EDIT | 6-inst expand + ShareModal + canvas PNG |
| `src/app/pages/SectorPage.tsx` | EDIT | Year context + sparklines row + grade clusters |
| `src/app/pages/RankingsPage.tsx` | EDIT | Consume YearContext instead of local state |

## Reused Patterns

- `ThemeContext.tsx` pattern → `YearContext.tsx`
- `Panel` component from `src/app/components/layout/Panel.tsx`
- `Sparkline` from `src/app/components/charts/Sparkline.tsx`
- `HealthBadge` from `src/app/components/institutions/HealthBadge.tsx`
- `NationBadge`, `RiskBadge` from same directory
- `MetricTrendChart` custom SVG from `src/app/components/charts/MetricTrendChart.tsx`
- `downloadCsv` pattern from `RankingsPage.tsx`
- `SpotlightModal` inline pattern from `Navbar.tsx` → `ShareModal` in Compare

## Verification

1. **Year selector**: FY dropdown in navbar → Rankings, Sector all update simultaneously for that year
2. **Downloads**: `/downloads` → clicking CSV on Institutions downloads `hestats-institutions.csv`; Citation copy button populates clipboard
3. **Intelligence feed**: Homepage shows 10-item scrollable feed with category pills, coloured severity borders, institution chips
4. **Status bar**: Homepage shows "11M financial records · {N} reports indexed · API Operational"
5. **New profile tabs**: Institution profile has 11 tabs with horizontal scroll; Outcomes/Staff/Timeline/Estates render with mock data and disclaimer labels
6. **Compare share**: Select 2+ institutions → Share button → modal opens → Download PNG triggers file save
7. **Sector clusters**: Expandable Excellent/Stable/Stressed sections at bottom of Sector page
8. **Nav**: 10 items including "Open Data" at `lg` breakpoint; compact spacing
