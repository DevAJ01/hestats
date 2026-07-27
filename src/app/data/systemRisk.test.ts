import { describe, expect, it } from 'vitest'
import { buildSystemRiskSnapshot, systemRiskLevel } from './systemRisk'

describe('system risk snapshot', () => {
  it('stays bounded and includes employment and finance signals', () => {
    const snapshot = buildSystemRiskSnapshot()
    expect(snapshot.score).toBeGreaterThanOrEqual(0)
    expect(snapshot.score).toBeLessThanOrEqual(100)
    expect(snapshot.indicators.every((row) => row.score >= 0 && row.score <= 100)).toBe(true)
    expect(snapshot.indicators.map((row) => row.id)).toContain('graduate-employment')
    expect(snapshot.indicators.map((row) => row.id)).toContain('finance')
  })

  it('uses stable, monotonic risk bands', () => {
    expect(systemRiskLevel(0)).toBe('Stable')
    expect(systemRiskLevel(30)).toBe('Guarded')
    expect(systemRiskLevel(55)).toBe('Severe')
    expect(systemRiskLevel(75)).toBe('Critical')
  })
})
