import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Check,
  Copy,
  Database,
  Download,
  FileText,
  Hash,
  Instagram,
  Linkedin,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { AVAILABLE_YEARS } from '../data/financials'
import {
  SOCIAL_AUDIENCES,
  SOCIAL_PLATFORMS,
  SOCIAL_TONES,
  buildSocialStories,
  composeSocialPost,
  getSocialStudioSummary,
  type SocialAudience,
  type SocialPlatform,
  type SocialStory,
  type SocialTone,
} from '../data/socialContent'
import { Panel } from '../components/layout/Panel'

const PLATFORM_ICONS: Record<SocialPlatform, typeof Linkedin> = {
  linkedin: Linkedin,
  x: MessageCircle,
  instagram: Instagram,
  threads: MessageCircle,
}

const SENTIMENT_COLOUR: Record<SocialStory['sentiment'], string> = {
  positive: 'var(--positive)',
  caution: 'var(--warning)',
  neutral: 'var(--accent)',
}

function StatusMetric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof BarChart3 }) {
  return (
    <div className="border px-3 py-2.5" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
      <div className="flex items-center justify-between gap-3">
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
      </div>
      <p className="font-num mt-2" style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700 }}>{value}</p>
      <p style={{ color: 'var(--text-2)', fontSize: 11, marginTop: 2 }}>{detail}</p>
    </div>
  )
}

function SegmentedButton<T extends string>({
  active,
  value,
  onClick,
  children,
}: {
  active: boolean
  value: T
  onClick: (value: T) => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className="px-2.5 py-1.5 border transition-colors"
      style={{
        backgroundColor: active ? 'var(--accent)' : 'var(--bg-2)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        color: active ? '#fff' : 'var(--text-2)',
        borderRadius: 3,
        fontSize: 11,
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  )
}

function StoryQueueItem({ story, active, onSelect }: { story: SocialStory; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-3 py-2.5 border transition-colors"
      style={{
        backgroundColor: active ? 'var(--panel-hover)' : 'var(--bg-2)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        borderRadius: 3,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: SENTIMENT_COLOUR[story.sentiment] }} />
        <span style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{story.category}</span>
        <span className="font-num ml-auto" style={{ color: 'var(--text)', fontSize: 11, fontWeight: 700 }}>{story.valueText}</span>
      </div>
      <p className="mt-1" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, lineHeight: 1.35 }}>{story.shortTitle}</p>
      <p className="mt-1" style={{ color: 'var(--text-2)', fontSize: 11, lineHeight: 1.45 }}>{story.metricLabel}</p>
    </button>
  )
}

function CopyButton({ text, label, doneLabel }: { text: string; label: string; doneLabel: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center justify-center gap-2 px-3 py-2 border transition-colors"
      style={{
        backgroundColor: copied ? 'var(--positive-bg)' : 'var(--bg-2)',
        borderColor: copied ? 'var(--positive)' : 'var(--border)',
        color: copied ? 'var(--positive)' : 'var(--text-2)',
        borderRadius: 3,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? doneLabel : label}
    </button>
  )
}

function downloadDraft(filename: string, body: string) {
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function SocialStudioPage() {
  const [year, setYear] = useState(AVAILABLE_YEARS[0])
  const [platform, setPlatform] = useState<SocialPlatform>('linkedin')
  const [audience, setAudience] = useState<SocialAudience>('sector')
  const [tone, setTone] = useState<SocialTone>('briefing')
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)

  const stories = useMemo(() => buildSocialStories(year), [year])
  const summary = useMemo(() => getSocialStudioSummary(year), [year])
  const selectedStory = stories.find((story) => story.id === selectedStoryId) ?? stories[0]
  const post = useMemo(
    () => selectedStory ? composeSocialPost(selectedStory, platform, audience, tone) : null,
    [audience, platform, selectedStory, tone],
  )
  const platformMeta = SOCIAL_PLATFORMS.find((item) => item.id === platform) ?? SOCIAL_PLATFORMS[0]
  const PlatformIcon = PLATFORM_ICONS[platform]
  const postWithinLimit = post ? post.characterCount <= post.limit : true

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Megaphone className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>SOCIAL STUDIO</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>FY <span className="font-num" style={{ color: 'var(--text)' }}>{year}</span></span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--positive)' }}>{summary.verifiedRows}</span> verified rows
        </span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{stories.length}</span> extracted storylines
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" style={{ color: 'var(--positive)' }} />
          <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em' }}>VERIFIED CLAIMS ONLY</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatusMetric label="Verified rows" value={summary.verifiedRows.toLocaleString()} detail={`FY${summary.year} aggregate inputs`} icon={Database} />
        <StatusMetric label="Indexed providers" value={summary.indexedInstitutions.toLocaleString()} detail="directory coverage" icon={BarChart3} />
        <StatusMetric label="Loaded income" value={summary.totalIncomeText} detail="verified rows only" icon={TrendingUp} />
        <StatusMetric label="Deficit rows" value={summary.deficitRows.toLocaleString()} detail="negative operating surplus" icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)_390px] gap-2.5 items-start">
        <Panel
          title="Storyline queue"
          subtitle="Ranked metric extracts"
          action={(
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_YEARS.slice(0, 4).map((candidateYear) => (
                <SegmentedButton key={candidateYear} value={candidateYear} active={year === candidateYear} onClick={setYear}>
                  {candidateYear}
                </SegmentedButton>
              ))}
            </div>
          )}
        >
          <div className="space-y-2">
            {stories.map((story) => (
              <StoryQueueItem
                key={story.id}
                story={story}
                active={story.id === selectedStory.id}
                onSelect={() => setSelectedStoryId(story.id)}
              />
            ))}
          </div>
        </Panel>

        <div className="space-y-2.5">
          <Panel title="Content controls" subtitle={`${platformMeta.label} · ${platformMeta.description}`}>
            <div className="space-y-3">
              <div>
                <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>Platform</p>
                <div className="flex flex-wrap gap-1.5">
                  {SOCIAL_PLATFORMS.map((item) => {
                    const Icon = PLATFORM_ICONS[item.id]
                    return (
                      <SegmentedButton key={item.id} value={item.id} active={platform === item.id} onClick={setPlatform}>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon className="w-3 h-3" /> {item.label}
                        </span>
                      </SegmentedButton>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>Audience</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SOCIAL_AUDIENCES.map((item) => (
                      <SegmentedButton key={item.id} value={item.id} active={audience === item.id} onClick={setAudience}>
                        {item.label}
                      </SegmentedButton>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>Tone</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SOCIAL_TONES.map((item) => (
                      <SegmentedButton key={item.id} value={item.id} active={tone === item.id} onClick={setTone}>
                        {item.label}
                      </SegmentedButton>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {selectedStory && (
            <Panel
              title={selectedStory.shortTitle}
              subtitle={`${selectedStory.category} · FY${selectedStory.year}`}
              action={<span className="font-num" style={{ color: SENTIMENT_COLOUR[selectedStory.sentiment], fontSize: 12, fontWeight: 700 }}>{selectedStory.valueText}</span>}
            >
              <div className="space-y-3">
                <div className="border px-3 py-3" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                  <p style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{selectedStory.title}</p>
                  <p style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.6, marginTop: 8 }}>{selectedStory.summary}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 11.5, lineHeight: 1.6, marginTop: 8 }}>{selectedStory.whyItMatters}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {selectedStory.evidence.slice(0, 3).map((item) => (
                    <div key={`${item.label}-${item.value}`} className="border px-3 py-2" style={{ borderColor: 'var(--border)', borderRadius: 3 }}>
                      <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</p>
                      <p className="font-num mt-1" style={{ color: 'var(--text)', fontSize: 15, fontWeight: 700 }}>{item.value}</p>
                      <p style={{ color: 'var(--text-2)', fontSize: 10.5, marginTop: 1 }}>{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="border overflow-hidden" style={{ borderColor: 'var(--border)', borderRadius: 3 }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                        {['Evidence', 'Value', 'Detail'].map((header) => (
                          <th key={header} className="px-3 py-2 text-left" style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStory.evidence.map((item) => (
                        <tr key={`${item.label}-${item.detail}`} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-3 py-2" style={{ color: 'var(--text)', fontSize: 12 }}>{item.label}</td>
                          <td className="px-3 py-2 font-num" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{item.value}</td>
                          <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11 }}>{item.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    ['Verified rows only', 'Pending and estimated rows are excluded before copy is generated.'],
                    ['Source attached', selectedStory.sourceLine],
                    ['No automated posting', 'Generated text remains a draft until a human publishes it.'],
                  ].map(([label, detail]) => (
                    <div key={label} className="flex items-start gap-2 border px-3 py-2" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--positive)' }} />
                      <span>
                        <span className="block" style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600 }}>{label}</span>
                        <span className="block" style={{ color: 'var(--muted)', fontSize: 10.5, lineHeight: 1.45 }}>{detail}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}
        </div>

        {selectedStory && post && (
          <div className="space-y-2.5">
            <Panel
              title="Generated post"
              subtitle={`${post.characterCount.toLocaleString()} / ${post.limit.toLocaleString()} characters`}
              action={<PlatformIcon className="w-4 h-4" style={{ color: postWithinLimit ? 'var(--positive)' : 'var(--warning)' }} />}
            >
              <div className="space-y-3">
                <textarea
                  readOnly
                  value={post.body}
                  className="w-full resize-none outline-none"
                  style={{
                    minHeight: 310,
                    backgroundColor: 'var(--bg-2)',
                    border: `1px solid ${postWithinLimit ? 'var(--border)' : 'var(--warning)'}`,
                    borderRadius: 3,
                    color: 'var(--text)',
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    padding: 12,
                  }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <CopyButton text={post.body} label="Copy post" doneLabel="Post copied" />
                  <button
                    onClick={() => downloadDraft(`hestats-${selectedStory.id}-${platform}.txt`, post.body)}
                    className="flex items-center justify-center gap-2 px-3 py-2 border"
                    style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text-2)', borderRadius: 3, fontSize: 12, fontWeight: 600 }}
                  >
                    <Download className="w-3.5 h-3.5" /> Draft TXT
                  </button>
                </div>
              </div>
            </Panel>

            <Panel title="Social card copy" subtitle="Graphic-ready text">
              <div className="border overflow-hidden" style={{ backgroundColor: '#0a0a0a', borderColor: 'var(--border)', borderRadius: 3 }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a2a28' }}>
                  <span style={{ color: '#f5f5f4', fontSize: 13, fontWeight: 800, letterSpacing: '0.02em' }}>HEStats</span>
                  <span style={{ color: '#a8a8a2', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>FY{selectedStory.year}</span>
                </div>
                <div className="px-4 py-5">
                  <p style={{ color: '#a8a8a2', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{selectedStory.metricLabel}</p>
                  <p className="font-num" style={{ color: '#f5f5f4', fontSize: 42, lineHeight: 1, fontWeight: 800, marginTop: 8 }}>{selectedStory.valueText}</p>
                  <p style={{ color: '#f5f5f4', fontSize: 16, fontWeight: 700, lineHeight: 1.25, marginTop: 16 }}>{selectedStory.shortTitle}</p>
                  <p style={{ color: '#a8a8a2', fontSize: 11.5, lineHeight: 1.5, marginTop: 10 }}>{selectedStory.summary}</p>
                </div>
                <div className="px-4 py-3" style={{ borderTop: '1px solid #2a2a28' }}>
                  <p style={{ color: '#6b6b66', fontSize: 9.5, lineHeight: 1.5 }}>{selectedStory.sourceLine}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <CopyButton text={post.graphicBrief} label="Copy card copy" doneLabel="Card copied" />
                <CopyButton text={post.altText} label="Copy alt text" doneLabel="Alt copied" />
              </div>
            </Panel>

            <Panel title="Distribution metadata" subtitle="Hashtags and CTA">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hash className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Hashtags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {post.hashtags.map((tag) => (
                      <span key={tag} className="px-2 py-1 border" style={{ borderColor: 'var(--border)', color: 'var(--text-2)', borderRadius: 3, fontSize: 11 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="border px-3 py-2" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{post.cta}</span>
                  </div>
                </div>
                <div className="border px-3 py-2" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                    <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>Alt text</span>
                  </div>
                  <p style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.55 }}>{post.altText}</p>
                </div>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}
