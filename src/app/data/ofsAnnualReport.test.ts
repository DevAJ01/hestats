import { describe, expect, it } from 'vitest'
import { OFS_ANNUAL_REPORT, OFS_REPORT_METRICS, OFS_ANNUAL_REPORT_RECORDS } from './ofsAnnualReport'
import { DATA_SOURCES } from './sources'
import { generateIntelligenceCsv, generateIntelligenceJson, generateSystemRiskJson } from './openDataExports'
import { buildSystemRiskSnapshot } from './systemRisk'

describe('OfS annual report ingestion', () => {
  it('preserves forecasts, monitoring cycles, geography and page provenance without contaminating provider aggregates', () => {
    expect(DATA_SOURCES.find((s) => s.id === OFS_ANNUAL_REPORT.id)?.dataset_url).toBe(OFS_ANNUAL_REPORT.url)
    for (const record of OFS_ANNUAL_REPORT_RECORDS) {
      expect(record.geography).toBe('England')
      expect(record.source_id).toBe(OFS_ANNUAL_REPORT.id)
      expect(record.metrics.every((m) => m.included_in_aggregates === false)).toBe(true)
    }
    expect(OFS_REPORT_METRICS.deficit_actual).toMatchObject({ value: 35.8, period: '2024-25', status: 'reported' })
    expect(OFS_REPORT_METRICS.deficit_forecast).toMatchObject({ value: 42.7, period: '2025-26 forecast', status: 'forecast' })
    expect(OFS_REPORT_METRICS.formal_monitoring.period).toContain('AFR24')
    for (const metric of Object.values(OFS_REPORT_METRICS)) {
      expect(metric.source_url).toBe(`${OFS_ANNUAL_REPORT.url}#page=${metric.printed_page + 1}`)
      expect(metric.notes).toBeTruthy()
    }
  })

  it('reconciles Note 3 units and keeps the re-presented comparator', () => {
    const m = OFS_REPORT_METRICS
    expect(m.teaching_grant.value + m.national_grant.value + m.capital_grant.value + m.other_grant.value).toBeCloseTo(m.total_grant.value, 3)
    expect(m.total_grant.value * 1000).toBeCloseTo(1386853, 0)
    expect(m.total_grant_prior.value).toBe(1573.922)
    expect(m.total_grant_prior.notes).toContain('Re-presented')
    expect(m.mental_health.period).toContain('Financial year')
    expect(m.uni_connect.period).toContain('Academic year')
  })

  it('includes the report and all its metrics in existing public exports', () => {
    const records = JSON.parse(generateIntelligenceJson()).filter((r: { source_id: string }) => r.source_id === OFS_ANNUAL_REPORT.id)
    expect(records).toHaveLength(10)
    expect(records.flatMap((r: { metrics: unknown[] }) => r.metrics)).toHaveLength(Object.keys(OFS_REPORT_METRICS).length)
    expect(generateIntelligenceCsv()).toContain(OFS_ANNUAL_REPORT.id)
  })

  it('recalculates the established composite and distinguishes review date from input date', () => {
    const s = buildSystemRiskSnapshot()
    expect(s.indicators.map((i) => i.score)).toEqual([57, 50, 50, 76])
    expect(s.score).toBe(Math.round(57 * .35 + 50 * .25 + 50 * .25 + 76 * .15))
    expect(s.score).toBe(56)
    expect(s.level).toBe('Severe')
    expect(s.review.score_change).toBe(0)
    expect(s.review.date).toBe('2026-09-26')
    expect(s.as_of).toBe('2026-07-26')
    expect(JSON.parse(generateSystemRiskJson()).review.source_id).toBe(OFS_ANNUAL_REPORT.id)
  })
})
