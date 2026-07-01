import { Heart, Github, ArrowUpRight, Mail, Code, Database, Server, Users, Star, GitBranch, TrendingUp, Shield, Globe, Coffee } from 'lucide-react'
import { Panel } from '../components/layout/Panel'
import { SUPPORT_LINKS } from '../data/links'
import { institutions } from '../data/institutions'
import { AVAILABLE_YEARS, financials } from '../data/financials'

const IMPACT_STATS = [
  { value: String(institutions.length), label: 'institutions tracked', icon: <Globe className="w-4 h-4" /> },
  { value: String(financials.filter((row) => row.data_source === 'verified').length), label: 'verified finance rows', icon: <Shield className="w-4 h-4" /> },
  { value: String(AVAILABLE_YEARS.length), label: 'verified fiscal years', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'Free', label: 'forever · no paywalls', icon: <Heart className="w-4 h-4" /> },
]

const RECOGNITION_TIERS = [
  {
    name: 'Supporter',
    amount: '£3/mo',
    description: 'Name in the contributors list. Help cover hosting costs.',
    perks: ['Contributors list', 'Monthly digest email'],
    color: '#5fa97b',
  },
  {
    name: 'Patron',
    amount: '£10/mo',
    description: 'Priority feature requests and direct contact for data queries.',
    perks: ['Contributors list', 'Monthly digest', 'Priority feature requests', 'Direct data contact'],
    color: '#7396c2',
  },
  {
    name: 'Institutional',
    amount: '£50/mo',
    description: 'Logo on the site. Dedicated data ingestion for your institution.',
    perks: ['Logo on site', 'All Patron perks', 'Dedicated data pipeline input', 'API roadmap input', 'Quarterly briefing'],
    color: '#c2945a',
  },
]

const ROADMAP = [
  { status: 'available', label: `${institutions.length} institutions with verified-or-pending decade finance coverage` },
  { status: 'available', label: `${financials.filter((row) => row.data_source === 'verified').length} verified HESA finance rows plus explicit pending gaps` },
  { status: 'available', label: 'Institution comparison engine (up to 6)' },
  { status: 'available', label: 'League tables sortable by 12+ metrics' },
  { status: 'building', label: 'Balance sheet & cash flow statement views' },
  { status: 'building', label: 'Complete coverage of 285 OfS-registered providers' },
  { status: 'building', label: 'Time Machine — animated historical rankings' },
  { status: 'planned', label: 'Interactive UK map with financial health overlays' },
  { status: 'planned', label: 'Public API for researchers and developers' },
  { status: 'planned', label: 'OfS AFR data integration (when released)' },
  { status: 'planned', label: 'Mobile app' },
]

const MONTHLY_GOAL_PCT = 0

const DONATION_OPTIONS = [
  {
    name: 'GitHub Sponsors',
    tagline: 'Monthly recurring support via GitHub. 100% reaches the project — GitHub waives platform fees for open-source sponsors.',
    cta: 'Sponsor on GitHub',
    href: SUPPORT_LINKS.github_sponsors,
    brand: '#ea4aaa',
    icon: <Github className="w-4 h-4" />,
    preferred: true,
  },
  {
    name: 'Ko-fi',
    tagline: 'One-off or recurring support through Ko-fi. Best for quick contributions toward hosting, data collection, and source review.',
    cta: 'Support on Ko-fi',
    href: SUPPORT_LINKS.kofi,
    brand: '#29abe0',
    icon: <Coffee className="w-4 h-4" />,
    preferred: false,
  },
  {
    name: 'Buy Me a Coffee',
    tagline: 'Send a small thank-you contribution if HEStats saved you time or helped with research, reporting, or planning.',
    cta: 'Buy me a coffee',
    href: SUPPORT_LINKS.buy_me_a_coffee,
    brand: '#ffdd00',
    icon: <Coffee className="w-4 h-4" />,
    preferred: false,
  },
  {
    name: 'GitHub Issues',
    tagline: 'Contribute source links, annual report PDFs, data corrections, or validation notes directly in the public repo.',
    cta: 'Open an issue',
    href: `${SUPPORT_LINKS.github_repo}/issues/new`,
    brand: '#7396c2',
    icon: <GitBranch className="w-4 h-4" />,
    preferred: false,
  },
  {
    name: 'Email Data',
    tagline: 'Send annual report links, source corrections, or institutional finance contacts for manual review.',
    cta: 'Email HEStats',
    href: `mailto:${SUPPORT_LINKS.contact_email}?subject=HEStats%20data%20contribution`,
    brand: '#c2945a',
    icon: <Mail className="w-4 h-4" />,
    preferred: false,
  },
]

function TierColor({ color }: { color: string }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}50`,
        borderRadius: 2,
        fontSize: 9,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      {RECOGNITION_TIERS.find((t) => t.color === color)?.name ?? ''}
    </span>
  )
}

export function SupportPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Heart className="w-3 h-3" style={{ color: 'var(--negative)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>SUPPORT HESTATS</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--positive)', letterSpacing: '0.04em' }}>OPEN SOURCE</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--positive)', letterSpacing: '0.04em' }}>FREE FOREVER</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--warning)', letterSpacing: '0.04em' }}>STUDENT BUILT</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>0</span> public supporters recorded
        </span>
      </div>

      {/* Mission statement */}
      <div
        className="p-4 border"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <h1 style={{ color: 'var(--text)', fontSize: 18, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>
          UK higher education finances are public information.<br />
          Finding them shouldn't require a research team.
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.65, maxWidth: 680 }}>
          HEStats is an independent, open-source platform built and maintained by a university student.
          Every dataset, every chart, every comparison on this site is free — no account, no paywall, no premium tier.
          The source code and data registry are public. The platform exists because institutional financial data
          matters: to students choosing a university, journalists investigating sector health, policy makers,
          researchers, and the finance teams inside the institutions themselves.
        </p>
        <p style={{ color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.65, maxWidth: 680, marginTop: 10 }}>
          Supporters fund the infrastructure and data collection work that makes this possible.
          Every contribution directly enables more institutions, more years of history, and more features.
        </p>
      </div>

      {/* Impact stats */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 border-l border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        {IMPACT_STATS.map((stat) => (
          <div
            key={stat.label}
            className="px-4 py-3 border-r border-b flex flex-col gap-1"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
          >
            <span style={{ color: 'var(--muted)' }}>{stat.icon}</span>
            <span className="font-num tabular-nums" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 700 }}>
              {stat.value}
            </span>
            <span style={{ color: 'var(--text-2)', fontSize: 11.5 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Monthly funding progress */}
      <div
        className="p-3 border"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <div className="flex items-baseline justify-between mb-2">
          <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>Monthly infrastructure target</span>
          <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 12 }}>
            £{Math.round(MONTHLY_GOAL_PCT * 0.5)}<span style={{ color: 'var(--muted)' }}> / £50 per month</span>
          </span>
        </div>
        <div
          className="w-full h-2 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-2)', borderRadius: 2, border: '1px solid var(--border)' }}
        >
          <div
            style={{
              height: '100%',
              width: `${MONTHLY_GOAL_PCT}%`,
              backgroundColor: 'var(--positive)',
              borderRadius: 2,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 6 }}>
          {MONTHLY_GOAL_PCT}% of monthly target reached · covers domain, hosting, and CDN costs · data collection is volunteer time
        </p>
      </div>

      {/* Donation options */}
      <div>
        <div className="flex items-baseline gap-3 mb-2">
          <h2 style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Support the platform</h2>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>Choose any platform — all contributions reach the project</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
          {DONATION_OPTIONS.map((opt) => (
            <a
              key={opt.name}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 border flex flex-col gap-3 transition-colors relative"
              style={{ backgroundColor: 'var(--bg-2)', borderColor: opt.preferred ? opt.brand : 'var(--border)', borderRadius: 3 }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = opt.brand)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = opt.preferred ? opt.brand : 'var(--border)')}
            >
              {opt.preferred && (
                <div
                  className="absolute -top-px left-3 px-2 py-0.5 flex items-center gap-1"
                  style={{ backgroundColor: opt.brand, borderRadius: '0 0 3px 3px', fontSize: 9, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  <Star className="w-2.5 h-2.5" /> Recommended
                </div>
              )}
              <div className={`flex items-center gap-2 ${opt.preferred ? 'mt-2' : ''}`}>
                <span style={{ color: opt.brand }}>{opt.icon}</span>
                <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{opt.name}</span>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.55, flex: 1 }}>{opt.tagline}</p>
              <div
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 transition-opacity"
                style={{ backgroundColor: opt.brand, color: opt.brand === '#ffdd00' ? '#1a1a00' : '#fff', fontSize: 12.5, fontWeight: 600, borderRadius: 3 }}
              >
                {opt.cta} <ArrowUpRight className="w-3 h-3" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recognition tiers */}
      <Panel title="Recognition tiers" subtitle="Supporters fund public infrastructure — not a product">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RECOGNITION_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="p-3 border flex flex-col gap-2"
              style={{
                backgroundColor: 'var(--bg-2)',
                borderColor: 'var(--border)',
                borderRadius: 3,
                borderTop: `3px solid ${tier.color}`,
              }}
            >
              <div className="flex items-baseline justify-between">
                <span style={{ color: tier.color, fontSize: 13, fontWeight: 700 }}>{tier.name}</span>
                <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 12 }}>{tier.amount}</span>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.5 }}>{tier.description}</p>
              <ul className="space-y-1 mt-1">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2" style={{ color: 'var(--text-2)', fontSize: 11 }}>
                    <span style={{ color: tier.color, fontSize: 10 }}>✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      {/* Supporter wall */}
      <Panel title="Current supporters" subtitle="Thank you — this platform exists because of you">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div
            className="flex items-center justify-center gap-2 px-3 py-6 border sm:col-span-2 lg:col-span-3"
            style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, borderStyle: 'dashed' }}
          >
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>Public supporter recognition will appear here once support channels are active.</span>
          </div>
        </div>
      </Panel>

      {/* Roadmap */}
      <Panel title="Roadmap" subtitle="Where your support goes">
        <div className="space-y-1.5">
          {ROADMAP.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    item.status === 'available' ? 'var(--positive)' :
                    item.status === 'building' ? 'var(--warning)' :
                    'var(--border-strong)',
                }}
              />
              <span
                style={{
                  color: item.status === 'available' ? 'var(--text-2)' : item.status === 'building' ? 'var(--text)' : 'var(--muted)',
                  fontSize: 12.5,
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </span>
              <span
                className="ml-auto px-1.5 py-0.5"
                style={{
                  color: item.status === 'available' ? 'var(--positive)' : item.status === 'building' ? 'var(--warning)' : 'var(--muted)',
                  border: `1px solid currentColor`,
                  borderRadius: 2,
                  fontSize: 9,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  opacity: item.status === 'planned' ? 0.5 : 1,
                }}
              >
                {item.status === 'available' ? 'Available' : item.status === 'building' ? 'Building' : 'Planned'}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Open source / contribute */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <Panel title="Contribute code" subtitle="The repo is open — PRs welcome">
          <p style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 10 }}>
            The biggest bottleneck is data collection — ~145 institutions tracked, ~285 in the OfS register.
            If you can supply or scrape audited annual report PDFs, open an issue or PR.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={SUPPORT_LINKS.github_repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5"
              style={{ backgroundColor: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, borderRadius: 3 }}
            >
              <Github className="w-3.5 h-3.5" /> View on GitHub <ArrowUpRight className="w-3 h-3" />
            </a>
            <a
              href={`${SUPPORT_LINKS.github_repo}/issues/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5"
              style={{ backgroundColor: 'var(--panel)', color: 'var(--text-2)', border: '1px solid var(--border)', fontSize: 12, borderRadius: 3 }}
            >
              <GitBranch className="w-3.5 h-3.5" /> File an issue
            </a>
          </div>
        </Panel>

        <Panel title="Contribute data" subtitle="Work in HE finance? Help close the gap.">
          <p style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 10 }}>
            We accept official annual report PDFs, links to provider AFR returns, or direct numeric
            submissions. All sources are credited and dated in the registry. Institutions that contribute
            their own data receive a Verified badge.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`mailto:${SUPPORT_LINKS.contact_email}?subject=HEStats%20data%20contribution`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5"
              style={{ backgroundColor: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 12, borderRadius: 3 }}
            >
              <Mail className="w-3.5 h-3.5" /> {SUPPORT_LINKS.contact_email}
            </a>
          </div>
        </Panel>
      </div>

      {/* Transparency / acknowledgements */}
      <Panel title="Transparency" subtitle="What this platform is and is not">
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: <Server className="w-4 h-4" style={{ color: 'var(--link)' }} />, title: 'Infrastructure costs', body: 'Domain hestats.co.uk and underlying hosting. Your support keeps it online and fast.' },
              { icon: <Database className="w-4 h-4" style={{ color: 'var(--link)' }} />, title: 'Data collection', body: 'Locating, downloading, parsing, and validating hundreds of PDFs. Each institution takes hours of careful work.' },
              { icon: <Code className="w-4 h-4" style={{ color: 'var(--link)' }} />, title: 'Open source forever', body: 'No paywalls, no premium tier, no ads, no tracking. Support keeps the platform accessible to everyone.' },
            ].map((c) => (
              <div
                key={c.title}
                className="p-3 border flex flex-col gap-2"
                style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}
              >
                {c.icon}
                <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{c.title}</p>
                <p style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.5 }}>{c.body}</p>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.55 }}>
            Data sourced from the <span style={{ color: 'var(--text)' }}>Office for Students (OfS) Annual Financial Return</span>,{' '}
            <span style={{ color: 'var(--text)' }}>HESA finance open data</span>, individual institutional annual reports,
            and <span style={{ color: 'var(--text)' }}>Companies House</span> filings where applicable.
            HEStats is an independent informational service not affiliated with any university or regulator.
          </p>
        </div>
      </Panel>
    </div>
  )
}
