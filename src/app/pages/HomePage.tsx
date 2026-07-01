import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { TrendingUp, TrendingDown, ArrowUpRight, FileText, ChevronRight, Activity, AlertCircle, Heart, Coffee } from 'lucide-react'
import { institutions } from '../data/institutions'
import { compareNullableDesc, financials, formatCurrencyM, formatNumber, formatPct, getAllLatestFinancials, getFinancialsByInstitution, AVAILABLE_YEARS, isAggregateEligible, isKnownNumber } from '../data/financials'
import { getStudentCoverage } from '../data/students'
import { getLatestIntelligence } from '../data/intelligence'
import { getSectorAverageScore, getAllHealthScores, scoreToGrade, computeHealthScore, getGradeColor } from '../data/health'
import { SUPPORT_LINKS } from '../data/links'
import { Sparkline } from '../components/charts/Sparkline'
import { RiskBadge } from '../components/institutions/RiskBadge'
import { NationBadge } from '../components/institutions/NationBadge'
import { HealthBadge } from '../components/institutions/HealthBadge'
import { MetricTrendChart } from '../components/charts/MetricTrendChart'
import { IncomeBreakdownChart } from '../components/charts/IncomeBreakdownChart'
import { Panel } from '../components/layout/Panel'
import { WorkspaceSection } from '../components/layout/WorkspaceSection'
import { IntelligenceCardList } from '../components/intelligence/IntelligenceCardList'

function aggregateByYear() {
  const byYear = new Map<string, { revenue: number; surplus: number; research: number; staff: number; cash: number; borrowing: number; capex: number; intl: number; intlCount: number; students: number; studentsCount: number; tuition: number; other: number; net_assets: number; count: number }>()
  for (const f of financials) {
    const e = byYear.get(f.fiscal_year) ?? { revenue: 0, surplus: 0, research: 0, staff: 0, cash: 0, borrowing: 0, capex: 0, intl: 0, intlCount: 0, students: 0, studentsCount: 0, tuition: 0, other: 0, net_assets: 0, count: 0 }
    if (isKnownNumber(f.revenue_gbp_m)) e.revenue += f.revenue_gbp_m
    if (isKnownNumber(f.surplus_gbp_m)) e.surplus += f.surplus_gbp_m
    if (isKnownNumber(f.research_income_gbp_m)) e.research += f.research_income_gbp_m
    if (isKnownNumber(f.staff_costs_gbp_m)) e.staff += f.staff_costs_gbp_m
    if (isKnownNumber(f.cash_gbp_m)) e.cash += f.cash_gbp_m
    if (isKnownNumber(f.borrowing_gbp_m)) e.borrowing += f.borrowing_gbp_m
    if (isKnownNumber(f.capital_expenditure_gbp_m)) e.capex += f.capital_expenditure_gbp_m
    if (isKnownNumber(f.international_fte_pct)) {
      e.intl += f.international_fte_pct
      e.intlCount += 1
    }
    if (isKnownNumber(f.student_fte_total)) {
      e.students += f.student_fte_total
      e.studentsCount += 1
    }
    if (isKnownNumber(f.tuition_fee_income_gbp_m)) e.tuition += f.tuition_fee_income_gbp_m
    if (isKnownNumber(f.other_income_gbp_m)) e.other += f.other_income_gbp_m
    if (isKnownNumber(f.net_assets_gbp_m)) e.net_assets += f.net_assets_gbp_m
    if (isAggregateEligible(f)) e.count += 1
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
  const pendingCount = [...latestByInst.values()].filter((f) => f.data_source === 'pending').length

  const sectorHealthScore = getSectorAverageScore()
  const healthScores = getAllHealthScores()
  const distressCount = healthScores.filter((h) => isKnownNumber(h.score) && h.score < 45).length
  const studentCoverage = getStudentCoverage()
  const latestIntlAvg = latest.intlCount ? latest.intl / latest.intlCount : null
  const prevIntlAvg = prev.intlCount ? prev.intl / prev.intlCount : null
  const latestStudentTotal = latest.studentsCount ? latest.students : null
  const prevStudentTotal = prev.studentsCount ? prev.students : null
  const latestIntelligence = getLatestIntelligence(3)
  const careerIntelligence = latestIntelligence.filter((row) => ['graduate-outcomes', 'labour-market', 'ai-exposure', 'policy'].includes(row.category))

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
      value: isKnownNumber(latestIntlAvg) ? `${latestIntlAvg.toFixed(1)}%` : 'Pending',
      change: isKnownNumber(latestIntlAvg) && isKnownNumber(prevIntlAvg) ? latestIntlAvg - prevIntlAvg : 0,
      cagrVal: null as null | number,
      isPct: true,
      spark: sortedYears.map((y) => { const e = byYear.get(y)!; return e.intlCount ? e.intl / e.intlCount : null }),
      href: '/rankings?sort=international',
    },
    {
      label: 'Student FTE',
      value: isKnownNumber(latestStudentTotal) ? latestStudentTotal.toLocaleString() : 'Pending',
      change: isKnownNumber(latestStudentTotal) && isKnownNumber(prevStudentTotal) ? pctChange(latestStudentTotal, prevStudentTotal) : 0,
      cagrVal: isKnownNumber(latestStudentTotal) && first.studentsCount ? cagr(latestStudentTotal, first.students, numYears) : null as null | number,
      spark: sortedYears.map((y) => { const e = byYear.get(y)!; return e.studentsCount ? e.students : null }),
      href: '/open-data',
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

  const sectorTrendFinancials = sortedYears.flatMap((y) => {
    const e = byYear.get(y)!
    if (!e.count) return []
    return {
      institution_id: 'SECTOR',
      fiscal_year: y,
      published: '',
      revenue_gbp_m: e.revenue,
      surplus_gbp_m: e.surplus,
      surplus_margin_pct: e.revenue > 0 ? (e.surplus / e.revenue) * 100 : null,
      research_income_gbp_m: e.research,
      tuition_fee_income_gbp_m: e.tuition,
      other_income_gbp_m: e.other,
      staff_costs_gbp_m: e.staff,
      total_expenditure_gbp_m: null,
      cash_gbp_m: e.cash,
      borrowing_gbp_m: e.borrowing,
      liquidity_days: null,
      international_fte_pct: null,
      student_fte_total: e.students,
      capital_expenditure_gbp_m: e.capex,
      net_assets_gbp_m: e.net_assets,
      risk_flag: 'Pending' as const,
      status: 'found' as const,
      data_source: 'verified' as const,
      confidence: 'high' as const,
      included_in_aggregates: true,
    }
  })

  const rankedByRevenue = [...institutions]
    .map((i) => ({ inst: i, fin: latestByInst.get(i.id) }))
    .filter((x): x is { inst: typeof x.inst; fin: NonNullable<typeof x.fin> } => !!x.fin)
    .sort((a, b) => compareNullableDesc(a.fin.revenue_gbp_m, b.fin.revenue_gbp_m))
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
          <span className="font-num" style={{ color: 'var(--warning)' }}>{pendingCount}</span> pending
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
          Source <span className="font-num" style={{ color: 'var(--text)' }}>HESA Finance</span>
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
        const deficitInsts = allFins.filter((f) => isKnownNumber(f.surplus_gbp_m) && f.surplus_gbp_m < 0)
        const surplusInsts = allFins.filter((f) => isKnownNumber(f.surplus_gbp_m) && f.surplus_gbp_m >= 0)
        const totalIncome = latest.revenue
        const totalBorrowing = latest.borrowing
        const totalResearch = latest.research
        const avgStaffRatio = latest.revenue > 0 ? (latest.staff / latest.revenue) * 100 : 0
        const avgIntl = latest.intlCount ? latest.intl / latest.intlCount : null
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
            context: 'Count of latest verified finance rows with negative operating surplus',
          },
          {
            label: 'Aggregate sector income',
            value: fmtGBP(totalIncome),
            sub: incomeGrowth >= 0 ? `+${incomeGrowth.toFixed(1)}% YoY` : `${incomeGrowth.toFixed(1)}% YoY`,
            color: incomeGrowth >= 0 ? 'var(--positive)' : 'var(--negative)',
            signal: incomeGrowth >= 0 ? 'positive' : 'negative',
            context: `FY${latestYear} total across ${latest.count} verified provider rows`,
          },
          {
            label: 'Research income',
            value: fmtGBP(totalResearch),
            sub: researchGrowth >= 0 ? `+${researchGrowth.toFixed(1)}% YoY` : `${researchGrowth.toFixed(1)}% YoY`,
            color: researchGrowth >= 0 ? 'var(--positive)' : 'var(--warning)',
            signal: researchGrowth >= 0 ? 'positive' : 'warning',
            context: 'Research grants and contracts income from verified finance rows',
          },
          {
            label: 'Sector borrowing',
            value: fmtGBP(totalBorrowing),
            sub: borrowingGrowth >= 0 ? `+${borrowingGrowth.toFixed(1)}% YoY` : `${borrowingGrowth.toFixed(1)}% YoY`,
            color: borrowingGrowth > 5 ? 'var(--negative)' : 'var(--warning)',
            signal: 'warning',
            context: 'External borrowing from verified finance rows',
          },
          {
            label: 'Avg staff cost ratio',
            value: `${avgStaffRatio.toFixed(1)}%`,
            sub: 'Staff costs / total income',
            color: avgStaffRatio > 58 ? 'var(--negative)' : 'var(--positive)',
            signal: avgStaffRatio > 58 ? 'warning' : 'positive',
            context: 'Derived from latest verified staff costs and total income',
          },
          {
            label: 'Avg international %',
            value: isKnownNumber(avgIntl) ? `${avgIntl.toFixed(1)}%` : 'Pending',
            sub: 'Mean across reporting rows',
            color: 'var(--warning)',
            signal: 'warning',
            context: 'International FTE percentage where reported in verified finance rows',
          },
          {
            label: 'HESA enrolment rows',
            value: `${studentCoverage.verified}/${studentCoverage.total_institutions}`,
            sub: studentCoverage.verified ? `${studentCoverage.pending} pending` : 'Figure 7 source rows pending',
            color: 'var(--text)',
            signal: 'neutral',
            context: 'Provider-level HESA Student Statistics rows attached to the platform',
          },
          {
            label: 'AAA / AA rated',
            value: aaaCount.toString(),
            sub: `${((aaaCount / healthScores.length) * 100).toFixed(0)}% of sector`,
            color: 'var(--positive)',
            signal: 'positive',
            context: 'Derived HEStats financial health grade from verified finance rows',
          },
          {
            label: 'B / CCC rated',
            value: cccCount.toString(),
            sub: `${((cccCount / healthScores.length) * 100).toFixed(0)}% of sector`,
            color: 'var(--negative)',
            signal: 'negative',
            context: 'Derived HEStats financial health grade from verified finance rows',
          },
          {
            label: 'Avg health score',
            value: `${sectorHealthScore}/100`,
            sub: `${scoreToGrade(sectorHealthScore)} — sector average`,
            color: getGradeColor(scoreToGrade(sectorHealthScore)),
            signal: sectorHealthScore >= 60 ? 'positive' : 'warning',
            context: 'HEStats composite across 6 dimensions',
          },
        ]

        return (
          <div className="mb-2.5">
            <div className="flex items-center gap-3 mb-1.5">
              <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Verified finance indicators · UK higher education {latestYear}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2.5">
        <Panel title="National student finance" subtitle="Awaiting source-row ingestion">
          <div className="flex items-start gap-2 px-1 py-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
            <p style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.6 }}>
              SLC, DfE, OBR and IFS student-finance claims are withheld until each displayed statistic has source URL,
              table reference, retrieved date and last verified date.
            </p>
          </div>
        </Panel>
        <Panel title="Sector intelligence feed" subtitle="Latest source-backed records">
          <IntelligenceCardList records={latestIntelligence} compact />
        </Panel>
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
                    const isPositive = isKnownNumber(fin.surplus_margin_pct) && fin.surplus_margin_pct >= 0
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
                              {formatCurrencyM(fin.revenue_gbp_m)}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 tabular-nums text-right" style={{ color: isPositive ? 'var(--positive)' : 'var(--negative)', fontSize: 11.5 }}>
                          {formatPct(fin.surplus_margin_pct)}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>
                          {formatCurrencyM(fin.research_income_gbp_m)}
                        </td>
                        <td className="hidden lg:table-cell px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>
                          {formatCurrencyM(fin.cash_gbp_m)}
                        </td>
                        <td className="hidden lg:table-cell px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>
                          {formatCurrencyM(fin.borrowing_gbp_m)}
                        </td>
                        <td className="hidden xl:table-cell px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>
                          {isKnownNumber(fin.student_fte_total) ? `${(fin.student_fte_total / 1000).toFixed(1)}k` : 'Pending'}
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

      {/* Career intelligence status */}
      <div className="mb-2.5 border px-3 py-3" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Career Intelligence</span>
          <span style={{ color: 'var(--positive)', fontSize: 11 }}>{careerIntelligence.length} sourced records attached</span>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.6, marginBottom: 10 }}>
          Graduate outcomes, labour-market and AI exposure records now display only when each claim has source provenance and verification metadata. External analysis is labelled separately from official statistics.
        </p>
        <div className="mb-3">
          <IntelligenceCardList records={careerIntelligence} compact />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Graduate Outcomes', href: '/graduate-outcomes' },
            { label: 'Employer Intelligence', href: '/employers' },
            { label: 'Degree Intelligence', href: '/degrees' },
            { label: 'Career Explorer', href: '/career-explorer' },
            { label: 'Student Journey', href: '/student-journey' },
          ].map(({ label, href }) => (
            <Link key={href} to={href} className="flex items-center gap-1 px-2.5 py-1 hover:underline"
              style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)', fontSize: 11, textDecoration: 'none' }}>
              {label} <ArrowUpRight className="w-3 h-3" />
            </Link>
          ))}
        </div>
      </div>

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
