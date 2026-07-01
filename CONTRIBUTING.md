# Contributing to HEStats

Thank you for helping build open financial intelligence infrastructure for UK higher education.

HEStats currently accepts public contributions for data accuracy, official source discovery, provenance notes, and provider metadata corrections.

Platform development is maintainer-led. Code changes, UI changes, feature work, architecture changes, dependency upgrades, and product roadmap changes may be closed unless a maintainer explicitly requested them.

## Before You Start

1. Check existing issues and pull requests to avoid duplicate work.
2. Use the data correction or source submission issue forms.
3. Keep pull requests focused on data/source updates.
4. Do not submit unsourced financial values.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

Run checks if you open a data pull request:

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
- The PR only changes data, source references, provenance notes, or contribution documentation.
- `pnpm test:data` passes if data files changed.
- New data rows include source status and confidence.
- Any estimated or pending data is labelled as such.
- Official source URLs and page/table references are included.
- The PR description explains what changed and how it was verified.

Maintainers may manually port accepted data contributions into the platform rather than merging a contributor branch directly.

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

## What Not To Submit

- Product feature PRs.
- UI redesign PRs.
- Large generated-code changes.
- Dependency update PRs.
- Data values without official source links.
- AI-generated or estimated figures presented as verified fact.

If you want to propose platform work, open a source-backed data issue first or wait for a maintainer-created issue that explicitly asks for code help.

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

- Open data exports.
- Data validation.
- Institution identifiers.

Use data validation tests for data quality rules.

## Reporting Security Issues

Please do not open public issues for security vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the MIT License used by this repository.
