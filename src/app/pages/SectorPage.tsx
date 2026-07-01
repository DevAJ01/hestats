import { Link } from 'react-router'
import { AlertCircle, TrendingUp, TrendingDown, ArrowUpRight, Activity } from 'lucide-react'
import { institutions } from '../data/institutions'
import { compareNullableDesc, formatCurrencyM, getAllLatestFinancials, getFinancialsByInstitution, AVAILABLE_YEARS, isKnownNumber, ratioPct } from '../data/financials'
import { computeHealthScore, getGradeColor, getSectorAverageScore, scoreToGrade, getAllHealthScores } from '../data/health'
import { NationBadge } from '../components/institutions/NationBadge'
import { HealthBadge } from '../components/institutions/HealthBadge'
import { RiskBadge } from '../components/institutions/RiskBadge'
import { Panel } from '../components/layout/Panel'
import { Sparkline } from '../components/charts/Sparkline'

const ALERTS = [
  { level: 'high', title: 'OfS Financial Sustainability Review', body: '40+ providers identified as requiring enhanced monitoring. Borrowing-to-income ratios above 100% in 12 institutions.', date: 'Jun 2025' },
  { level: 'medium', title: 'Sector Borrowing Hits Record £12.3bn', body: 'Aggregate external borrowing increased 8.2% YoY. Fixed-rate bond exposure is £7.1bn (58% of total).', date: 'May 2025' },
  { level: 'low', title: 'Research Income Growth: +6.1% Sector-Wide', body: 'Strongest growth in London cluster universities. UKRI funding uplift driving results at research-intensive providers.', date: 'Apr 2025' },
  { level: 'medium', title: 'International Student Enrolment Softening', body: 'Post-graduate taught international applications down 14% sector-wide. Revenue impact expected in 2025-26 accounts.', date: 'Mar 2025' },
]

const MISSION_GROUPS = [
  { name: 'Russell Group', ids: ['oxford', 'cambridge', 'imperial', 'ucl', 'lse', 'edinburgh', 'manchester', 'bristol', 'warwick', 'durham', 'exeter', 'cardiff', 'qub'] },
  { name: 'Alliance', ids: ['bath', 'brighton', 'brunel', 'city', 'coventry', 'shu', 'ljmu', 'northumbria', 'portsmouth', 'uwe'] },
  { name: 'Million+', ids: ['anglia', 'beds', 'bcu', 'uel', 'londonmet', 'lsbu', 'sunderland', 'northampton', 'staffs', 'wlv', 'worc'] },
  { name: 'GuildHE', ids: ['ual', 'falmouth'] },
]

function alertColor(level: string) {
  if (level === 'high') return 'var(--negative)'
  if (level === 'medium') return 'var(--warning)'
  return 'var(--positive)'
}

export function SectorPage() {
  const latestFins = getAllLatestFinancials()
  const finMap = new Map(latestFins.map((f) => [f.institution_id, f]))
  const healthScores = getAllHealthScores()
  const healthMap = new Map(healthScores.map((h) => [h.institution_id, h]))

  const sectorAvgScore = getSectorAverageScore()
  const latestYear = AVAILABLE_YEARS[0]

  // Health score distribution (bins of 10)
  const bins = Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}–${i * 10 + 9}`, min: i * 10, max: i * 10 + 10, count: 0 }))
  bins[bins.length - 1].max = 101
  bins[bins.length - 1].label = '90–100'
  healthScores.forEach(({ score }) => {
    if (!isKnownNumber(score)) return
    const bin = bins.find((b) => score >= b.min && score < b.max)
    if (bin) bin.count++
  })
  const maxBinCount = Math.max(...bins.map((b) => b.count))

  // Distress count (score < 45 = BB or worse)
  const distressCount = healthScores.filter((h) => isKnownNumber(h.score) && h.score < 45).length

  // Top 10 by borrowing ratio
  const byBorrowingRatio = latestFins
    .map((f) => {
      const inst = institutions.find((i) => i.id === f.institution_id)
      const ratioPctValue = ratioPct(f.borrowing_gbp_m, f.revenue_gbp_m, 4)
      const ratio = isKnownNumber(ratioPctValue) ? ratioPctValue / 100 : null
      return { f, inst, ratio }
    })
    .filter((x): x is { f: typeof latestFins[number]; inst: typeof institutions[number]; ratio: number } => Boolean(x.inst && isKnownNumber(x.ratio) && x.ratio > 0))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 10)
  const maxBorrowRatio = Math.max(...byBorrowingRatio.map((x) => x.ratio))

  // Top 10 by research income
  const byResearch = latestFins
    .map((f) => {
      const inst = institutions.find((i) => i.id === f.institution_id)
      const prev = getFinancialsByInstitution(f.institution_id).find((p) => p.fiscal_year === AVAILABLE_YEARS[1])
      const yoy = prev && isKnownNumber(f.research_income_gbp_m) && isKnownNumber(prev.research_income_gbp_m) && prev.research_income_gbp_m !== 0
        ? ((f.research_income_gbp_m - prev.research_income_gbp_m) / Math.abs(prev.research_income_gbp_m)) * 100
        : null
      return { f, inst, yoy }
    })
    .filter((x): x is { f: typeof latestFins[number]; inst: typeof institutions[number]; yoy: number | null } => Boolean(x.inst && isKnownNumber(x.f.research_income_gbp_m)))
    .sort((a, b) => compareNullableDesc(a.f.research_income_gbp_m, b.f.research_income_gbp_m))
    .slice(0, 10)
  const maxResearch = Math.max(...byResearch.map((x) => x.f.research_income_gbp_m).filter(isKnownNumber), 1)

  // Institutions in focus
  const sortedByScore = healthScores
    .map((h) => {
      const inst = institutions.find((i) => i.id === h.institution_id)
      const fin = finMap.get(h.institution_id)
      return { ...h, inst, fin }
    })
    .filter((x) => x.inst && x.fin && isKnownNumber(x.score))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const focusInstitutions = [
    sortedByScore[0],
    sortedByScore[1],
    sortedByScore[2],
    sortedByScore[sortedByScore.length - 1],
    sortedByScore[sortedByScore.length - 2],
    sortedByScore[Math.floor(sortedByScore.length / 2)],
  ].filter(Boolean)

  // Mission group aggregates
  const missionGroupData = MISSION_GROUPS.map((g) => {
    const groupFins = g.ids.map((id) => finMap.get(id)).filter(Boolean)
    if (!groupFins.length) return { name: g.name, avgScore: 0, totalIncome: 0, count: 0 }
    const scores = g.ids.map((id) => healthMap.get(id)?.score).filter(isKnownNumber)
    return {
      name: g.name,
      avgScore: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
      totalIncome: groupFins.reduce((s, f) => s + (f && isKnownNumber(f.revenue_gbp_m) ? f.revenue_gbp_m : 0), 0),
      count: groupFins.length,
    }
  })
  const maxGroupIncome = Math.max(...missionGroupData.map((g) => g.totalIncome))

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Activity className="w-3 h-3" style={{ color: 'var(--positive)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>SECTOR OBSERVATORY</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          FY <span className="font-num" style={{ color: 'var(--text)' }}>{latestYear}</span>
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          Avg health score <span className="font-num" style={{ color: getGradeColor(scoreToGrade(sectorAvgScore)) }}>{sectorAvgScore}/100</span>
          {' '}(<span style={{ color: getGradeColor(scoreToGrade(sectorAvgScore)) }}>{scoreToGrade(sectorAvgScore)}</span>)
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--negative)' }}>{distressCount}</span> providers in financial stress
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{healthScores.length}</span> institutions indexed
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--positive)' }} />
          <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em' }}>LIVE DATA</span>
        </div>
      </div>

      {/* Sector Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        {ALERTS.map((alert, i) => (
          <div
            key={i}
            className="px-3 py-2.5 border flex flex-col gap-1.5"
            style={{
              backgroundColor: 'var(--panel)',
              borderColor: 'var(--border)',
              borderRadius: 3,
              borderLeft: `3px solid ${alertColor(alert.level)}`,
            }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: alertColor(alert.level) }} />
              <p style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600, lineHeight: 1.3 }}>{alert.title}</p>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 11, lineHeight: 1.5 }}>{alert.body}</p>
            <p className="font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>{alert.date}</p>
          </div>
        ))}
      </div>

      {/* Health Distribution + Mission Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Health Score Distribution */}
        <Panel title="Financial Health Distribution" subtitle={`${healthScores.length} institutions · FY${latestYear}`}>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {bins.map((bin, i) => {
              const pct = maxBinCount > 0 ? (bin.count / maxBinCount) * 100 : 0
              const score = bin.min + 5
              const color = getGradeColor(scoreToGrade(score))
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <span style={{ color: 'var(--muted)', fontSize: 9 }}>{bin.count > 0 ? bin.count : ''}</span>
                  <div style={{ height: 90, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <div
                      style={{
                        height: `${Math.max(pct, 2)}%`,
                        width: '100%',
                        backgroundColor: color,
                        opacity: 0.7,
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ color: 'var(--muted)', fontSize: 8, textAlign: 'center', lineHeight: 1.2 }}>
                    {bin.min}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-2">
            {[['AAA/AA', 'var(--positive)', '≥75'], ['A/BBB', 'var(--warning)', '45–74'], ['BB/B/CCC', 'var(--negative)', '<45']].map(([label, color, range]) => (
              <span key={label} className="flex items-center gap-1.5" style={{ fontSize: 10, color: 'var(--text-2)' }}>
                <span style={{ width: 8, height: 8, backgroundColor: color, borderRadius: 1, display: 'inline-block' }} />
                {label} <span style={{ color: 'var(--muted)' }}>({range})</span>
              </span>
            ))}
          </div>
        </Panel>

        {/* Mission Group Breakdown */}
        <Panel title="Mission Group Overview" subtitle="Avg health score and total income by group">
          <div className="space-y-3">
            {missionGroupData.map((g) => (
              <div key={g.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{g.name}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 10 }}>{g.count} inst.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HealthBadge score={g.avgScore} grade={scoreToGrade(g.avgScore)} size="sm" showScore />
                    <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 11 }}>
                      £{g.totalIncome >= 1000 ? `${(g.totalIncome / 1000).toFixed(1)}bn` : `${Math.round(g.totalIncome)}m`}
                    </span>
                  </div>
                </div>
                <div className="h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${maxGroupIncome > 0 ? (g.totalIncome / maxGroupIncome) * 100 : 0}%`,
                      backgroundColor: 'var(--accent)',
                      borderRadius: 1,
                      opacity: 0.75,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Borrowing Analysis + Research Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Borrowing Analysis */}
        <Panel
          title="Highest Borrowing Burden"
          subtitle="Borrowing as % of total income · FY2024-25"
          action={
            <Link to="/rankings?sort=borrowing" style={{ color: 'var(--link)', fontSize: 11 }} className="flex items-center gap-1">
              Full ranking <ArrowUpRight className="w-3 h-3" />
            </Link>
          }
          padded={false}
        >
          <div className="px-3 py-2 space-y-2">
            {byBorrowingRatio.map(({ f, inst, ratio }, i) => {
              const barPct = maxBorrowRatio > 0 ? (ratio / maxBorrowRatio) * 100 : 0
              const isHigh = ratio > 1.0
              return (
                <div key={f.institution_id} className="flex items-center gap-2">
                  <span className="font-num" style={{ color: 'var(--muted)', fontSize: 10, width: 16, flexShrink: 0 }}>{i + 1}</span>
                  <Link to={`/universities/${f.institution_id}`} className="truncate hover:underline" style={{ color: 'var(--text)', fontSize: 11.5, flexShrink: 0, minWidth: 0, width: 120 }}>
                    {inst?.short_name}
                  </Link>
                  <div className="flex-1 h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${barPct}%`,
                        backgroundColor: isHigh ? 'var(--negative)' : 'var(--warning)',
                        borderRadius: 1,
                      }}
                    />
                  </div>
                  <span className="font-num" style={{ color: isHigh ? 'var(--negative)' : 'var(--text-2)', fontSize: 11, width: 36, textAlign: 'right', flexShrink: 0 }}>
                    {(ratio * 100).toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>

        {/* Research Leaders */}
        <Panel
          title="Research Income Leaders"
          subtitle={`Top 10 by research income · FY${latestYear}`}
          action={
            <Link to="/rankings?sort=research" style={{ color: 'var(--link)', fontSize: 11 }} className="flex items-center gap-1">
              Full ranking <ArrowUpRight className="w-3 h-3" />
            </Link>
          }
          padded={false}
        >
          <div className="px-3 py-2 space-y-2">
            {byResearch.map(({ f, inst, yoy }, i) => {
              const history = getFinancialsByInstitution(f.institution_id)
                .sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year))
                .map((h) => h.research_income_gbp_m)
              const barPct = isKnownNumber(f.research_income_gbp_m) && maxResearch > 0 ? (f.research_income_gbp_m / maxResearch) * 100 : 0
              return (
                <div key={f.institution_id} className="flex items-center gap-2">
                  <span className="font-num" style={{ color: 'var(--muted)', fontSize: 10, width: 16, flexShrink: 0 }}>{i + 1}</span>
                  <Link to={`/universities/${f.institution_id}`} className="truncate hover:underline" style={{ color: 'var(--text)', fontSize: 11.5, flexShrink: 0, minWidth: 0, width: 110 }}>
                    {inst?.short_name}
                  </Link>
                  <Sparkline values={history} width={36} height={11} color="var(--link)" />
                  <div className="flex-1 h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                    <div style={{ height: '100%', width: `${barPct}%`, backgroundColor: 'var(--positive)', borderRadius: 1 }} />
                  </div>
                  <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 11, width: 40, textAlign: 'right', flexShrink: 0 }}>
                    {formatCurrencyM(f.research_income_gbp_m)}
                  </span>
                  {isKnownNumber(yoy) && (
                    <span
                      className="font-num flex items-center"
                      style={{ color: yoy >= 0 ? 'var(--positive)' : 'var(--negative)', fontSize: 10, width: 36, textAlign: 'right', flexShrink: 0 }}
                    >
                      {yoy >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {Math.abs(yoy).toFixed(1)}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      {/* Institutions in Focus */}
      <Panel title="Institutions in Focus" subtitle="Highest, lowest, and median financial health scores">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {focusInstitutions.map((h, i) => {
            if (!h?.inst || !h.fin) return null
            const revHistory = getFinancialsByInstitution(h.institution_id)
              .sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year))
              .map((f) => f.revenue_gbp_m)
            const label = i === 0 ? 'Strongest' : i === 1 ? '2nd Strongest' : i === 2 ? '3rd Strongest' : i === 3 ? 'Weakest' : i === 4 ? '2nd Weakest' : 'Median'
            return (
              <Link
                key={h.institution_id}
                to={`/universities/${h.institution_id}`}
                className="flex flex-col gap-2 p-2.5 border transition-colors"
                style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className="flex items-center justify-between gap-1">
                  <NationBadge nation={h.inst.nation} size="sm" />
                  <HealthBadge score={h.score} grade={h.grade} size="sm" showScore />
                </div>
                <div>
                  <p className="truncate" style={{ color: 'var(--text)', fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{h.inst.short_name}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 10 }}>{formatCurrencyM(h.fin.revenue_gbp_m)}</span>
                  <Sparkline values={revHistory} width={36} height={11} color={getGradeColor(h.grade)} />
                </div>
              </Link>
            )
          })}
        </div>
      </Panel>

      {/* Grade distribution summary with sparklines */}
      <Panel title="Health Grade Clusters" subtitle={`Grade distribution · FY${latestYear} · click to see top institutions per grade`}>
        <div
          className="grid grid-cols-3 sm:grid-cols-7 border-l border-t mb-4"
          style={{ borderColor: 'var(--border)' }}
        >
          {['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'].map((grade) => {
            const gradeInsts = healthScores
              .filter((h) => h.grade === grade)
              .map((h) => ({
                ...h,
                inst: institutions.find((i) => i.id === h.institution_id),
                fin: finMap.get(h.institution_id),
              }))
              .filter((h) => h.inst && h.fin)
            const count = gradeInsts.length
            const color = getGradeColor(grade)
            // Sparkline: show count distribution across score bins within this grade
            const scoreValues = gradeInsts.map((h) => h.score).filter(isKnownNumber)
            const avgScore = scoreValues.length ? Math.round(scoreValues.reduce((s, v) => s + v, 0) / scoreValues.length) : 0
            const revSparkValues = gradeInsts.slice(0, 5).map((h) => h.fin!.revenue_gbp_m)
            return (
              <div
                key={grade}
                className="px-3 py-3 border-r border-b flex flex-col items-center gap-1.5"
                style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
              >
                <span style={{ color, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>{grade}</span>
                <span className="font-num" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{count}</span>
                <span style={{ color: 'var(--muted)', fontSize: 9.5 }}>institutions</span>
                {revSparkValues.length > 0 && (
                  <Sparkline values={revSparkValues} width={40} height={12} color={color} />
                )}
                <span className="font-num" style={{ color: 'var(--muted)', fontSize: 9 }}>avg {avgScore}/100</span>
              </div>
            )
          })}
        </div>

        {/* Institution clusters — show top 3 per grade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          {['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'].map((grade) => {
            const color = getGradeColor(grade)
            const gradeInsts = healthScores
              .filter((h) => h.grade === grade)
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .slice(0, 3)
              .map((h) => ({
                ...h,
                inst: institutions.find((i) => i.id === h.institution_id),
                fin: finMap.get(h.institution_id),
              }))
              .filter((h) => h.inst && h.fin)
            return (
              <div key={grade}>
                <p style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>
                  {grade} cluster
                </p>
                <div className="space-y-1.5">
                  {gradeInsts.map((h) => (
                    <Link
                      key={h.institution_id}
                      to={`/universities/${h.institution_id}`}
                      className="flex items-center gap-1.5 px-2 py-1.5 border transition-colors"
                      style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <NationBadge nation={h.inst!.nation} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ color: 'var(--text)', fontSize: 10, fontWeight: 500 }}>{h.inst!.short_name}</p>
                        <p className="font-num" style={{ color: 'var(--muted)', fontSize: 9 }}>{h.score}/100</p>
                      </div>
                    </Link>
                  ))}
                  {gradeInsts.length === 0 && (
                    <p style={{ color: 'var(--muted)', fontSize: 10, fontStyle: 'italic' }}>No institutions</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
