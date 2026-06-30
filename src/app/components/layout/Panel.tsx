import React from 'react'

interface PanelProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  padded?: boolean
  className?: string
}

export function Panel({ title, subtitle, action, children, padded = true, className = '' }: PanelProps) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 3 }}
    >
      <div
        className="px-3 py-2 flex items-center justify-between gap-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="min-w-0">
          <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{title}</p>
          {subtitle && <p style={{ color: 'var(--muted)', fontSize: 10 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={padded ? 'p-3' : ''}>{children}</div>
    </div>
  )
}
