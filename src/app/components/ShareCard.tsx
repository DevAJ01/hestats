import { useState, useRef, useEffect } from 'react'
import { X, Download, Instagram, CheckCircle, Smartphone, Monitor } from 'lucide-react'
import { Institution, FinancialYear } from '../data/types'
import { computeHealthScore } from '../data/health'

interface ShareItem {
  inst: Institution
  fin: FinancialYear
  color: string
}

type Format = 'square' | 'story' | 'landscape'

const FORMAT_SIZES: Record<Format, { w: number; h: number; label: string; icon: React.ReactNode; desc: string }> = {
  square: { w: 1080, h: 1080, label: 'Square', icon: <Instagram className="w-3.5 h-3.5" />, desc: 'Instagram feed · Twitter' },
  story:  { w: 1080, h: 1920, label: 'Story',  icon: <Smartphone className="w-3.5 h-3.5" />, desc: 'Instagram / Snapchat stories' },
  landscape: { w: 1920, h: 1080, label: 'Landscape', icon: <Monitor className="w-3.5 h-3.5" />, desc: 'Twitter / LinkedIn cover' },
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function gradeLabel(grade: string): string {
  const map: Record<string, string> = {
    AAA: 'Exceptional', AA: 'Very Strong', A: 'Strong',
    BBB: 'Adequate', BB: 'Below Avg', B: 'Weak', CCC: 'Stressed',
  }
  return map[grade] ?? grade
}

function gradeHex(grade: string): string {
  const map: Record<string, string> = {
    AAA: '#5fa97b', AA: '#7fb889', A: '#9fc898',
    BBB: '#c2945a', BB: '#d4885a', B: '#cf6660', CCC: '#b84040',
  }
  return map[grade] ?? '#707987'
}

function fmtM(m: number): string {
  if (m >= 1000) return `£${(m / 1000).toFixed(1)}bn`
  return `£${m.toFixed(0)}m`
}

function drawCard(canvas: HTMLCanvasElement, items: ShareItem[], format: Format) {
  const { w, h } = FORMAT_SIZES[format]
  const scale = 2
  canvas.width = w * scale
  canvas.height = h * scale
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`

  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)

  const BG      = '#0d1117'
  const PANEL   = '#161b22'
  const BORDER  = '#21262d'
  const TEXT    = '#f0f6fc'
  const MUTED   = '#8b949e'
  const ACCENT  = '#4a90c4'

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)

  // Subtle grid pattern
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 0.5
  const gridStep = 48
  for (let x = 0; x < w; x += gridStep) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
  for (let y = 0; y < h; y += gridStep) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

  // Top accent bar
  const accentGrad = ctx.createLinearGradient(0, 0, w, 0)
  items.forEach(({ color }, i) => { accentGrad.addColorStop(i / items.length, color); accentGrad.addColorStop((i + 1) / items.length, color) })
  ctx.fillStyle = accentGrad
  ctx.fillRect(0, 0, w, 4)

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const hdrH = format === 'story' ? 120 : 80
  ctx.fillStyle = PANEL
  ctx.fillRect(0, 4, w, hdrH)
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, 4 + hdrH); ctx.lineTo(w, 4 + hdrH); ctx.stroke()

  // HE logo pill
  const padH = format === 'story' ? 32 : 20
  const logoX = padH, logoY = 4 + padH
  ctx.fillStyle = ACCENT
  roundRect(ctx, logoX, logoY, 38, 22, 4)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `700 11px "JetBrains Mono", monospace`
  ctx.fillText('HE', logoX + 7, logoY + 15)

  // HEStats wordmark
  ctx.fillStyle = TEXT
  ctx.font = `600 ${format === 'story' ? 20 : 15}px system-ui, -apple-system, sans-serif`
  ctx.fillText('HEStats', logoX + 48, logoY + 15)
  ctx.fillStyle = MUTED
  ctx.font = `400 ${format === 'story' ? 13 : 10}px "JetBrains Mono", monospace`
  ctx.fillText('hestats.co.uk', logoX + 48, logoY + (format === 'story' ? 33 : 28))

  // Title
  const titleX = w - padH
  ctx.textAlign = 'right'
  ctx.fillStyle = TEXT
  ctx.font = `600 ${format === 'story' ? 20 : 14}px system-ui, sans-serif`
  ctx.fillText('Financial Comparison', titleX, logoY + 15)
  ctx.fillStyle = MUTED
  ctx.font = `400 ${format === 'story' ? 13 : 10}px "JetBrains Mono", monospace`
  const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  ctx.fillText(`FY 2024-25  ·  ${now}`, titleX, logoY + (format === 'story' ? 33 : 28))
  ctx.textAlign = 'left'

  // ── INSTITUTION CARDS ───────────────────────────────────────────────────────
  const contentY = 4 + hdrH + (format === 'story' ? 28 : 20)
  const padCard = format === 'story' ? 28 : 18
  const contentW = w - padCard * 2

  if (format === 'story') {
    // Stacked cards for story format
    const cardH = Math.floor((h - contentY - 120) / items.length) - 12
    items.forEach(({ inst, fin, color }, i) => {
      const health = computeHealthScore(fin)
      const cy = contentY + i * (cardH + 12)
      const cx = padCard

      ctx.fillStyle = PANEL
      roundRect(ctx, cx, cy, contentW, cardH, 8)
      ctx.fill()

      // Left accent stripe
      ctx.fillStyle = color
      roundRect(ctx, cx, cy, 4, cardH, 4)
      ctx.fill()

      // Institution name
      ctx.fillStyle = color
      ctx.font = `700 20px system-ui, sans-serif`
      ctx.fillText(inst.short_name, cx + 22, cy + 34)

      ctx.fillStyle = MUTED
      ctx.font = `400 12px "JetBrains Mono", monospace`
      ctx.fillText(inst.nation, cx + 22, cy + 52)

      // Grade badge
      const badgeX = cx + contentW - 12
      ctx.fillStyle = gradeHex(health.grade) + '33'
      roundRect(ctx, badgeX - 72, cy + 18, 72, 30, 4)
      ctx.fill()
      ctx.fillStyle = gradeHex(health.grade)
      ctx.font = `700 18px "JetBrains Mono", monospace`
      ctx.textAlign = 'center'
      ctx.fillText(health.grade, badgeX - 36, cy + 38)
      ctx.textAlign = 'left'
      ctx.fillStyle = gradeHex(health.grade)
      ctx.font = `400 10px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(gradeLabel(health.grade), badgeX - 36, cy + 52)
      ctx.textAlign = 'left'

      // Metrics row
      const metrics = [
        { l: 'Income', v: fmtM(fin.revenue_gbp_m) },
        { l: 'Surplus', v: `${fin.surplus_margin_pct >= 0 ? '+' : ''}${fin.surplus_margin_pct.toFixed(1)}%` },
        { l: 'Research', v: fmtM(fin.research_income_gbp_m) },
        { l: 'Health', v: `${health.score}/100` },
      ]
      const metW = (contentW - 24 - 90) / metrics.length
      metrics.forEach(({ l, v }, mi) => {
        const mx = cx + 22 + mi * metW
        const my = cy + cardH - 38
        ctx.fillStyle = MUTED
        ctx.font = `400 9px "JetBrains Mono", monospace`
        ctx.fillText(l.toUpperCase(), mx, my)
        ctx.fillStyle = TEXT
        ctx.font = `600 14px "JetBrains Mono", monospace`
        ctx.fillText(v, mx, my + 17)
      })
    })
  } else {
    // Side-by-side columns for square / landscape
    const cols = items.length
    const colW = Math.floor(contentW / cols) - 8
    const cardH = format === 'landscape' ? h - contentY - 80 : h - contentY - 80

    items.forEach(({ inst, fin, color }, ci) => {
      const health = computeHealthScore(fin)
      const cx = padCard + ci * (colW + 8)
      const cy = contentY

      // Card background
      ctx.fillStyle = PANEL
      roundRect(ctx, cx, cy, colW, cardH, 8)
      ctx.fill()

      // Top accent bar per card
      ctx.fillStyle = color
      roundRect(ctx, cx, cy, colW, 4, 4)
      ctx.fill()
      ctx.fillRect(cx, cy + 2, colW, 4)

      const innerPad = 16
      let ry = cy + innerPad + 12

      // Institution name
      ctx.fillStyle = color
      const nameFontSize = format === 'landscape' ? 16 : Math.min(16, Math.floor(colW / 7))
      ctx.font = `700 ${nameFontSize}px system-ui, sans-serif`
      // Clip long names
      const maxNameW = colW - innerPad * 2
      let name = inst.short_name
      while (ctx.measureText(name).width > maxNameW && name.length > 4) name = name.slice(0, -1)
      if (name !== inst.short_name) name += '…'
      ctx.fillText(name, cx + innerPad, ry)
      ry += nameFontSize + 4

      // Nation tag
      ctx.fillStyle = MUTED
      ctx.font = `400 9px "JetBrains Mono", monospace`
      ctx.fillText(inst.nation, cx + innerPad, ry)
      ry += 20

      // Separator
      ctx.strokeStyle = BORDER
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cx + innerPad, ry); ctx.lineTo(cx + colW - innerPad, ry); ctx.stroke()
      ry += 14

      // Grade — big central display
      ctx.fillStyle = gradeHex(health.grade)
      const gradeSize = format === 'landscape' ? 44 : 38
      ctx.font = `800 ${gradeSize}px "JetBrains Mono", monospace`
      ctx.textAlign = 'center'
      ctx.fillText(health.grade, cx + colW / 2, ry + gradeSize)
      ry += gradeSize + 6
      ctx.fillStyle = gradeHex(health.grade)
      ctx.font = `400 9px system-ui, sans-serif`
      ctx.fillText(gradeLabel(health.grade), cx + colW / 2, ry)
      ctx.textAlign = 'left'
      ry += 20

      // Score bar
      const barX = cx + innerPad, barW = colW - innerPad * 2, barH = 5
      ctx.fillStyle = BORDER
      roundRect(ctx, barX, ry, barW, barH, 2); ctx.fill()
      ctx.fillStyle = gradeHex(health.grade)
      roundRect(ctx, barX, ry, barW * (health.score / 100), barH, 2); ctx.fill()
      ry += barH + 6
      ctx.fillStyle = MUTED
      ctx.font = `400 9px "JetBrains Mono", monospace`
      ctx.textAlign = 'center'
      ctx.fillText(`${health.score}/100`, cx + colW / 2, ry)
      ctx.textAlign = 'left'
      ry += 18

      // Separator
      ctx.strokeStyle = BORDER
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cx + innerPad, ry); ctx.lineTo(cx + colW - innerPad, ry); ctx.stroke()
      ry += 14

      // Metrics
      const mets = [
        { l: 'Income', v: fmtM(fin.revenue_gbp_m), c: TEXT },
        { l: 'Surplus', v: `${fin.surplus_margin_pct >= 0 ? '+' : ''}${fin.surplus_margin_pct.toFixed(1)}%`, c: fin.surplus_margin_pct >= 0 ? '#5fa97b' : '#cf6660' },
        { l: 'Research', v: fmtM(fin.research_income_gbp_m), c: TEXT },
        { l: 'Cash', v: fmtM(fin.cash_gbp_m), c: TEXT },
        { l: 'Students', v: `${(fin.student_fte_total / 1000).toFixed(1)}k`, c: TEXT },
      ]

      const metFontL = 8, metFontV = 11
      mets.forEach(({ l, v, c }) => {
        if (ry + 28 > cy + cardH - innerPad) return
        ctx.fillStyle = MUTED
        ctx.font = `400 ${metFontL}px "JetBrains Mono", monospace`
        ctx.fillText(l.toUpperCase(), cx + innerPad, ry)
        ctx.fillStyle = c
        ctx.font = `600 ${metFontV}px "JetBrains Mono", monospace`
        ctx.textAlign = 'right'
        ctx.fillText(v, cx + colW - innerPad, ry + 12)
        ctx.textAlign = 'left'
        ry += 20
      })
    })
  }

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const footerY = h - (format === 'story' ? 80 : 52)
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(padCard, footerY); ctx.lineTo(w - padCard, footerY); ctx.stroke()

  ctx.fillStyle = MUTED
  ctx.font = `400 10px "JetBrains Mono", monospace`
  ctx.fillText('hestats.co.uk  ·  UK HE Financial Intelligence  ·  Data: OfS · HESA · Audited Accounts  ·  CC BY 4.0', padCard, footerY + 18)
  ctx.font = `400 9px "JetBrains Mono", monospace`
  ctx.fillStyle = '#3a414d'
  ctx.fillText('Estimated figures are model-derived. Verified figures sourced from audited institutional accounts.', padCard, footerY + 32)
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ShareCardModal({
  onClose,
  items,
}: {
  onClose: () => void
  items: ShareItem[]
}) {
  const [format, setFormat] = useState<Format>('square')
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)

  // Draw preview (scaled-down) whenever format or items change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !items.length) return
    drawCard(canvas, items, format)

    // Scale down to preview canvas
    const preview = previewRef.current
    if (!preview) return
    const maxPreviewW = 360
    const { w, h } = FORMAT_SIZES[format]
    const scale = maxPreviewW / w
    preview.width = maxPreviewW
    preview.height = Math.round(h * scale)
    preview.style.width = `${maxPreviewW}px`
    preview.style.height = `${Math.round(h * scale)}px`
    const pctx = preview.getContext('2d')!
    pctx.clearRect(0, 0, preview.width, preview.height)
    pctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, preview.width, preview.height)
  }, [format, items])

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading(true)
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hestats-compare-${format}-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
      setDownloading(false)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)
    }, 'image/png')
  }

  function copyUrl() {
    const url = `${window.location.origin}/compare?ids=${items.map((i) => i.inst.id).join(',')}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const { w, h } = FORMAT_SIZES[format]
  const previewMaxW = 360
  const previewH = Math.round((h / w) * previewMaxW)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-3 py-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[900px] overflow-hidden flex flex-col md:flex-row"
        style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 8, maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left — preview */}
        <div
          className="flex items-center justify-center p-4 flex-shrink-0"
          style={{ backgroundColor: '#0d1117', minWidth: 0 }}
        >
          <div className="overflow-hidden" style={{ borderRadius: 6, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <canvas
              ref={previewRef}
              style={{ display: 'block', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          </div>
          {/* Hidden full-res canvas */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Right — controls */}
        <div className="flex flex-col overflow-y-auto" style={{ minWidth: 260, maxWidth: 320, borderLeft: '1px solid var(--border)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={{ color: 'var(--text)', fontSize: 13.5, fontWeight: 600 }}>Share card</p>
              <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>{items.length} institutions compared</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--muted)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 px-4 py-4 space-y-5">
            {/* Format selector */}
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Format</p>
              <div className="space-y-1.5">
                {(Object.entries(FORMAT_SIZES) as [Format, typeof FORMAT_SIZES[Format]][]).map(([key, f]) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{
                      backgroundColor: format === key ? 'var(--panel-hover)' : 'var(--bg-2)',
                      border: `1px solid ${format === key ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 4,
                    }}
                  >
                    <span style={{ color: format === key ? 'var(--accent)' : 'var(--muted)' }}>{f.icon}</span>
                    <div>
                      <p style={{ color: format === key ? 'var(--text)' : 'var(--text-2)', fontSize: 12, fontWeight: format === key ? 600 : 400 }}>
                        {f.label}
                        <span className="font-num ml-1.5" style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 10 }}>
                          {f.w}×{f.h}
                        </span>
                      </p>
                      <p style={{ color: 'var(--muted)', fontSize: 10 }}>{f.desc}</p>
                    </div>
                    {format === key && (
                      <CheckCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: 'var(--accent)' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Institutions list */}
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Included</p>
              <div className="space-y-1.5">
                {items.map(({ inst, fin, color }) => {
                  const h = computeHealthScore(fin)
                  return (
                    <div key={inst.id} className="flex items-center gap-2 px-2.5 py-2" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 3, border: '1px solid var(--border)' }}>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="flex-1 truncate" style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 500 }}>{inst.short_name}</span>
                      <span className="font-num flex-shrink-0" style={{ color: gradeHex(h.grade), fontSize: 11, fontWeight: 700 }}>{h.grade}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="px-3 py-2.5 rounded" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 4 }}>
              <p style={{ color: 'var(--muted)', fontSize: 10, lineHeight: 1.6 }}>
                Download the PNG, then post directly to Instagram, Snapchat, or Twitter/X.
                The card includes attribution and source info automatically.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={download}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-2.5 transition-colors"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#fff',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                opacity: downloading ? 0.7 : 1,
              }}
            >
              {downloaded
                ? <><CheckCircle className="w-4 h-4" /> Saved to device!</>
                : downloading
                ? 'Generating…'
                : <><Download className="w-4 h-4" /> Download PNG</>
              }
            </button>
            <button
              onClick={copyUrl}
              className="w-full flex items-center justify-center gap-2 py-2 transition-colors"
              style={{ border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-2)', fontSize: 12 }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {copied
                ? <><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Link copied!</>
                : 'Copy comparison link'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
