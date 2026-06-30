# Contributing to HEStats

Thank you for helping build open financial intelligence infrastructure for UK higher education.

HEStats welcomes code, design, data, documentation, methodology, and validation contributions. The most valuable contributions improve trust: clearer sources, better validation, fewer broken identifiers, and more honest confidence labels.

## Before You Start

1. Check existing issues and pull requests to avoid duplicate work.
2. For large changes, open an issue first and describe the proposed approach.
3. Keep pull requests focused. A small verified fix is easier to review than a broad rewrite.
4. Preserve the institutional terminal direction of the product.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

Run checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Focused checks:

```bash
pnpm test:data
pnpm test:smoke
```

## Pull Request Checklist

Before opening a PR, confirm:

- The branch is up to date with `main`.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- Public routes still render if the routing layer changed.
- New data rows include source status and confidence.
- Any estimated or pending data is labelled as such.
- UI changes preserve the dense institutional design direction.
- The PR description explains what changed and how it was verified.

## Data Contribution Rules

Financial data needs provenance. Please include official sources whenever possible:

- Audited annual reports and financial statements.
- HESA open data.
- OfS datasets and regulatory returns.
- UKPRN/provider metadata.
- Government or official sector statistical releases.

For each data correction, include:

- Institution.
- Fiscal year.
- Metric.
- Current value.
- Proposed value.
- Source URL.
- Page, table, note, or row reference.
- Confidence: `verified`, `estimated`, or `pending`.

Do not silently replace unknown values with guesses. Use pending or estimated status when provenance is incomplete.

## Code Style

- Follow the existing React and TypeScript patterns.
- Prefer small, explicit components over broad abstractions.
- Keep source-aware data logic in `src/app/data`.
- Keep route definitions in `src/app/routes.tsx`.
- Keep visual styling aligned with `src/styles/theme.css`.
- Use existing dense panels, tables, badges, and chart conventions before creating new primitives.

## Design Principles

HEStats should feel:

- Data-first.
- Dense.
- Professional.
- Analytical.
- Credible.
- Fast.
- Open-source.
- Finance-grade.

Avoid generic SaaS UI, marketing hero treatment, decorative gradients, glassmorphism, large empty cards, fake AI claims, and unsupported "live data" language.

## Testing Expectations

Add or update tests when you change:

- Routing.
- Public pages.
- Open data exports.
- Data validation.
- API-shape runtime behavior.
- Comparison or ranking state.
- Institution identifiers.

Use route smoke tests for public route regressions and data validation tests for data quality rules.

## Reporting Security Issues

Please do not open public issues for security vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the MIT License used by this repository.
