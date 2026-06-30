# Security Policy

## Supported Versions

HEStats is currently a prototype. Security reports should target the `main` branch unless a production release branch is created.

## Reporting a Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Report privately by emailing:

```text
hello@hestats.co.uk
```

Include:

- A clear description of the issue.
- Steps to reproduce.
- Affected route, file, or data surface.
- Potential impact.
- Any suggested fix, if known.

## Scope

In scope:

- Vulnerabilities in the HEStats web app.
- Unsafe export behavior.
- Client-side data exposure beyond intended open data.
- Dependency or build-chain issues that affect users or contributors.

Out of scope:

- Social engineering.
- Denial-of-service testing.
- Reports against third-party services not controlled by HEStats.
- Automated scanner output without a reproducible impact.

## Data Integrity Reports

Incorrect financial figures, missing provenance, duplicate UKPRNs, or source gaps are data quality issues rather than security vulnerabilities. Please use the data correction issue template for those.
