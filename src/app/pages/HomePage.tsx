import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowDown, ArrowUp, Building2, Coins, FlaskConical, Landmark, ChevronRight } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts'
import { institutions } from '../data/institutions'
import { AVAILABLE_YEARS, getAggregateEligibleFinancials, isKnownNumber, sumKnown } from '../data/financials'
import { SYSTEM_RISK_SNAPSHOT } from '../data/systemRisk'
import { useYear } from '../context/YearContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { WorkspaceSection } from '../components/layout/WorkspaceSection'
import { OfsReportPanel } from '../components/intelligence/OfsReportPanel'

const institutionById = new Map(institutions.map((institution) => [institution.id, institution]))
const sectorSeries = [...AVAILABLE_YEARS].reverse().map((year) => {
  const rows = getAggregateEligibleFinancials(year)
  return { year, income: sumKnown(rows, 'revenue_gbp_m'), research: sumKnown(rows, 'research_income_gbp_m'), providers: rows.length }
})
function billions(value: number | null) {
  return isKnownNumber(value) ? '£' + (value / 1000).toFixed(2) + 'bn' : 'Pending'
}
function change(current: number | null, previous: number | null) {
  if (!isKnownNumber(current) || !isKnownNumber(previous) || previous === 0) return null
  return (current - previous) / Math.abs(previous) * 100
}
function Change({ value }: { value: number | null }) {
  return value === null ? <span className="metric-footnote">No earlier comparable total</span> : <span className="metric-footnote"><span className={value >= 0 ? 'metric-positive' : 'metric-negative'}>{value >= 0 ? '+' : ''}{value.toFixed(1)}%</span> vs previous year</span>
}

export function HomePage() {
  const { selectedYear } = useYear()
  const workspace = useWorkspace()
  const [metric, setMetric] = useState<'income' | 'research'>('income')
  const [selected, setSelected] = useState<string[]>([])
  const [descending, setDescending] = useState(true)
  useEffect(() => { setSelected([]) }, [selectedYear])
  const current = sectorSeries.find((row) => row.year === selectedYear)!
  const previous = sectorSeries[sectorSeries.indexOf(current) - 1]
  const trend = sectorSeries.filter((row) => row.year <= selectedYear)
  const providers = useMemo(() => getAggregateEligibleFinancials(selectedYear).filter((row) => isKnownNumber(row.revenue_gbp_m)).sort((a, b) => (b.revenue_gbp_m! - a.revenue_gbp_m!)), [selectedYear])
  const featured = providers.slice(0, 4)
  const visible = descending ? featured : [...featured].reverse()
  const snapshot = SYSTEM_RISK_SNAPSHOT
  const riskDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(snapshot.as_of))
  const hasWorkspace = workspace.watchlist.length + workspace.recentlyViewed.length + workspace.savedComparisons.length > 0
  function toggle(id: string) { setSelected((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id].slice(0, 6)) }

  return <div className="sector-overview">
    <section className="overview-heading" aria-labelledby="overview-title">
      <div><p className="eyebrow">The higher education observatory</p><h1 id="overview-title">The sector, in focus.</h1><p>Financial intelligence for UK higher education.</p></div>
      <div className="overview-source"><span>Financial year {selectedYear}</span><Link to="/open-data">Source: HESA Finance <ArrowRight size={13} /></Link></div>
    </section>

    <section className="overview-metrics" aria-label={'Sector indicators for ' + selectedYear}>
      <Link className="overview-metric" to="/sector"><span className="metric-icon"><Coins size={29} /></span><div><span className="metric-label">Sector income</span><strong>{billions(current.income)}</strong><Change value={change(current.income, previous?.income ?? null)} /></div></Link>
      <Link className="overview-metric" to="/sector"><span className="metric-icon"><FlaskConical size={29} /></span><div><span className="metric-label">Research income</span><strong>{billions(current.research)}</strong><Change value={change(current.research, previous?.research ?? null)} /></div></Link>
      <Link className="overview-metric" to="/open-data"><span className="metric-icon"><Landmark size={29} /></span><div><span className="metric-label">Verified providers</span><strong>{current.providers}</strong><span className="metric-footnote">included in this year's totals</span></div></Link>
    </section>

    <div className="overview-analysis">
      <section className="observatory-panel income-panel" aria-labelledby="income-chart-title">
        <div className="panel-heading"><div><h2 id="income-chart-title">Sector {metric === 'income' ? 'income' : 'research income'}</h2><p>UK higher education · {trend[0].year}–{selectedYear}</p></div>
          <div className="chart-switch" role="group" aria-label="Chart metric">
            <button aria-pressed={metric === 'income'} onClick={() => setMetric('income')}>Income</button>
            <button aria-pressed={metric === 'research'} onClick={() => setMetric('research')}>Research</button>
          </div>
        </div>
        <div className="overview-chart" role="img" aria-label={'Sector ' + metric + ' by financial year, in billions of pounds. Values available in the trend data below.'}>
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 222 }}>
            <AreaChart data={trend} margin={{ top: 18, right: 12, bottom: 8, left: -13 }} accessibilityLayer>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="year" tickFormatter={(year: string) => year.slice(0, 4)} tick={{ fill: 'var(--text-2)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} minTickGap={24} />
              <YAxis domain={[0, 'auto']} tickFormatter={(value: number) => '£' + (value / 1000).toFixed(0) + 'bn'} tick={{ fill: 'var(--text-2)', fontSize: 12 }} tickLine={false} axisLine={false} width={68} />
              <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)' }} labelFormatter={(label) => 'FY ' + label} formatter={(value: number) => [billions(value), metric === 'income' ? 'Total income' : 'Research income']} />
              <Area type="linear" dataKey={metric} stroke="var(--chart-1)" strokeWidth={2.5} fill="var(--chart-1)" fillOpacity={0.12} dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <details className="trend-data"><summary>View trend data and coverage</summary><p>Provider coverage varies by year. Changes compare aggregate totals, not a fixed group of providers.</p><table><caption className="sr-only">Verified sector totals by financial year</caption><thead><tr><th>Year</th><th>Income</th><th>Research</th><th>Providers</th></tr></thead><tbody>{trend.map((row) => <tr key={row.year}><th>{row.year}</th><td>{billions(row.income)}</td><td>{billions(row.research)}</td><td>{row.providers}</td></tr>)}</tbody></table></details>
      </section>
      <section className="observatory-panel watch-panel" aria-labelledby="system-watch-title">
        <div className="panel-heading"><h2 id="system-watch-title">System watch</h2><Link to="/system-watch" aria-label="Open system watch"><ChevronRight size={19} /></Link></div>
        <p>Finance, graduate employment, labour demand and recruitment exposure.</p>
        <div className="watch-summary">
          <div className="risk-gauge" role="img" aria-label={'System pressure score ' + snapshot.score + ' out of 100'}>
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 222 }}><PieChart><Pie data={[{ value: snapshot.score }, { value: 100 - snapshot.score }]} dataKey="value" innerRadius="79%" outerRadius="98%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}><Cell fill="var(--warning)" /><Cell fill="var(--border)" /></Pie></PieChart></ResponsiveContainer>
            <div className="risk-value"><strong>{snapshot.score}</strong><span>/ 100</span></div>
          </div>
          <div className="risk-description"><strong>{snapshot.level}</strong><p>Inputs as of {riskDate}. Annual report reviewed {snapshot.review.date}; score unchanged.</p></div>
        </div>
        <Link className="observatory-button watch-action" to="/system-watch">View underlying indicators <ArrowRight size={16} /></Link>
      </section>
    </div>

    <OfsReportPanel compact />
    <section className="overview-institutions" aria-labelledby="institutions-title">
      <div className="panel-heading"><div><h2 id="institutions-title">Institutions to explore</h2><p>Compare key financial indicators for leading universities.</p></div><Link className="text-link" to="/universities">View all universities <ArrowRight size={16} /></Link></div>
      <div className="overview-table-scroll"><table className="overview-table"><caption className="sr-only">Leading institutions by income for {selectedYear}. Select at least two to compare.</caption><thead><tr><th scope="col">#</th><th scope="col">Institution</th><th scope="col" aria-sort={descending ? 'descending' : 'ascending'}><button className="table-sort" onClick={() => setDescending((value) => !value)}>Total income <span className="table-year">(FY {selectedYear})</span>{descending ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</button></th><th scope="col">Compare</th></tr></thead><tbody>
        {visible.map((row) => { const institution = institutionById.get(row.institution_id); return <tr key={row.institution_id} className={selected.includes(row.institution_id) ? 'selected' : ''}><td>{featured.indexOf(row) + 1}</td><th scope="row"><Link to={'/universities/' + row.institution_id}><Building2 size={21} aria-hidden="true" /><span>{institution?.canonical_name ?? row.institution_id}</span></Link></th><td className="income-value">{isKnownNumber(row.revenue_gbp_m) ? '£' + row.revenue_gbp_m.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'm' : 'Pending'}</td><td><input type="checkbox" aria-label={'Compare ' + (institution?.short_name ?? row.institution_id)} checked={selected.includes(row.institution_id)} onChange={() => toggle(row.institution_id)} /></td></tr> })}
      </tbody></table></div>
      <div className="comparison-footer"><p>Source: HESA Finance · {selectedYear}</p><div className="comparison-controls"><span role="status">{selected.length > 0 ? selected.length + ' selected' : 'Select 2–4 institutions'}</span>{selected.length > 0 && <button className="text-link" onClick={() => setSelected([])}>Clear</button>}{selected.length >= 2 ? <Link className="observatory-button primary" to={'/compare?ids=' + selected.join(',')}>Compare selected <ArrowRight size={16} /></Link> : <button className="observatory-button" disabled>Compare selected <ArrowRight size={16} /></button>}</div></div>
    </section>
    {hasWorkspace && <section className="overview-workspace" aria-label="Saved workspace"><WorkspaceSection /></section>}
    <div className="overview-more"><Link to="/sector">Explore all sector indicators <ArrowRight size={16} /></Link><Link to="/student-journey">Students & careers <ArrowRight size={16} /></Link><Link to="/intelligence">Latest sector intelligence <ArrowRight size={16} /></Link></div>
  </div>
}
