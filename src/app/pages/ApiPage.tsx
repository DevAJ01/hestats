import { useState } from 'react'
import { Link } from 'react-router'
import {
  Terminal, Copy, CheckCircle,
  Play, Clock, Database, Shield, Zap, BookOpen,
  ArrowUpRight, Activity, Key, Globe, RefreshCw,
  Heart, Hash
} from 'lucide-react'
import { dispatchRequest, type ApiResponse } from '../api/runtime'
import { AVAILABLE_YEARS } from '../data/financials'
import { institutions } from '../data/institutions'

const BASE = 'https://api.hestats.co.uk/v1'

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'curl' | 'python' | 'javascript' | 'r'

interface EndpointDef {
  group: string
  method: 'GET' | 'POST'
  path: string
  summary: string
  description: string
  params: { name: string; in: 'path' | 'query'; type: string; required: boolean; description: string; example?: string }[]
  examplePath: string
  exampleQuery?: string
}

// ─── Endpoint catalogue ────────────────────────────────────────────────────────

const ENDPOINTS: EndpointDef[] = [
  {
    group: 'Institutions',
    method: 'GET', path: '/institutions',
    summary: 'List institutions',
    description: 'Returns all UK Higher Education providers. Supports filtering by nation, mission group, and free-text query. Results are paginated.',
    params: [
      { name: 'nation', in: 'query', type: 'string', required: false, description: 'Filter by nation', example: 'England' },
      { name: 'mission_group', in: 'query', type: 'string', required: false, description: 'Filter by mission group (partial match)', example: 'Russell Group' },
      { name: 'q', in: 'query', type: 'string', required: false, description: 'Free-text search on name or UKPRN', example: 'manchester' },
      { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Results per page (1–200, default 50)', example: '10' },
      { name: 'offset', in: 'query', type: 'integer', required: false, description: 'Pagination offset', example: '0' },
    ],
    examplePath: '/institutions',
    exampleQuery: 'nation=England&mission_group=Russell Group&limit=5',
  },
  {
    group: 'Institutions',
    method: 'GET', path: '/institutions/{id}',
    summary: 'Get institution',
    description: 'Full institution profile by HEStats ID or UKPRN. Includes latest financial health assessment.',
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'HEStats ID (e.g. oxford) or UKPRN (e.g. 10007774)', example: 'oxford' },
    ],
    examplePath: '/institutions/oxford',
  },
  {
    group: 'Institutions',
    method: 'GET', path: '/institutions/{id}/financials',
    summary: 'Institution financials',
    description: 'Annual financial statements for an institution across all 10 available years. Filter by year range or specific fiscal year.',
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'HEStats ID or UKPRN', example: 'cambridge' },
      { name: 'fiscal_year', in: 'query', type: 'string', required: false, description: 'Exact year, e.g. 2023-24', example: '2023-24' },
      { name: 'from', in: 'query', type: 'string', required: false, description: 'Start year (inclusive)', example: '2020-21' },
      { name: 'to', in: 'query', type: 'string', required: false, description: 'End year (inclusive)', example: '2024-25' },
    ],
    examplePath: '/institutions/cambridge/financials',
    exampleQuery: 'from=2022-23',
  },
  {
    group: 'Institutions',
    method: 'GET', path: '/institutions/{id}/health',
    summary: 'Health score',
    description: 'Composite financial health score (0–100) and letter grade (AAA–CCC) with component breakdown for the latest available year.',
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'HEStats ID or UKPRN', example: 'imperial' },
    ],
    examplePath: '/institutions/imperial/health',
  },
  {
    group: 'Sector',
    method: 'GET', path: '/sector/summary',
    summary: 'Sector aggregates',
    description: 'Sector-wide aggregate financial statistics for any available year — total income, surplus, borrowing, average health, and grade distribution.',
    params: [
      { name: 'fiscal_year', in: 'query', type: 'string', required: false, description: `Fiscal year (default: ${AVAILABLE_YEARS[0]})`, example: '2023-24' },
    ],
    examplePath: '/sector/summary',
    exampleQuery: `fiscal_year=${AVAILABLE_YEARS[0]}`,
  },
  {
    group: 'Rankings',
    method: 'GET', path: '/rankings',
    summary: 'League table',
    description: 'Ranked list of institutions by any financial metric. Supports filtering by nation and sorting direction.',
    params: [
      { name: 'metric', in: 'query', type: 'string', required: true, description: 'Metric key (see /metrics for full list)', example: 'research' },
      { name: 'fiscal_year', in: 'query', type: 'string', required: false, description: 'Year to rank (default: latest)', example: '2024-25' },
      { name: 'order', in: 'query', type: 'string', required: false, description: 'asc or desc (default: desc)', example: 'desc' },
      { name: 'nation', in: 'query', type: 'string', required: false, description: 'Filter by nation', example: 'Scotland' },
      { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Results (1–200, default 50)', example: '10' },
    ],
    examplePath: '/rankings',
    exampleQuery: 'metric=research&limit=10&order=desc',
  },
  {
    group: 'Rankings',
    method: 'GET', path: '/health-scores',
    summary: 'All health scores',
    description: 'Financial health scores for every institution. Filter by grade or nation. Sorted by score descending by default.',
    params: [
      { name: 'grade', in: 'query', type: 'string', required: false, description: 'Filter by grade: AAA, AA, A, BBB, BB, B, CCC', example: 'AAA' },
      { name: 'nation', in: 'query', type: 'string', required: false, description: 'Filter by nation', example: 'Wales' },
      { name: 'order', in: 'query', type: 'string', required: false, description: 'asc or desc', example: 'asc' },
      { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Max results', example: '20' },
    ],
    examplePath: '/health-scores',
    exampleQuery: 'grade=AAA',
  },
  {
    group: 'Compare',
    method: 'GET', path: '/compare',
    summary: 'Side-by-side comparison',
    description: 'All financial metrics side-by-side for up to 6 institutions. Use HEStats IDs or UKPRNs in a comma-separated list.',
    params: [
      { name: 'ids', in: 'query', type: 'string', required: true, description: 'Comma-separated HEStats IDs or UKPRNs (max 6)', example: 'oxford,cambridge,imperial' },
      { name: 'fiscal_year', in: 'query', type: 'string', required: false, description: 'Year for comparison (default: latest)', example: '2024-25' },
    ],
    examplePath: '/compare',
    exampleQuery: 'ids=oxford,cambridge,imperial,ucl&fiscal_year=2024-25',
  },
  {
    group: 'Reference',
    method: 'GET', path: '/years',
    summary: 'Available years',
    description: 'List of all fiscal years in the HEStats dataset with institution reporting counts.',
    params: [],
    examplePath: '/years',
  },
  {
    group: 'Reference',
    method: 'GET', path: '/metrics',
    summary: 'Metric catalogue',
    description: 'Full catalogue of available financial metrics with keys, labels, units, and descriptions.',
    params: [],
    examplePath: '/metrics',
  },
]

// ─── Code generation ───────────────────────────────────────────────────────────

function buildUrl(ep: EndpointDef, customQuery?: string) {
  const base = `${BASE}${ep.examplePath}`
  const q = customQuery !== undefined ? customQuery : ep.exampleQuery
  return q ? `${base}?${q}` : base
}

function codeFor(lang: Lang, ep: EndpointDef, customQuery?: string): string {
  const url = buildUrl(ep, customQuery)
  switch (lang) {
    case 'curl':
      return `curl -X GET \\
  "${url}" \\
  -H "Authorization: Bearer hsk_your_api_key_here" \\
  -H "Accept: application/json"`
    case 'python':
      return `import requests

API_KEY = "hsk_your_api_key_here"
BASE_URL = "https://api.hestats.co.uk/v1"

response = requests.get(
    "${url}",
    headers={"Authorization": f"Bearer {API_KEY}"}
)
response.raise_for_status()
data = response.json()
print(data["data"])`
    case 'javascript':
      return `const API_KEY = 'hsk_your_api_key_here';

const response = await fetch(
  '${url}',
  { headers: { Authorization: \`Bearer \${API_KEY}\` } }
);

if (!response.ok) throw new Error(\`API error: \${response.status}\`);
const { data, meta } = await response.json();
console.log(data);`
    case 'r':
      return `library(httr)
library(jsonlite)

api_key <- "hsk_your_api_key_here"

resp <- GET(
  "${url}",
  add_headers(Authorization = paste("Bearer", api_key))
)
stop_for_status(resp)
result <- fromJSON(content(resp, "text"))
print(result$data)`
  }
}

// ─── Small utilities ───────────────────────────────────────────────────────────

function CopyBtn({ text, size = 'sm' }: { text: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="flex items-center gap-1 transition-colors"
      style={{ color: copied ? 'var(--positive)' : 'var(--muted)', fontSize: size === 'sm' ? 10 : 11 }}
    >
      {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Badge({ method }: { method: string }) {
  return (
    <span
      className="px-2 py-0.5 font-num flex-shrink-0"
      style={{
        backgroundColor: 'var(--positive-bg)',
        color: 'var(--positive)',
        borderRadius: 2,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.06em',
      }}
    >
      {method}
    </span>
  )
}

function JsonHighlight({ json }: { json: string }) {
  const highlighted = json
    .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span style="color:#7396c2">$1</span>$2')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#5fa97b">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#c2945a">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span style="color:#b18ab8">$1</span>')
  return (
    <pre
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 3,
        padding: '12px 14px',
        fontSize: 11,
        overflowX: 'auto',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.65,
        margin: 0,
        whiteSpace: 'pre',
      }}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}

// ─── Live Playground ──────────────────────────────────────────────────────────

function Playground() {
  const [activeEp, setActiveEp] = useState(ENDPOINTS[0])
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<Lang>('curl')
  const [apiKey] = useState(`hsk_demo_${ Math.random().toString(36).slice(2, 14)}`)
  const [keyCopied, setKeyCopied] = useState(false)

  function selectEndpoint(ep: EndpointDef) {
    setActiveEp(ep)
    setParamValues({})
    setResponse(null)
  }

  function buildQueryFromParams(): string {
    const queryParams = activeEp.params.filter((p) => p.in === 'query')
    const parts: string[] = []
    queryParams.forEach((p) => {
      const val = paramValues[p.name]
      if (val) parts.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(val)}`)
    })
    return parts.join('&')
  }

  function buildPathWithParams(): string {
    let path = activeEp.path
    activeEp.params.filter((p) => p.in === 'path').forEach((p) => {
      const val = paramValues[p.name] || p.example || 'oxford'
      path = path.replace(`{${p.name}}`, val)
    })
    return path
  }

  async function run() {
    setLoading(true)
    setResponse(null)
    try {
      const path = buildPathWithParams()
      const query = buildQueryFromParams()
      const res = await dispatchRequest('GET', `/v1${path}`, query)
      setResponse(res)
    } finally {
      setLoading(false)
    }
  }

  const customQuery = buildQueryFromParams()
  const customPath = buildPathWithParams()

  function copyKey() {
    navigator.clipboard.writeText(apiKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 2000)
  }

  const groups = [...new Set(ENDPOINTS.map((e) => e.group))]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-0 border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 4 }}>
      {/* Sidebar — endpoint list */}
      <div className="xl:col-span-1 border-b xl:border-b-0 xl:border-r overflow-y-auto" style={{ borderColor: 'var(--border)', maxHeight: 600 }}>
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
          <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Endpoints</p>
        </div>
        <div className="overflow-x-auto xl:overflow-x-hidden">
          <div style={{ minWidth: 'max-content' }} className="xl:min-w-0">
            {groups.map((g) => (
              <div key={g}>
                <p className="px-3 py-1.5" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>{g}</p>
                {ENDPOINTS.filter((e) => e.group === g).map((ep) => (
                  <button
                    key={ep.path}
                    onClick={() => selectEndpoint(ep)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                    style={{
                      backgroundColor: activeEp.path === ep.path ? 'var(--panel-hover)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                      borderLeft: activeEp.path === ep.path ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                  >
                    <Badge method={ep.method} />
                    <span className="font-num truncate" style={{ color: activeEp.path === ep.path ? 'var(--text)' : 'var(--text-2)', fontSize: 11 }}>{ep.path}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="xl:col-span-4 flex flex-col" style={{ maxHeight: 600, overflowY: 'auto' }}>
        {/* Endpoint header */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Badge method={activeEp.method} />
            <span className="font-num" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 500 }}>{activeEp.path}</span>
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>— {activeEp.summary}</span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.5 }}>{activeEp.description}</p>
        </div>

        {/* Params + request URL */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* API key row */}
          <div className="flex items-center gap-2 mb-3 p-2 rounded" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <Key className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--warning)' }} />
            <span style={{ color: 'var(--muted)', fontSize: 10, flexShrink: 0 }}>Demo key</span>
            <code className="flex-1 truncate font-num" style={{ color: 'var(--warning)', fontSize: 10 }}>{apiKey}</code>
            <button onClick={copyKey} className="flex items-center gap-1 flex-shrink-0" style={{ color: keyCopied ? 'var(--positive)' : 'var(--muted)', fontSize: 10 }}>
              {keyCopied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Parameters */}
          {activeEp.params.length > 0 && (
            <div className="space-y-2 mb-3">
              {activeEp.params.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ width: 130 }}>
                    <span className="font-num" style={{ color: p.required ? 'var(--negative)' : 'var(--accent)', fontSize: 11 }}>{p.name}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 9 }}>{p.in === 'path' ? 'path' : 'query'}</span>
                    {p.required && <span style={{ color: 'var(--negative)', fontSize: 9 }}>*</span>}
                  </div>
                  <input
                    type="text"
                    placeholder={p.example ?? p.type}
                    value={paramValues[p.name] ?? ''}
                    onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                    className="flex-1 px-2 py-1 outline-none font-num"
                    style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text)', fontSize: 11, minWidth: 0 }}
                  />
                  <span className="hidden sm:block truncate" style={{ color: 'var(--muted)', fontSize: 10, maxWidth: 200 }}>{p.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Request URL preview */}
          <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <Globe className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted)' }} />
            <code className="flex-1 font-num truncate" style={{ color: 'var(--text-2)', fontSize: 10.5 }}>
              GET {BASE}{customPath}{customQuery ? `?${customQuery}` : (activeEp.exampleQuery ? `?${activeEp.exampleQuery}` : '')}
            </code>
            <button
              onClick={run}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0 transition-colors"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#fff',
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 600,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {loading ? 'Running…' : 'Run'}
            </button>
          </div>
        </div>

        {/* Code / Response tabs */}
        <div className="flex-1">
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['curl', 'python', 'javascript', 'r'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-3 py-2 transition-colors whitespace-nowrap"
                style={{
                  color: lang === l ? 'var(--text)' : 'var(--muted)',
                  borderBottom: lang === l ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: 11,
                  fontWeight: lang === l ? 500 : 400,
                  marginBottom: -1,
                }}
              >
                {l}
              </button>
            ))}
            <div className="ml-auto flex items-center pr-3">
              <CopyBtn text={codeFor(lang, activeEp, customQuery || (activeEp.exampleQuery ?? ''))} />
            </div>
          </div>

          <div className="p-3">
            <pre
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                padding: '10px 12px',
                fontSize: 11,
                color: 'var(--text-2)',
                overflowX: 'auto',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.65,
                margin: 0,
                whiteSpace: 'pre',
              }}
            >
              {codeFor(lang, activeEp, customQuery || (activeEp.exampleQuery ?? ''))}
            </pre>
          </div>

          {response && (
            <div className="px-3 pb-3">
              {/* Response status bar */}
              <div
                className="flex items-center gap-3 px-3 py-1.5 mb-2"
                style={{
                  backgroundColor: response.status < 300 ? 'var(--positive-bg)' : 'var(--negative-bg)',
                  border: `1px solid ${response.status < 300 ? 'var(--positive)' : 'var(--negative)'}`,
                  borderRadius: 3,
                }}
              >
                <span className="font-num" style={{ color: response.status < 300 ? 'var(--positive)' : 'var(--negative)', fontSize: 12, fontWeight: 700 }}>
                  {response.status} {response.statusText}
                </span>
                <span style={{ color: 'var(--border-strong)' }}>│</span>
                <Clock className="w-3 h-3" style={{ color: 'var(--muted)' }} />
                <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 10.5 }}>{response.timingMs}ms</span>
                <span style={{ color: 'var(--border-strong)' }}>│</span>
                <span className="font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>{response.requestId}</span>
                <div className="ml-auto">
                  <CopyBtn text={JSON.stringify(response.data, null, 2)} />
                </div>
              </div>

              {/* Response headers */}
              <details className="mb-2">
                <summary className="cursor-pointer" style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Response headers
                </summary>
                <div className="p-2 rounded mt-1" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3 }}>
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-3 font-num" style={{ fontSize: 10.5, borderBottom: '1px solid var(--border)', padding: '2px 0' }}>
                      <span style={{ color: 'var(--accent)', width: 200, flexShrink: 0 }}>{k}</span>
                      <span style={{ color: 'var(--text-2)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </details>

              {/* Response body */}
              <JsonHighlight json={JSON.stringify(response.data, null, 2)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Endpoint reference accordion ─────────────────────────────────────────────

function EndpointRef({ ep }: { ep: EndpointDef }) {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<Lang>('curl')

  return (
    <div className="border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
        <Badge method={ep.method} />
        <span className="font-num" style={{ color: 'var(--accent)', fontSize: 12 }}>{ep.path}</span>
        <span className="hidden sm:block flex-1 min-w-0 truncate" style={{ color: 'var(--text-2)', fontSize: 11 }}>{ep.summary}</span>
        <span style={{ color: 'var(--muted)', fontSize: 10, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6 }}>{ep.description}</p>
          </div>

          {ep.params.length > 0 && (
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Parameters</p>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: 400 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Name', 'Location', 'Type', 'Required', 'Description'].map((h) => (
                        <th key={h} className="pb-1.5 text-left pr-4" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map((p) => (
                      <tr key={p.name} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="py-1.5 pr-4 font-num" style={{ color: 'var(--accent)', fontSize: 11 }}>{p.name}</td>
                        <td className="py-1.5 pr-4 font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>{p.in}</td>
                        <td className="py-1.5 pr-4 font-num" style={{ color: 'var(--text-2)', fontSize: 11 }}>{p.type}</td>
                        <td className="py-1.5 pr-4">
                          <span style={{ color: p.required ? 'var(--negative)' : 'var(--muted)', fontSize: 10 }}>{p.required ? 'required' : 'optional'}</span>
                        </td>
                        <td className="py-1.5" style={{ color: 'var(--text-2)', fontSize: 11 }}>
                          {p.description}{p.example ? <span className="font-num" style={{ color: 'var(--muted)', marginLeft: 6 }}>e.g. {p.example}</span> : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-0">
                {(['curl', 'python', 'javascript', 'r'] as Lang[]).map((l) => (
                  <button key={l} onClick={() => setLang(l)} className="px-2.5 py-1"
                    style={{ fontSize: 11, color: lang === l ? 'var(--text)' : 'var(--muted)', borderBottom: lang === l ? '2px solid var(--accent)' : '2px solid transparent' }}>
                    {l}
                  </button>
                ))}
              </div>
              <CopyBtn text={codeFor(lang, ep)} />
            </div>
            <pre style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3, padding: '10px 12px', fontSize: 11, color: 'var(--text-2)', overflowX: 'auto', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.65, margin: 0, whiteSpace: 'pre' }}>
              {codeFor(lang, ep)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Schema browser ────────────────────────────────────────────────────────────

const SCHEMAS: { name: string; description: string; fields: { name: string; type: string; nullable?: boolean; description: string }[] }[] = [
  {
    name: 'Institution',
    description: 'A UK Higher Education provider.',
    fields: [
      { name: 'id', type: 'string', description: 'HEStats identifier (e.g. oxford)' },
      { name: 'ukprn', type: 'string', description: '8-digit UKPRN from the UK Register of Learning Providers' },
      { name: 'canonical_name', type: 'string', description: 'Full official institution name' },
      { name: 'short_name', type: 'string', description: 'Abbreviated name used in displays' },
      { name: 'nation', type: '"England"|"Scotland"|"Wales"|"Northern Ireland"', description: 'UK nation of registration' },
      { name: 'city', type: 'string', description: 'Primary city of operation' },
      { name: 'founded', type: 'integer', description: 'Year of founding' },
      { name: 'mission_group', type: 'string', nullable: true, description: 'Mission group membership (e.g. Russell Group)' },
      { name: 'official_website', type: 'string', nullable: true, description: 'Primary domain without protocol' },
    ],
  },
  {
    name: 'FinancialYear',
    description: 'Annual financial statement for one institution in one fiscal year.',
    fields: [
      { name: 'fiscal_year', type: 'string', description: 'HESA fiscal year format, e.g. 2024-25' },
      { name: 'data_source', type: '"verified"|"estimated"|"pending"', description: 'Confidence in this record\'s source' },
      { name: 'revenue_gbp_m', type: 'number', description: 'Total annual income (£m)' },
      { name: 'surplus_gbp_m', type: 'number', description: 'Operating surplus (£m)' },
      { name: 'surplus_margin_pct', type: 'number', description: 'Surplus as % of income' },
      { name: 'research_income_gbp_m', type: 'number', description: 'Research grants and contracts income (£m)' },
      { name: 'tuition_fee_income_gbp_m', type: 'number', description: 'Tuition fee income (£m)' },
      { name: 'other_income_gbp_m', type: 'number', description: 'Residences, catering, and other income (£m)' },
      { name: 'staff_costs_gbp_m', type: 'number', description: 'Total staff emoluments inc. pension (£m)' },
      { name: 'total_expenditure_gbp_m', type: 'number', description: 'Total operating expenditure (£m)' },
      { name: 'cash_gbp_m', type: 'number', description: 'Cash and short-term deposits (£m)' },
      { name: 'borrowing_gbp_m', type: 'number', description: 'External long-term borrowing (£m)' },
      { name: 'liquidity_days', type: 'integer', description: 'Days of expenditure covered by liquid assets' },
      { name: 'international_fte_pct', type: 'number', description: 'International students as % of FTE total' },
      { name: 'student_fte_total', type: 'integer', description: 'Total full-time equivalent student enrolment' },
      { name: 'capital_expenditure_gbp_m', type: 'number', description: 'Capital investment in estate and equipment (£m)' },
      { name: 'net_assets_gbp_m', type: 'number', description: 'Total assets minus total liabilities (£m)' },
      { name: 'risk_flag', type: '"Low"|"Medium"|"High"', description: 'HEStats financial risk assessment' },
      { name: 'source_pdf', type: 'string', nullable: true, description: 'URL to the source annual report PDF' },
    ],
  },
  {
    name: 'HealthScore',
    description: 'Composite financial health assessment.',
    fields: [
      { name: 'health_score', type: 'integer', description: 'Composite score 0–100 across 6 dimensions' },
      { name: 'health_grade', type: '"AAA"|"AA"|"A"|"BBB"|"BB"|"B"|"CCC"', description: 'Letter grade mapped from score' },
      { name: 'components.liquidity', type: 'number', description: 'Liquidity sub-score (0–100)' },
      { name: 'components.surplusMargin', type: 'number', description: 'Surplus margin sub-score (0–100)' },
      { name: 'components.borrowingBurden', type: 'number', description: 'Borrowing burden sub-score (0–100)' },
      { name: 'components.cashCover', type: 'number', description: 'Cash cover sub-score (0–100)' },
      { name: 'components.incomeDiversity', type: 'number', description: 'Income diversity sub-score (0–100)' },
      { name: 'components.researchIntensity', type: 'number', description: 'Research intensity sub-score (0–100)' },
    ],
  },
  {
    name: 'ApiResponse (envelope)',
    description: 'All API responses share this envelope structure.',
    fields: [
      { name: 'data', type: 'object | array', description: 'The requested resource(s)' },
      { name: 'meta', type: 'object', nullable: true, description: 'Pagination, totals, and context (when applicable)' },
      { name: 'meta.total', type: 'integer', nullable: true, description: 'Total count before pagination' },
      { name: 'meta.limit', type: 'integer', nullable: true, description: 'Applied page size' },
      { name: 'meta.offset', type: 'integer', nullable: true, description: 'Applied offset' },
      { name: 'error', type: 'object', nullable: true, description: 'Present only on error responses' },
      { name: 'error.code', type: 'integer', nullable: true, description: 'HTTP status code' },
      { name: 'error.message', type: 'string', nullable: true, description: 'Human-readable error message' },
    ],
  },
]

function SchemaBlock({ s }: { s: typeof SCHEMAS[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
        <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
        <span className="font-num" style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>{s.name}</span>
        <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{s.description}</span>
        <span style={{ color: 'var(--muted)', fontSize: 10, marginLeft: 'auto' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="overflow-x-auto" style={{ borderTop: '1px solid var(--border)' }}>
          <table className="w-full" style={{ minWidth: 480 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                {['Field', 'Type', 'Nullable', 'Description'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.fields.map((f) => (
                <tr key={f.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-3 py-2 font-num" style={{ color: 'var(--accent)', fontSize: 11 }}>{f.name}</td>
                  <td className="px-3 py-2 font-num" style={{ color: 'var(--text-2)', fontSize: 10.5 }}>{f.type}</td>
                  <td className="px-3 py-2" style={{ color: f.nullable ? 'var(--warning)' : 'var(--muted)', fontSize: 10 }}>{f.nullable ? 'nullable' : '—'}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11 }}>{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Changelog ────────────────────────────────────────────────────────────────

const CHANGELOG = [
  { version: 'v1.2.0', date: 'Jun 2025', tag: 'New', color: 'var(--positive)', changes: ['Added /compare endpoint supporting up to 6 institutions', 'Health score components now included in /institutions/{id}/health', '/health-scores now supports grade and nation filtering', 'R SDK example added to all endpoint code samples'] },
  { version: 'v1.1.0', date: 'Mar 2025', tag: 'Update', color: 'var(--link)', changes: ['Added /years endpoint listing all available fiscal years', 'Added /metrics catalogue endpoint', 'Pagination offset/limit added to /institutions and /health-scores', 'source_pdf field added to FinancialYear response'] },
  { version: 'v1.0.0', date: 'Jan 2025', tag: 'Release', color: 'var(--warning)', changes: ['Initial v1 API release', 'Endpoints: /institutions, /sector/summary, /rankings', 'REST + JSON with Bearer token authentication', '10-year financial history for 155+ institutions'] },
]

// ─── Main page ─────────────────────────────────────────────────────────────────

export function ApiPage() {
  const [section, setSection] = useState<'playground' | 'reference' | 'schema' | 'auth' | 'changelog'>('playground')

  const NAV = [
    { id: 'playground' as const, label: 'Playground', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'reference' as const, label: 'Reference', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'schema' as const, label: 'Schema', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'auth' as const, label: 'Auth & Limits', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'changelog' as const, label: 'Changelog', icon: <Clock className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2.5 space-y-3">
      {/* Status bar */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Terminal className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>HESTATS API</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span className="font-num" style={{ color: 'var(--text)' }}>v1.2.0</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span className="font-num hidden sm:inline" style={{ color: 'var(--accent)' }}>{BASE}</span>
        <span style={{ color: 'var(--border-strong)' }} className="hidden sm:inline">│</span>
        <span className="font-num" style={{ color: 'var(--text-2)' }}>{ENDPOINTS.length} endpoints</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>{institutions.length} institutions</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--positive)' }} />
          <span style={{ color: 'var(--positive)', fontSize: 10, letterSpacing: '0.06em' }}>LIVE · OPEN ACCESS</span>
        </div>
      </div>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <div className="lg:col-span-2 p-4 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
          <h1 style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>HEStats API</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
            Programmatic access to every financial metric, health score, and institution profile in the HEStats dataset.
            Build dashboards, power research, and integrate audited UK Higher Education finance data into your own tools.
            <strong style={{ color: 'var(--text)' }}> No authentication required for public endpoints.</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: <Zap className="w-3.5 h-3.5" />, label: 'REST + JSON' },
              { icon: <Shield className="w-3.5 h-3.5" />, label: 'Source-verified' },
              { icon: <Globe className="w-3.5 h-3.5" />, label: `${institutions.length} institutions` },
              { icon: <Database className="w-3.5 h-3.5" />, label: '10 years history' },
              { icon: <Activity className="w-3.5 h-3.5" />, label: 'Live data' },
              { icon: <Heart className="w-3.5 h-3.5" />, label: 'Free forever' },
            ].map((f) => (
              <span key={f.label} className="flex items-center gap-1.5 px-2.5 py-1.5"
                style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)', fontSize: 11 }}>
                <span style={{ color: 'var(--accent)' }}>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
          {[
            { label: 'Endpoints', value: ENDPOINTS.length, color: 'var(--accent)' },
            { label: 'Institutions', value: institutions.length, color: 'var(--positive)' },
            { label: 'Fiscal years', value: AVAILABLE_YEARS.length, color: 'var(--link)' },
            { label: 'Rate limit', value: '50k/day', color: 'var(--warning)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col justify-center px-3 py-3 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
              <p className="font-num" style={{ color, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}</p>
              <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section nav */}
      <div className="overflow-x-auto -mx-3 sm:mx-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex px-3 sm:px-0" style={{ minWidth: 'max-content' }}>
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 whitespace-nowrap transition-colors"
              style={{
                color: section === n.id ? 'var(--text)' : 'var(--text-2)',
                borderBottom: section === n.id ? '2px solid var(--accent)' : '2px solid transparent',
                fontSize: 12.5,
                fontWeight: section === n.id ? 500 : 400,
                marginBottom: -1,
              }}
            >
              <span style={{ color: section === n.id ? 'var(--accent)' : 'var(--muted)' }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PLAYGROUND ─────────────────────────────────────────────────────────── */}
      {section === 'playground' && (
        <div className="space-y-3">
          <div className="px-3 py-2 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--accent)', borderRadius: 3, borderLeft: '3px solid var(--accent)' }}>
            <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>Interactive API Console</p>
            <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.55 }}>
              Select an endpoint, fill in parameters, and click <strong style={{ color: 'var(--text)' }}>Run</strong> to execute a real query against the HEStats dataset.
              Responses are live — the data comes directly from the same engine that powers this platform.
            </p>
          </div>
          <Playground />
        </div>
      )}

      {/* ── REFERENCE ──────────────────────────────────────────────────────────── */}
      {section === 'reference' && (
        <div className="space-y-2">
          <div className="flex items-baseline gap-3 mb-3">
            <h2 style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Endpoint Reference</h2>
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>Click any endpoint to expand documentation and code samples</span>
          </div>
          {[...new Set(ENDPOINTS.map((e) => e.group))].map((g) => (
            <div key={g}>
              <p className="px-1 py-1.5 mb-1.5" style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{g}</p>
              <div className="space-y-2">
                {ENDPOINTS.filter((e) => e.group === g).map((ep) => (
                  <EndpointRef key={ep.path} ep={ep} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SCHEMA ─────────────────────────────────────────────────────────────── */}
      {section === 'schema' && (
        <div className="space-y-2">
          <div className="flex items-baseline gap-3 mb-3">
            <h2 style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Data Schema</h2>
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>Type definitions for all API response objects</span>
          </div>
          {SCHEMAS.map((s) => <SchemaBlock key={s.name} s={s} />)}

          {/* Grade mapping */}
          <div className="border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>Health Grade Mapping</p>
              <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>Score-to-grade thresholds used in all health score responses</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 400 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                    {['Grade', 'Score range', 'Interpretation', 'Colour'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { grade: 'AAA', range: '85–100', label: 'Exceptional financial strength', color: '#5fa97b' },
                    { grade: 'AA', range: '75–84', label: 'Very strong finances', color: '#7fb889' },
                    { grade: 'A', range: '65–74', label: 'Strong financial position', color: '#9fc898' },
                    { grade: 'BBB', range: '55–64', label: 'Adequate — monitor trends', color: '#c2945a' },
                    { grade: 'BB', range: '45–54', label: 'Below average — elevated risk', color: '#d4885a' },
                    { grade: 'B', range: '30–44', label: 'Weak — requires attention', color: '#cf6660' },
                    { grade: 'CCC', range: '0–29', label: 'Financially stressed', color: '#b84040' },
                  ].map(({ grade, range, label, color }) => (
                    <tr key={grade} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-3 py-2 font-num" style={{ color, fontSize: 13, fontWeight: 700 }}>{grade}</td>
                      <td className="px-3 py-2 font-num" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>{range}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>{label}</td>
                      <td className="px-3 py-2"><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, backgroundColor: color }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error codes */}
          <div className="border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>HTTP Status Codes</p>
            </div>
            <table className="w-full">
              <tbody>
                {[
                  { code: 200, label: 'OK', desc: 'Request successful. Data returned in response body.' },
                  { code: 400, label: 'Bad Request', desc: 'Invalid request format or parameter type.' },
                  { code: 404, label: 'Not Found', desc: 'Institution, year, or endpoint not found.' },
                  { code: 405, label: 'Method Not Allowed', desc: 'Only GET requests are supported.' },
                  { code: 422, label: 'Unprocessable Entity', desc: 'Required parameter missing or invalid value (e.g. unknown metric).' },
                  { code: 429, label: 'Too Many Requests', desc: 'Rate limit exceeded. See X-RateLimit-Reset header.' },
                ].map(({ code, label, desc }) => (
                  <tr key={code} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-num" style={{ color: code < 300 ? 'var(--positive)' : code < 500 ? 'var(--warning)' : 'var(--negative)', fontSize: 12.5, fontWeight: 600, width: 60 }}>{code}</td>
                    <td className="px-3 py-2 font-num" style={{ color: 'var(--text)', fontSize: 11.5, width: 180 }}>{label}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AUTH & LIMITS ──────────────────────────────────────────────────────── */}
      {section === 'auth' && (
        <div className="space-y-3">
          {/* Authentication */}
          <div className="border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Authentication</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.6, marginBottom: 10 }}>
                  The HEStats API uses <strong style={{ color: 'var(--text)' }}>Bearer token authentication</strong>. Pass your API key in the
                  <code className="font-num" style={{ color: 'var(--accent)', margin: '0 4px' }}>Authorization</code> header.
                  All read endpoints are accessible with a free-tier key.
                </p>
                <pre style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3, padding: '10px 12px', fontSize: 11, color: 'var(--text-2)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.65, margin: 0, overflowX: 'auto', whiteSpace: 'pre' }}>
{`Authorization: Bearer hsk_your_api_key_here

# Example:
curl -H "Authorization: Bearer hsk_live_abc123xyz" \\
  "${BASE}/institutions/oxford"`}
                </pre>
              </div>
              <div>
                <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Key format</p>
                <p style={{ color: 'var(--text-2)', fontSize: 12 }}>
                  API keys follow the format <code className="font-num" style={{ color: 'var(--accent)' }}>hsk_&lt;env&gt;_&lt;32-char-random&gt;</code>.
                  Environment prefix: <code className="font-num" style={{ color: 'var(--positive)' }}>live</code> for production,{' '}
                  <code className="font-num" style={{ color: 'var(--warning)' }}>test</code> for sandbox.
                </p>
              </div>
            </div>
          </div>

          {/* Rate limits */}
          <div>
            <h2 style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Rate Limits & Tiers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              {[
                { tier: 'Free', rate: '1,000', unit: 'req/day', price: 'No cost', color: 'var(--muted)', features: ['All institution data', 'Latest fiscal year only', 'Public endpoints', 'JSON responses', 'Community support'] },
                { tier: 'Research', rate: '50,000', unit: 'req/day', price: 'Contact us', color: 'var(--link)', features: ['Full 10-year history', 'Bulk CSV export', 'Provenance metadata', 'Priority support', 'SLA 99.5%'] },
                { tier: 'Enterprise', rate: 'Unlimited', unit: '', price: 'Custom pricing', color: 'var(--warning)', features: ['All Research features', 'Custom data feeds', 'GraphQL endpoint', 'Dedicated support', 'SLA 99.9%', 'On-premise option'] },
              ].map((t) => (
                <div key={t.tier} className="p-3.5 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3, borderTop: `3px solid ${t.color}` }}>
                  <div className="flex items-baseline justify-between mb-1">
                    <p style={{ color: t.color, fontSize: 13, fontWeight: 700 }}>{t.tier}</p>
                    <span style={{ color: 'var(--muted)', fontSize: 10 }}>{t.price}</span>
                  </div>
                  <p className="font-num" style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700, margin: '4px 0 10px' }}>
                    {t.rate} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>{t.unit}</span>
                  </p>
                  <ul className="space-y-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5" style={{ color: 'var(--text-2)', fontSize: 11 }}>
                        <span style={{ color: t.color }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Rate limit headers */}
          <div className="border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>Rate Limit Headers</p>
              <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>Included in every API response</p>
            </div>
            <table className="w-full">
              <tbody>
                {[
                  { header: 'X-RateLimit-Limit', desc: 'Daily request quota for your API key tier' },
                  { header: 'X-RateLimit-Remaining', desc: 'Requests remaining in the current window' },
                  { header: 'X-RateLimit-Reset', desc: 'Unix timestamp when the quota resets (midnight UTC)' },
                  { header: 'X-API-Version', desc: 'API version that served this response' },
                  { header: 'Cache-Control', desc: 'Caching directive — public responses are cached for 5 minutes' },
                ].map(({ header, desc }) => (
                  <tr key={header} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-2 font-num" style={{ color: 'var(--accent)', fontSize: 11, width: 240 }}>{header}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick start */}
          <div className="border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>Quick Start</p>
              <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>Get data in under 60 seconds</p>
            </div>
            <div className="p-4 space-y-4">
              {[
                { step: '1', title: 'Get an API key', desc: 'Register at hestats.co.uk/api/register. Free tier is available immediately with no credit card required.' },
                { step: '2', title: 'Make your first request', code: `curl -H "Authorization: Bearer hsk_your_key" \\\n  "${BASE}/institutions/oxford"` },
                { step: '3', title: 'Explore with the Playground', desc: 'Use the Playground tab above to run any endpoint with real parameters and see live responses.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full" style={{ backgroundColor: 'var(--accent)' }}>
                    <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{s.step}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>{s.title}</p>
                    {s.desc && <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5 }}>{s.desc}</p>}
                    {s.code && (
                      <pre style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3, padding: '8px 10px', fontSize: 11, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.65, margin: 0, overflowX: 'auto', whiteSpace: 'pre' }}>
                        {s.code}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGELOG ──────────────────────────────────────────────────────────── */}
      {section === 'changelog' && (
        <div className="space-y-3">
          <h2 style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>API Changelog</h2>
          {CHANGELOG.map((c) => (
            <div key={c.version} className="border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
              <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="font-num" style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>{c.version}</span>
                <span
                  style={{
                    fontSize: 9.5, padding: '1px 6px', borderRadius: 2,
                    backgroundColor: `${c.color}22`, color: c.color,
                    fontWeight: 600, letterSpacing: '0.04em',
                  }}
                >
                  {c.tag}
                </span>
                <span className="ml-auto font-num" style={{ color: 'var(--muted)', fontSize: 11 }}>{c.date}</span>
              </div>
              <ul className="px-4 py-3 space-y-1.5">
                {c.changes.map((ch, i) => (
                  <li key={i} className="flex items-start gap-2" style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5 }}>
                    <span style={{ color: c.color, flexShrink: 0, marginTop: 1 }}>+</span>{ch}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>API questions?</span>
        <Link to="/support" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>Contact us <ArrowUpRight className="w-3 h-3" /></Link>
        <Link to="/about" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>Methodology <ArrowUpRight className="w-3 h-3" /></Link>
        <Link to="/open-data" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>Bulk download <ArrowUpRight className="w-3 h-3" /></Link>
        <span className="ml-auto font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>HEStats API v1.2.0 · CC BY 4.0</span>
      </div>
    </div>
  )
}
