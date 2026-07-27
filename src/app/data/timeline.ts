import { getEstateRecordsByInstitution, isVerifiedEstateRecord } from './estates'
import { getFinancialsByInstitution, isKnownNumber } from './financials'
import { getProvenance } from './sources'
import { getTefByInstitution } from './tef'

export type TimelineEventType = 'milestone' | 'risk' | 'positive' | 'regulatory' | 'estate' | 'pending'

export interface InstitutionTimelineEvent {
  id: string
  year: string
  type: TimelineEventType
  domain: 'finance' | 'estates' | 'teaching'
  title: string
  body: string
  source_status: 'verified' | 'pending'
  source_label: string
  source_url?: string
}

function currency(value: number | null) {
  return isKnownNumber(value) ? `£${value.toLocaleString()}m` : 'Pending'
}

function pct(value: number | null) {
  return isKnownNumber(value) ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : 'Pending'
}

export function buildInstitutionTimeline(institutionId: string): InstitutionTimelineEvent[] {
  const events: InstitutionTimelineEvent[] = []

  for (const row of getFinancialsByInstitution(institutionId)) {
    const provenance = getProvenance(institutionId, row.fiscal_year)
    if (row.data_source === 'pending') {
      events.push({
        id: `${row.fiscal_year}-finance-pending`,
        year: row.fiscal_year,
        type: 'pending',
        domain: 'finance',
        title: 'Financial source pending',
        body: 'No verified provider-level financial row is attached for this period. Metrics remain null and excluded from aggregates.',
        source_status: 'pending',
        source_label: 'Awaiting audited accounts or official HESA finance row',
      })
      continue
    }

    const eventType: TimelineEventType = row.risk_flag === 'High' || (isKnownNumber(row.surplus_margin_pct) && row.surplus_margin_pct < 0)
      ? 'risk'
      : isKnownNumber(row.surplus_margin_pct) && row.surplus_margin_pct >= 3
        ? 'positive'
        : 'milestone'
    const isNottinghamAccounts = institutionId === 'nottingham' && row.fiscal_year === '2024-25'
    events.push({
      id: `${row.fiscal_year}-finance`,
      year: row.fiscal_year,
      type: eventType,
      domain: 'finance',
      title: isNottinghamAccounts ? 'Signed 2024/25 accounts verified' : 'Verified financial year',
      body: isNottinghamAccounts
        ? `${currency(row.revenue_gbp_m)} income, ${currency(row.surplus_gbp_m)} adjusted deficit, ${currency(row.cash_gbp_m)} cash and ${row.liquidity_days ?? 'Pending'} liquidity days.`
        : `${currency(row.revenue_gbp_m)} income · ${pct(row.surplus_margin_pct)} margin · ${row.risk_flag} risk flag.`,
      source_status: 'verified',
      source_label: provenance?.publication ?? 'Verified financial source',
      source_url: provenance?.source_url ?? row.source_pdf,
    })
  }

  for (const row of getEstateRecordsByInstitution(institutionId).filter(isVerifiedEstateRecord)) {
    events.push({
      id: `${row.academic_year}-estates`,
      year: row.academic_year,
      type: 'estate',
      domain: 'estates',
      title: 'HESA estate return reported',
      body: `${isKnownNumber(row.total_estate_area_sqm) ? `${row.total_estate_area_sqm.toLocaleString()} m²` : 'Pending area'} gross internal area · ${isKnownNumber(row.energy_consumption_kwh) ? `${(row.energy_consumption_kwh / 1_000_000).toFixed(1)}m kWh` : 'Pending energy'} · ${isKnownNumber(row.water_consumption_m3) ? `${row.water_consumption_m3.toLocaleString()} m³ water` : 'Pending water'}.`,
      source_status: 'verified',
      source_label: row.source_reference,
      source_url: row.source_url,
    })
  }

  const tef = getTefByInstitution(institutionId)
  if (tef?.source_status === 'verified') {
    events.push({
      id: `${tef.assessment_year}-tef`,
      year: '2022-23',
      type: 'regulatory',
      domain: 'teaching',
      title: `TEF ${tef.assessment_year} assessment`,
      body: `${tef.overall_rating ?? 'Pending'} overall · ${tef.student_experience_rating ?? 'Pending'} student experience · ${tef.student_outcomes_rating ?? 'Pending'} student outcomes.`,
      source_status: 'verified',
      source_label: tef.source_reference,
      source_url: tef.source_url,
    })
  }

  return events.sort((a, b) => b.year.localeCompare(a.year) || a.domain.localeCompare(b.domain))
}
