import { useState, useMemo } from 'react'
import { Search, LayoutGrid, List } from 'lucide-react'
import { institutions } from '../data/institutions'
import { AVAILABLE_YEARS, compareNullableDesc, financials } from '../data/financials'
import { providerFinanceCoverage } from '../data/providerFinanceCoverage'
import { providerUniverse } from '../data/providers'
import { Institution } from '../data/types'
import { InstitutionCard } from '../components/institutions/InstitutionCard'
import { InstitutionRow } from '../components/institutions/InstitutionRow'

type SortKey = 'name' | 'revenue' | 'surplus' | 'research' | 'liquidity'
type ViewMode = 'card' | 'table'

const SELECT_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--bg-2)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 3,
  fontSize: 11.5,
  padding: '4px 8px',
  outline: 'none',
}

export function InstitutionsPage() {
  const [query, setQuery] = useState('')
  const [nation, setNation] = useState<string>('All')
  const [missionGroup, setMissionGroup] = useState<string>('All')
  const [riskFilter, setRiskFilter] = useState<string>('All')
  const [sourceFilter, setSourceFilter] = useState<string>('All')
  const [fiscalYear, setFiscalYear] = useState<string>(AVAILABLE_YEARS[0])
  const [providerTypeFilter, setProviderTypeFilter] = useState<string>('All')
  const [regulatorFilter, setRegulatorFilter] = useState<string>('All')
  const [providerSourceFilter, setProviderSourceFilter] = useState<string>('All')
  const [financeCoverageFilter, setFinanceCoverageFilter] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortKey>('revenue')
  const [view, setView] = useState<ViewMode>('table')

  const yearFinancials = useMemo(() => financials.filter((row) => row.fiscal_year === fiscalYear), [fiscalYear])
  const finMap = useMemo(() => new Map(yearFinancials.map((f) => [f.institution_id, f])), [yearFinancials])
  const providerByInstitution = useMemo(() => new Map(providerUniverse.filter((row) => row.institution_id).map((row) => [row.institution_id, row])), [])
  const providerFinanceForYear = useMemo(() => new Map(providerFinanceCoverage
    .filter((row) => row.fiscal_year === fiscalYear)
    .map((row) => [row.provider_id, row])), [fiscalYear])

  const filtered = useMemo(() => {
    let list = institutions.filter((i) => finMap.has(i.id))
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(
        (i) =>
          i.canonical_name.toLowerCase().includes(q) ||
          i.short_name.toLowerCase().includes(q) ||
          i.city.toLowerCase().includes(q),
      )
    }
    if (nation !== 'All') list = list.filter((i) => i.nation === nation)
    if (missionGroup !== 'All') {
      if (missionGroup === 'None') list = list.filter((i) => !i.mission_group)
      else list = list.filter((i) => i.mission_group === missionGroup)
    }
    if (providerTypeFilter !== 'All') list = list.filter((i) => providerByInstitution.get(i.id)?.provider_type === providerTypeFilter)
    if (regulatorFilter !== 'All') list = list.filter((i) => providerByInstitution.get(i.id)?.regulator === regulatorFilter)
    if (riskFilter !== 'All') list = list.filter((i) => finMap.get(i.id)?.risk_flag === riskFilter)
    if (sourceFilter !== 'All') list = list.filter((i) => finMap.get(i.id)?.data_source === sourceFilter)

    list.sort((a, b) => {
      const fa = finMap.get(a.id)!
      const fb = finMap.get(b.id)!
      if (sortBy === 'name') return a.canonical_name.localeCompare(b.canonical_name)
      if (sortBy === 'revenue') return compareNullableDesc(fa.revenue_gbp_m, fb.revenue_gbp_m)
      if (sortBy === 'surplus') return compareNullableDesc(fa.surplus_margin_pct, fb.surplus_margin_pct)
      if (sortBy === 'research') return compareNullableDesc(fa.research_income_gbp_m, fb.research_income_gbp_m)
      if (sortBy === 'liquidity') return compareNullableDesc(fa.liquidity_days, fb.liquidity_days)
      return 0
    })
    return list
  }, [query, nation, missionGroup, providerTypeFilter, regulatorFilter, riskFilter, sourceFilter, sortBy, finMap, providerByInstitution])

  const filteredProviders = useMemo(() => {
    let list = [...providerUniverse]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((provider) =>
        provider.canonical_name.toLowerCase().includes(q) ||
        provider.provider_id.toLowerCase().includes(q) ||
        (provider.ukprn ?? '').includes(q),
      )
    }
    if (nation !== 'All') list = list.filter((provider) => provider.nation === nation)
    if (providerTypeFilter !== 'All') list = list.filter((provider) => provider.provider_type === providerTypeFilter)
    if (regulatorFilter !== 'All') list = list.filter((provider) => provider.regulator === regulatorFilter)
    if (providerSourceFilter !== 'All') list = list.filter((provider) => provider.source_status === providerSourceFilter)
    if (financeCoverageFilter !== 'All') {
      list = list.filter((provider) => providerFinanceForYear.get(provider.provider_id)?.source_status === financeCoverageFilter)
    }
    return list.sort((a, b) => a.canonical_name.localeCompare(b.canonical_name))
  }, [query, nation, providerTypeFilter, regulatorFilter, providerSourceFilter, financeCoverageFilter, providerFinanceForYear])

  const nations: Institution['nation'][] = ['England', 'Scotland', 'Wales', 'Northern Ireland']
  const providerTypes = [...new Set(providerUniverse.map((provider) => provider.provider_type))].sort()
  const regulators = [...new Set(providerUniverse.map((provider) => provider.regulator))].sort()
  const financeCoverage = {
    verified: providerFinanceCoverage.filter((row) => row.fiscal_year === fiscalYear && row.source_status === 'verified').length,
    pending: providerFinanceCoverage.filter((row) => row.fiscal_year === fiscalYear && row.source_status === 'pending').length,
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-3">
      <div
        className="flex items-center gap-3 px-3 py-1.5 mb-3 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>INSTITUTIONS DIRECTORY</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{filtered.length}</span> / {institutions.length} profiled
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{filteredProviders.length}</span> / {providerUniverse.length} HESA providers
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          FY <span className="font-num" style={{ color: 'var(--text)' }}>{fiscalYear}</span> finance: {financeCoverage.verified} verified / {financeCoverage.pending} pending
        </span>
      </div>

      {/* Filter bar */}
      <div
        className="flex flex-wrap items-center gap-2 p-2 mb-3 border"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Filter institutions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 outline-none"
            style={{
              backgroundColor: 'var(--bg-2)',
              borderColor: 'var(--border)',
              border: '1px solid',
              color: 'var(--text)',
              borderRadius: 3,
              fontSize: 12,
            }}
          />
        </div>
        <select value={nation} onChange={(e) => setNation(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Nations</option>
          {nations.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} style={SELECT_STYLE}>
          {AVAILABLE_YEARS.map((year) => <option key={year} value={year}>FY {year}</option>)}
        </select>
        <select value={providerTypeFilter} onChange={(e) => setProviderTypeFilter(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Provider Types</option>
          {providerTypes.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
        </select>
        <select value={regulatorFilter} onChange={(e) => setRegulatorFilter(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Regulators</option>
          {regulators.map((regulator) => <option key={regulator} value={regulator}>{regulator}</option>)}
        </select>
        <select value={missionGroup} onChange={(e) => setMissionGroup(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Groups</option>
          <option value="Russell Group">Russell Group</option>
          <option value="None">Unaffiliated</option>
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Risk</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Finance Data</option>
          <option value="verified">Verified Finance</option>
          <option value="pending">Pending Finance</option>
        </select>
        <select value={providerSourceFilter} onChange={(e) => setProviderSourceFilter(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Source Status</option>
          <option value="verified">Provider verified</option>
          <option value="matched">Provider matched</option>
          <option value="pending">Provider pending</option>
        </select>
        <select value={financeCoverageFilter} onChange={(e) => setFinanceCoverageFilter(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Coverage</option>
          <option value="verified">Coverage verified</option>
          <option value="pending">Coverage pending</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} style={SELECT_STYLE}>
          <option value="revenue">Sort: Income ▾</option>
          <option value="surplus">Sort: Margin ▾</option>
          <option value="research">Sort: Research ▾</option>
          <option value="liquidity">Sort: Liquidity ▾</option>
          <option value="name">Sort: Name ▾</option>
        </select>
        <div
          className="flex items-center"
          style={{ border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}
        >
          <button
            onClick={() => setView('table')}
            className="px-2 py-1.5 transition-colors"
            style={{
              backgroundColor: view === 'table' ? 'var(--panel-hover)' : 'transparent',
              color: view === 'table' ? 'var(--text)' : 'var(--text-2)',
            }}
            aria-label="Table view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView('card')}
            className="px-2 py-1.5 transition-colors"
            style={{
              backgroundColor: view === 'card' ? 'var(--panel-hover)' : 'transparent',
              color: view === 'card' ? 'var(--text)' : 'var(--text-2)',
              borderLeft: '1px solid var(--border)',
            }}
            aria-label="Card view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((inst) => {
            const fin = finMap.get(inst.id)
            if (!fin) return null
            return <InstitutionCard key={inst.id} institution={inst} financial={fin} />
          })}
        </div>
      )}

      {view === 'table' && (
        <div
          className="overflow-hidden border"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th
                    className="px-3 py-2"
                    style={{
                      color: 'var(--muted)',
                      fontSize: 9.5,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      textAlign: 'left',
                    }}
                  >
                    Institution
                  </th>
                  {['Income', 'Margin', 'Research', 'Liquidity', 'Borrowing', 'Risk', 'Data'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2"
                      style={{
                        color: 'var(--muted)',
                        fontSize: 9.5,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        textAlign: 'right',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inst) => {
                  const fin = finMap.get(inst.id)
                  if (!fin) return null
                  return <InstitutionRow key={inst.id} institution={inst} financial={fin} />
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p style={{ fontSize: 12 }}>No institutions match your filters.</p>
        </div>
      )}

      <div
        className="mt-3 border"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <div
          className="flex flex-wrap items-center gap-3 px-3 py-2"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>HESA Provider Universe</span>
          <span style={{ color: 'var(--text-2)', fontSize: 11 }}>
            {filteredProviders.length} providers shown for FY {fiscalYear}
          </span>
          <span style={{ color: 'var(--text-2)', fontSize: 11 }}>
            pending identifiers are deliberately null until source reconciliation
          </span>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: 360 }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: 'var(--panel)' }}>
                {['Provider', 'UKPRN', 'Type', 'Nation', 'Regulator', 'Platform', 'Source', 'Finance coverage'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2"
                    style={{
                      color: 'var(--muted)',
                      fontSize: 9.5,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      textAlign: h === 'Provider' ? 'left' : 'right',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProviders.map((provider) => {
                const coverage = providerFinanceForYear.get(provider.provider_id)
                return (
                  <tr key={provider.provider_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-2" style={{ color: 'var(--text)', fontSize: 12, textAlign: 'left', minWidth: 280 }}>
                      {provider.canonical_name}
                      <div style={{ color: 'var(--muted)', fontSize: 10 }}>{provider.provider_id}</div>
                    </td>
                    <td className="px-3 py-2 font-num" style={{ color: 'var(--text-2)', fontSize: 11, textAlign: 'right' }}>{provider.ukprn ?? 'Pending'}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11, textAlign: 'right' }}>{provider.provider_type.replaceAll('_', ' ')}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11, textAlign: 'right' }}>{provider.nation}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11, textAlign: 'right' }}>{provider.regulator}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11, textAlign: 'right' }}>{provider.platform_status.replaceAll('_', ' ')}</td>
                    <td className="px-3 py-2" style={{ color: provider.source_status === 'pending' ? 'var(--warning)' : 'var(--positive)', fontSize: 11, textAlign: 'right' }}>{provider.source_status}</td>
                    <td className="px-3 py-2" style={{ color: coverage?.source_status === 'verified' ? 'var(--positive)' : 'var(--warning)', fontSize: 11, textAlign: 'right' }}>
                      {coverage?.source_status ?? 'pending'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
