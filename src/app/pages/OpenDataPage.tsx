import { useState } from 'react'
import { Download, Copy, CheckCircle, Database, FileJson, FileText, ExternalLink, Activity } from 'lucide-react'
import { institutions } from '../data/institutions'
import { financials, getAllLatestFinancials, AVAILABLE_YEARS } from '../data/financials'
import { STUDENT_YEARS, studentEnrolments } from '../data/students'
import { INTELLIGENCE_RECORDS } from '../data/intelligence'
import { computeHealthScore } from '../data/health'
import { Panel } from '../components/layout/Panel'
import { getDataset, type Format } from '../data/openDataExports'

const LICENCE = 'Creative Commons Attribution 4.0 International (CC BY 4.0)'
const VERSION = 'verified-2026.1'
const CITATION_YEAR = '2026'

const DATASETS = [
  {
    id: 'all-financials',
    name: 'Full Financial Dataset',
    description: 'All financial metrics for all institutions across all available years (2015-16 to 2024-25). Includes income, surplus, research, staff costs, borrowing, liquidity, and student FTE.',
    rows: financials.length,
    columns: 22,
    years: `${AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]}–${AVAILABLE_YEARS[0]}`,
    formats: ['csv', 'json'],
    size: '~420 KB',
    tier: 'core',
  },
  {
    id: 'latest-snapshot',
    name: 'Latest Year Snapshot',
    description: `Single-year snapshot for FY${AVAILABLE_YEARS[0]}. Includes all computed metrics, financial health scores (0–100), letter grades (AAA–CCC), and risk flags.`,
    rows: getAllLatestFinancials().length,
    columns: 23,
    years: AVAILABLE_YEARS[0],
    formats: ['csv', 'json'],
    size: '~45 KB',
    tier: 'core',
  },
  {
    id: 'student-enrolments',
    name: 'Student Enrolment Coverage',
    description: 'HESA Student Statistics provider-level enrolment coverage. Pending rows remain blank until Figure 7 source rows are ingested.',
    rows: studentEnrolments.length,
    columns: 16,
    years: STUDENT_YEARS.join(', '),
    formats: ['csv', 'json'],
    size: '~30 KB',
    tier: 'core',
  },
  {
    id: 'institutions',
    name: 'Institution Reference',
    description: 'Canonical institution metadata: UKPRN, full name, short name, city, nation, founding year, and mission group membership.',
    rows: institutions.length,
    columns: 9,
    years: 'Static',
    formats: ['csv', 'json'],
    size: '~12 KB',
    tier: 'reference',
  },
  {
    id: 'intelligence',
    name: 'Source-backed Intelligence',
    description: 'Official statistics, regulator publications, government policy records and clearly labelled external AI-risk analysis. Every record includes source URL, reference, publisher, dates and confidence.',
    rows: INTELLIGENCE_RECORDS.length,
    columns: 18,
    years: '2025-2026',
    formats: ['csv', 'json'],
    size: '~20 KB',
    tier: 'reference',
  },
  {
    id: 'health-scores',
    name: 'Financial Health Scores',
    description: 'Computed financial health scores, component breakdowns, and source confidence for all institutions.',
    rows: getAllLatestFinancials().length,
    columns: 12,
    years: AVAILABLE_YEARS[0],
    formats: ['csv', 'json'],
    size: '~18 KB',
    tier: 'derived',
  },
]

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const CITATION_STYLES = ['APA', 'BibTeX', 'Chicago', 'Harvard', 'Vancouver'] as const
type CitationStyle = (typeof CITATION_STYLES)[number]

function buildCitation(style: CitationStyle, datasetName: string): string {
  const url = 'https://hestats.co.uk/open-data'
  const accessed = 'June 2026'
  switch (style) {
    case 'APA':
      return `HEStats. (${CITATION_YEAR}). ${datasetName} [Data set]. HEStats UK Higher Education Financial Intelligence. ${url}`
    case 'BibTeX':
      return `@misc{hestats${CITATION_YEAR},\n  author = {{HEStats}},\n  title = {${datasetName}},\n  year = {${CITATION_YEAR}},\n  howpublished = {\\url{${url}}},\n  note = {Accessed: ${accessed}}\n}`
    case 'Chicago':
      return `HEStats. "${datasetName}." HEStats UK Higher Education Financial Intelligence, ${CITATION_YEAR}. ${url}.`
    case 'Harvard':
      return `HEStats (${CITATION_YEAR}) ${datasetName}. Available at: ${url} (Accessed: ${accessed}).`
    case 'Vancouver':
      return `HEStats. ${datasetName} [Internet]. ${CITATION_YEAR} [cited ${accessed}]. Available from: ${url}`
  }
}

const TIER_COLOR: Record<string, string> = {
  core: 'var(--positive)',
  derived: 'var(--link)',
  reference: 'var(--warning)',
}
const TIER_LABEL: Record<string, string> = {
  core: 'Core',
  derived: 'Derived',
  reference: 'Reference',
}

export function OpenDataPage() {
  const [selectedDataset, setSelectedDataset] = useState(DATASETS[0].id)
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA')
  const [copied, setCopied] = useState(false)

  const ds = DATASETS.find((d) => d.id === selectedDataset) ?? DATASETS[0]
  const citation = buildCitation(citationStyle, ds.name)
  const exampleFinancial = getAllLatestFinancials().find((row) => row.institution_id === 'oxford') ?? getAllLatestFinancials()[0]
  const exampleHealth = computeHealthScore(exampleFinancial)
  const examplePayload = JSON.stringify({
    institution_id: exampleFinancial.institution_id,
    fiscal_year: exampleFinancial.fiscal_year,
    revenue_gbp_m: exampleFinancial.revenue_gbp_m,
    surplus_gbp_m: exampleFinancial.surplus_gbp_m,
    surplus_margin_pct: exampleFinancial.surplus_margin_pct,
    research_income_gbp_m: exampleFinancial.research_income_gbp_m,
    health_score: exampleHealth.score,
    health_grade: exampleHealth.grade,
    risk_flag: exampleFinancial.risk_flag,
    data_source: exampleFinancial.data_source,
    source_status: exampleFinancial.status,
    confidence: exampleFinancial.confidence,
    included_in_aggregates: exampleFinancial.included_in_aggregates,
  }, null, 2)

  function handleDownload(id: string, fmt: Format) {
    const content = getDataset(id, fmt)
    const mime = fmt === 'csv' ? 'text/csv' : 'application/json'
    downloadFile(content, `hestats-${id}-${AVAILABLE_YEARS[0]}.${fmt}`, mime)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Database className="w-3 h-3" style={{ color: 'var(--positive)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>OPEN DATA</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          Version <span className="font-num" style={{ color: 'var(--text)' }}>{VERSION}</span>
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{(financials.length + studentEnrolments.length).toLocaleString()}</span> records
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{AVAILABLE_YEARS.length}</span> years
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Licence: <span style={{ color: 'var(--positive)' }}>CC BY 4.0</span></span>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--positive)' }} />
          <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em' }}>FREE FOREVER</span>
        </div>
      </div>

      {/* Intro */}
      <div
        className="px-4 py-3 border"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex-1 min-w-0">
            <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              HEStats Open Data
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.6, maxWidth: 700 }}>
              Verified financial datasets are available free of charge under <strong style={{ color: 'var(--text)' }}>CC BY 4.0</strong>.
              Rows marked <strong style={{ color: 'var(--positive)' }}>verified</strong> trace to official open datasets;
              pending cells remain blank until an official source is attached.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
            {[
              { label: 'Institutions', value: institutions.length },
              { label: 'Financial years', value: AVAILABLE_YEARS.length },
              { label: 'Total records', value: (financials.length + studentEnrolments.length).toLocaleString() },
              { label: 'Data version', value: VERSION },
            ].map(({ label, value }) => (
              <div key={label} className="text-center px-3 py-2" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 3, border: '1px solid var(--border)' }}>
                <p className="font-num" style={{ color: 'var(--text)', fontSize: 18, fontWeight: 700 }}>{value}</p>
                <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
        {DATASETS.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDataset(d.id)}
            className="text-left p-3 border transition-colors"
            style={{
              backgroundColor: selectedDataset === d.id ? 'var(--panel-hover)' : 'var(--panel)',
              borderColor: selectedDataset === d.id ? 'var(--accent)' : 'var(--border)',
              borderRadius: 3,
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '1px 5px',
                  borderRadius: 2,
                  backgroundColor: `${TIER_COLOR[d.tier]}22`,
                  color: TIER_COLOR[d.tier],
                  fontWeight: 600,
                }}
              >
                {TIER_LABEL[d.tier]}
              </span>
              {selectedDataset === d.id && (
                <span style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.06em' }}>SELECTED</span>
              )}
            </div>
            <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{d.name}</p>
            <p style={{ color: 'var(--text-2)', fontSize: 11, lineHeight: 1.45, marginBottom: 8 }}>{d.description}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {[
                { label: 'Rows', value: d.rows.toLocaleString() },
                { label: 'Cols', value: d.columns },
                { label: 'Size', value: d.size },
                { label: 'Period', value: d.years },
              ].map(({ label, value }) => (
                <span key={label} style={{ fontSize: 10, color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--text-2)' }}>{value}</span> {label}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Download section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <div className="lg:col-span-2">
          <Panel title={`Download: ${ds.name}`} subtitle={`${ds.rows.toLocaleString()} rows · ${ds.columns} columns · ${ds.years}`}>
            <div className="space-y-3">
              {/* Format cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(['csv', 'json'] as Format[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleDownload(ds.id, fmt)}
                    className="flex items-center gap-3 px-4 py-3 border transition-colors text-left"
                    style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'var(--panel-hover)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'var(--bg-2)' }}
                  >
                    {fmt === 'csv' ? (
                      <FileText className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--positive)' }} />
                    ) : (
                      <FileJson className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--link)' }} />
                    )}
                    <div>
                      <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase' }}>{fmt}</p>
                      <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>
                        {fmt === 'csv' ? 'Comma-separated · Excel/R/Python compatible' : 'Structured JSON · API-ready'}
                      </p>
                    </div>
                    <Download className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  </button>
                ))}
              </div>

              {/* Schema preview */}
              <div>
                <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Schema preview (CSV header)
                </p>
                <div
                  className="px-3 py-2.5 overflow-x-auto"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: 'var(--text-2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getDataset(ds.id, 'csv').split('\n')[0]}
                </div>
              </div>

              {/* Preview table */}
              <div>
                <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Data preview (first 3 rows)
                </p>
                <div
                  className="overflow-x-auto border"
                  style={{ borderColor: 'var(--border)', borderRadius: 3, backgroundColor: 'var(--bg)' }}
                >
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-2)' }}>
                        {getDataset(ds.id, 'csv').split('\n')[0].split(',').map((col, i) => (
                          <th key={i} className="px-2 py-1.5 text-left whitespace-nowrap" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", borderBottom: '1px solid var(--border)' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getDataset(ds.id, 'csv').split('\n').slice(1, 4).map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                          {row.split(',').map((cell, ci) => (
                            <td key={ci} className="px-2 py-1 whitespace-nowrap" style={{ color: 'var(--text-2)', fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace" }}>
                              {cell.replace(/^"|"$/g, '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Citation generator */}
        <div className="space-y-2.5">
          <Panel title="Citation Generator" subtitle="Cite this dataset in your research">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {CITATION_STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setCitationStyle(s)}
                    className="px-2.5 py-1 transition-colors"
                    style={{
                      border: `1px solid ${citationStyle === s ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 3,
                      color: citationStyle === s ? 'var(--accent)' : 'var(--text-2)',
                      fontSize: 11,
                      fontWeight: citationStyle === s ? 600 : 400,
                      backgroundColor: citationStyle === s ? 'var(--panel-hover)' : 'transparent',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div
                className="px-3 py-3 relative"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 3,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {citation}
              </div>
              <button
                onClick={() => handleCopy(citation)}
                className="w-full flex items-center justify-center gap-2 py-2 transition-colors"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 3,
                  color: copied ? 'var(--positive)' : 'var(--text-2)',
                  fontSize: 12,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy citation'}
              </button>
            </div>
          </Panel>

          {/* Licence & attribution */}
          <Panel title="Licence & Attribution">
            <div className="space-y-3">
              <div>
                <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Licence
                </p>
                <p style={{ color: 'var(--positive)', fontSize: 12, fontWeight: 600 }}>CC BY 4.0</p>
                <p style={{ color: 'var(--text-2)', fontSize: 11, lineHeight: 1.5, marginTop: 2 }}>
                  {LICENCE}. You are free to copy, share, and adapt this data provided you give appropriate credit.
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Data sources
                </p>
                {[
                  { label: 'HESA Finance Open Data', url: 'https://www.hesa.ac.uk/data-and-analysis/finances' },
                  { label: 'HESA Student Statistics 2024/25', url: 'https://ckan.publishing.service.gov.uk/dataset/higher-education-student-statistics-uk-2024-25' },
                  { label: 'DfE LEO graduate labour-market outcomes', url: 'https://explore-education-statistics.service.gov.uk/find-statistics/graduate-labour-market-outcomes-leo/2023-24' },
                  { label: 'ONS Business Insights and Conditions Survey', url: 'https://www.ons.gov.uk/businessindustryandtrade/business/businessservices/bulletins/businessinsightsandimpactontheukeconomy/2april2026' },
                  { label: 'Office for Students financial sustainability reports', url: 'https://www.officeforstudents.org.uk/publications/financial-sustainability-of-higher-education-providers-in-england-2026/' },
                  { label: 'ILO generative AI occupational exposure research', url: 'https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure' },
                  { label: 'World Economic Forum Future of Jobs 2025', url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/' },
                  { label: 'McKinsey Superagency in the workplace 2025', url: 'https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/superagency-in-the-workplace-empowering-people-to-unlock-ais-full-potential-at-work' },
                  { label: 'HESA provider tools', url: 'https://www.hesa.ac.uk/collection/provider-tools/' },
                  { label: 'Institutional audited accounts', url: null },
                ].map(({ label, url }) => (
                  <div key={label} className="flex items-center gap-1.5 mb-1">
                    <span style={{ width: 4, height: 4, backgroundColor: 'var(--border-strong)', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }} />
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
                        {label} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* API preview */}
      <Panel title="Programmatic Access" subtitle="Use the local HEStats JSON API simulator for verified data consumers">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              The current app includes a local read-only API simulator backed by this same verified dataset. Public endpoint shape is stable,
              but hosted API availability and rate limits are not yet production guarantees.
            </p>
            <div className="space-y-2">
              {[
                { method: 'GET', path: '/api/v1/institutions', desc: 'List all institutions' },
                { method: 'GET', path: '/api/v1/institutions/{id}/financials', desc: 'Full financial history for one institution' },
                { method: 'GET', path: '/api/v1/rankings?metric=revenue&fiscal_year=2024-25', desc: 'All institutions ranked for a given year' },
                { method: 'GET', path: '/api/v1/health-scores', desc: 'Financial health scores (latest year)' },
              ].map(({ method, path, desc }) => (
                <div key={path} className="flex items-start gap-2">
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 5px',
                      borderRadius: 2,
                      backgroundColor: 'var(--positive)22',
                      color: 'var(--positive)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {method}
                  </span>
                  <div>
                    <code style={{ color: 'var(--link)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{path}</code>
                    <p style={{ color: 'var(--muted)', fontSize: 10.5, marginTop: 1 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Example response
            </p>
            <pre
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                padding: '10px 12px',
                fontSize: 10.5,
                color: 'var(--text-2)',
                overflow: 'auto',
                overflowX: 'auto',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.55,
                maxWidth: '100%',
                whiteSpace: 'pre',
              }}
            >{examplePayload}</pre>
          </div>
        </div>
      </Panel>

      {/* Footer note */}
      <div
        className="px-3 py-2 border flex flex-wrap items-center gap-x-6 gap-y-1"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <Activity className="w-3 h-3" style={{ color: 'var(--muted)' }} />
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em' }}>DATA STANDARDS</span>
        <span style={{ color: 'var(--text-2)', fontSize: 11 }}>
          Financial figures in £ millions (GBP). Years in HESA format (e.g. 2024-25 = academic year ending July 2025).
          Pending fields are blank or null and excluded from aggregates; verified rows include source URL/reference columns.
        </span>
      </div>
    </div>
  )
}
