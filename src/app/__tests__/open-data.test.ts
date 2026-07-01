import { describe, expect, it } from 'vitest'
import { dispatchRequest } from '../api/runtime'
import { getDataset } from '../data/openDataExports'

describe('open data exports', () => {
  it('exports institution reference CSV with expected columns', () => {
    const header = getDataset('institutions', 'csv').split('\n')[0]
    expect(header).toBe('id,ukprn,canonical_name,short_name,city,nation,founded,mission_group,official_website')
  })

  it('exports latest snapshot CSV with health fields', () => {
    const header = getDataset('latest-snapshot', 'csv').split('\n')[0]
    expect(header).toContain('health_score')
    expect(header).toContain('health_grade')
    expect(header).toContain('data_source')
    expect(header).toContain('source_status')
    expect(header).toContain('source_pdf')
    expect(header).toContain('confidence')
  })

  it('exports financial source and confidence fields', () => {
    const header = getDataset('all-financials', 'csv').split('\n')[0]
    expect(header).toContain('data_source')
    expect(header).toContain('source_status')
    expect(header).toContain('source_pdf')
    expect(header).toContain('confidence')
    expect(header).toContain('source_url')
    expect(header).toContain('source_reference')
    expect(header).toContain('included_in_aggregates')
  })

  it('exports student enrolment source and coverage fields', () => {
    const csv = getDataset('student-enrolments', 'csv')
    const header = csv.split('\n')[0]
    const rows = JSON.parse(getDataset('student-enrolments', 'json'))

    expect(header).toContain('total_enrolments')
    expect(header).toContain('source_status')
    expect(header).toContain('source_url')
    expect(header).toContain('source_reference')
    expect(header).toContain('included_in_aggregates')
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBeGreaterThan(100)
    expect(rows[0]).toHaveProperty('confidence')
  })

  it('exports provider universe and finance coverage datasets', () => {
    const providers = JSON.parse(getDataset('provider-universe', 'json'))
    const providerHeader = getDataset('provider-universe', 'csv').split('\n')[0]
    const coverage = JSON.parse(getDataset('provider-finance-coverage', 'json'))
    const coverageHeader = getDataset('provider-finance-coverage', 'csv').split('\n')[0]

    expect(providers).toHaveLength(304)
    expect(providerHeader).toContain('provider_type')
    expect(providerHeader).toContain('source_status')
    expect(providerHeader).toContain('source_reference')
    expect(coverage.length).toBe(3040)
    expect(coverageHeader).toContain('fiscal_year')
    expect(coverageHeader).toContain('verified_metric_count')
    expect(coverageHeader).toContain('included_in_aggregates')
  })

  it('exports national student finance and provider source coverage datasets', () => {
    const national = JSON.parse(getDataset('national-student-finance', 'json'))
    const nationalHeader = getDataset('national-student-finance', 'csv').split('\n')[0]
    const sourceCoverage = JSON.parse(getDataset('provider-source-coverage', 'json'))
    const sourceHeader = getDataset('provider-source-coverage', 'csv').split('\n')[0]

    expect(national.length).toBeGreaterThan(10)
    expect(nationalHeader).toContain('source_url')
    expect(nationalHeader).toContain('included_in_aggregates')
    expect(national.filter((row: { source_status: string }) => row.source_status === 'forecast')
      .every((row: { included_in_aggregates: boolean }) => !row.included_in_aggregates)).toBe(true)
    expect(sourceCoverage).toHaveLength(1216)
    expect(sourceHeader).toContain('domain')
    expect(sourceHeader).toContain('source_reference')
  })

  it('exports intelligence records with source metadata', () => {
    const csv = getDataset('intelligence', 'csv')
    const header = csv.split('\n')[0]
    const rows = JSON.parse(getDataset('intelligence', 'json'))

    expect(header).toContain('source_id')
    expect(header).toContain('source_url')
    expect(header).toContain('source_reference')
    expect(header).toContain('confidence')
    expect(header).toContain('claim_type')
    expect(header).toContain('source_status')
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBeGreaterThan(5)
    expect(rows[0]).toHaveProperty('metrics')
  })

  it('does not export primary-layer estimated financial rows', () => {
    const allFinancials = JSON.parse(getDataset('all-financials', 'json'))
    const latest = JSON.parse(getDataset('latest-snapshot', 'json'))
    expect(allFinancials.some((row: { data_source: string }) => row.data_source === 'estimated')).toBe(false)
    expect(latest.some((row: { data_source: string }) => row.data_source === 'estimated')).toBe(false)
  })

  it('exports valid JSON arrays', () => {
    const institutions = JSON.parse(getDataset('institutions', 'json'))
    const latest = JSON.parse(getDataset('latest-snapshot', 'json'))
    expect(Array.isArray(institutions)).toBe(true)
    expect(Array.isArray(latest)).toBe(true)
    expect(institutions.length).toBeGreaterThan(100)
    expect(latest[0]).toHaveProperty('health_score')
    expect(latest[0]).toHaveProperty('confidence')
    expect(latest[0]).toHaveProperty('source_status')
  })

  it('reports aggregate coverage and excludes pending rows in API summaries', async () => {
    const response = await dispatchRequest('GET', '/v1/sector/summary')
    expect(response.status).toBe(200)
    const payload = response.data as {
      data: {
        coverage: {
          reporting_institutions: number
          total_institutions: number
          pending_institutions: number
          included_in_aggregates: number
        }
        aggregate: { total_income_gbp_m: number | null }
      }
    }

    expect(payload.data.coverage.total_institutions).toBeGreaterThan(100)
    expect(payload.data.coverage.reporting_institutions).toBe(payload.data.coverage.included_in_aggregates)
    expect(payload.data.coverage.pending_institutions).toBe(payload.data.coverage.total_institutions - payload.data.coverage.reporting_institutions)
    if (payload.data.coverage.reporting_institutions === 0) {
      expect(payload.data.aggregate.total_income_gbp_m).toBeNull()
    }
  })

  it('reports ranking coverage denominators and omits pending metric rows', async () => {
    const response = await dispatchRequest('GET', '/v1/rankings', '?metric=revenue')
    expect(response.status).toBe(200)
    const payload = response.data as {
      data: unknown[]
      meta: { coverage: { included: number; total_rows: number; excluded_pending: number } }
    }

    expect(payload.meta.coverage.total_rows).toBeGreaterThan(100)
    expect(payload.meta.coverage.included).toBeGreaterThanOrEqual(payload.data.length)
    expect(payload.data.length).toBeLessThanOrEqual(50)
    expect(payload.meta.coverage.excluded_pending).toBe(payload.meta.coverage.total_rows - payload.meta.coverage.included)
  })

  it('reports student enrolment coverage through the API simulator', async () => {
    const response = await dispatchRequest('GET', '/v1/student-enrolments')
    expect(response.status).toBe(200)
    const payload = response.data as {
      data: unknown[]
      meta: { coverage: { total_institutions: number; verified: number; pending: number; included_in_aggregates: number } }
    }

    expect(Array.isArray(payload.data)).toBe(true)
    expect(payload.meta.coverage.total_institutions).toBeGreaterThan(100)
    expect(payload.meta.coverage.pending).toBe(payload.meta.coverage.total_institutions - payload.meta.coverage.verified)
    expect(payload.meta.coverage.included_in_aggregates).toBe(payload.meta.coverage.verified)
  })

  it('reports intelligence coverage and labels external analysis in the API simulator', async () => {
    const response = await dispatchRequest('GET', '/v1/intelligence', '?claim_type=external-analysis')
    expect(response.status).toBe(200)
    const payload = response.data as {
      data: { claim_type: string; source_status: string; metrics: { included_in_aggregates: boolean }[] }[]
      meta: { coverage: { external_analysis_records: number; included_in_aggregates: number } }
    }

    expect(payload.data.length).toBeGreaterThan(0)
    expect(payload.data.every((row) => row.claim_type === 'external-analysis')).toBe(true)
    expect(payload.data.every((row) => row.source_status === 'external_analysis')).toBe(true)
    expect(payload.data.every((row) => row.metrics.every((metric) => !metric.included_in_aggregates))).toBe(true)
    expect(payload.meta.coverage.external_analysis_records).toBeGreaterThan(0)
    expect(payload.meta.coverage.included_in_aggregates).toBe(0)
  })

  it('reports provider universe coverage through the API simulator', async () => {
    const response = await dispatchRequest('GET', '/v1/providers', '?limit=400')
    expect(response.status).toBe(200)
    const payload = response.data as {
      data: unknown[]
      meta: { coverage: { provider_universe_rows: number; metadata_pending_rows: number } }
    }

    expect(payload.data).toHaveLength(304)
    expect(payload.meta.coverage.provider_universe_rows).toBe(304)
    expect(payload.meta.coverage.metadata_pending_rows).toBe(0)
  })

  it('reports provider finance coverage and national student finance through the API simulator', async () => {
    const coverageResponse = await dispatchRequest('GET', '/v1/provider-finance-coverage', '?fiscal_year=2024-25&limit=400')
    expect(coverageResponse.status).toBe(200)
    const coveragePayload = coverageResponse.data as {
      data: { source_status: string; included_in_aggregates: boolean }[]
      meta: { coverage: { total_provider_rows: number; verified: number; pending: number } }
    }
    expect(coveragePayload.data).toHaveLength(304)
    expect(coveragePayload.meta.coverage.total_provider_rows).toBe(304)
    expect(coveragePayload.meta.coverage.verified + coveragePayload.meta.coverage.pending).toBe(304)
    expect(coveragePayload.data.filter((row) => row.source_status === 'pending').every((row) => !row.included_in_aggregates)).toBe(true)

    const financeResponse = await dispatchRequest('GET', '/v1/national-student-finance', '?source_status=forecast')
    expect(financeResponse.status).toBe(200)
    const financePayload = financeResponse.data as {
      data: { source_status: string; included_in_aggregates: boolean }[]
      meta: { coverage: { forecast_records: number } }
    }
    expect(financePayload.data.length).toBeGreaterThan(0)
    expect(financePayload.data.every((row) => row.source_status === 'forecast')).toBe(true)
    expect(financePayload.data.every((row) => !row.included_in_aggregates)).toBe(true)
    expect(financePayload.meta.coverage.forecast_records).toBeGreaterThan(0)
  })
})
