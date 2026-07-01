import { useState } from 'react'
import { FileText, ArrowUpRight, Search, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react'
import { institutions } from '../data/institutions'
import { financials, AVAILABLE_YEARS } from '../data/financials'
import type { FinancialYear, Institution } from '../data/types'
import { NationBadge } from '../components/institutions/NationBadge'
import { DataSourceBadge } from '../components/institutions/DataSourceBadge'
import { Link } from 'react-router'

function StatusIcon({ status }: { status: string }) {
  if (status === 'found') return <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--positive)' }} />
  if (status === 'archived') return <Clock className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
  return <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
}

export function ReportsPage() {
  const [activeYear, setActiveYear] = useState(AVAILABLE_YEARS[0])
  const [search, setSearch] = useState('')

  const allReportFins = financials.filter((f) => f.fiscal_year === activeYear)

  const rows = allReportFins
    .map((f) => {
      const inst = institutions.find((i) => i.id === f.institution_id)
      return inst ? { f, inst } : null
    })
    .filter((row): row is { f: FinancialYear; inst: Institution } => row !== null)
    .filter(({ inst }) =>
      !search ||
      inst.canonical_name.toLowerCase().includes(search.toLowerCase()) ||
      inst.short_name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.inst.canonical_name.localeCompare(b.inst.canonical_name))

  const verifiedCount = rows.filter((r) => r.f.data_source === 'verified').length
  const pendingCount = rows.length - verifiedCount
  const withSourceCount = rows.filter((r) => r.f.source_pdf).length

  function downloadCsv() {
    const header = 'Institution,UKPRN,Fiscal Year,Published,Data Source,Status,Source URL\n'
    const lines = rows.map((r) =>
      [
        `"${r.inst.canonical_name}"`,
        r.inst.ukprn,
        r.f.fiscal_year,
        r.f.published || '—',
        r.f.data_source,
        r.f.status,
        r.f.source_pdf || '—',
      ].join(','),
    )
    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hestats-reports-${activeYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <FileText className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>ANNUAL REPORTS REGISTRY</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--positive)' }}>{verifiedCount}</span> verified · <span className="font-num">{pendingCount}</span> pending
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{withSourceCount}</span> source links
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>FY <span className="font-num" style={{ color: 'var(--text)' }}>{activeYear}</span></span>
        <div className="ml-auto">
          <button
            onClick={downloadCsv}
            className="flex items-center gap-1.5 px-2 py-1"
            style={{ border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text-2)', fontSize: 10.5 }}
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* Year tabs + search */}
      <div className="flex items-center gap-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {AVAILABLE_YEARS.slice().reverse().map((year) => (
          <button
            key={year}
            onClick={() => setActiveYear(year)}
            className="px-4 py-2 transition-colors"
            style={{
              color: activeYear === year ? 'var(--text)' : 'var(--text-2)',
              borderBottom: activeYear === year ? '2px solid var(--accent)' : '2px solid transparent',
              fontSize: 12.5,
              fontWeight: activeYear === year ? 500 : 400,
              marginBottom: -1,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {year}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-2 pb-1 pr-1">
          <div
            className="flex items-center gap-2 px-2.5 py-1.5"
            style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 3 }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter institutions…"
              className="bg-transparent outline-none"
              style={{ color: 'var(--text)', fontSize: 12, width: 200 }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="border overflow-hidden"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
                {['Institution', 'Nation', 'UKPRN', 'Published', 'Data Source', 'Status', 'Source'].map((h, i) => (
                  <th
                    key={h}
                    className="px-3 py-2"
                    style={{
                      color: 'var(--muted)',
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      textAlign: i === 0 ? 'left' : i === 6 ? 'right' : 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ f, inst }) => (
                <tr
                  key={`${inst.id}-${f.fiscal_year}`}
                  className="transition-colors group"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-3 py-2">
                    <Link
                      to={`/universities/${inst.id}`}
                      className="hover:underline"
                      style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 500 }}
                    >
                      {inst.canonical_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <NationBadge nation={inst.nation} size="sm" />
                  </td>
                  <td className="px-3 py-2 font-num" style={{ color: 'var(--muted)', fontSize: 11 }}>
                    {inst.ukprn}
                  </td>
                  <td className="px-3 py-2 font-num" style={{ color: 'var(--text-2)', fontSize: 11 }}>
                    {f.published || '—'}
                  </td>
                  <td className="px-3 py-2">
                    <DataSourceBadge source={f.data_source} size="sm" />
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5">
                      <StatusIcon status={f.status} />
                      <span style={{ color: 'var(--text-2)', fontSize: 11, textTransform: 'capitalize' }}>{f.status}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {f.source_pdf ? (
                      <a
                        href={f.source_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 transition-colors hover:underline"
                        style={{ color: 'var(--link)', fontSize: 11, border: '1px solid var(--border)', borderRadius: 2 }}
                      >
                        <FileText className="w-3 h-3" /> Source
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 11 }}>No link</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center" style={{ color: 'var(--muted)', fontSize: 13 }}>
                    No results for "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-1 px-3 py-2 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Key</span>
        <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-2)' }}>
          <CheckCircle className="w-3 h-3" style={{ color: 'var(--positive)' }} /> Found — official source ingested and verified
        </span>
        <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-2)' }}>
          <Clock className="w-3 h-3" style={{ color: 'var(--warning)' }} /> Archived — located but not yet processed
        </span>
        <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-2)' }}>
          <AlertCircle className="w-3 h-3" style={{ color: 'var(--muted)' }} /> Missing — awaiting official source
        </span>
        <Link to="/support" className="ml-auto hover:underline flex items-center gap-1" style={{ color: 'var(--link)', fontSize: 11 }}>
          Help us add missing reports <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
