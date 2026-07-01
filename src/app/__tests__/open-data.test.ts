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
})
