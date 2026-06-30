import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Shield, Database, ExternalLink, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { DATA_SOURCES, CONFIDENCE_META, LICENCE_DISPLAY, METRIC_SOURCES, DataSourceDef } from '../data/sources'
import { Panel } from '../components/layout/Panel'

const TIER_LABELS: Record<number, string> = {
  1: 'Primary — HESA',
  2: 'Secondary — Department for Education',
  3: 'Tertiary — Student Loans Company',
  4: 'Regulatory — Office for Students',
  5: 'Admissions — UCAS',
  6: 'Institutional — Annual Reports & Accounts',
  7: 'Corporate — Companies House',
  8: 'Charity — Charity Commission',
}

const TIER_COLORS: Record<number, string> = {
  1: 'var(--positive)',
  2: 'var(--link)',
  3: 'var(--link)',
  4: 'var(--warning)',
  5: 'var(--link)',
  6: 'var(--accent)',
  7: 'var(--muted)',
  8: 'var(--muted)',
}

function SourceCard({ source }: { source: DataSourceDef }) {
  const [open, setOpen] = useState(false)
  const licence = LICENCE_DISPLAY[source.licence]
  const tierColor = TIER_COLORS[source.tier]

  return (
    <div className="border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3, borderLeft: `3px solid ${tierColor}` }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-3 py-2.5 text-left"
      >
        <div
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5"
          style={{ backgroundColor: `${tierColor}20`, borderRadius: 2 }}
        >
          <span style={{ color: tierColor, fontSize: 9.5, fontWeight: 700 }}>T{source.tier}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>{source.dataset}</p>
          <p style={{ color: 'var(--text-2)', fontSize: 11 }}>{source.publisher}</p>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: 'var(--muted)' }} /> : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: 'var(--muted)' }} />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.55 }}>{source.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
            <Row label="Publisher">
              <a href={source.publisher_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
                {source.publisher} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </Row>
            <Row label="Coverage">{source.coverage}</Row>
            <Row label="Update frequency">{source.update_frequency}</Row>
            <Row label="Licence">
              {licence.url ? (
                <a href={licence.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
                  {licence.name} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : <span>{licence.name}</span>}
            </Row>
            {source.dataset_url && (
              <Row label="Dataset URL">
                <a href={source.dataset_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
                  Access dataset <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </Row>
            )}
            {source.methodology_url && (
              <Row label="Methodology">
                <a href={source.methodology_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
                  Official methodology <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </Row>
            )}
          </div>

          {source.known_limitations.length > 0 && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Known limitations</p>
              <ul className="space-y-1">
                {source.known_limitations.map((lim, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                    <span style={{ color: 'var(--text-2)', fontSize: 11, lineHeight: 1.45 }}>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0, width: 130, paddingTop: 1 }}>{label}</span>
      <span style={{ flex: 1, color: 'var(--text-2)', fontSize: 11, lineHeight: 1.4 }}>{children}</span>
    </div>
  )
}

export function AboutPage() {
  const [activeSection, setActiveSection] = useState<'overview' | 'sources' | 'metrics' | 'confidence' | 'validation' | 'legal'>('overview')

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'sources', label: 'Data Sources' },
    { id: 'metrics', label: 'Metric Definitions' },
    { id: 'confidence', label: 'Confidence & Provenance' },
    { id: 'validation', label: 'Validation' },
    { id: 'legal', label: 'Legal' },
  ] as const

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-2.5">
      {/* Status bar */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 mb-3 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Shield className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>METHODOLOGY · DATA SOURCES · PROVENANCE · LEGAL</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>{DATA_SOURCES.length} official data sources registered</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Every statistic traceable to an official publication</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <div className="sticky top-16 space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="w-full text-left px-3 py-2 transition-colors"
                style={{
                  backgroundColor: activeSection === s.id ? 'var(--panel)' : 'transparent',
                  border: activeSection === s.id ? '1px solid var(--border)' : '1px solid transparent',
                  borderRadius: 3,
                  color: activeSection === s.id ? 'var(--text)' : 'var(--text-2)',
                  fontSize: 12.5,
                  fontWeight: activeSection === s.id ? 500 : 400,
                }}
              >
                {s.label}
              </button>
            ))}
            <div className="pt-3 space-y-1.5">
              <Link to="/institutions" className="flex items-center gap-1 px-3 py-1.5" style={{ color: 'var(--link)', fontSize: 11 }}>
                Browse institutions <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link to="/reports" className="flex items-center gap-1 px-3 py-1.5" style={{ color: 'var(--link)', fontSize: 11 }}>
                Annual reports registry <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link to="/support" className="flex items-center gap-1 px-3 py-1.5" style={{ color: 'var(--link)', fontSize: 11 }}>
                Contribute data <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-3">
          {/* OVERVIEW */}
          {activeSection === 'overview' && (
            <>
              <Panel title="About HEStats" subtitle="Mission, scope and design philosophy">
                <div className="space-y-3" style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-2)' }}>
                  <p>
                    HEStats is an independent, open-source financial intelligence platform for UK Higher Education.
                    Our mission is to transform publicly available institutional financial data into structured,
                    searchable, comparable and auditable intelligence — accessible to researchers, journalists,
                    finance directors, regulators, students and policy makers without cost or registration.
                  </p>
                  <p>
                    Every statistic displayed on this platform is sourced from an official published document:
                    a HESA dataset, an OfS return, an audited annual report, or a government statistical release.
                    We do not fabricate, estimate, interpolate or AI-generate any financial figure.
                  </p>
                  <p>
                    Where official data has not yet been published for a given institution and year, we display
                    <strong style={{ color: 'var(--text)' }}> "Awaiting official publication"</strong> rather than
                    a placeholder number. Confidence levels are displayed on every metric.
                  </p>
                </div>
              </Panel>

              <Panel title="Coverage" subtitle="Institutions, years and metrics">
                <div className="grid grid-cols-2 sm:grid-cols-4 border-l border-t" style={{ borderColor: 'var(--border)' }}>
                  {[
                    { value: '155+', label: 'Institutions indexed' },
                    { value: '10', label: 'Financial years' },
                    { value: '8', label: 'Official data sources' },
                    { value: '95+', label: 'Verified audited records' },
                  ].map((s) => (
                    <div key={s.label} className="px-3 py-3 border-r border-b" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)' }}>
                      <p className="font-num" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 700 }}>{s.value}</p>
                      <p style={{ color: 'var(--text-2)', fontSize: 11 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Source priority hierarchy" subtitle="Data is always sourced from the highest available tier">
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((tier) => (
                    <div key={tier} className="flex items-center gap-3">
                      <span
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center"
                        style={{ backgroundColor: `${TIER_COLORS[tier]}20`, borderRadius: 2 }}
                      >
                        <span style={{ color: TIER_COLORS[tier], fontSize: 10, fontWeight: 700 }}>T{tier}</span>
                      </span>
                      <span style={{ color: tier <= 2 ? 'var(--text)' : 'var(--text-2)', fontSize: 12.5 }}>
                        {TIER_LABELS[tier]}
                      </span>
                      {tier === 1 && <span className="px-1.5 py-0.5" style={{ backgroundColor: 'var(--positive-bg)', color: 'var(--positive)', fontSize: 9, borderRadius: 2, letterSpacing: '0.05em' }}>PRIMARY</span>}
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}

          {/* DATA SOURCES */}
          {activeSection === 'sources' && (
            <>
              <div
                className="px-3 py-2 border"
                style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}
              >
                <strong style={{ color: 'var(--text)' }}>Source priority:</strong> Financial figures come from Tier 6 (audited institutional accounts) first, cross-referenced against Tier 1 (HESA Finance Open Data). Student figures come from Tier 1 (HESA Students). Click any source to expand its full metadata.
              </div>
              <div className="space-y-1.5">
                {DATA_SOURCES.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            </>
          )}

          {/* METRIC DEFINITIONS */}
          {activeSection === 'metrics' && (
            <Panel title="Metric definitions and provenance" subtitle="How each figure is derived and sourced">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
                      {['Metric', 'Concept / AFR Reference', 'Primary Source', 'Unit', 'Cross-check'].map((h, i) => (
                        <th key={h} className="px-3 py-2" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, textAlign: i === 0 ? 'left' : 'left', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(METRIC_SOURCES).map(([key, meta]) => (
                      <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2">
                          <span className="font-num" style={{ color: 'var(--accent)', fontSize: 11 }}>{key}</span>
                        </td>
                        <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11, maxWidth: 280 }}>{meta.concept}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11 }}>
                          {DATA_SOURCES.find((s) => s.id === meta.primary)?.publisher ?? meta.primary}
                        </td>
                        <td className="px-3 py-2 font-num" style={{ color: 'var(--text-2)', fontSize: 11 }}>{meta.unit}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--muted)', fontSize: 11 }}>
                          {meta.crossCheck ? DATA_SOURCES.find((s) => s.id === meta.crossCheck)?.publisher : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {/* CONFIDENCE & PROVENANCE */}
          {activeSection === 'confidence' && (
            <>
              <Panel title="Confidence levels" subtitle="Every metric carries a confidence classification">
                <div className="space-y-3">
                  {Object.entries(CONFIDENCE_META).map(([key, meta]) => (
                    <div key={key} className="flex gap-3 px-3 py-2.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                      <div className="flex-shrink-0 mt-0.5">
                        {key === 'high' && <CheckCircle className="w-4 h-4" style={{ color: meta.color }} />}
                        {key === 'awaiting' && <AlertCircle className="w-4 h-4" style={{ color: meta.color }} />}
                        {(key === 'medium' || key === 'provisional') && <Clock className="w-4 h-4" style={{ color: meta.color }} />}
                      </div>
                      <div>
                        <p style={{ color: meta.color, fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{meta.label}</p>
                        <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5 }}>{meta.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Provenance requirements" subtitle="What we require before displaying any metric">
                <div className="space-y-2" style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.6 }}>
                  <p>Every metric displayed in HEStats must have at minimum:</p>
                  <ul className="space-y-1.5 mt-2">
                    {[
                      'Original data source (publisher name and URL)',
                      'Dataset or publication name',
                      'Academic or financial year',
                      'Date the data was retrieved',
                      'Last verified timestamp',
                      'Confidence level classification',
                      'Source licence',
                      'Known methodological limitations',
                    ].map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: 'var(--positive)' }} />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-2)' }}>
                    Where provenance cannot be established for a metric, we display <strong style={{ color: 'var(--text)' }}>"Awaiting official publication"</strong> rather than a value. We never use estimated, interpolated or AI-generated figures.
                  </p>
                </div>
              </Panel>

              <Panel title="Update and reconciliation process" subtitle="How new data is incorporated">
                <div className="space-y-2.5" style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.6 }}>
                  {[
                    { step: '1', title: 'Institution publishes annual report', desc: 'Typically November–February following the July financial year end. Figures ingested from audited accounts PDF, marked as Tier 6 Verified.' },
                    { step: '2', title: 'HESA publishes Finance Open Data', desc: 'Typically January–March (12–14 months after year end). HEStats cross-references all verified figures against HESA values and flags discrepancies.' },
                    { step: '3', title: 'Discrepancy review', desc: 'Where institution accounts differ from HESA (e.g. due to restatements, group boundary changes), we retain both values with provenance and document the difference.' },
                    { step: '4', title: 'Version history maintained', desc: 'All source data is version-controlled. Previous values are never deleted — only superseded with a version audit trail.' },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-3">
                      <div
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent)', borderRadius: '50%' }}
                      >
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{s.step}</span>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 2 }}>{s.title}</p>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}

          {/* VALIDATION */}
          {activeSection === 'validation' && (
            <Panel title="Data validation rules" subtitle="Every record passes these checks before being displayed">
              <div className="space-y-2">
                {[
                  { cat: 'Identity', checks: ['UKPRN matches OfS register', 'Institution name matches HESA/OfS canonical name', 'Academic year is a valid string (e.g. 2023-24)', 'No duplicate UKPRN + year records'] },
                  { cat: 'Financial consistency', checks: ['Revenue > 0 for active institutions', 'Surplus = Revenue − Total Expenditure (within £0.5m rounding)', 'Staff costs ≤ Total expenditure', 'Cash ≥ 0', 'Liquidity days = (Cash / Total Expenditure) × 365 (within 2 days)', 'Tuition + Research + Other ≈ Total income (within £1m)'] },
                  { cat: 'Cross-source', checks: ['Institution account figures within 5% of HESA Finance Open Data (flagged if outside)', 'Student FTE cross-referenced against HESA student data', 'Borrowing cross-referenced against any Companies House filings'] },
                  { cat: 'Outlier detection', checks: ['Year-on-year revenue change > ±25% flagged for manual review', 'Surplus margin < −10% or > 25% flagged', 'Liquidity days < 15 flagged as critical', 'Borrowing > 200% of revenue flagged'] },
                ].map((group) => (
                  <div key={group.cat} className="p-3 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                    <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{group.cat}</p>
                    <ul className="space-y-1">
                      {group.checks.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--positive)', fontSize: 10 }}>✓</span>
                          <span style={{ color: 'var(--text-2)', fontSize: 11, lineHeight: 1.45 }}>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* LEGAL */}
          {activeSection === 'legal' && (
            <>
              <Panel title="Legal notice" subtitle="Terms, copyright and disclaimer">
                <div className="space-y-3" style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.65 }}>
                  <p>
                    HEStats (hestats.co.uk) is an independent informational service operated by a student developer.
                    It is not affiliated with HESA, the Office for Students, any university, UCAS, the Student Loans
                    Company, the Department for Education, Companies House, or the Charity Commission.
                  </p>
                  <p>
                    Financial figures presented on this platform are extracted from publicly available official
                    publications and audited accounts. They are provided for informational and educational purposes only.
                    HEStats does not provide financial advice. Users should verify all figures directly from the cited
                    primary sources before making decisions.
                  </p>
                  <p>
                    The underlying PDF annual reports remain copyright of their respective institutions. HEStats links
                    to these documents under fair dealing provisions for the purposes of reporting and research. No PDF
                    content is hosted by HEStats — all links point to institutional or official URLs.
                  </p>
                  <p>
                    HESA, OfS, DfE, UCAS, SLC and Companies House data is used under their respective licences
                    (Open Government Licence v3.0 or Creative Commons Attribution 4.0 as appropriate). Attribution
                    is provided on every metric.
                  </p>
                </div>
              </Panel>

              <Panel title="Open source" subtitle="Source code and data registry">
                <div style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.6 }}>
                  <p>HEStats is open source. The source code, data normalisation scripts, and source registry are
                    publicly available on GitHub. Contributions, corrections and audits are welcome.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link to="/support" className="inline-flex items-center gap-1.5 px-3 py-1.5" style={{ backgroundColor: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, borderRadius: 3 }}>
                      View source & contribute <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Panel>

              <Panel title="Registered data licences" subtitle="Licences under which official data is used">
                <div className="space-y-2">
                  {Object.entries(LICENCE_DISPLAY).map(([key, lic]) => (
                    <div key={key} className="flex items-center gap-3 px-3 py-2 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                      <Database className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--muted)' }} />
                      <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500, flex: 1 }}>{lic.name}</span>
                      {lic.url && (
                        <a href={lic.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
                          View licence <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
