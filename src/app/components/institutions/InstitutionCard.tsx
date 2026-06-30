import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { Institution, FinancialYear } from '../../data/types'
import { RiskBadge } from './RiskBadge'
import { NationBadge } from './NationBadge'
import { DataSourceBadge } from './DataSourceBadge'
import { getFinancialsByInstitution } from '../../data/financials'
import { Sparkline } from '../charts/Sparkline'

interface InstitutionCardProps {
  institution: Institution
  financial: FinancialYear
}

export function InstitutionCard({ institution, financial }: InstitutionCardProps) {
  const history = getFinancialsByInstitution(institution.id).sort((a, b) =>
    a.fiscal_year.localeCompare(b.fiscal_year),
  )
  const sparkValues = history.map((h) => h.revenue_gbp_m)
  const isPositiveSurplus = financial.surplus_margin_pct >= 0

  return (
    <Link
      to={`/institutions/${institution.id}`}
      className="block transition-colors group"
      style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 4 }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div className="px-3 py-2.5 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span style={{ color: 'var(--muted)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
              {institution.ukprn}
            </span>
            <NationBadge nation={institution.nation} size="sm" />
            <DataSourceBadge source={financial.data_source} size="sm" />
          </div>
          <p
            className="truncate transition-colors group-hover:underline"
            style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}
          >
            {institution.short_name}
          </p>
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--muted)' }} />
      </div>

      <div className="px-3 py-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
        <Metric
          label="Revenue"
          value={`£${financial.revenue_gbp_m.toLocaleString()}m`}
          spark={<Sparkline values={sparkValues} width={56} height={14} color="#7396c2" />}
        />
        <Metric
          label="Margin"
          value={`${financial.surplus_margin_pct.toFixed(1)}%`}
          valueColor={isPositiveSurplus ? 'var(--positive)' : 'var(--negative)'}
        />
        <Metric label="Research" value={`£${financial.research_income_gbp_m}m`} />
        <Metric label="Liquidity" value={`${financial.liquidity_days}d`} />
      </div>

      <div
        className="px-3 py-2 flex items-center justify-between border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)' }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
          FY{financial.fiscal_year}
        </span>
        <RiskBadge risk={financial.risk_flag} size="sm" />
      </div>
    </Link>
  )
}

function Metric({
  label,
  value,
  valueColor,
  spark,
}: {
  label: string
  value: string
  valueColor?: string
  spark?: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <p
        style={{
          color: 'var(--muted)',
          fontSize: 9.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 1,
        }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-1.5 justify-between">
        <span
          className="tabular-nums truncate"
          style={{ color: valueColor ?? 'var(--text)', fontSize: 13, fontWeight: 600 }}
        >
          {value}
        </span>
        {spark}
      </div>
    </div>
  )
}
