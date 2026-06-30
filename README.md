# HEStats

[![CI](https://github.com/DevAJ01/hestats/actions/workflows/ci.yml/badge.svg)](https://github.com/DevAJ01/hestats/actions/workflows/ci.yml)

HEStats is an open-source UK Higher Education Financial Intelligence Platform.

The long-term aim is to turn official university annual financial statements and higher education datasets into structured, searchable, comparable, visual intelligence. Think Bloomberg Terminal, Financial Times Markets, TradingView, Palantir Foundry, Companies House, and sector-specific public infrastructure for UK universities.

HEStats is currently a prototype. Some records are verified seed data and some records are explicitly labelled estimates while the real ingestion and provenance pipeline is being built. Do not cite estimated rows as audited fact.

## What HEStats Is For

HEStats should help people:

- Explore every UK higher education institution.
- View latest financial data and decade-long financial history.
- Rank universities by revenue, surplus, borrowing, liquidity, research income, student numbers, margins, and health indicators.
- Compare institutions side by side.
- Inspect annual report sources, methodology, confidence, and data status.
- Export open CSV and JSON datasets.
- Build public, reusable infrastructure for sector analysis.

## Current Status

The app is a Vite React prototype with:

- University directory and profile pages.
- Rankings and comparison workspaces.
- Explorer, reports, open data, API-shape, methodology, and support pages.
- Dark and light terminal-style themes.
- Local open-data CSV/JSON generators.
- Data validation tests for duplicate UKPRNs, orphan financial rows, invalid source states, and broken identifiers.
- Route smoke tests across public routes.

Known limitations:

- Financial coverage is not yet a complete official production dataset.
- Several UKPRNs are marked `PENDING-*` until verified.
- The API page documents a local simulator and intended response shape, not a hosted production API.
- The app currently ships as a single large bundle; code-splitting is future work.

## Tech Stack

- React 18
- React Router 7
- Vite 6
- TypeScript
- Vitest and Testing Library
- Tailwind CSS 4
- Lucide icons
- Custom HEStats theme tokens in `src/styles/theme.css`

## Getting Started

Requirements:

- Node.js 22 or newer recommended
- pnpm 11.7.0

Install dependencies:

```bash
pnpm install
```

Start the local dev server:

```bash
pnpm dev
```

Open:

```text
http://127.0.0.1:5173/
```

## Useful Commands

```bash
pnpm typecheck
pnpm test
pnpm test:smoke
pnpm test:data
pnpm build
```

Before opening a pull request, run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Project Structure

```text
src/app/
  api/              Local API-shape runtime used by the prototype
  components/       Layout, charts, institution UI, and shared primitives
  context/          Theme, year, workspace, and context-panel state
  data/             Institutions, financials, sources, exports, validation
  pages/            Public route screens
  __tests__/        Route and export smoke tests
src/styles/         Theme, global CSS, fonts, Tailwind entry
.github/           Contribution templates and CI
```

## Data Contributions

High-quality data contributions are welcome. The best data issue or PR includes:

- Institution name and HEStats id, if known.
- Fiscal year, for example `2024-25`.
- Metric name and current value.
- Corrected value.
- Official source URL.
- Annual report page, table, note, or dataset row reference.
- Whether the figure is audited, provisional, estimated, or missing.

Please do not submit unsourced financial values. If a value is inferred, modelled, or estimated, say so clearly.

## Code Contributions

Good first contributions include:

- Fixing broken links, route regressions, or accessibility issues.
- Improving tests and validation coverage.
- Adding source/provenance fields to exports.
- Improving table ergonomics without reducing density.
- Documenting methodology and data assumptions.
- Replacing pending identifiers with verified official metadata.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Design Direction

HEStats is serious institutional software. The interface should feel dense, analytical, credible, fast, and finance-grade.

Please avoid:

- Generic SaaS dashboard styling.
- Marketing hero sections.
- Decorative gradients, glassmorphism, and empty cards.
- Claims that data is live, audited, verified, or production-ready unless the code and sources prove it.

## Community

- [Contributing guide](CONTRIBUTING.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Support and funding](SUPPORT.md)

## License

Code is released under the [MIT License](LICENSE).
