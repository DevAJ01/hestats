import { Link } from 'react-router'
import { Institution, FinancialYear } from '../../data/types'
import { RiskBadge } from './RiskBadge'
import { NationBadge } from './NationBadge'
import { DataSourceBadge } from './DataSourceBadge'
import { formatCurrencyM, formatDays, formatPct, isKnownNumber } from '../../data/financials'

interface InstitutionRowProps {
  institution: Institution
  financial: FinancialYear
  rank?: number
}

export function InstitutionRow({ institution, financial, rank }: InstitutionRowProps) {
  const isPositiveSurplus = isKnownNumber(financial.surplus_margin_pct) && financial.surplus_margin_pct >= 0

  return (
    <tr
      className="transition-colors group"
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {rank !== undefined && (
        <td
          className="px-3 py-2 tabular-nums"
          style={{ color: 'var(--muted)', fontSize: 11, width: 36, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {rank.toString().padStart(2, '0')}
        </td>
      )}
      <td className="px-3 py-2">
        <Link to={`/universities/${institution.id}`} className="flex items-center gap-2.5 min-w-0">
          <NationBadge nation={institution.nation} size="sm" />
          <div className="min-w-0">
            <p
              className="truncate transition-colors group-hover:underline"
              style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 500 }}
            >
              {institution.canonical_name}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
              {institution.ukprn ?? 'UKPRN pending'} · {institution.mission_group ?? '—'}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>
        {formatCurrencyM(financial.revenue_gbp_m)}
      </td>
      <td
        className="px-3 py-2 tabular-nums text-right"
        style={{ fontSize: 12, color: isPositiveSurplus ? 'var(--positive)' : 'var(--negative)', fontWeight: 500 }}
      >
        {formatPct(financial.surplus_margin_pct)}
      </td>
      <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>
        {formatCurrencyM(financial.research_income_gbp_m)}
      </td>
      <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>
        {formatDays(financial.liquidity_days)}
      </td>
      <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>
        {formatCurrencyM(financial.borrowing_gbp_m)}
      </td>
      <td className="px-3 py-2 text-right">
        <RiskBadge risk={financial.risk_flag} size="sm" />
      </td>
      <td className="px-3 py-2 text-right">
        <DataSourceBadge source={financial.data_source} size="sm" />
      </td>
    </tr>
  )
}
