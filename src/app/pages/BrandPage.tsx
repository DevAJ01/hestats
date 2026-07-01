import { useRef, useState } from 'react'
import { Copy, Check, ImageIcon, FileCode, X } from 'lucide-react'
import { BrandLogo, BrandMark, LogoTone } from '../components/brand/BrandLogo'
import { BrandBanner, BRAND_FORMATS, BrandFormat } from '../components/brand/BrandBanner'
import { downloadPng, downloadSvg } from '../lib/exportSvg'

const DISPLAY = "'Archivo', sans-serif"
const MONO = "'IBM Plex Mono', monospace"
const INK = '#f5f5f4'
const BLACK = '#0a0a0a'
const OFFWHITE = '#f5f5f4'

// ── A container that exposes its inner <svg> for export ──────────────────────
function Exportable({ name, scale = 1, children, className, dark = true }: { name: string; scale?: number; children: React.ReactNode; className?: string; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  function svg() { return ref.current?.querySelector('svg') as SVGSVGElement | null }
  async function png() { const el = svg(); if (!el) return; setBusy(true); try { await downloadPng(el, name, scale) } finally { setBusy(false) } }
  function svgDl() { const el = svg(); if (el) downloadSvg(el, name) }
  return (
    <div className="group relative">
      <div ref={ref} className={`overflow-hidden [&>svg]:block [&>svg]:w-full [&>svg]:h-auto ${className ?? ''}`} style={{ backgroundColor: dark ? BLACK : OFFWHITE, border: '1px solid var(--border)' }}>
        {children}
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={png} disabled={busy} className="flex items-center gap-1 px-2 py-1" style={btn} title="Download PNG"><ImageIcon className="w-3 h-3" /> PNG</button>
        <button onClick={svgDl} className="flex items-center gap-1 px-2 py-1" style={btn} title="Download SVG"><FileCode className="w-3 h-3" /> SVG</button>
      </div>
    </div>
  )
}
const btn: React.CSSProperties = { backgroundColor: '#141414', border: '1px solid #333', color: INK, fontSize: 10.5, fontWeight: 500, letterSpacing: '0.06em', fontFamily: MONO }

function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a }
function ratioOf(w: number, h: number): string { const g = gcd(w, h); return `${w / g}:${h / g}` }

// One tidy, uniform card per asset. The artwork is letterboxed on a mat inside a
// fixed-height stage so every format lines up regardless of its aspect ratio.
function AssetCard({ format, onPreview }: { format: BrandFormat; onPreview: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'png' | 'svg' | null>(null)
  const [done, setDone] = useState<'png' | 'svg' | null>(null)

  function svg() { return ref.current?.querySelector('svg') as SVGSVGElement | null }
  async function png() {
    const el = svg(); if (!el) return
    setBusy('png')
    try { await downloadPng(el, `hestats-${format.key}`, 1); setDone('png'); setTimeout(() => setDone(null), 1400) } finally { setBusy(null) }
  }
  function svgDl() { const el = svg(); if (!el) return; downloadSvg(el, `hestats-${format.key}`); setDone('svg'); setTimeout(() => setDone(null), 1400) }

  return (
    <div className="flex flex-col overflow-hidden border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--panel)' }}>
      {/* Stage */}
      <div className="relative">
        <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5" style={{ backgroundColor: 'rgba(10,10,10,0.72)', border: '1px solid #2a2a28', color: '#a8a8a2', fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.08em' }}>{ratioOf(format.w, format.h)}</div>
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5" style={{ backgroundColor: 'rgba(10,10,10,0.72)', border: '1px solid #2a2a28', color: '#6b6b66', fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.06em' }}>{format.w}×{format.h}</div>
        <button
          onClick={onPreview}
          className="group block w-full cursor-zoom-in"
          style={{ height: 224, backgroundColor: '#0e0e0e', backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
          title="Click to preview full size"
        >
          <div
            ref={ref}
            className="w-full h-full flex items-center justify-center px-6 py-6 transition-transform duration-200 group-hover:scale-[1.02] [&>svg]:block [&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:shadow-[0_6px_24px_rgba(0,0,0,0.55)] [&>svg]:outline [&>svg]:outline-1 [&>svg]:-outline-offset-1 [&>svg]:outline-white/10"
          >
            <BrandBanner format={format} />
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex-1 min-w-0">
          <p className="truncate" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{format.label}</p>
          <p className="truncate" style={{ color: 'var(--muted)', fontSize: 10.5, fontFamily: MONO }}>{format.platform}</p>
        </div>
        <button onClick={png} disabled={busy === 'png'} className="flex items-center gap-1 px-2 py-1.5" style={btn} title="Download PNG">
          {done === 'png' ? <Check className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />} PNG
        </button>
        <button onClick={svgDl} className="flex items-center gap-1 px-2 py-1.5" style={btn} title="Download SVG">
          {done === 'svg' ? <Check className="w-3 h-3" /> : <FileCode className="w-3 h-3" />} SVG
        </button>
      </div>
    </div>
  )
}

const GREYS = [
  { name: 'Void', hex: '#0a0a0a', note: 'Primary field' },
  { name: 'Carbon', hex: '#141414', note: 'Surfaces' },
  { name: 'Graphite', hex: '#2a2a28', note: 'Hairlines' },
  { name: 'Steel', hex: '#6b6b66', note: 'Metadata' },
  { name: 'Ash', hex: '#a8a8a2', note: 'Secondary' },
  { name: 'Bone', hex: '#f5f5f4', note: 'Primary ink' },
]
const SIGNALS = [
  { name: 'Gain', hex: '#5fa97b' },
  { name: 'Loss', hex: '#cf6660' },
  { name: 'Caution', hex: '#c2945a' },
]

function Kicker({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase', color: '#6b6b66' }}>{children}</span>
}
function SectionHead({ n, kicker, title, desc }: { n: string; kicker: string; title: string; desc: string }) {
  return (
    <div className="mb-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-2"><span style={{ fontFamily: MONO, fontSize: 10, color: '#6b6b66', letterSpacing: '0.2em' }}>{n}</span><Kicker>{kicker}</Kicker></div>
      <h2 style={{ fontFamily: DISPLAY, color: 'var(--text)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>{title}</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4, maxWidth: 640 }}>{desc}</p>
    </div>
  )
}

export function BrandPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [preview, setPreview] = useState<BrandFormat | null>(null)
  function copy(hex: string) { navigator.clipboard?.writeText(hex); setCopied(hex); setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1400) }

  const tiles: { tone: LogoTone; label: string; dark: boolean }[] = [
    { tone: 'onDark', label: 'PRIMARY / ON BLACK', dark: true },
    { tone: 'onLight', label: 'INVERSE / ON WHITE', dark: false },
  ]

  return (
    <div className="max-w-[1500px] mx-auto px-3 sm:px-4 py-3">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 mb-4 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', fontFamily: MONO, fontSize: 11 }}>
        <span style={{ color: 'var(--muted)', letterSpacing: '0.14em' }}>BRAND / IDENTITY SYSTEM</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Monochrome · type-led · hover any asset to export PNG / SVG</span>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden mb-8" style={{ border: '1px solid var(--border)', backgroundColor: BLACK }}>
        <div className="px-6 sm:px-14 py-20 flex flex-col items-center text-center">
          <BrandLogo variant="stacked" tone="onDark" size={40} />
          <div className="mt-10 mb-1" style={{ width: 40, height: 1, backgroundColor: '#2a2a28' }} />
          <p className="mt-6" style={{ fontFamily: DISPLAY, color: INK, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', textTransform: 'uppercase', maxWidth: 700, lineHeight: 1.05 }}>
            Intelligence infrastructure for UK higher education
          </p>
          <p className="mt-3" style={{ color: '#a8a8a2', fontSize: 14, maxWidth: 500 }}>
            A monochrome, type-led identity built for precision. No decoration — the wordmark, the grid, and the data carry the brand.
          </p>
        </div>
      </div>

      {/* ── LOGO ────────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionHead n="01" kicker="Identity" title="The mark" desc="The wordmark is the logo, set in a wide aerospace face. The aperture mark stands in where the wordmark can't — favicons, avatars, app icons. Monochrome only." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {tiles.map((t) => (
            <div key={t.tone} className="relative flex items-center justify-center min-h-[160px] border" style={{ backgroundColor: t.dark ? BLACK : OFFWHITE, borderColor: 'var(--border)' }}>
              <BrandLogo variant="lockup" tone={t.tone} size={22} />
              <span className="absolute bottom-2.5 left-3" style={{ color: t.dark ? '#6b6b66' : '#a8a8a2', fontSize: 9.5, fontFamily: MONO, letterSpacing: '0.14em' }}>{t.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Exportable name="hestats-mark-white" scale={5} className="flex items-center justify-center py-9" dark>
            <div className="w-[92px]"><MarkSvg tone="onDark" /></div>
          </Exportable>
          <Exportable name="hestats-mark-black" scale={5} className="flex items-center justify-center py-9" dark={false}>
            <div className="w-[92px]"><MarkSvg tone="onLight" /></div>
          </Exportable>
          <div className="flex flex-col items-center justify-center gap-3 py-9 border" style={{ backgroundColor: BLACK, borderColor: 'var(--border)' }}>
            <BrandMark size={18} tone="onDark" />
            <BrandMark size={28} tone="onDark" />
            <span style={{ color: '#6b6b66', fontSize: 9.5, fontFamily: MONO, letterSpacing: '0.1em' }}>16PX MINIMUM</span>
          </div>
          <div className="flex items-center justify-center py-9 border" style={{ backgroundColor: OFFWHITE, borderColor: 'var(--border)' }}>
            <BrandLogo variant="wordmark" tone="onLight" size={17} showTag={false} />
          </div>
        </div>

        {/* clear space & misuse */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
          <div className="p-5 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}>
            <Kicker>Clear space & scale</Kicker>
            <div className="flex items-center gap-6 mt-3">
              <div className="p-4" style={{ border: '1px dashed var(--border-strong)' }}><BrandMark size={52} tone="onDark" /></div>
              <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6 }}>Maintain padding equal to the aperture's ring weight on all sides. Mark minimum <strong style={{ color: 'var(--text)' }}>16px</strong>; lockup minimum width <strong style={{ color: 'var(--text)' }}>140px</strong>.</p>
            </div>
          </div>
          <div className="p-5 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}>
            <Kicker>Never</Kicker>
            <ul className="space-y-1.5 mt-3">
              {['Introduce colour into the mark or wordmark', 'Re-typeset the wordmark in another typeface', 'Add gradients, glows, bevels or shadows', 'Condense, stretch, outline or rotate'].map((d) => (
                <li key={d} className="flex items-center gap-2" style={{ color: 'var(--text-2)', fontSize: 12 }}><X className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--negative)' }} /> {d}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── SOCIAL ──────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionHead n="02" kicker="Deployment" title="Social kit" desc="Ready-to-post templates for every platform, each at its exact native resolution. Export a print-crisp PNG or an infinitely scalable SVG, or click a tile to preview it full size." />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4">
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#6b6b66', letterSpacing: '0.14em' }}>{BRAND_FORMATS.length} FORMATS</span>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span style={{ color: 'var(--text-2)', fontSize: 11.5 }}>Profile · Open Graph · X · LinkedIn · YouTube · Instagram feed & story</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {BRAND_FORMATS.map((f) => (
            <AssetCard key={f.key} format={f} onPreview={() => setPreview(f)} />
          ))}
        </div>
      </section>

      {/* ── COLOUR ──────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionHead n="03" kicker="Colour" title="Greyscale" desc="The brand is monochrome. Six greys carry everything from field to ink. Colour appears only as functional data signals — never in the identity. Click to copy." />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-3">
          {GREYS.map((c) => (
            <button key={c.hex} onClick={() => copy(c.hex)} className="text-left border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="h-20 flex items-end justify-end p-1.5" style={{ backgroundColor: c.hex }}>
                {copied === c.hex && <span className="flex items-center gap-1 px-1.5 py-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9, fontFamily: MONO }}><Check className="w-3 h-3" /> COPIED</span>}
              </div>
              <div className="px-2.5 py-2" style={{ backgroundColor: 'var(--panel)' }}>
                <p style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600 }}>{c.name}</p>
                <p className="flex items-center gap-1" style={{ color: 'var(--muted)', fontSize: 10, fontFamily: MONO }}>{c.hex} <Copy className="w-2.5 h-2.5" /></p>
                <p style={{ color: 'var(--text-2)', fontSize: 10 }}>{c.note}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: 'var(--muted)', fontSize: 10.5, fontFamily: MONO, letterSpacing: '0.14em' }}>DATA SIGNALS ONLY —</span>
          {SIGNALS.map((s) => (
            <button key={s.hex} onClick={() => copy(s.hex)} className="flex items-center gap-1.5 px-2 py-1 border" style={{ borderColor: 'var(--border)' }}>
              <span style={{ width: 10, height: 10, backgroundColor: s.hex, display: 'inline-block' }} />
              <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{s.name}</span>
              <span style={{ color: 'var(--muted)', fontSize: 10, fontFamily: MONO }}>{s.hex}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── TYPE ────────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionHead n="04" kicker="Typography" title="Type system" desc="Archivo carries the wordmark, headlines and UI — a grounded grotesque with real weight and gravitas. IBM Plex Mono handles every number, label and identifier." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="p-5 border" style={{ backgroundColor: BLACK, borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4"><span style={{ color: INK, fontSize: 12, fontFamily: MONO }}>ARCHIVO BLACK</span><span style={{ color: '#6b6b66', fontSize: 10, fontFamily: MONO }}>WORDMARK</span></div>
            <p style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, letterSpacing: '0.01em', color: INK, textTransform: 'uppercase' }}>HEStats</p>
            <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 12, letterSpacing: '0.02em', color: '#a8a8a2', marginTop: 14 }}>ABCDEFGHIJ 0123456789</p>
          </div>
          <div className="p-5 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4"><span style={{ color: 'var(--text)', fontSize: 12, fontFamily: MONO }}>ARCHIVO</span><span style={{ color: 'var(--muted)', fontSize: 10, fontFamily: MONO }}>UI · HEADLINES</span></div>
            <p style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', color: 'var(--text)', textTransform: 'uppercase', lineHeight: 1 }}>Measured<br />precisely</p>
            <p style={{ fontFamily: DISPLAY, fontSize: 12.5, color: 'var(--text-2)', marginTop: 12 }}>Regular · Medium · Semibold · Bold · Black</p>
          </div>
          <div className="p-5 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4"><span style={{ color: 'var(--text)', fontSize: 12, fontFamily: MONO }}>IBM PLEX MONO</span><span style={{ color: 'var(--muted)', fontSize: 10, fontFamily: MONO }}>DATA</span></div>
            <p style={{ fontFamily: MONO, fontSize: 24, color: 'var(--text)' }}>£2,860M ▲7.4%</p>
            <p style={{ fontFamily: MONO, fontSize: 12.5, color: 'var(--text-2)', marginTop: 14, letterSpacing: '0.02em' }}>UKPRN 10007774<br />FY2024-25 · 51.7520°N</p>
          </div>
        </div>
      </section>

      {/* Full-size preview */}
      {preview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={() => setPreview(null)}>
          <div className="relative max-w-[92vw] max-h-[88vh] overflow-auto" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid #333' }}>
            <div className="[&>svg]:block [&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-[92vw] [&>svg]:max-h-[80vh]"><BrandBanner format={preview} /></div>
          </div>
          <button onClick={() => setPreview(null)} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center" style={{ backgroundColor: '#141414', border: '1px solid #333', color: INK }}><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  )
}

// Standalone aperture mark as a real <svg> for export.
function MarkSvg({ tone }: { tone: LogoTone }) {
  const color = tone === 'onDark' ? '#f5f5f4' : '#0a0a0a'
  return (
    <svg width="92" height="92" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="13" width="9.5" height="38" fill={color} />
      <rect x="40.5" y="13" width="9.5" height="38" fill={color} />
      <path d="M23.5 36 L40.5 26 L40.5 34.5 L23.5 44.5 Z" fill={color} />
    </svg>
  )
}
