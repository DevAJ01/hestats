import { describe, expect, it } from 'vitest'
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
})
