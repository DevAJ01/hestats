import { useState } from 'react'
import { Info, ExternalLink, ChevronDown, ChevronUp, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { getSourceById, CONFIDENCE_META, LICENCE_DISPLAY, Confidence, DataSourceDef } from '../../data/sources'

interface SourcePanelProps {
  sourceId: string
  confidence?: Confidence
  publication?: string
  sourceUrl?: string
  lastVerified?: string
  concept?: string
  notes?: string
  inline?: boolean
}

function ConfidenceIcon({ confidence }: { confidence: Confidence }) {
  const meta = CONFIDENCE_META[confidence]
  if (confidence === 'high') return <CheckCircle className="w-3 h-3" style={{ color: meta.color }} />
  if (confidence === 'awaiting') return <AlertCircle className="w-3 h-3" style={{ color: meta.color }} />
  return <Clock className="w-3 h-3" style={{ color: meta.color }} />
}

export function SourcePanel({
  sourceId,
  confidence = 'high',
  publication,
  sourceUrl,
  lastVerified,
  concept,
  notes,
  inline = false,
}: SourcePanelProps) {
  const [open, setOpen] = useState(false)
  const source = getSourceById(sourceId)
  const confMeta = CONFIDENCE_META[confidence]
  const licence = source ? LICENCE_DISPLAY[source.licence] : null

  const trigger = (
    <button
      onClick={() => setOpen(!open)}
      className="inline-flex items-center gap-1 transition-colors"
      style={{
        color: open ? 'var(--text-2)' : 'var(--muted)',
        fontSize: 10,
        letterSpacing: '0.04em',
      }}
      title="View data source"
    >
      <Info className="w-3 h-3" />
      Source
      {open ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
    </button>
  )

  if (!open) return trigger

  return (
    <div>
      {trigger}
      <div
        className="mt-1.5"
        style={{
          backgroundColor: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 3,
          padding: '10px 12px',
          fontSize: 11,
        }}
      >
        {/* Confidence */}
        <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <ConfidenceIcon confidence={confidence} />
          <span style={{ color: confMeta.color, fontWeight: 600, fontSize: 11 }}>{confMeta.label}</span>
          <span style={{ color: 'var(--muted)', fontSize: 10 }}>— {confMeta.description}</span>
        </div>

        <div className="space-y-1.5">
          {/* Publisher */}
          {source && (
            <Row label="Publisher">
              <a href={source.publisher_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)' }}>
                {source.publisher} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </Row>
          )}

          {/* Dataset */}
          {source && (
            <Row label="Dataset">
              {source.dataset_url ? (
                <a href={source.dataset_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)' }}>
                  {source.dataset} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span style={{ color: 'var(--text-2)' }}>{source.dataset}</span>
              )}
            </Row>
          )}

          {/* Publication */}
          {publication && (
            <Row label="Publication">
              {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)' }}>
                  {publication} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span style={{ color: 'var(--text-2)' }}>{publication}</span>
              )}
            </Row>
          )}

          {/* Concept / metric definition */}
          {concept && (
            <Row label="Metric definition">
              <span style={{ color: 'var(--text-2)' }}>{concept}</span>
            </Row>
          )}

          {/* Last verified */}
          {lastVerified && (
            <Row label="Last verified">
              <span className="font-num" style={{ color: 'var(--text-2)' }}>{lastVerified}</span>
            </Row>
          )}

          {/* Update frequency */}
          {source && (
            <Row label="Update frequency">
              <span style={{ color: 'var(--text-2)' }}>{source.update_frequency}</span>
            </Row>
          )}

          {/* Licence */}
          {licence && (
            <Row label="Licence">
              {licence.url ? (
                <a href={licence.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)' }}>
                  {licence.name} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span style={{ color: 'var(--text-2)' }}>{licence.name}</span>
              )}
            </Row>
          )}

          {/* Notes */}
          {notes && (
            <Row label="Notes">
              <span style={{ color: 'var(--muted)' }}>{notes}</span>
            </Row>
          )}

          {/* Known limitations */}
          {source && source.known_limitations.length > 0 && (
            <div>
              <span style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Known limitations</span>
              <ul className="mt-1 space-y-0.5">
                {source.known_limitations.map((lim, i) => (
                  <li key={i} className="flex items-start gap-1.5" style={{ color: 'var(--muted)', fontSize: 10 }}>
                    <span style={{ flexShrink: 0, marginTop: 3 }}>·</span>
                    {lim}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Methodology link */}
          {source?.methodology_url && (
            <Row label="Methodology">
              <a href={source.methodology_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)' }}>
                Official methodology <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </Row>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0, width: 110, paddingTop: 1 }}>
        {label}
      </span>
      <span style={{ flex: 1, fontSize: 11, lineHeight: 1.4 }}>{children}</span>
    </div>
  )
}

// ─── Inline "Source" badge for chart/panel headers ────────────────────────────
export function SourceBadge({ confidence, onClick }: { confidence?: Confidence; onClick: () => void }) {
  const meta = CONFIDENCE_META[confidence ?? 'high']
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 transition-colors"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 2,
        color: meta.color,
        fontSize: 9,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      <Shield className="w-2.5 h-2.5" />
      {meta.label}
    </button>
  )
}

// ─── Awaiting publication placeholder ────────────────────────────────────────
export function AwaitingPublication({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{ color: 'var(--muted)', fontSize: 11, fontStyle: 'italic' }}
      title="Official figures have not yet been published for this period"
    >
      Awaiting official publication
    </span>
  )
}
