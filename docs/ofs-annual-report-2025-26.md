# OfS annual report 2025–26: ingestion and score review

Reviewed 26 September 2026. Source: Office for Students, Annual report and accounts 2025–2026, HC 250, published 14 July 2026; reporting year 1 April 2025–31 March 2026.

Official PDF: https://www.officeforstudents.org.uk/media/c5wfhf2c/ofs-ara-2026_accessible.pdf

The supplied PDF is 153 pages. Printed page numbers are one less than PDF page numbers. Source registration uses `ofs-annual-report-2025-26` and the report's Open Government Licence v3.0. Data is in `src/app/data/ofsAnnualReport.ts`, with per-metric page links, periods, status and limitations.

## Included evidence

Ten intelligence records cover financial monitoring (pp. 12, 53, 57), deficits and restructuring (pp. 54–55), recruitment (p. 54), forecast accuracy (KPM 7, p. 74), student support and disability (pp. 50–51, note 100 p. 85), NSS results (p. 46), sexual misconduct survey respondents (p. 51), grant expenditure (Note 3, p. 138), subcontractual provision (p. 60), and AI conversion courses (p. 44).

The registry, intelligence feed, intelligence CSV/JSON exports and existing intelligence API share these records. Highlights appear on Overview, Sector, System Watch, Reports and Students & careers. The search palette links directly to the report panel.

## Interpretation rules

- English regulatory evidence is not UK-wide provider finance data. No provider financial, estates, health or ranking values were overwritten.
- 35.8% deficit incidence is reported for 2024–25; 42.7% is a 2025–26 forecast, already present as external context in System Watch.
- The 108 and 71 formal-monitoring counts describe successive monitoring cycles. They are not failures, a current census, or a rate obtained by dividing by an unrelated register count.
- Recruitment percentages refer to providers submitting both AFR24 and AFR25. KPM 7 measures fee income versus forecast, not annual income growth.
- £13.9m mental health funding is a financial-year amount, whereas £20m Uni Connect is an academic-year allocation. They are not summed.
- Note 3 grant figures are converted from £000 to £m, and sum to £1,386.853m. The £1,573.922m comparator was re-presented. These grants are not new university revenue rows.
- Survey findings retain respondent populations and years. Teaching positivity is not overall satisfaction; sexual misconduct prevalence is since starting study, not an annual rate.
- The regulator's own staff, pay, property, emissions, liabilities, governance transactions and operating accounts are outside the university dataset. Related-party disclosures are not a complete provider grant distribution. Qualitative case studies and proposed policies are not converted into risk penalties or current legal guidance.
- Charts without exact labelled values are not digitised by estimation. Forecasts and approximately 335 delivery partners are explicitly labelled.

## System Watch

Recalculated v1.0: `round(57 × 0.35 + 50 × 0.25 + 50 × 0.25 + 76 × 0.15) = 56` (**Severe**), unchanged from the prior snapshot. Components: finance 57, graduate employment 50, labour demand 50, recruitment exposure 76. Unrounded weighted total: 56.35.

The annual report adds relevant context but no comparable new UK panel/liquidity, graduate employment or labour-demand inputs. Adding England monitoring counts or a repeated deficit forecast would require a new calibrated methodology and could double-count financial stress. The review date is 2026-09-26; the input snapshot date remains 2026-07-26 and individual periods are displayed. This is not a September nowcast. New context is not evidence that the numerical score must increase.

## Interface

The report panel supports topic switching, direct page links, forecast labels and expandable interpretation notes. System Watch exposes its arithmetic and review rationale. Softer panels, improved spacing, visible focus rings, mobile search controls and short entrance/interaction animations improve navigation. Reduced-motion preferences disable animations and transitions; there is no scroll hijacking, looping motion or animated financial-value counting.
