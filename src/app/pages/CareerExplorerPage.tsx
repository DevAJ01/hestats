import { Link } from 'react-router'
import { AlertCircle, ArrowUpRight, Compass } from 'lucide-react'
import { Panel } from '../components/layout/Panel'

export function CareerExplorerPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 py-3 space-y-3">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Compass className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>CAREER EXPLORER</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>Official-source ingestion pending</span>
      </div>

      <Panel title="Career explorer pending verification" subtitle="Synthetic graduate pathway data has been removed from the verified platform">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
          <div className="space-y-3" style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.65 }}>
            <p>
              Degree, employer, salary progression, AI exposure, regional-demand and pathway statistics are withheld until
              each displayed claim is traceable to official or explicitly licensed source records.
            </p>
            <p>
              The financial platform remains available with HESA-backed institution finance rows and explicit pending cells
              where source records are not yet attached.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/universities" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
                Browse verified institutions <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link to="/open-data" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
                Download open data <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}
