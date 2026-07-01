import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { TrendingUp, TrendingDown, ArrowUpRight, FileText, ChevronRight, Activity, AlertCircle, Heart, Coffee } from 'lucide-react'
import { institutions } from '../data/institutions'
import { financials, getAllLatestFinancials, getFinancialsByInstitution, AVAILABLE_YEARS } from '../data/financials'
import { getSectorAverageScore, getAllHealthScores, scoreToGrade, computeHealthScore, getGradeColor } from '../data/health'
import { SUPPORT_LINKS } from '../data/links'
import { getSectorOutcomes } from '../data/outcomes'
import { getSectorDegreeStats, DEGREES } from '../data/degrees'
import { EMPLOYERS } from '../data/employers'
import { Sparkline } from '../components/charts/Sparkline'
import { RiskBadge } from '../components/institutions/RiskBadge'
import { NationBadge } from '../components/institutions/NationBadge'
import { HealthBadge } from '../components/institutions/HealthBadge'
import { MetricTrendChart } from '../components/charts/MetricTrendChart'
import { IncomeBreakdownChart } from '../components/charts/IncomeBreakdownChart'
import { Panel } from '../components/layout/Panel'
import { WorkspaceSection } from '../components/layout/WorkspaceSection'

function aggregateByYear() {
  const byYear = new Map<string, { revenue: number; surplus: number; research: number; staff: number; cash: number; borrowing: number; capex: number; intl: number; students: number; tuition: number; other: number; net_assets: number; count: number }>()
  for (const f of financials) {
    const e = byYear.get(f.fiscal_year) ?? { revenue: 0, surplus: 0, research: 0, staff: 0, cash: 0, borrowing: 0, capex: 0, intl: 0, students: 0, tuition: 0, other: 0, net_assets: 0, count: 0 }
    e.revenue += f.revenue_gbp_m
    e.surplus += f.surplus_gbp_m
    e.research += f.research_income_gbp_m
    e.staff += f.staff_costs_gbp_m
    e.cash += f.cash_gbp_m
    e.borrowing += f.borrowing_gbp_m
    e.capex += f.capital_expenditure_gbp_m
    e.intl += f.international_fte_pct
    e.students += f.student_fte_total
    e.tuition += f.tuition_fee_income_gbp_m
    e.other += f.other_income_gbp_m
    e.net_assets += f.net_assets_gbp_m
    e.count += 1
    byYear.set(f.fiscal_year, e)
  }
  return byYear
}

function fmtGBP(m: number) {
  if (m >= 1000) return `£${(m / 1000).toFixed(2)}bn`
  return `£${m.toLocaleString(undefined, { maximumFractionDigits: 0 })}m`
}

function pctChange(current: number, prev: number) {
  if (!prev) return 0
  return ((current - prev) / prev) * 100
}

function cagr(end: number, start: number, years: number) {
  if (!start || !years || end <= 0) return 0
  return (Math.pow(end / start, 1 / years) - 1) * 100
}

const OBSERVATORY_FEED = [
  { level: 'warning', title: 'OfS Financial Sustainability', text: '40+ providers flagged for enhanced monitoring. Liquidity stress most acute in smaller post-92 institutions.', href: '/sector', date: 'Jun 2025' },
  { level: 'info', title: 'Sector Borrowing Record', text: 'Aggregate external borrowing increased 8.2% YoY to £12.3bn. Fixed-rate bond exposure is £7.1bn.', href: '/sector', date: 'May 2025' },
  { level: 'positive', title: 'Research Income Growth', text: 'Research income grew 6.1% across the sector; strongest in London cluster and Russell Group.', href: '/sector', date: 'Apr 2025' },
  { level: 'warning', title: 'International Enrolment Softening', text: 'PGT international applications down 14% sector-wide. Revenue impact expected in FY2025-26.', href: '/reports', date: 'Mar 2025' },
  { level: 'negative', title: 'University of Arts London Deficit', text: 'UAL reported a £19m operating deficit for FY2023-24, its third consecutive year of financial decline.', href: '/universities/ual', date: 'Feb 2025' },
  { level: 'positive', title: 'UKRI Funding Uplift Confirmed', text: 'UKRI announced a £1.2bn uplift in research council funding for 2025-26, benefiting 45 institutions.', href: '/sector', date: 'Jan 2025' },
  { level: 'warning', title: 'Tuition Fee Policy Uncertainty', text: 'HM Treasury consultation on fee cap reform creates income planning risk for teaching-dependent providers.', href: '/about', date: 'Dec 2024' },
  { level: 'info', title: 'Staff Cost Pressure Accelerating', text: 'Sector-wide staff cost ratio reached 59.3% in FY2023-24, highest since pre-pandemic levels. USS pension contributions rising.', href: '/rankings', date: 'Nov 2024' },
  { level: 'negative', title: 'Graduate Visa Route Restriction Impact', text: 'ONS data confirms 18% decline in non-EU international PGT visas. Most affected: mid-size providers.', href: '/sector', date: 'Oct 2024' },
  { level: 'positive', title: 'Capital Investment Cycle Underway', text: 'Sector CapEx rose to £4.8bn in FY2023-24. Seven Russell Group institutions announced major estate programmes.', href: '/rankings?sort=capex', date: 'Sep 2024' },
]

export function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const byYear = aggregateByYear()
  const latestYear = AVAILABLE_YEARS[0]
  const prevYear = AVAILABLE_YEARS[1]
  const earliest = AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]
  const latest = byYear.get(latestYear)!
  const prev = byYear.get(prevYear)!
  const first = byYear.get(earliest)!

  const sortedYears = [...AVAILABLE_YEARS].sort()
  const sparkSeries = (key: 'revenue' | 'surplus' | 'research' | 'staff' | 'cash' | 'borrowing' | 'capex' | 'intl' | 'students') =>
    sortedYears.map((y) => byYear.get(y)?.[key] ?? 0)

  const latestByInst = new Map(getAllLatestFinancials().map((f) => [f.institution_id, f]))
  const verifiedCount = [...latestByInst.values()].filter((f) => f.data_source === 'verified').length
  const estimatedCount = [...latestByInst.values()].filter((f) => f.data_source === 'estimated').length

  const sectorHealthScore = getSectorAverageScore()
  const healthScores = getAllHealthScores()
  const distressCount = healthScores.filter((h) => h.score < 45).length

  const numYears = sortedYears.length - 1

  const kpis = [
    {
      label: 'Total Sector Income',
      value: fmtGBP(latest.revenue),
      change: pctChange(latest.revenue, prev.revenue),
      cagrVal: cagr(latest.revenue, first.revenue, numYears),
      spark: sparkSeries('revenue'),
      href: '/rankings?sort=revenue',
    },
    {
      label: 'Operating Surplus',
      value: fmtGBP(latest.surplus),
      change: pctChange(latest.surplus, prev.surplus),
      cagrVal: cagr(latest.surplus, first.surplus, numYears),
      spark: sparkSeries('surplus'),
      href: '/rankings?sort=surplus',
    },
    {
      label: 'Operating Margin',
      value: `${((latest.surplus / latest.revenue) * 100).toFixed(2)}%`,
      change: ((latest.surplus / latest.revenue) - (prev.surplus / prev.revenue)) * 100,
      cagrVal: null as null | number,
      isPct: true,
      spark: sortedYears.map((y) => { const e = byYear.get(y)!; return (e.surplus / e.revenue) * 100 }),
      href: '/rankings?sort=surplus_margin',
    },
    {
      label: 'Research Income',
      value: fmtGBP(latest.research),
      change: pctChange(latest.research, prev.research),
      cagrVal: cagr(latest.research, first.research, numYears),
      spark: sparkSeries('research'),
      href: '/rankings?sort=research',
    },
    {
      label: 'Staff Costs',
      value: fmtGBP(latest.staff),
      change: pctChange(latest.staff, prev.staff),
      cagrVal: cagr(latest.staff, first.staff, numYears),
      spark: sparkSeries('staff'),
      href: '/rankings?sort=staff',
      inverse: true,
    },
    {
      label: 'Cash Reserves',
      value: fmtGBP(latest.cash),
      change: pctChange(latest.cash, prev.cash),
      cagrVal: cagr(latest.cash, first.cash, numYears),
      spark: sparkSeries('cash'),
      href: '/rankings?sort=cash',
    },
    {
      label: 'External Borrowing',
      value: fmtGBP(latest.borrowing),
      change: pctChange(latest.borrowing, prev.borrowing),
      cagrVal: cagr(latest.borrowing, first.borrowing, numYears),
      spark: sparkSeries('borrowing'),
      href: '/rankings?sort=borrowing',
      inverse: true,
    },
    {
      label: 'Capital Expenditure',
      value: fmtGBP(latest.capex),
      change: pctChange(latest.capex, prev.capex),
      cagrVal: cagr(latest.capex, first.capex, numYears),
      spark: sparkSeries('capex'),
      href: '/rankings?sort=capex',
    },
    {
      label: 'Avg International %',
      value: `${(latest.intl / latest.count).toFixed(1)}%`,
      change: (latest.intl / latest.count) - (prev.intl / prev.count),
      cagrVal: null as null | number,
      isPct: true,
      spark: sortedYears.map((y) => { const e = byYear.get(y)!; return e.intl / e.count }),
      href: '/rankings?sort=international',
    },
    {
      label: 'Total Student FTE',
      value: latest.students.toLocaleString(),
      change: pctChange(latest.students, prev.students),
      cagrVal: cagr(latest.students, first.students, numYears),
      spark: sparkSeries('students'),
      href: '/rankings?sort=students',
    },
    {
      label: 'Institutions Reporting',
      value: latest.count.toString(),
      change: 0,
      cagrVal: null as null | number,
      spark: sortedYears.map((y) => byYear.get(y)?.count ?? 0),
      href: '/universities',
    },
    {
      label: 'Avg Income / Institution',
      value: fmtGBP(latest.revenue / latest.count),
      change: pctChange(latest.revenue / latest.count, prev.revenue / prev.count),
      cagrVal: cagr(latest.revenue / latest.count, first.revenue / first.count, numYears),
      spark: sortedYears.map((y) => { const e = byYear.get(y)!; return e.revenue / e.count }),
      href: '/rankings?sort=revenue',
    },
    {
      label: 'Avg Financial Health',
      value: `${sectorHealthScore}/100`,
      change: 0,
      cagrVal: null as null | number,
      spark: sortedYears.map(() => sectorHealthScore),
      href: '/sector',
      gradeValue: scoreToGrade(sectorHealthScore),
    },
    {
      label: 'Staff Cost Ratio',
      value: `${latest.revenue > 0 ? ((latest.staff / latest.revenue) * 100).toFixed(1) : 0}%`,
      change: (latest.revenue > 0 ? (latest.staff / latest.revenue) * 100 : 0) - (prev.revenue > 0 ? (prev.staff / prev.revenue) * 100 : 0),
      cagrVal: null as null | number,
      isPct: true,
      spark: sortedYears.map((y) => { const e = byYear.get(y)!; return e.revenue > 0 ? (e.staff / e.revenue) * 100 : 0 }),
      href: '/rankings?sort=surplus',
      inverse: true,
    },
    {
      label: 'Sector Net Assets',
      value: fmtGBP(latest.net_assets),
      change: pctChange(latest.net_assets, prev.net_assets),
      cagrVal: cagr(latest.net_assets, first.net_assets, numYears),
      spark: sortedYears.map((y) => byYear.get(y)?.net_assets ?? 0),
      href: '/rankings?sort=net_assets',
    },
    {
      label: 'Research Income %',
      value: `${latest.revenue > 0 ? ((latest.research / latest.revenue) * 100).toFixed(1) : 0}%`,
      change: (latest.revenue > 0 ? (latest.research / latest.revenue) * 100 : 0) - (prev.revenue > 0 ? (prev.research / prev.revenue) * 100 : 0),
      cagrVal: null as null | number,
      isPct: true,
      spark: sortedYears.map((y) => { const e = byYear.get(y)!; return e.revenue > 0 ? (e.research / e.revenue) * 100 : 0 }),
      href: '/rankings?sort=research',
    },
  ]

  const sectorTrendFinancials = sortedYears.map((y) => {
    const e = byYear.get(y)!
    return {
      institution_id: 'SECTOR',
      fiscal_year: y,
      published: '',
      revenue_gbp_m: e.revenue,
      surplus_gbp_m: e.surplus,
      surplus_margin_pct: (e.surplus / e.revenue) * 100,
      research_income_gbp_m: e.research,
      tuition_fee_income_gbp_m: e.tuition,
      other_income_gbp_m: e.other,
      staff_costs_gbp_m: e.staff,
      total_expenditure_gbp_m: 0,
      cash_gbp_m: e.cash,
      borrowing_gbp_m: e.borrowing,
      liquidity_days: 0,
      international_fte_pct: 0,
      student_fte_total: e.students,
      capital_expenditure_gbp_m: e.capex,
      net_assets_gbp_m: 0,
      risk_flag: 'Low' as const,
      status: 'found' as const,
      data_source: 'estimated' as const,
    }
  })

  const rankedByRevenue = [...institutions]
    .map((i) => ({ inst: i, fin: latestByInst.get(i.id) }))
    .filter((x): x is { inst: typeof x.inst; fin: NonNullable<typeof x.fin> } => !!x.fin)
    .sort((a, b) => b.fin.revenue_gbp_m - a.fin.revenue_gbp_m)
    .slice(0, 12)

  const recentReports = financials
    .filter((f) => f.source_pdf)
    .sort((a, b) => b.published.localeCompare(a.published))
    .slice(0, 8)
    .map((f) => ({ f, inst: institutions.find((i) => i.id === f.institution_id)! }))

  const filteredSuggestions = search
    ? institutions
        .filter((i) =>
          i.canonical_name.toLowerCase().includes(search.toLowerCase()) ||
          i.short_name.toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 6)
    : []

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (filteredSuggestions[0]) navigate(`/universities/${filteredSuggestions[0].id}`)
    else navigate(`/universities?q=${encodeURIComponent(search)}`)
  }

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5">
      {/* Sector status bar */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 mb-2.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Activity className="w-3 h-3" style={{ color: 'var(--positive)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>SECTOR OVERVIEW</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          FY <span className="font-num" style={{ color: 'var(--text)' }}>{latestYear}</span>
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{latest.count}</span> reporting
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{fmtGBP(latest.revenue)}</span> aggregate income
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--positive)' }}>{verifiedCount}</span> verified ·{' '}
          <span className="font-num" style={{ color: 'var(--warning)' }}>{estimatedCount}</span> estimated
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          Avg health <span className="font-num" style={{ color: 'var(--positive)' }}>{sectorHealthScore}/100</span>
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--negative)' }}>{distressCount}</span> in stress
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          Updated <span className="font-num" style={{ color: 'var(--text)' }}>Jun 2025</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--positive)' }} />
          <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em' }}>OPEN SOURCE · FREE FOREVER</span>
        </div>
      </div>

      {/* ── My Workspace (watchlist · recent · saved comparisons) ─────────────── */}
      <WorkspaceSection />

      {/* ── Support banner ──────────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-x-4 sm:gap-y-2 px-4 py-3 mb-2.5 border min-w-0"
        style={{
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)',
          borderRadius: 3,
          borderLeft: '3px solid var(--negative)',
        }}
      >
        <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
          <Heart className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--negative)' }} />
          <div className="min-w-0">
            <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
              HEStats is free, open-source, and student-built
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: 11, lineHeight: 1.4 }}>
              No paywalls. No ads. No VC funding. If this platform saves you time, please consider supporting it.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto min-w-0">
          <a
            href={SUPPORT_LINKS.github_sponsors}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 transition-colors min-w-0"
            style={{ backgroundColor: '#ea4aaa', color: '#fff', borderRadius: 3, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Heart className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">GitHub Sponsors</span>
          </a>
          <a
            href={SUPPORT_LINKS.kofi}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 transition-colors min-w-0"
            style={{ backgroundColor: '#29abe0', color: '#fff', borderRadius: 3, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Coffee className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">Ko-fi</span>
          </a>
          <a
            href={SUPPORT_LINKS.github_repo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 transition-colors min-w-0"
            style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 3, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">Contribute</span>
          </a>
          <Link
            to="/support"
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 min-w-0"
            style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)', fontSize: 12, textDecoration: 'none' }}
          >
            <span className="truncate">All options</span> <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* ── Current era: UK HE indicators ──────────────────────────────────── */}
      {(() => {
        const allFins = getAllLatestFinancials()
        const deficitInsts = allFins.filter((f) => f.surplus_gbp_m < 0)
        const surplusInsts = allFins.filter((f) => f.surplus_gbp_m >= 0)
        const totalIncome = latest.revenue
        const totalBorrowing = latest.borrowing
        const totalResearch = latest.research
        const avgStaffRatio = latest.revenue > 0 ? (latest.staff / latest.revenue) * 100 : 0
        const avgIntl = latest.intl / latest.count
        const totalStudents = latest.students
        const highRiskCount = allFins.filter((f) => f.risk_flag === 'High').length
        const aaaCount = healthScores.filter((h) => h.grade === 'AAA' || h.grade === 'AA').length
        const cccCount = healthScores.filter((h) => h.grade === 'CCC' || h.grade === 'B').length
        const researchGrowth = prev ? pctChange(latest.research, prev.research) : 0
        const borrowingGrowth = prev ? pctChange(latest.borrowing, prev.borrowing) : 0
        const incomeGrowth = prev ? pctChange(latest.revenue, prev.revenue) : 0

        const ERA_INDICATORS = [
          {
            label: 'Institutions in deficit',
            value: deficitInsts.length.toString(),
            sub: `of ${allFins.length} reporting`,
            color: deficitInsts.length > 20 ? 'var(--negative)' : 'var(--warning)',
            signal: 'warning',
            context: 'Deficit institutions carry elevated OfS monitoring risk',
          },
          {
            label: 'Aggregate sector income',
            value: fmtGBP(totalIncome),
            sub: incomeGrowth >= 0 ? `+${incomeGrowth.toFixed(1)}% YoY` : `${incomeGrowth.toFixed(1)}% YoY`,
            color: incomeGrowth >= 0 ? 'var(--positive)' : 'var(--negative)',
            signal: incomeGrowth >= 0 ? 'positive' : 'negative',
            context: `FY${latestYear} total across ${latest.count} providers`,
          },
          {
            label: 'Research income',
            value: fmtGBP(totalResearch),
            sub: researchGrowth >= 0 ? `+${researchGrowth.toFixed(1)}% YoY` : `${researchGrowth.toFixed(1)}% YoY`,
            color: researchGrowth >= 0 ? 'var(--positive)' : 'var(--warning)',
            signal: researchGrowth >= 0 ? 'positive' : 'warning',
            context: 'UKRI grants + contracts aggregate',
          },
          {
            label: 'Sector borrowing',
            value: fmtGBP(totalBorrowing),
            sub: borrowingGrowth >= 0 ? `+${borrowingGrowth.toFixed(1)}% — record high` : `${borrowingGrowth.toFixed(1)}% YoY`,
            color: borrowingGrowth > 5 ? 'var(--negative)' : 'var(--warning)',
            signal: 'warning',
            context: 'Long-term external debt; bonds + EIB + bank',
          },
          {
            label: 'Avg staff cost ratio',
            value: `${avgStaffRatio.toFixed(1)}%`,
            sub: avgStaffRatio > 58 ? 'Above 58% OfS threshold' : 'Within OfS benchmark',
            color: avgStaffRatio > 58 ? 'var(--negative)' : 'var(--positive)',
            signal: avgStaffRatio > 58 ? 'warning' : 'positive',
            context: 'Staff costs as % of total income',
          },
          {
            label: 'Avg international %',
            value: `${avgIntl.toFixed(1)}%`,
            sub: 'PGT applications −14% YoY',
            color: 'var(--warning)',
            signal: 'warning',
            context: 'Revenue risk from visa policy changes',
          },
          {
            label: 'Total student FTE',
            value: (totalStudents / 1000).toFixed(0) + 'k',
            sub: `${pctChange(latest.students, prev?.students ?? latest.students).toFixed(1)}% YoY`,
            color: 'var(--text)',
            signal: 'neutral',
            context: 'All HESA-registered enrolments',
          },
          {
            label: 'High financial risk',
            value: highRiskCount.toString(),
            sub: `${((highRiskCount / allFins.length) * 100).toFixed(0)}% of sector`,
            color: highRiskCount > 10 ? 'var(--negative)' : 'var(--warning)',
            signal: highRiskCount > 10 ? 'negative' : 'warning',
            context: 'Flagged by OfS or HEStats model',
          },
          {
            label: 'AAA / AA rated',
            value: aaaCount.toString(),
            sub: `${((aaaCount / healthScores.length) * 100).toFixed(0)}% of sector`,
            color: 'var(--positive)',
            signal: 'positive',
            context: 'Exceptional or very strong financial health',
          },
          {
            label: 'B / CCC rated',
            value: cccCount.toString(),
            sub: `${((cccCount / healthScores.length) * 100).toFixed(0)}% of sector`,
            color: 'var(--negative)',
            signal: 'negative',
            context: 'Weak or financially stressed institutions',
          },
          {
            label: 'Avg health score',
            value: `${sectorHealthScore}/100`,
            sub: `${scoreToGrade(sectorHealthScore)} — sector average`,
            color: getGradeColor(scoreToGrade(sectorHealthScore)),
            signal: sectorHealthScore >= 60 ? 'positive' : 'warning',
            context: 'HEStats composite across 6 dimensions',
          },
          {
            label: 'OfS monitoring',
            value: '40+',
            sub: 'enhanced financial monitoring',
            color: 'var(--negative)',
            signal: 'negative',
            context: 'Providers under OfS enhanced oversight (Jun 2025)',
          },
        ]

        return (
          <div className="mb-2.5">
            <div className="flex items-center gap-3 mb-1.5">
              <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Current Era · UK Higher Education 2024–25
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              <Link to="/sector" style={{ color: 'var(--link)', fontSize: 10, letterSpacing: '0.04em' }}>Full sector view →</Link>
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 border-l border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              {ERA_INDICATORS.map((ind) => (
                <div
                  key={ind.label}
                  className="px-3 py-2.5 border-r border-b group relative"
                  style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                >
                  {/* signal bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      backgroundColor:
                        ind.signal === 'positive' ? 'var(--positive)'
                        : ind.signal === 'negative' ? 'var(--negative)'
                        : ind.signal === 'warning' ? 'var(--warning)'
                        : 'transparent',
                      opacity: 0.5,
                    }}
                  />
                  <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                    {ind.label}
                  </p>
                  <p className="font-num tabular-nums" style={{ color: ind.color, fontSize: 18, fontWeight: 700, lineHeight: 1.05, marginBottom: 2 }}>
                    {ind.value}
                  </p>
                  <p style={{ color: 'var(--text-2)', fontSize: 10, lineHeight: 1.3 }}>{ind.sub}</p>
                  {/* tooltip on hover */}
                  <div
                    className="absolute bottom-full left-0 mb-1 px-2 py-1 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundColor: 'var(--panel)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 3,
                      fontSize: 10,
                      color: 'var(--text-2)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    {ind.context}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── National Student Debt ────────────────────────────────────────────── */}
      {(() => {
        const DEBT_INDICATORS = [
          {
            label: 'Total student loan book',
            value: '£236bn',
            sub: 'SLC outstanding balance 2024',
            color: 'var(--negative)',
            signal: 'negative',
            note: 'Surpassed £200bn in 2022. Growing ~£20bn per year.',
          },
          {
            label: 'Avg graduate debt (England)',
            value: '~£45k',
            sub: 'Post-2012 Plan 2 graduates',
            color: 'var(--negative)',
            signal: 'negative',
            note: 'Up from ~£26k in 2016. Scottish graduates: £0 for Scottish unis.',
          },
          {
            label: 'Annual new borrowing',
            value: '~£20bn',
            sub: 'new loans issued per year',
            color: 'var(--warning)',
            signal: 'warning',
            note: 'Tuition + maintenance loans combined. Growing as maintenance rises.',
          },
          {
            label: 'Expected repayment rate',
            value: '~25%',
            sub: 'of new loans (Plan 2)',
            color: 'var(--warning)',
            signal: 'warning',
            note: 'OBR estimate: ~75% written off after 30 years under Plan 2.',
          },
          {
            label: 'Repayment threshold',
            value: '£25k',
            sub: 'Plan 2 & Plan 5',
            color: 'var(--text)',
            signal: 'neutral',
            note: 'Plan 5 (from 2023): 40-year term, frozen threshold until 2025.',
          },
          {
            label: 'Max tuition fee (England)',
            value: '£9,535',
            sub: 'FY2025-26 · up from £9,250',
            color: 'var(--warning)',
            signal: 'warning',
            note: 'First increase since 2017. RPI-linked future rises expected.',
          },
          {
            label: 'Interest rate (Plan 2)',
            value: 'RPI+3%',
            sub: 'while studying / high earners',
            color: 'var(--negative)',
            signal: 'negative',
            note: 'Capped to protect borrowers when commercial rates rise sharply.',
          },
          {
            label: 'Scottish graduate debt',
            value: '£0',
            sub: 'for Scottish-domiciled students',
            color: 'var(--positive)',
            signal: 'positive',
            note: 'Scottish Government funds SAAS grants. For Scottish universities only.',
          },
          {
            label: 'Maintenance loan max',
            value: '£13,348',
            sub: 'London / away from home 2025-26',
            color: 'var(--text)',
            signal: 'neutral',
            note: 'Means-tested. Below 2022 inflation peak in real terms for many.',
          },
          {
            label: 'Graduate premium',
            value: '+£100k',
            sub: 'lifetime earnings uplift (median)',
            color: 'var(--positive)',
            signal: 'positive',
            note: 'IFS estimate vs non-graduates. Varies hugely by subject and institution.',
          },
          {
            label: 'NHS & teaching bursaries',
            value: 'Up to £10k',
            sub: 'non-repayable in shortage subjects',
            color: 'var(--positive)',
            signal: 'positive',
            note: 'Targeted grants to address workforce gaps in health and education.',
          },
          {
            label: 'Fiscal cost of HE loans',
            value: '~£10bn/yr',
            sub: 'RAB charge to government',
            color: 'var(--warning)',
            signal: 'warning',
            note: 'Resource Accounting & Budgeting charge — the expected write-off cost.',
          },
        ]

        return (
          <div className="mb-2.5">
            <div className="flex items-center gap-3 mb-1.5">
              <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                National Student Debt & Finance · England / UK 2025
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              <a
                href="https://www.gov.uk/government/collections/student-loans-in-england"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--link)', fontSize: 10, letterSpacing: '0.04em' }}
              >
                Source: SLC / DfE →
              </a>
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 border-l border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              {DEBT_INDICATORS.map((ind) => (
                <div
                  key={ind.label}
                  className="px-3 py-2.5 border-r border-b group relative"
                  style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      backgroundColor:
                        ind.signal === 'positive' ? 'var(--positive)'
                        : ind.signal === 'negative' ? 'var(--negative)'
                        : ind.signal === 'warning' ? 'var(--warning)'
                        : 'transparent',
                      opacity: 0.5,
                    }}
                  />
                  <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                    {ind.label}
                  </p>
                  <p className="font-num tabular-nums" style={{ color: ind.color, fontSize: 18, fontWeight: 700, lineHeight: 1.05, marginBottom: 2 }}>
                    {ind.value}
                  </p>
                  <p style={{ color: 'var(--text-2)', fontSize: 10, lineHeight: 1.3 }}>{ind.sub}</p>
                  <div
                    className="absolute bottom-full left-0 mb-1 px-2 py-1.5 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundColor: 'var(--panel)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 3,
                      fontSize: 10,
                      color: 'var(--text-2)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                      maxWidth: 260,
                      whiteSpace: 'normal' as const,
                    }}
                  >
                    {ind.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Observatory Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 mb-2.5">
        {OBSERVATORY_FEED.map((alert, i) => {
          const color = alert.level === 'warning' ? 'var(--warning)' : alert.level === 'positive' ? 'var(--positive)' : alert.level === 'negative' ? 'var(--negative)' : 'var(--link)'
          return (
            <Link
              key={i}
              to={alert.href}
              className="flex flex-col gap-1.5 px-3 py-2.5 border transition-colors"
              style={{
                backgroundColor: 'var(--panel)',
                borderColor: 'var(--border)',
                borderRadius: 3,
                borderLeft: `3px solid ${color}`,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel)')}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color }} />
                <p style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600, lineHeight: 1.3 }}>{alert.title}</p>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 11, lineHeight: 1.45 }}>{alert.text}</p>
              <div className="flex items-center justify-between">
                <span className="font-num" style={{ color: 'var(--muted)', fontSize: 9.5 }}>{alert.date}</span>
                <span style={{ color: color, fontSize: 9.5, letterSpacing: '0.04em' }}>→ View in Sector</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* KPI grid — every cell is a link */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 border-l border-t mb-2.5"
        style={{ borderColor: 'var(--border)' }}
      >
        {kpis.map((k) => {
          const positive = (k as any).inverse ? k.change < 0 : k.change > 0
          const changeColor = k.change === 0 ? 'var(--muted)' : positive ? 'var(--positive)' : 'var(--negative)'
          return (
            <Link
              to={k.href}
              key={k.label}
              className="px-3 py-2.5 border-r border-b block group"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel)')}
            >
              <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                {k.label}
              </p>
              <div className="flex items-baseline justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-num tabular-nums" style={{ color: 'var(--text)', fontSize: 17, fontWeight: 600, lineHeight: 1.1 }}>
                    {k.value}
                  </span>
                  {(k as any).gradeValue && (
                    <HealthBadge score={sectorHealthScore} grade={(k as any).gradeValue} size="sm" />
                  )}
                </div>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" style={{ color: 'var(--text-2)' }} />
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span
                    className="tabular-nums flex items-center gap-0.5"
                    style={{ color: changeColor, fontSize: 10, fontWeight: 500 }}
                  >
                    {k.change !== 0 && (k.change > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />)}
                    {k.change === 0 ? '—' : `${k.change > 0 ? '+' : ''}${k.change.toFixed((k as any).isPct ? 2 : 1)}${(k as any).isPct ? 'pp' : '%'}`}
                    <span style={{ color: 'var(--muted)', fontSize: 9, fontWeight: 400, marginLeft: 1 }}>YoY</span>
                  </span>
                  {k.cagrVal !== null && (
                    <span className="tabular-nums" style={{ color: 'var(--muted)', fontSize: 9 }}>
                      {k.cagrVal >= 0 ? '+' : ''}{k.cagrVal.toFixed(1)}% CAGR
                    </span>
                  )}
                </div>
                <Sparkline values={k.spark} width={48} height={15} color={positive ? '#5fa97b' : '#cf6660'} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick search */}
      <div
        className="mb-2.5 border"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <form onSubmit={onSearchSubmit} className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find an institution by name, city, or UKPRN…"
            className="w-full px-4 py-2.5 bg-transparent outline-none"
            style={{ color: 'var(--text)', fontSize: 13 }}
            autoComplete="off"
          />
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 2,
              fontSize: 10,
              color: 'var(--muted)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ENTER ↵
          </div>
        </form>
        {filteredSuggestions.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {filteredSuggestions.map((s) => (
              <Link
                key={s.id}
                to={`/universities/${s.id}`}
                className="flex items-center gap-3 px-4 py-2 transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <NationBadge nation={s.nation} size="sm" />
                <span style={{ color: 'var(--text)', fontSize: 12.5 }}>{s.canonical_name}</span>
                <span className="ml-auto font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>{s.ukprn}</span>
                <ArrowUpRight className="w-3 h-3" style={{ color: 'var(--muted)' }} />
              </Link>
            ))}
          </div>
        )}
        {!search && (
          <div style={{ borderTop: '1px solid var(--border)' }} className="px-4 py-2 flex flex-wrap items-center gap-2">
            <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quick access</span>
            {['oxford', 'cambridge', 'imperial', 'ucl', 'edinburgh', 'lse', 'manchester', 'bristol'].map((id) => {
              const inst = institutions.find((x) => x.id === id)
              if (!inst) return null
              return (
                <Link
                  key={id}
                  to={`/universities/${id}`}
                  className="px-2 py-0.5 transition-colors"
                  style={{ border: '1px solid var(--border)', borderRadius: 2, fontSize: 11, color: 'var(--text-2)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
                >
                  {inst.short_name}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Analytics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 mb-2.5">
        <Panel title="Sector Income & Surplus" subtitle={`${sortedYears[0]}–${sortedYears[sortedYears.length - 1]} (£m)`}>
          <MetricTrendChart
            financials={sectorTrendFinancials}
            metrics={[
              { key: 'revenue_gbp_m', label: 'Total Income', color: '#7396c2', unit: '£m' },
              { key: 'research_income_gbp_m', label: 'Research', color: '#5fa97b', unit: '£m' },
              { key: 'surplus_gbp_m', label: 'Surplus', color: '#c2945a', unit: '£m' },
            ]}
            height={205}
          />
        </Panel>
        <Panel title="Income Composition" subtitle="Tuition · Research · Other (£m)">
          <IncomeBreakdownChart financials={sectorTrendFinancials} height={205} />
        </Panel>
        <Panel title="Capital & Borrowing" subtitle="Cash, borrowing, capex (£m)">
          <MetricTrendChart
            financials={sectorTrendFinancials}
            metrics={[
              { key: 'cash_gbp_m', label: 'Cash', color: '#5fa97b', unit: '£m' },
              { key: 'borrowing_gbp_m', label: 'Borrowing', color: '#cf6660', unit: '£m' },
              { key: 'capital_expenditure_gbp_m', label: 'CapEx', color: '#7396c2', unit: '£m' },
            ]}
            height={205}
          />
        </Panel>
      </div>

      {/* League table + Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <div className="lg:col-span-2">
          <Panel
            title="Top Institutions by Income"
            subtitle={`FY${latestYear} · ranked by total income`}
            action={
              <Link to="/rankings" className="flex items-center gap-1" style={{ color: 'var(--link)', fontSize: 11 }}>
                Full league table <ArrowUpRight className="w-3 h-3" />
              </Link>
            }
            padded={false}
          >
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 380 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
                    <th className="px-2 sm:px-3 py-2 text-left" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, width: 28 }}>#</th>
                    <th className="px-2 sm:px-3 py-2 text-left" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Institution</th>
                    <th className="px-2 sm:px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Income</th>
                    <th className="px-2 sm:px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Margin</th>
                    <th className="hidden md:table-cell px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Research</th>
                    <th className="hidden lg:table-cell px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Cash</th>
                    <th className="hidden lg:table-cell px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Borrowing</th>
                    <th className="hidden xl:table-cell px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Students</th>
                    <th className="px-2 sm:px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Health</th>
                    <th className="hidden sm:table-cell px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedByRevenue.map(({ inst, fin }, idx) => {
                    const history = getFinancialsByInstitution(inst.id).sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year))
                    const revSpark = history.map((h) => h.revenue_gbp_m)
                    const isPositive = fin.surplus_margin_pct >= 0
                    return (
                      <tr
                        key={inst.id}
                        className="transition-colors group"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td className="px-2 sm:px-3 py-2 font-num tabular-nums" style={{ color: 'var(--muted)', fontSize: 11, width: 28 }}>
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          <Link to={`/universities/${inst.id}`} className="flex items-center gap-1.5 min-w-0">
                            <NationBadge nation={inst.nation} size="sm" />
                            <span className="truncate group-hover:underline" style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 500 }}>
                              {inst.canonical_name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Sparkline values={revSpark} width={28} height={10} color="#7396c2" />
                            <span className="tabular-nums" style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 500 }}>
                              £{fin.revenue_gbp_m.toLocaleString()}m
                            </span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 tabular-nums text-right" style={{ color: isPositive ? 'var(--positive)' : 'var(--negative)', fontSize: 11.5 }}>
                          {isPositive ? '+' : ''}{fin.surplus_margin_pct.toFixed(1)}%
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>
                          £{fin.research_income_gbp_m}m
                        </td>
                        <td className="hidden lg:table-cell px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>
                          £{fin.cash_gbp_m}m
                        </td>
                        <td className="hidden lg:table-cell px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>
                          £{fin.borrowing_gbp_m}m
                        </td>
                        <td className="hidden xl:table-cell px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>
                          {(fin.student_fte_total / 1000).toFixed(1)}k
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right">
                          {(() => {
                            const h = computeHealthScore(fin)
                            return <HealthBadge score={h.score} grade={h.grade} size="sm" />
                          })()}
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2 text-right">
                          <RiskBadge risk={fin.risk_flag} size="sm" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title="Recent Reports" subtitle="Latest published annual statements" padded={false}>
          <div>
            {recentReports.map(({ f, inst }) => (
              <a
                key={`${inst?.id}-${f.fiscal_year}`}
                href={f.source_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 px-3 py-2.5 transition-colors group"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="truncate group-hover:underline" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>
                    {inst?.canonical_name ?? 'Unknown'}
                  </p>
                  <p className="font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>
                    FY{f.fiscal_year} · published {f.published}
                  </p>
                </div>
                <ArrowUpRight className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: 'var(--muted)' }} />
              </a>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Career Intelligence indicators ───────────────────────────────────── */}
      {(() => {
        const sectorOut = getSectorOutcomes()
        const degStats = getSectorDegreeStats()
        const mostAIResilient = DEGREES.reduce((a, b) => a.ai_resilience_score > b.ai_resilience_score ? a : b)
        const highestPaid = DEGREES.reduce((a, b) => a.avg_salary_k > b.avg_salary_k ? a : b)
        const fastestToJob = DEGREES.reduce((a, b) => a.avg_months_to_job < b.avg_months_to_job ? a : b)
        const totalEmployerIntake = EMPLOYERS.reduce((s, e) => s + e.annual_graduate_intake, 0)

        const CAREER_INDICATORS = [
          { label: 'Sector employment rate', value: `${sectorOut.avg_employment_rate}%`, sub: '15 months post-graduation', color: 'var(--positive)', signal: 'positive', context: 'HESA Graduate Outcomes Survey, sector average' },
          { label: 'Avg graduate salary', value: `£${sectorOut.avg_salary_k}k`, sub: 'sector average, all subjects', color: 'var(--text)', signal: 'neutral', context: '15 months after graduation, median across institutions' },
          { label: 'Graduate-level roles', value: `${sectorOut.avg_graduate_role_pct}%`, sub: 'of employed graduates', color: 'var(--positive)', signal: 'positive', context: 'Graduates employed in professional or managerial roles' },
          { label: 'Highest paid degree', value: `£${highestPaid.avg_salary_k}k`, sub: highestPaid.name, color: 'var(--positive)', signal: 'positive', context: `${highestPaid.emoji} ${highestPaid.name} — average graduate salary 15 months post-graduation` },
          { label: 'Most AI resilient', value: `${mostAIResilient.ai_resilience_score}/100`, sub: mostAIResilient.name, color: 'var(--positive)', signal: 'positive', context: `${mostAIResilient.emoji} ${mostAIResilient.name} — AI resilience score (HEStats model)` },
          { label: 'Fastest to employment', value: `${fastestToJob.avg_months_to_job} months`, sub: fastestToJob.name, color: 'var(--link)', signal: 'positive', context: `${fastestToJob.emoji} ${fastestToJob.name} — average time to first graduate job` },
          { label: 'Major employer intake', value: totalEmployerIntake.toLocaleString(), sub: `${EMPLOYERS.length} tracked employers`, color: 'var(--text)', signal: 'neutral', context: 'Combined annual graduate intake across 26 major UK employers' },
          { label: 'Avg AI automation risk', value: `${degStats.avg_ai_risk}%`, sub: 'across all degree subjects', color: 'var(--warning)', signal: 'warning', context: 'Modelled estimate — McKinsey / Oxford Future of Work research. Not official statistics.' },
          { label: 'Further study rate', value: `${sectorOut.avg_further_study_pct}%`, sub: 'proceed to postgrad', color: 'var(--link)', signal: 'neutral', context: 'Graduates progressing to Master\'s or PhD study within 3 years' },
          { label: 'Avg time to job', value: `${sectorOut.avg_months_to_job} months`, sub: 'sector average', color: 'var(--text-2)', signal: 'neutral', context: 'Average months to secure first graduate-level employment' },
        ]

        return (
          <div className="mb-2.5">
            <div className="flex items-center gap-3 mb-1.5">
              <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Career Intelligence · Graduate Outcomes 2024–25
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              <Link to="/graduate-outcomes" style={{ color: 'var(--link)', fontSize: 10, letterSpacing: '0.04em' }}>Full outcomes data →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 border-l border-t" style={{ borderColor: 'var(--border)' }}>
              {CAREER_INDICATORS.map((ind) => (
                <div key={ind.label} className="px-3 py-2.5 border-r border-b group relative" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{
                    backgroundColor: ind.signal === 'positive' ? 'var(--positive)' : ind.signal === 'warning' ? 'var(--warning)' : 'transparent',
                    opacity: 0.5,
                  }} />
                  <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{ind.label}</p>
                  <p className="font-num tabular-nums" style={{ color: ind.color, fontSize: 16, fontWeight: 700, lineHeight: 1.05, marginBottom: 2 }}>{ind.value}</p>
                  <p style={{ color: 'var(--text-2)', fontSize: 10, lineHeight: 1.3 }}>{ind.sub}</p>
                  <div className="absolute bottom-full left-0 mb-1 px-2 py-1.5 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 3, fontSize: 10, color: 'var(--text-2)', boxShadow: '0 4px 12px rgba(0,0,0,0.35)', maxWidth: 220, whiteSpace: 'normal' as const }}>
                    {ind.context}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { label: 'Graduate Outcomes', href: '/graduate-outcomes' },
                { label: 'Employer Intelligence', href: '/employers' },
                { label: 'Degree Intelligence', href: '/degrees' },
                { label: 'Career Explorer', href: '/career-explorer' },
                { label: 'Student Journey', href: '/student-journey' },
              ].map(({ label, href }) => (
                <Link key={href} to={href} className="flex items-center gap-1 px-2.5 py-1 hover:underline"
                  style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)', fontSize: 11, textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}>
                  {label} <ArrowUpRight className="w-3 h-3" />
                </Link>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Methodology footer */}
      <div
        className="mt-2.5 px-3 py-2 border flex flex-wrap items-center gap-x-6 gap-y-1"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Methodology</span>
        <span style={{ color: 'var(--text-2)', fontSize: 11 }}>
          Metrics normalised to OfS AFR concept families. Sourced from audited institutional accounts and HESA open data.
        </span>
        <Link to="/about" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
          Full methodology <ArrowUpRight className="w-3 h-3" />
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span style={{ color: 'var(--muted)', fontSize: 10 }}>Free & open-source —</span>
          <a
            href={SUPPORT_LINKS.kofi}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline"
            style={{ color: 'var(--negative)', fontSize: 11, fontWeight: 500 }}
          >
            <Coffee className="w-3 h-3" /> Support HEStats
          </a>
        </div>
      </div>
    </div>
  )
}
