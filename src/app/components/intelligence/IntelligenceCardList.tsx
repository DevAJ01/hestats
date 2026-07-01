import { ArrowUpRight, BadgeCheck, FileText } from 'lucide-react'
import type { IntelligenceRecord } from '../../data/intelligence'

function statusLabel(row: IntelligenceRecord) {
  if (row.claim_type === 'external-analysis') return 'External analysis'
  if (row.claim_type === 'official-statistic') return 'Official statistic'
  if (row.claim_type === 'regulator-publication') return 'Regulator publication'
  if (row.claim_type === 'government-policy') return 'Government policy'
  return 'Geospatial reference'
}

function statusColor(row: IntelligenceRecord) {
  if (row.claim_type === 'external-analysis') return 'var(--warning)'
  if (row.confidence === 'high') return 'var(--positive)'
  if (row.confidence === 'provisional') return 'var(--warning)'
  return 'var(--link)'
}

function formatMetric(value: number | null, unit: string) {
  if (value === null) return 'Pending'
  if (unit.startsWith('GBP')) return `GBP ${value.toLocaleString()}`
  if (unit === 'percent') return `${value.toLocaleString()}%`
  if (unit === 'USD trillion') return `$${value.toLocaleString()}tn`
  return value.toLocaleString()
}

export function IntelligenceCardList({ records, compact = false }: { records: IntelligenceRecord[]; compact?: boolean }) {
  if (!records.length) {
    return (
      <div className="px-3 py-3 border" style={{ borderColor: 'var(--border)', borderRadius: 3, backgroundColor: 'var(--bg-2)' }}>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>No verified intelligence records are currently attached for this view.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {records.map((row) => (
        <article key={row.id} className="border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
          <div className="p-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5"
                style={{ color: statusColor(row), border: `1px solid ${statusColor(row)}`, borderRadius: 2, fontSize: 9.5, fontWeight: 600 }}
              >
                <BadgeCheck className="w-3 h-3" /> {statusLabel(row)}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>{row.publisher}</span>
              <span style={{ color: 'var(--border-strong)', fontSize: 10 }}>|</span>
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>Published {row.published_date}</span>
              <span style={{ color: 'var(--border-strong)', fontSize: 10 }}>|</span>
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>Verified {row.last_verified}</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p style={{ color: 'var(--text)', fontSize: compact ? 12 : 13, fontWeight: 600 }}>{row.title}</p>
                <p style={{ color: 'var(--text-2)', fontSize: compact ? 11 : 12, lineHeight: 1.55, marginTop: 4 }}>{row.summary}</p>
              </div>
              <a href={row.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 flex-shrink-0 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
                Source <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            {!compact && row.metrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 mt-3">
                {row.metrics.slice(0, 4).map((metric) => (
                  <div key={metric.key} className="px-2 py-2 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
                    <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{metric.label}</p>
                    <p className="font-num tabular-nums" style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>
                      {formatMetric(metric.value, metric.unit)}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 9.5, marginTop: 2 }}>{metric.period}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-1.5 mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--muted)' }} />
              <p style={{ color: 'var(--muted)', fontSize: 10.5, lineHeight: 1.4 }}>{row.source_reference}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
