import { useId, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, BookOpen, ChevronDown } from 'lucide-react'
import { OFS_ANNUAL_REPORT, OFS_REPORT_METRICS, type OfsReportMetric } from '../../data/ofsAnnualReport'

export function formatOfsMetric(metric: OfsReportMetric) {
  const value = metric.value.toLocaleString('en-GB', { maximumFractionDigits: 3 })
  const prefix = metric.status === 'approximate' ? '≈ ' : ''
  return prefix + (metric.unit === 'GBP million' ? `£${value}m` : metric.unit === 'percent' ? `${value}%` : value)
}

const groups = {
  resilience: { label: 'Financial resilience', keys: ['deficit_actual', 'deficit_forecast', 'formal_monitoring', 'forecast_accuracy'] },
  students: { label: 'Student experience', keys: ['teaching_positive', 'mental_health', 'uni_connect', 'organisation_positive'] },
  funding: { label: 'Public funding', keys: ['total_grant', 'teaching_grant', 'capital_grant', 'total_grant_prior'] },
} as const

export function OfsReportPanel({ compact = false, initialGroup = 'resilience' }: { compact?: boolean; initialGroup?: keyof typeof groups }) {
  const [group, setGroup] = useState<keyof typeof groups>(initialGroup)
  const id = useId()
  return <section className={`report-brief ${compact ? 'report-brief-compact' : ''}`} aria-labelledby={`${id}-title`}>
    <div className="report-brief-heading">
      <div>
        <p className="eyebrow"><BookOpen size={14} aria-hidden="true" /> Evidence update · England</p>
        <h2 id={`${id}-title`}>A clearer view of sector resilience.</h2>
        <p>OfS Annual report 2025–26 · Published 14 July 2026</p>
      </div>
      <a className="observatory-button" href={OFS_ANNUAL_REPORT.url} target="_blank" rel="noreferrer">Read report <ArrowUpRight size={16} /></a>
    </div>
    {!compact && <div className="report-filters" role="group" aria-label="Report topic">
      {Object.entries(groups).map(([key, value]) => <button key={key} aria-pressed={group === key} onClick={() => setGroup(key as keyof typeof groups)}>{value.label}</button>)}
    </div>}
    <div className="report-metrics" key={group}>
      {groups[group].keys.map((key) => {
        const metric = OFS_REPORT_METRICS[key]
        return <article key={key}>
          <span className={`evidence-label ${metric.status}`}>{metric.status === 'forecast' ? 'Forecast' : 'Reported'}</span>
          <strong>{formatOfsMetric(metric)}</strong>
          <h3>{metric.label}</h3>
          <p>{metric.period}</p>
          <a href={metric.source_url} target="_blank" rel="noreferrer" aria-label={`${metric.label}: report page ${metric.printed_page}`}>p. {metric.printed_page} <ArrowUpRight size={12} /></a>
        </article>
      })}
    </div>
    <div className="report-brief-footer">
      <p>England evidence. Actuals, forecasts and monitoring cycles have different coverage.</p>
      {compact ? <Link className="text-link" to="/reports#ofs-annual-report">Explore the evidence <ArrowUpRight size={14} /></Link> : <details>
        <summary>Coverage & interpretation <ChevronDown size={14} /></summary>
        <p>{OFS_ANNUAL_REPORT.scope} The report covers {OFS_ANNUAL_REPORT.period}, but each metric has its own period. Grant disbursements are not university income. Forecasts are not realised results.</p>
        {groups[group].keys.map((key) => <p key={key}><strong>{OFS_REPORT_METRICS[key].label}:</strong> {OFS_REPORT_METRICS[key].notes}</p>)}
        <Link className="text-link" to="/intelligence">All report findings and source notes <ArrowUpRight size={14} /></Link>
      </details>}
    </div>
  </section>
}
