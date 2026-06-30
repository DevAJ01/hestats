import { institutions, getInstitutionById } from '../data/institutions'
import {
  financials,
  getAllLatestFinancials,
  getFinancialsByInstitution,
  getLatestFinancial,
  AVAILABLE_YEARS,
} from '../data/financials'
import { computeHealthScore, getAllHealthScores, getSectorAverageScore, scoreToGrade } from '../data/health'
import { FinancialYear } from '../data/types'

export interface ApiResponse {
  status: number
  statusText: string
  data: unknown
  headers: Record<string, string>
  timingMs: number
  requestId: string
}

function requestId() {
  return 'req_' + Math.random().toString(36).slice(2, 11)
}

function paginateArray<T>(arr: T[], limit: number, offset: number) {
  return {
    items: arr.slice(offset, offset + limit),
    total: arr.length,
    limit,
    offset,
  }
}

function parseParams(search: string): Record<string, string> {
  const params: Record<string, string> = {}
  new URLSearchParams(search).forEach((v, k) => { params[k] = v })
  return params
}

function ok(data: unknown, meta?: Record<string, unknown>): ApiResponse['data'] {
  return meta ? { data, meta } : { data }
}

function err(status: number, message: string): ApiResponse {
  return {
    status,
    statusText: status === 404 ? 'Not Found' : status === 422 ? 'Unprocessable Entity' : status === 429 ? 'Too Many Requests' : 'Bad Request',
    data: { error: { code: status, message } },
    headers: { 'Content-Type': 'application/json', 'X-RateLimit-Remaining': '999' },
    timingMs: Math.round(Math.random() * 8 + 2),
    requestId: requestId(),
  }
}

function buildFin(f: FinancialYear) {
  return {
    fiscal_year: f.fiscal_year,
    published: f.published || null,
    data_source: f.data_source,
    status: f.status,
    revenue_gbp_m: f.revenue_gbp_m,
    surplus_gbp_m: f.surplus_gbp_m,
    surplus_margin_pct: +f.surplus_margin_pct.toFixed(2),
    research_income_gbp_m: f.research_income_gbp_m,
    tuition_fee_income_gbp_m: f.tuition_fee_income_gbp_m,
    other_income_gbp_m: f.other_income_gbp_m,
    staff_costs_gbp_m: f.staff_costs_gbp_m,
    total_expenditure_gbp_m: f.total_expenditure_gbp_m,
    cash_gbp_m: f.cash_gbp_m,
    borrowing_gbp_m: f.borrowing_gbp_m,
    liquidity_days: f.liquidity_days,
    international_fte_pct: f.international_fte_pct,
    student_fte_total: f.student_fte_total,
    capital_expenditure_gbp_m: f.capital_expenditure_gbp_m,
    net_assets_gbp_m: f.net_assets_gbp_m,
    risk_flag: f.risk_flag,
    source_pdf: f.source_pdf || null,
  }
}

function buildInst(i: ReturnType<typeof getInstitutionById>, withHealth = false) {
  if (!i) return null
  const base = {
    id: i.id,
    ukprn: i.ukprn,
    canonical_name: i.canonical_name,
    short_name: i.short_name,
    nation: i.nation,
    city: i.city,
    founded: i.founded,
    mission_group: i.mission_group ?? null,
    official_website: i.official_website ?? null,
  }
  if (!withHealth) return base
  const fin = getLatestFinancial(i.id)
  if (!fin) return base
  const h = computeHealthScore(fin)
  return {
    ...base,
    financial_health: { score: h.score, grade: h.grade, components: h.components, fiscal_year: fin.fiscal_year },
  }
}

// ─── Route dispatcher ──────────────────────────────────────────────────────────

export async function dispatchRequest(method: string, path: string, search: string = ''): Promise<ApiResponse> {
  const t0 = performance.now()
  // Add simulated network jitter
  await new Promise((r) => setTimeout(r, Math.round(Math.random() * 30 + 5)))

  const params = parseParams(search)
  const segments = path.replace(/^\/v1/, '').split('/').filter(Boolean)

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Version': 'v1',
    'X-RateLimit-Limit': '50000',
    'X-RateLimit-Remaining': String(Math.floor(Math.random() * 48000 + 1000)),
    'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
    'Cache-Control': 'public, max-age=300',
  }

  function respond(data: unknown, status = 200): ApiResponse {
    return {
      status,
      statusText: 'OK',
      data,
      headers: defaultHeaders,
      timingMs: Math.round(performance.now() - t0),
      requestId: requestId(),
    }
  }

  if (method !== 'GET') return err(405, 'Method not allowed. The HEStats API is read-only.')

  // ── GET /institutions ────────────────────────────────────────────────────────
  if (segments[0] === 'institutions' && !segments[1]) {
    let list = [...institutions]
    if (params.nation) list = list.filter((i) => i.nation.toLowerCase() === params.nation.toLowerCase())
    if (params.mission_group) list = list.filter((i) => (i.mission_group ?? '').toLowerCase().includes(params.mission_group.toLowerCase()))
    if (params.q) {
      const q = params.q.toLowerCase()
      list = list.filter((i) => i.canonical_name.toLowerCase().includes(q) || i.short_name.toLowerCase().includes(q) || i.ukprn.includes(q))
    }
    const limit = Math.min(Number(params.limit ?? 50), 200)
    const offset = Number(params.offset ?? 0)
    const { items, total } = paginateArray(list, limit, offset)
    return respond(ok(items.map((i) => buildInst(i)), { total, limit, offset, nations: [...new Set(list.map((i) => i.nation))] }))
  }

  // ── GET /institutions/:id ────────────────────────────────────────────────────
  if (segments[0] === 'institutions' && segments[1] && !segments[2]) {
    const inst = getInstitutionById(segments[1]) ?? institutions.find((i) => i.ukprn === segments[1])
    if (!inst) return err(404, `Institution '${segments[1]}' not found. Use a valid HEStats ID (e.g. 'oxford') or UKPRN.`)
    return respond(ok(buildInst(inst, true)))
  }

  // ── GET /institutions/:id/financials ─────────────────────────────────────────
  if (segments[0] === 'institutions' && segments[1] && segments[2] === 'financials') {
    const inst = getInstitutionById(segments[1]) ?? institutions.find((i) => i.ukprn === segments[1])
    if (!inst) return err(404, `Institution '${segments[1]}' not found.`)
    let fins = getFinancialsByInstitution(inst.id)
    if (params.fiscal_year) {
      fins = fins.filter((f) => f.fiscal_year === params.fiscal_year)
      if (!fins.length) return err(404, `No financial data for '${inst.id}' in fiscal year '${params.fiscal_year}'. Available years: ${AVAILABLE_YEARS.join(', ')}.`)
    }
    if (params.from) fins = fins.filter((f) => f.fiscal_year >= params.from)
    if (params.to) fins = fins.filter((f) => f.fiscal_year <= params.to)
    return respond(ok(fins.map(buildFin), { institution_id: inst.id, years_available: fins.length, data_sources: [...new Set(fins.map((f) => f.data_source))] }))
  }

  // ── GET /institutions/:id/health ─────────────────────────────────────────────
  if (segments[0] === 'institutions' && segments[1] && segments[2] === 'health') {
    const inst = getInstitutionById(segments[1]) ?? institutions.find((i) => i.ukprn === segments[1])
    if (!inst) return err(404, `Institution '${segments[1]}' not found.`)
    const fin = getLatestFinancial(inst.id)
    if (!fin) return err(404, `No financial data available for '${inst.id}'.`)
    const h = computeHealthScore(fin)
    return respond(ok({
      institution_id: inst.id,
      fiscal_year: fin.fiscal_year,
      health_score: h.score,
      health_grade: h.grade,
      components: h.components,
      interpretation: {
        AAA: 'Exceptional financial strength', AA: 'Very strong', A: 'Strong',
        BBB: 'Adequate', BB: 'Below average', B: 'Weak', CCC: 'Financially stressed',
      }[h.grade] ?? 'Unknown',
    }))
  }

  // ── GET /sector/summary ───────────────────────────────────────────────────────
  if (segments[0] === 'sector' && segments[1] === 'summary') {
    const year = params.fiscal_year ?? AVAILABLE_YEARS[0]
    if (!AVAILABLE_YEARS.includes(year)) return err(422, `Unknown fiscal_year '${year}'. Available: ${AVAILABLE_YEARS.join(', ')}.`)
    const yearFins = financials.filter((f) => f.fiscal_year === year)
    if (!yearFins.length) return err(404, `No data for fiscal year '${year}'.`)
    const totalIncome = yearFins.reduce((s, f) => s + f.revenue_gbp_m, 0)
    const totalSurplus = yearFins.reduce((s, f) => s + f.surplus_gbp_m, 0)
    const totalResearch = yearFins.reduce((s, f) => s + f.research_income_gbp_m, 0)
    const totalBorrowing = yearFins.reduce((s, f) => s + f.borrowing_gbp_m, 0)
    const totalStudents = yearFins.reduce((s, f) => s + f.student_fte_total, 0)
    const avgLiquidity = yearFins.reduce((s, f) => s + f.liquidity_days, 0) / yearFins.length
    const avgIntl = yearFins.reduce((s, f) => s + f.international_fte_pct, 0) / yearFins.length
    const avgHealth = getSectorAverageScore()
    const healthScores = getAllHealthScores()
    const gradeCounts: Record<string, number> = {}
    healthScores.forEach(({ grade }) => { gradeCounts[grade] = (gradeCounts[grade] ?? 0) + 1 })
    return respond(ok({
      fiscal_year: year,
      institutions_reporting: yearFins.length,
      aggregate: {
        total_income_gbp_m: Math.round(totalIncome),
        total_surplus_gbp_m: Math.round(totalSurplus),
        average_surplus_margin_pct: +((totalSurplus / totalIncome) * 100).toFixed(2),
        total_research_income_gbp_m: Math.round(totalResearch),
        total_student_fte: Math.round(totalStudents),
        total_borrowing_gbp_m: Math.round(totalBorrowing),
        average_liquidity_days: Math.round(avgLiquidity),
        average_international_pct: +avgIntl.toFixed(1),
        average_health_score: avgHealth,
        average_health_grade: scoreToGrade(avgHealth),
      },
      health_distribution: gradeCounts,
    }))
  }

  // ── GET /rankings ─────────────────────────────────────────────────────────────
  if (segments[0] === 'rankings') {
    const VALID_METRICS: Record<string, (f: FinancialYear) => number> = {
      revenue: (f) => f.revenue_gbp_m,
      surplus: (f) => f.surplus_gbp_m,
      surplus_margin: (f) => f.surplus_margin_pct,
      research: (f) => f.research_income_gbp_m,
      tuition: (f) => f.tuition_fee_income_gbp_m,
      staff_costs: (f) => f.staff_costs_gbp_m,
      cash: (f) => f.cash_gbp_m,
      borrowing: (f) => f.borrowing_gbp_m,
      liquidity: (f) => f.liquidity_days,
      international: (f) => f.international_fte_pct,
      students: (f) => f.student_fte_total,
      capex: (f) => f.capital_expenditure_gbp_m,
      net_assets: (f) => f.net_assets_gbp_m,
      health_score: (f) => computeHealthScore(f).score,
      borrowing_ratio: (f) => f.revenue_gbp_m > 0 ? (f.borrowing_gbp_m / f.revenue_gbp_m) * 100 : 0,
      staff_ratio: (f) => f.revenue_gbp_m > 0 ? (f.staff_costs_gbp_m / f.revenue_gbp_m) * 100 : 0,
    }
    const metric = params.metric ?? 'revenue'
    if (!VALID_METRICS[metric]) return err(422, `Unknown metric '${metric}'. Valid metrics: ${Object.keys(VALID_METRICS).join(', ')}.`)
    const year = params.fiscal_year ?? AVAILABLE_YEARS[0]
    const order = params.order === 'asc' ? 'asc' : 'desc'
    const limit = Math.min(Number(params.limit ?? 50), 200)
    const offset = Number(params.offset ?? 0)
    let yearFins = financials.filter((f) => f.fiscal_year === year)
    if (params.nation) {
      const nationInsts = new Set(institutions.filter((i) => i.nation.toLowerCase() === params.nation.toLowerCase()).map((i) => i.id))
      yearFins = yearFins.filter((f) => nationInsts.has(f.institution_id))
    }
    const getter = VALID_METRICS[metric]
    const sorted = yearFins.slice().sort((a, b) => order === 'desc' ? getter(b) - getter(a) : getter(a) - getter(b))
    const paged = sorted.slice(offset, offset + limit)
    const items = paged.map((f, i) => {
      const inst = getInstitutionById(f.institution_id)
      return {
        rank: offset + i + 1,
        institution_id: f.institution_id,
        ukprn: inst?.ukprn ?? null,
        institution_name: inst?.canonical_name ?? f.institution_id,
        nation: inst?.nation ?? null,
        [metric]: +getter(f).toFixed(2),
      }
    })
    return respond(ok(items, { metric, fiscal_year: year, order, total: sorted.length, limit, offset }))
  }

  // ── GET /health-scores ────────────────────────────────────────────────────────
  if (segments[0] === 'health-scores') {
    const scores = getAllHealthScores()
    let list = scores.map((h) => {
      const inst = getInstitutionById(h.institution_id)
      const fin = getLatestFinancial(h.institution_id)
      return {
        institution_id: h.institution_id,
        ukprn: inst?.ukprn ?? null,
        institution_name: inst?.canonical_name ?? h.institution_id,
        nation: inst?.nation ?? null,
        fiscal_year: fin?.fiscal_year ?? AVAILABLE_YEARS[0],
        health_score: h.score,
        health_grade: h.grade,
        components: h.components,
      }
    })
    if (params.grade) list = list.filter((h) => h.health_grade === params.grade.toUpperCase())
    if (params.nation) list = list.filter((h) => (h.nation ?? '').toLowerCase() === params.nation.toLowerCase())
    const order = params.order === 'asc' ? 'asc' : 'desc'
    list = list.sort((a, b) => order === 'desc' ? b.health_score - a.health_score : a.health_score - b.health_score)
    const limit = Math.min(Number(params.limit ?? 50), 200)
    const offset = Number(params.offset ?? 0)
    const { items, total } = paginateArray(list, limit, offset)
    return respond(ok(items, { total, limit, offset, average_score: getSectorAverageScore() }))
  }

  // ── GET /compare ──────────────────────────────────────────────────────────────
  if (segments[0] === 'compare') {
    if (!params.ids) return err(422, "Required parameter 'ids' is missing. Provide comma-separated HEStats IDs or UKPRNs.")
    const ids = params.ids.split(',').map((s) => s.trim()).slice(0, 6)
    if (ids.length < 2) return err(422, 'At least 2 institution IDs are required for comparison.')
    const year = params.fiscal_year ?? AVAILABLE_YEARS[0]
    const results = ids.map((rawId) => {
      const inst = getInstitutionById(rawId) ?? institutions.find((i) => i.ukprn === rawId)
      if (!inst) return { error: `'${rawId}' not found`, institution_id: rawId }
      const fin = getFinancialsByInstitution(inst.id).find((f) => f.fiscal_year === year)
      if (!fin) return { institution_id: inst.id, error: `No data for ${year}` }
      const h = computeHealthScore(fin)
      return {
        institution_id: inst.id,
        ukprn: inst.ukprn,
        canonical_name: inst.canonical_name,
        nation: inst.nation,
        fiscal_year: fin.fiscal_year,
        revenue_gbp_m: fin.revenue_gbp_m,
        surplus_gbp_m: fin.surplus_gbp_m,
        surplus_margin_pct: +fin.surplus_margin_pct.toFixed(2),
        research_income_gbp_m: fin.research_income_gbp_m,
        tuition_fee_income_gbp_m: fin.tuition_fee_income_gbp_m,
        staff_costs_gbp_m: fin.staff_costs_gbp_m,
        cash_gbp_m: fin.cash_gbp_m,
        borrowing_gbp_m: fin.borrowing_gbp_m,
        liquidity_days: fin.liquidity_days,
        international_fte_pct: fin.international_fte_pct,
        student_fte_total: fin.student_fte_total,
        health_score: h.score,
        health_grade: h.grade,
        risk_flag: fin.risk_flag,
      }
    })
    return respond(ok(results, { fiscal_year: year, institutions_requested: ids.length, institutions_found: results.filter((r) => !('error' in r && !r.institution_id)).length }))
  }

  // ── GET /years ────────────────────────────────────────────────────────────────
  if (segments[0] === 'years') {
    return respond(ok(AVAILABLE_YEARS.map((y) => {
      const count = financials.filter((f) => f.fiscal_year === y).length
      return { fiscal_year: y, institutions_reporting: count }
    })))
  }

  // ── GET /metrics ──────────────────────────────────────────────────────────────
  if (segments[0] === 'metrics') {
    return respond(ok([
      { key: 'revenue_gbp_m', label: 'Total Income', unit: '£m', description: 'Total annual income from all sources' },
      { key: 'surplus_gbp_m', label: 'Operating Surplus', unit: '£m', description: 'Income minus expenditure before exceptional items' },
      { key: 'surplus_margin_pct', label: 'Surplus Margin', unit: '%', description: 'Surplus as % of total income' },
      { key: 'research_income_gbp_m', label: 'Research Income', unit: '£m', description: 'Grants, contracts and research council funding' },
      { key: 'tuition_fee_income_gbp_m', label: 'Tuition Fee Income', unit: '£m', description: 'Home and international tuition fee income' },
      { key: 'other_income_gbp_m', label: 'Other Income', unit: '£m', description: 'Residences, catering, commercial and other income' },
      { key: 'staff_costs_gbp_m', label: 'Staff Costs', unit: '£m', description: 'Total staff emoluments including pension contributions' },
      { key: 'cash_gbp_m', label: 'Cash & Equivalents', unit: '£m', description: 'Short-term liquid assets' },
      { key: 'borrowing_gbp_m', label: 'External Borrowing', unit: '£m', description: 'Long-term debt including bonds, EIB loans, and bank facilities' },
      { key: 'liquidity_days', label: 'Liquidity Days', unit: 'days', description: 'Days of operating expenditure held as liquid assets' },
      { key: 'international_fte_pct', label: 'International Student %', unit: '%', description: 'International students as % of total FTE' },
      { key: 'student_fte_total', label: 'Total Student FTE', unit: 'FTE', description: 'Full-time equivalent student headcount' },
      { key: 'capital_expenditure_gbp_m', label: 'Capital Expenditure', unit: '£m', description: 'Investment in fixed assets and infrastructure' },
      { key: 'net_assets_gbp_m', label: 'Net Assets', unit: '£m', description: 'Total assets minus total liabilities' },
      { key: 'health_score', label: 'Financial Health Score', unit: '0–100', description: 'HEStats composite score across 6 financial dimensions' },
    ]))
  }

  return err(404, `Endpoint '${path}' not found. See /v1 for available routes.`)
}
