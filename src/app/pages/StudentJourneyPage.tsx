import { useState } from 'react'
import { Link } from 'react-router'
import { Map, ArrowRight, ArrowUpRight, Users, GraduationCap, Briefcase, TrendingUp, BookOpen, Microscope, Award } from 'lucide-react'
import { getSectorOutcomes } from '../data/outcomes'
import { getSectorDegreeStats } from '../data/degrees'

interface JourneyStage {
  id: string
  icon: React.ReactNode
  label: string
  sublabel: string
  color: string
  stats: { label: string; value: string; note?: string }[]
  description: string
  links: { label: string; href: string }[]
}

function StageCard({ stage, active, onClick }: { stage: JourneyStage; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 transition-all"
      style={{ opacity: 1 }}
    >
      <div
        className="w-12 h-12 flex items-center justify-center rounded-full transition-all"
        style={{
          backgroundColor: active ? stage.color : 'var(--panel)',
          border: `2px solid ${active ? stage.color : 'var(--border)'}`,
          boxShadow: active ? `0 0 20px ${stage.color}44` : 'none',
        }}
      >
        <span style={{ color: active ? '#fff' : stage.color }}>{stage.icon}</span>
      </div>
      <p style={{ color: active ? 'var(--text)' : 'var(--text-2)', fontSize: 10, fontWeight: active ? 600 : 400, textAlign: 'center', maxWidth: 64 }}>{stage.label}</p>
    </button>
  )
}

export function StudentJourneyPage() {
  const [activeStage, setActiveStage] = useState<string>('application')
  const sector = getSectorOutcomes()
  const degreeStats = getSectorDegreeStats()

  const STAGES: JourneyStage[] = [
    {
      id: 'application',
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Application',
      sublabel: 'UCAS & clearing',
      color: '#7396c2',
      description: 'Every year, over 760,000 people apply to UK universities through UCAS. The application process involves personal statements, predicted grades, and reference letters — culminating in offers from institutions.',
      stats: [
        { label: 'UCAS applications', value: '762,000', note: '2024 cycle' },
        { label: 'Applicants', value: '577,000', note: 'unique individuals' },
        { label: 'Acceptance rate', value: '67%', note: 'offers converted to places' },
        { label: 'Clearing places', value: '68,000', note: '2024' },
        { label: 'International applicants', value: '118,000', note: 'non-UK domicile' },
        { label: 'Avg choices', value: '3.8', note: 'per applicant' },
      ],
      links: [{ label: 'View institutions', href: '/universities' }, { label: 'Rankings', href: '/rankings' }],
    },
    {
      id: 'offer',
      icon: <Award className="w-5 h-5" />,
      label: 'Offer & Enrolment',
      sublabel: 'Accepting & enrolling',
      color: '#c2945a',
      description: 'After receiving offers, applicants confirm their firm and insurance choices. A-Level results day in August determines who meets their offer conditions. Those who miss grades enter clearing for available places.',
      stats: [
        { label: 'Enrolments 2024', value: '484,000', note: 'new UK undergraduates' },
        { label: 'International enrolments', value: '136,000', note: 'new UG students' },
        { label: 'Mature students', value: '22%', note: 'over 21 at entry' },
        { label: 'First in family', value: '38%', note: 'first generation' },
        { label: 'Disabled students', value: '18%', note: 'declared disability' },
        { label: 'Care leavers', value: '4,200', note: 'additional bursaries available' },
      ],
      links: [{ label: 'Student finance', href: '/' }, { label: 'Support', href: '/support' }],
    },
    {
      id: 'study',
      icon: <GraduationCap className="w-5 h-5" />,
      label: 'Study',
      sublabel: '3–5 year degree',
      color: '#5fa97b',
      description: 'The core undergraduate experience. 2.4 million students are enrolled in UK HE at any time. Degrees typically last 3 years (4 in Scotland, 4–5 for integrated Masters programmes). NSS scores show 82% overall satisfaction.',
      stats: [
        { label: 'Total enrolled students', value: '2.4m', note: 'UK HE 2023-24' },
        { label: 'Undergraduate students', value: '1.82m', note: 'full and part time' },
        { label: 'Postgraduate students', value: '570,000', note: 'taught and research' },
        { label: 'Completion rate', value: '91.4%', note: 'non-continuation adjusted' },
        { label: 'NSS satisfaction', value: `${sector.avg_nss}%`, note: 'sector average' },
        { label: 'Degree subjects', value: `${degreeStats.total_subjects}`, note: 'tracked by HEStats' },
      ],
      links: [{ label: 'Degree intelligence', href: '/degrees' }, { label: 'Institutions', href: '/universities' }],
    },
    {
      id: 'placement',
      icon: <Briefcase className="w-5 h-5" />,
      label: 'Placement Year',
      sublabel: 'Industry experience',
      color: '#b18ab8',
      description: 'Around 26% of UK students complete a year in industry placement. Placement students earn significantly higher salaries and secure employment faster after graduation. Employers report higher retention rates for placement hires.',
      stats: [
        { label: 'Placement participation', value: '26%', note: 'of full-time UG students' },
        { label: 'Salary boost', value: '+£2.5k', note: 'vs non-placement grads' },
        { label: 'Employment boost', value: '+8pp', note: 'employment rate advantage' },
        { label: 'Employer retention', value: '+14%', note: '3-year retention uplift' },
        { label: 'Avg placement salary', value: '£19.5k', note: '2024 data' },
        { label: 'Conversion to grad offer', value: '61%', note: 'placement → grad job' },
      ],
      links: [{ label: 'Graduate Outcomes', href: '/graduate-outcomes' }, { label: 'Employers', href: '/employers' }],
    },
    {
      id: 'graduation',
      icon: <Award className="w-5 h-5" />,
      label: 'Graduation',
      sublabel: 'Degree awarded',
      color: '#6fb5b5',
      description: '350,000 students graduate from UK universities every year. Degree classification (First, 2:1, 2:2, Third) significantly influences early career opportunities. 70% of graduates received a First or 2:1 in 2024.',
      stats: [
        { label: 'Annual graduates', value: '350,000', note: 'UK HE sector' },
        { label: 'Firsts awarded', value: '31%', note: 'of all graduates 2024' },
        { label: '2:1 awarded', value: '49%', note: 'of all graduates' },
        { label: '2:2 awarded', value: '16%', note: 'of all graduates' },
        { label: 'Integrated Masters', value: '42,000', note: 'MEng, MChem, MMath etc.' },
        { label: 'Postgrad conversion', value: `${sector.avg_further_study_pct}%`, note: 'proceed to PG study' },
      ],
      links: [{ label: 'Graduate Outcomes', href: '/graduate-outcomes' }, { label: 'Rankings', href: '/rankings' }],
    },
    {
      id: 'employment',
      icon: <Briefcase className="w-5 h-5" />,
      label: 'Employment',
      sublabel: '15 months post-grad',
      color: '#5fa97b',
      description: 'The HESA Graduate Outcomes Survey tracks graduates 15 months after graduation. Across the sector, 87% are in employment or further study. Graduate-level employment is 68% — a key measure of degree quality.',
      stats: [
        { label: 'Employment rate', value: `${sector.avg_employment_rate}%`, note: '15 months post-graduation' },
        { label: 'Graduate-level roles', value: `${sector.avg_graduate_role_pct}%`, note: 'of those employed' },
        { label: 'Avg salary', value: `£${sector.avg_salary_k}k`, note: '15 months post-graduation' },
        { label: 'Median salary', value: `£${sector.avg_median_salary_k}k`, note: 'across all subjects' },
        { label: 'Unemployed', value: `${sector.avg_unemployed_pct}%`, note: 'seeking employment' },
        { label: 'Time to job', value: `${sector.avg_months_to_job} months`, note: 'sector average' },
      ],
      links: [{ label: 'Graduate Outcomes', href: '/graduate-outcomes' }, { label: 'Employers', href: '/employers' }],
    },
    {
      id: 'progression',
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Career Progression',
      sublabel: '3–5 years in',
      color: '#c2945a',
      description: 'By 3–5 years post-graduation, graduate careers diverge significantly. High performers in competitive sectors (finance, tech, law) see rapid salary growth. Many pursue professional qualifications (ACA, CFA, LPC, CEng) at this stage.',
      stats: [
        { label: 'Avg salary at 5 years', value: '£42k', note: 'across all graduates' },
        { label: 'Finance grads (5yr)', value: '£65k+', note: 'qualified accountants/analysts' },
        { label: 'Tech grads (5yr)', value: '£58k+', note: 'senior software engineers' },
        { label: 'Healthcare (5yr)', value: '£42k', note: 'specialty registrar level' },
        { label: 'Professional quals', value: '38%', note: 'studying for prof. quals.' },
        { label: 'Changed employer', value: '52%', note: 'moved jobs by year 3' },
      ],
      links: [{ label: 'Career Explorer', href: '/career-explorer' }, { label: 'Employers', href: '/employers' }],
    },
    {
      id: 'masters',
      icon: <BookOpen className="w-5 h-5" />,
      label: "Master's",
      sublabel: 'Postgraduate study',
      color: '#7396c2',
      description: '22% of UK undergraduates progress to a Master\'s degree within 3 years. Taught Masters (MA, MSc, MBA) dominate. London Business School, Oxford, and Cambridge attract international postgraduate students with world-class programmes.',
      stats: [
        { label: "Master's progression", value: `${sector.avg_further_study_pct}%`, note: 'proceed to PG study' },
        { label: 'Taught Masters', value: '230,000', note: 'enrolled 2023-24' },
        { label: 'International PGT', value: '58%', note: 'of taught postgrads' },
        { label: 'MBA students', value: '18,000', note: 'UK 2024' },
        { label: 'Avg Masters cost', value: '£12k', note: 'UK students' },
        { label: 'Conversion to PhD', value: '8%', note: 'of Masters graduates' },
      ],
      links: [{ label: 'Degrees', href: '/degrees' }, { label: 'Rankings', href: '/rankings' }],
    },
    {
      id: 'phd',
      icon: <Microscope className="w-5 h-5" />,
      label: 'PhD',
      sublabel: 'Doctoral research',
      color: '#cf6660',
      description: 'The UK has world-class doctoral training across all disciplines. 25,000 PhD studentships are awarded annually, mostly funded by Research Councils via UKRI. Edinburgh, Cambridge, and Imperial lead in PhD output.',
      stats: [
        { label: 'PhD enrolments', value: '110,000', note: 'total enrolled UK HE' },
        { label: 'PhDs awarded/yr', value: '25,000', note: '2023-24' },
        { label: 'UKRI funded', value: '18,000', note: 'Research Council studentships' },
        { label: 'International PhDs', value: '41%', note: 'of new PhD enrolments' },
        { label: 'Avg PhD stipend', value: '£18.6k', note: 'UKRI minimum 2025-26' },
        { label: 'Into academia', value: '28%', note: 'remain in HE sector' },
      ],
      links: [{ label: 'Research leaders', href: '/sector' }, { label: 'Rankings', href: '/rankings' }],
    },
    {
      id: 'leadership',
      icon: <Users className="w-5 h-5" />,
      label: 'Industry Leadership',
      sublabel: '10+ years in career',
      color: '#5fa97b',
      description: 'At senior career stages, UK graduates lead global organisations, drive research, and shape public policy. 74% of FTSE 350 directors are UK university graduates. The return on degree investment is clear over a lifetime.',
      stats: [
        { label: 'Graduate lifetime premium', value: '+£100k', note: 'IFS analysis vs non-graduate' },
        { label: 'FTSE 350 directors', value: '74%', note: 'are UK university graduates' },
        { label: 'Cabinet ministers', value: '89%', note: 'have UK degrees' },
        { label: 'NHS consultants', value: '38k+', note: 'UK medical graduates' },
        { label: 'Avg salary (10yr+)', value: '£58k', note: 'degree-holding workers' },
        { label: 'Self-employed (10yr)', value: '18%', note: 'graduates running businesses' },
      ],
      links: [{ label: 'Employer Intelligence', href: '/employers' }, { label: 'Graduate Outcomes', href: '/graduate-outcomes' }],
    },
  ]

  const active = STAGES.find((s) => s.id === activeStage) ?? STAGES[0]
  const activeIdx = STAGES.findIndex((s) => s.id === activeStage)

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}>
        <Map className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>STUDENT JOURNEY</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Viewing <span style={{ color: 'var(--text)' }}>{active.label}</span></span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Stage <span className="font-num" style={{ color: 'var(--text)' }}>{activeIdx + 1}</span> of {STAGES.length}</span>
        <span style={{ color: 'var(--muted)', fontSize: 10, marginLeft: 'auto' }}>Click any stage to explore</span>
      </div>

      {/* Stage timeline */}
      <div className="border p-4" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 6 }}>
        {/* Mobile: horizontal scroll */}
        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="flex items-center gap-0 min-w-max">
            {STAGES.map((stage, i) => (
              <div key={stage.id} className="flex items-center">
                <StageCard stage={stage} active={stage.id === activeStage} onClick={() => setActiveStage(stage.id)} />
                {i < STAGES.length - 1 && (
                  <div className="w-6 flex items-center justify-center flex-shrink-0">
                    <div className="h-0.5 w-full" style={{ backgroundColor: i < activeIdx ? active.color : 'var(--border)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active stage detail */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: `${active.color}22`, border: `2px solid ${active.color}` }}>
              <span style={{ color: active.color }}>{active.icon}</span>
            </div>
            <div>
              <h2 style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700 }}>{active.label}</h2>
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>{active.sublabel}</p>
            </div>
          </div>

          <p style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.65, marginBottom: 16, maxWidth: 700 }}>{active.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-l border-t mb-4" style={{ borderColor: 'var(--border)' }}>
            {active.stats.map(({ label, value, note }) => (
              <div key={label} className="px-3 py-2.5 border-r border-b" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)' }}>
                <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                <p className="font-num" style={{ color: active.color, fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
                {note && <p style={{ color: 'var(--muted)', fontSize: 9.5, marginTop: 2 }}>{note}</p>}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {active.links.map(({ label, href }) => (
              <Link key={href} to={href} className="flex items-center gap-1.5 px-3 py-1.5 transition-colors"
                style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)', fontSize: 11.5, textDecoration: 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = active.color; e.currentTarget.style.color = active.color }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}>
                {label} <ArrowUpRight className="w-3 h-3" />
              </Link>
            ))}
            <div className="ml-auto flex gap-2">
              <button onClick={() => setActiveStage(STAGES[Math.max(0, activeIdx - 1)].id)}
                disabled={activeIdx === 0}
                className="px-3 py-1.5 transition-colors"
                style={{ border: '1px solid var(--border)', borderRadius: 3, color: activeIdx === 0 ? 'var(--border)' : 'var(--text-2)', fontSize: 11 }}>
                ← Previous
              </button>
              <button onClick={() => setActiveStage(STAGES[Math.min(STAGES.length - 1, activeIdx + 1)].id)}
                disabled={activeIdx === STAGES.length - 1}
                className="px-3 py-1.5 transition-colors"
                style={{ backgroundColor: activeIdx === STAGES.length - 1 ? 'var(--border)' : active.color, color: '#fff', borderRadius: 3, fontSize: 11, fontWeight: 600 }}>
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-navigate grid */}
      <div>
        <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>All stages</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
          {STAGES.map((s, i) => (
            <button key={s.id} onClick={() => setActiveStage(s.id)}
              className="px-2 py-2 border transition-colors text-center"
              style={{
                backgroundColor: s.id === activeStage ? `${s.color}22` : 'var(--panel)',
                borderColor: s.id === activeStage ? s.color : 'var(--border)',
                borderRadius: 3,
              }}>
              <div className="flex justify-center" style={{ color: s.color }}>{s.icon}</div>
              <p style={{ color: s.id === activeStage ? 'var(--text)' : 'var(--muted)', fontSize: 9.5, marginTop: 2 }}>{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
        <p style={{ color: 'var(--muted)', fontSize: 10.5, lineHeight: 1.5 }}>Statistics sourced from HESA, UCAS, ONS, IFS, Graduate Outcomes, and DfE publications where available. Sector-context and pathway figures are guidance records and are not included in official platform aggregates unless a metric-level source row is attached.</p>
      </div>
    </div>
  )
}
