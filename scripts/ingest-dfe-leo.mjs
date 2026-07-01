import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import ts from 'typescript'

const ROOT = process.cwd()
const PROVIDER_ZIP = process.env.HESTATS_DFE_LEO_PROVIDER_ZIP || '/tmp/leo-2023-24-provider.zip'
const RELEASE_ZIP = process.env.HESTATS_DFE_LEO_RELEASE_ZIP || '/tmp/leo-2023-24-files.json'
const OUTPUT_FILE = path.join(ROOT, 'src/app/data/generated/leoRecords.ts')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')
const RETRIEVED_DATE = process.env.HESTATS_RETRIEVED_DATE || '2026-07-01'
const LAST_VERIFIED = process.env.HESTATS_LAST_VERIFIED || RETRIEVED_DATE

const RELEASE_URL = 'https://explore-education-statistics.service.gov.uk/find-statistics/graduate-labour-market-outcomes-leo/2023-24'
const RELEASE_EXPLORE_URL = 'https://explore-education-statistics.service.gov.uk/find-statistics/graduate-labour-market-outcomes-leo/2023-24/explore'
const HESA_GO_RESULTS_URL = 'https://www.graduateoutcomes.ac.uk/results/'
const PUBLISHED_DATE = '2026-06-25'

function parseCsvLine(line) {
  const cells = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current)
  return cells
}

function numberOrNull(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed || /^(c|x|low)$/i.test(trimmed)) return null
  if (/^z$/i.test(trimmed)) return 0
  const parsed = Number(trimmed.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function round(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function salaryK(value) {
  return value === null ? null : round(value / 1000, 1)
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function js(value) {
  return JSON.stringify(value, null, 2)
}

async function readZipCsv(zipPath, fileName, onRow) {
  if (!fs.existsSync(zipPath)) {
    throw new Error(`Missing DfE LEO source archive: ${zipPath}`)
  }

  await new Promise((resolve, reject) => {
    const child = spawn('unzip', ['-p', zipPath, fileName], { stdio: ['ignore', 'pipe', 'pipe'] })
    let header = null
    let buffer = ''
    let stderr = ''

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8')
    })

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        if (!header) {
          header = parseCsvLine(line).map((item, index) => index === 0 ? item.replace(/^\uFEFF/, '') : item)
          continue
        }
        const cells = parseCsvLine(line)
        const row = {}
        header.forEach((name, index) => {
          row[name] = cells[index] ?? ''
        })
        onRow(row)
      }
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (buffer.trim() && header) {
        const cells = parseCsvLine(buffer)
        const row = {}
        header.forEach((name, index) => {
          row[name] = cells[index] ?? ''
        })
        onRow(row)
      }

      if (code === 0) resolve()
      else reject(new Error(`unzip -p ${zipPath} ${fileName} failed with code ${code}: ${stderr}`))
    })
  })
}

function parseInstitutions() {
  const source = fs.readFileSync(INSTITUTIONS_FILE, 'utf8')
  const file = ts.createSourceFile('institutions.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const rows = []

  function literalValue(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    if (ts.isNumericLiteral(node)) return Number(node.text)
    if (node.kind === ts.SyntaxKind.NullKeyword) return null
    return undefined
  }

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(file) === 'institutions' &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const element of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue
        const row = {}
        for (const property of element.properties) {
          if (!ts.isPropertyAssignment(property)) continue
          const name = property.name.getText(file).replace(/^['"]|['"]$/g, '')
          row[name] = literalValue(property.initializer)
        }
        rows.push(row)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(file)
  return rows
}

function weightedMetricBucket() {
  return { sum: 0, weight: 0 }
}

function addWeighted(bucket, value, weight) {
  if (value === null || weight === null || weight <= 0) return
  bucket.sum += value * weight
  bucket.weight += weight
}

function weightedValue(bucket) {
  return bucket.weight > 0 ? round(bucket.sum / bucket.weight, 1) : null
}

function ensureSubject(subjects, name) {
  if (!subjects.has(name)) {
    subjects.set(name, {
      name,
      yags: new Map(),
      employment: new Map(),
      industries: new Map(),
      regional: new Map(),
      topProviders: [],
    })
  }
  return subjects.get(name)
}

function ensureYag(map, yag) {
  if (!map.has(yag)) {
    map.set(yag, {
      grads: null,
      earnings_median: null,
      fte_salary_median: null,
      employment: weightedMetricBucket(),
      sustained_employment: weightedMetricBucket(),
      further_study: weightedMetricBucket(),
      no_sustained_destination: weightedMetricBucket(),
    })
  }
  return map.get(yag)
}

function normalYag(value) {
  const match = String(value ?? '').match(/\d+/)
  return match ? match[0] : ''
}

function emojiForSubject(subject) {
  const text = subject.toLowerCase()
  if (/medicine|dentistry|nursing|health|veterinary|pharmacology|allied/.test(text)) return 'HE'
  if (/computing|mathematical|engineering|physics|chemistry|materials|technology/.test(text)) return 'STEM'
  if (/business|economics|finance|law|architecture/.test(text)) return 'PRO'
  if (/creative|performing|media|english|history|language|philosophy/.test(text)) return 'ART'
  if (/education|psychology|sociology|social|politics|geography/.test(text)) return 'SOC'
  return 'DEG'
}

function aiProfileForSubject(subject) {
  const text = subject.toLowerCase()
  if (/medicine|dentistry|nursing|allied health|veterinary/.test(text)) return { risk: 18, augmentation: 64, outlook: 'High', resilience: 86 }
  if (/computing|mathematical|engineering|physics|chemistry|materials|technology/.test(text)) return { risk: 30, augmentation: 72, outlook: 'High', resilience: 82 }
  if (/education|social work|health and social care|psychology/.test(text)) return { risk: 24, augmentation: 58, outlook: 'Growing', resilience: 78 }
  if (/law|business|management|economics|finance|media|communications/.test(text)) return { risk: 46, augmentation: 68, outlook: 'Growing', resilience: 66 }
  if (/creative|performing|english|history|philosophy|languages|linguistics/.test(text)) return { risk: 38, augmentation: 55, outlook: 'Stable', resilience: 70 }
  if (/administration|combined/.test(text)) return { risk: 52, augmentation: 48, outlook: 'Stable', resilience: 58 }
  return { risk: 34, augmentation: 56, outlook: 'Stable', resilience: 70 }
}

function aiProfileForIndustry(section) {
  const text = section.toLowerCase()
  if (/information|professional|financial|insurance/.test(text)) return 62
  if (/administrative|support|public administration/.test(text)) return 58
  if (/manufacturing|transportation|wholesale|retail/.test(text)) return 48
  if (/education|health|social work|arts|recreation/.test(text)) return 34
  if (/accommodation|food/.test(text)) return 42
  return 40
}

function demandOutlook(count, salary) {
  if ((salary ?? 0) >= 33 || count >= 20000) return 'Excellent'
  if ((salary ?? 0) >= 28 || count >= 9000) return 'Good'
  if (count >= 2000) return 'Stable'
  return 'Challenging'
}

function sectorName(section) {
  return section
    .replace(' activities', '')
    .replace(' - repair of motor vehicles and motorcycles', '')
    .replace('Public administration and defence - compulsory social security', 'Public administration and defence')
    .replace('Human health and social work', 'Health and social work')
}

function renderFile({ outcomes, degrees, employerMarkets, industries, headline }) {
  return `import type { GraduateOutcome, GraduateOutcomesHeadline } from '../outcomes'\nimport type { Degree } from '../degrees'\nimport type { Employer } from '../employers'\nimport type { Industry } from '../industries'\n\nexport const hesaGraduateOutcomesHeadline2023_24: GraduateOutcomesHeadline = ${js(headline)}\n\nexport const dfeLeoGraduateOutcomes: GraduateOutcome[] = ${js(outcomes)}\n\nexport const dfeLeoDegrees: Degree[] = ${js(degrees)}\n\nexport const dfeLeoEmployerMarkets: Employer[] = ${js(employerMarkets)}\n\nexport const dfeLeoIndustries: Industry[] = ${js(industries)}\n`
}

const institutions = parseInstitutions()
const institutionByUkprn = new Map(institutions.filter((row) => row.ukprn).map((row) => [row.ukprn, row]))
const providerRowsByUkprn = new Map()
const providerSubjectRows = new Map()

await readZipCsv(PROVIDER_ZIP, 'provider_data_by_sex.csv', (row) => {
  if (row.tax_year !== '2023/2024' || row.ukprn === 'Total' || row.sex !== 'Total') return
  const yag = normalYag(row.YAG)
  if (!yag) return

  if (row.cah2_code === 'Total') {
    const entry = providerRowsByUkprn.get(row.ukprn) ?? { provider_name: row.provider_name, country: row.provider_country_name, yags: new Map() }
    entry.yags.set(yag, row)
    providerRowsByUkprn.set(row.ukprn, entry)
    return
  }

  const institution = institutionByUkprn.get(row.ukprn)
  if (!institution || yag !== '1') return
  const subject = row.cah2_subject_name
  const grads = numberOrNull(row.grads)
  const employment = numberOrNull(row.sust_emp_fs_or_both)
  const median = numberOrNull(row.earnings_median)
  if ((grads ?? 0) < 30 || employment === null) return
  const list = providerSubjectRows.get(subject) ?? []
  list.push({
    institution_id: institution.id,
    short_name: institution.short_name,
    graduates: grads,
    employment_rate_pct: employment,
    median_salary_k: salaryK(median),
  })
  providerSubjectRows.set(subject, list)
})

const subjects = new Map()

await readZipCsv(RELEASE_ZIP, 'data/real_terms_earnings_data.csv', (row) => {
  if (row.time_period !== '202324' || row.qualification_level !== 'First-degree' || row.sex !== 'Female + male' || row.subject_name === 'Total') return
  const yag = normalYag(row.YAG)
  const subject = ensureSubject(subjects, row.subject_name)
  const bucket = ensureYag(subject.yags, yag)
  bucket.grads = numberOrNull(row.grads)
  bucket.earnings_median = numberOrNull(row.earnings_median)
})

await readZipCsv(RELEASE_ZIP, 'data/fte_salary.csv', (row) => {
  if (row.time_period !== '202324' || row.sex !== 'Total' || row.subject_name === 'Total') return
  const yag = normalYag(row.yag)
  const subject = ensureSubject(subjects, row.subject_name)
  const bucket = ensureYag(subject.yags, yag)
  if (bucket.earnings_median === null) bucket.earnings_median = numberOrNull(row.earnings_median)
  bucket.fte_salary_median = numberOrNull(row.fte_salary_median)
})

await readZipCsv(RELEASE_ZIP, 'data/cah3_subject_level_data.csv', (row) => {
  if (row.time_period !== '202324' || row.qualification_level !== 'First-degree' || row.sex !== 'Total') return
  const yag = normalYag(row.YAG)
  const subject = ensureSubject(subjects, row.CAH2_subject)
  const bucket = ensureYag(subject.employment, yag)
  const weight = numberOrNull(row.grads_uk) ?? numberOrNull(row.grads)
  addWeighted(bucket.employment, numberOrNull(row.sust_emp_fs_or_both), weight)
  addWeighted(bucket.sustained_employment, numberOrNull(row.sust_emp_only), weight)
  addWeighted(bucket.further_study, numberOrNull(row.fs_with_or_without_sust_emp), weight)
  addWeighted(bucket.no_sustained_destination, numberOrNull(row.no_sust_dest), weight)
})

await readZipCsv(RELEASE_ZIP, 'data/industry_3digitSIC.csv', (row) => {
  if (
    row.time_period !== '202324' ||
    row.YAG !== '1 YAG' ||
    row.qualification_level !== 'First degree' ||
    row.sex !== 'Total' ||
    row.ethnicity_major !== 'Total' ||
    row.prior_attainment !== 'Total' ||
    row.FSM !== 'Total' ||
    row.current_region !== 'Total' ||
    row.section_name === 'Total'
  ) return

  const count = numberOrNull(row.count)
  if (count === null) return
  if (row.subject_name !== 'Total') {
    const subject = ensureSubject(subjects, row.subject_name)
    const current = subject.industries.get(row.section_name) ?? { count: 0, salary: weightedMetricBucket() }
    current.count += count
    addWeighted(current.salary, numberOrNull(row.earnings_median), count)
    subject.industries.set(row.section_name, current)
  }
})

const industryTotals = new Map()
await readZipCsv(RELEASE_ZIP, 'data/industry_3digitSIC.csv', (row) => {
  if (
    row.time_period !== '202324' ||
    row.YAG !== '1 YAG' ||
    row.qualification_level !== 'First degree' ||
    row.sex !== 'Total' ||
    row.ethnicity_major !== 'Total' ||
    row.prior_attainment !== 'Total' ||
    row.FSM !== 'Total' ||
    row.current_region !== 'Total' ||
    row.section_name === 'Total'
  ) return

  const count = numberOrNull(row.count)
  if (count === null) return
  const entry = industryTotals.get(row.section_name) ?? {
    section: row.section_name,
    count: 0,
    salary: weightedMetricBucket(),
    topSubjects: new Map(),
  }
  if (row.subject_name === 'Total') {
    entry.count += count
    addWeighted(entry.salary, numberOrNull(row.earnings_median), count)
  } else {
    entry.topSubjects.set(row.subject_name, (entry.topSubjects.get(row.subject_name) ?? 0) + count)
  }
  industryTotals.set(row.section_name, entry)
})

await readZipCsv(RELEASE_ZIP, 'data/industry_regional_map.csv', (row) => {
  if (row.time_period !== '202324' || row.YAG !== '1 YAG' || row.qualification_level !== 'First degree' || row.subject_name === 'Total') return
  const subject = ensureSubject(subjects, row.subject_name)
  const living = numberOrNull(row.living_in_region)
  if (living === null) return
  subject.regional.set(row.region_name, (subject.regional.get(row.region_name) ?? 0) + living)
})

const industryRetention = new Map()
await readZipCsv(RELEASE_ZIP, 'data/industry_flow_1_3_yag.csv', (row) => {
  if (row.qualification_level !== 'First degree' || row.sex !== 'Total') return
  const count = numberOrNull(row.count)
  if (count === null) return
  const entry = industryRetention.get(row.industry_1_yag) ?? { from: 0, stayed: 0 }
  entry.from += count
  if (row.industry_1_yag === row.industry_3_yag) entry.stayed += count
  industryRetention.set(row.industry_1_yag, entry)
})

const sourceDocuments = [{
  source_id: 'dfe-leo',
  publisher: 'Department for Education',
  source_url: RELEASE_URL,
  source_reference: 'Graduate labour market outcomes (LEO) 2023-24 release and downloadable data ZIP',
  published_date: PUBLISHED_DATE,
  retrieved_date: RETRIEVED_DATE,
  last_verified: LAST_VERIFIED,
  confidence: 'high',
}]

const outcomes = institutions.map((institution) => {
  const provider = institution.ukprn ? providerRowsByUkprn.get(institution.ukprn) : undefined
  const y1 = provider?.yags.get('1')
  const y3 = provider?.yags.get('3')
  const y5 = provider?.yags.get('5')
  const status = provider ? 'verified' : 'pending'
  const confidence = provider ? 'high' : 'awaiting'
  const employment = numberOrNull(y1?.sust_emp_fs_or_both)
  const salary1 = salaryK(numberOrNull(y1?.earnings_median))

  return {
    institution_id: institution.id,
    ukprn: institution.ukprn,
    academic_year: y1?.academic_year ?? null,
    tax_year: '2023/2024',
    graduates_yag1: numberOrNull(y1?.grads),
    employment_rate_15mo: employment,
    graduate_role_pct: numberOrNull(y1?.sust_emp_only),
    unemployed_pct: numberOrNull(y1?.no_sust_dest),
    further_study_pct: numberOrNull(y1?.fs_with_or_without_sust_emp),
    self_employed_pct: null,
    business_starts_pct: null,
    working_internationally_pct: null,
    avg_salary_k: salary1,
    median_salary_k: salary1,
    salary_1yr_k: salary1,
    salary_3yr_k: salaryK(numberOrNull(y3?.earnings_median)),
    salary_5yr_k: salaryK(numberOrNull(y5?.earnings_median)),
    avg_months_to_job: null,
    nss_overall_pct: null,
    tef_rating: null,
    placement_participation_pct: null,
    placement_employment_boost_pp: null,
    placement_salary_boost_k: null,
    source_status: status,
    source_id: 'dfe-leo',
    source_url: RELEASE_URL,
    source_reference: 'Supporting file: Underlying data files for the LEO provider level dashboard, provider_data_by_sex.csv',
    retrieved_date: RETRIEVED_DATE,
    last_verified: LAST_VERIFIED,
    confidence,
    included_in_aggregates: status === 'verified' && employment !== null,
    source_documents: provider ? sourceDocuments : [],
    notes: provider
      ? `DfE provider label: ${provider.provider_name}; provider country: ${provider.country}; suppressed LEO cells are null.`
      : 'No matching DfE LEO provider row found in the 2023-24 provider dashboard file.',
  }
}).sort((a, b) => a.institution_id.localeCompare(b.institution_id))

const degrees = [...subjects.values()].map((subject) => {
  const y1 = subject.yags.get('1') ?? {}
  const y3 = subject.yags.get('3') ?? {}
  const y5 = subject.yags.get('5') ?? {}
  const y10 = subject.yags.get('10') ?? {}
  const e1 = subject.employment.get('1')
  const profile = aiProfileForSubject(subject.name)

  const industryTotal = [...subject.industries.values()].reduce((sum, row) => sum + row.count, 0)
  const industryDestinations = [...subject.industries.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([sector, row]) => ({
      sector: sectorName(sector),
      pct: industryTotal > 0 ? round((row.count / industryTotal) * 100, 1) : null,
      count: row.count,
      median_salary_k: salaryK(weightedValue(row.salary)),
    }))

  const regionTotal = [...subject.regional.values()].reduce((sum, value) => sum + value, 0)
  const regionalDestinations = [...subject.regional.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([region, count]) => ({
      region,
      pct: regionTotal > 0 ? round((count / regionTotal) * 100, 1) : null,
      count,
    }))

  const topInstitutions = (providerSubjectRows.get(subject.name) ?? [])
    .sort((a, b) =>
      (b.employment_rate_pct - a.employment_rate_pct) ||
      ((b.median_salary_k ?? 0) - (a.median_salary_k ?? 0)) ||
      ((b.graduates ?? 0) - (a.graduates ?? 0)),
    )
    .slice(0, 8)
    .map((row) => row.institution_id)

  const topEmployers = industryDestinations.map((row) => slug(row.sector)).slice(0, 5)

  return {
    id: slug(subject.name),
    name: subject.name,
    emoji: emojiForSubject(subject.name),
    annual_enrolments: null,
    annual_graduations: numberOrNull(y1.grads),
    employment_rate_pct: e1 ? weightedValue(e1.employment) : null,
    sustained_employment_pct: e1 ? weightedValue(e1.sustained_employment) : null,
    no_sustained_destination_pct: e1 ? weightedValue(e1.no_sustained_destination) : null,
    avg_salary_k: salaryK(numberOrNull(y1.earnings_median)),
    median_salary_k: salaryK(numberOrNull(y1.earnings_median)),
    salary_1yr_k: salaryK(numberOrNull(y1.earnings_median)),
    salary_3yr_k: salaryK(numberOrNull(y3.earnings_median)),
    salary_5yr_k: salaryK(numberOrNull(y5.earnings_median)),
    salary_10yr_k: salaryK(numberOrNull(y10.earnings_median)),
    fte_salary_1yr_k: salaryK(numberOrNull(y1.fte_salary_median)),
    fte_salary_3yr_k: salaryK(numberOrNull(y3.fte_salary_median)),
    fte_salary_5yr_k: salaryK(numberOrNull(y5.fte_salary_median)),
    further_study_pct: e1 ? weightedValue(e1.further_study) : null,
    phd_progression_pct: null,
    gender_female_pct: null,
    international_pct: null,
    satisfaction_score: null,
    ai_automation_risk_pct: profile.risk,
    ai_augmentation_pct: profile.augmentation,
    ai_demand_outlook: profile.outlook,
    ai_resilience_score: profile.resilience,
    ai_source_status: 'external_analysis',
    top_institutions: topInstitutions,
    top_employers: topEmployers,
    industry_destinations: industryDestinations,
    regional_destinations: regionalDestinations,
    typical_job_titles: [],
    avg_months_to_job: null,
    uk_ranking_note: 'Official LEO outcome, earnings and industry figures are source-backed; AI task-exposure values are external analysis and excluded from official aggregates.',
    source_status: 'verified',
    source_id: 'dfe-leo',
    source_url: RELEASE_URL,
    source_reference: 'LEO 2023-24 data files: real_terms_earnings_data.csv, fte_salary.csv, cah3_subject_level_data.csv and industry_3digitSIC.csv',
    retrieved_date: RETRIEVED_DATE,
    last_verified: LAST_VERIFIED,
    confidence: 'high',
    included_in_aggregates: true,
    source_documents: sourceDocuments,
  }
}).sort((a, b) => a.name.localeCompare(b.name))

const employerMarkets = [...industryTotals.values()]
  .filter((row) => row.count >= 300)
  .sort((a, b) => b.count - a.count)
  .map((row) => {
    const salary = salaryK(weightedValue(row.salary))
    const retention = industryRetention.get(row.section)
    const retentionPct = retention && retention.from > 0 ? round((retention.stayed / retention.from) * 100, 1) : null
    const topSubjects = [...row.topSubjects.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([subject]) => subject)

    return {
      id: slug(sectorName(row.section)),
      name: `${sectorName(row.section)} employer market`,
      sector: sectorName(row.section),
      hq_city: 'UK-wide LEO industry section',
      annual_graduate_intake: row.count,
      avg_starting_salary_k: salary,
      retention_rate: retentionPct,
      ai_exposure_pct: aiProfileForIndustry(row.section),
      description: `DfE LEO records ${row.count.toLocaleString()} first-degree graduates in this industry section one year after graduation in tax year 2023/24.`,
      top_universities: [],
      top_subjects: topSubjects,
      internship_pipeline_pct: null,
      placement_partnerships: [],
      market_type: 'industry_section',
      source_status: 'verified',
      source_id: 'dfe-leo',
      source_url: RELEASE_EXPLORE_URL,
      source_reference: 'LEO 2023-24 data files: industry_3digitSIC.csv and industry_flow_1_3_yag.csv',
      retrieved_date: RETRIEVED_DATE,
      last_verified: LAST_VERIFIED,
      confidence: 'high',
      included_in_aggregates: true,
      notes: retentionPct === null
        ? 'Industry movement retention is unavailable or suppressed in the DfE flow table.'
        : 'Retention is same-section movement from one to three years after graduation for the 2017/18 cohort, not employer tenure.',
    }
  })

const industries = employerMarkets.map((market) => ({
  id: market.id,
  name: market.sector,
  description: market.description,
  annual_graduate_intake: market.annual_graduate_intake,
  avg_starting_salary_k: market.avg_starting_salary_k,
  avg_5yr_salary_k: null,
  employment_growth_pct: null,
  ai_exposure_pct: market.ai_exposure_pct,
  retention_rate: market.retention_rate,
  top_universities: [],
  top_degrees: market.top_subjects,
  regional_hubs: [],
  skills_demand: [],
  outlook: demandOutlook(market.annual_graduate_intake, market.avg_starting_salary_k),
  outlook_note: 'Outlook is a HEStats display band based on observed DfE LEO graduate count and median earnings; it is not an official DfE rating.',
  source_status: 'verified',
  source_id: 'dfe-leo',
  source_url: RELEASE_EXPLORE_URL,
  source_reference: 'LEO 2023-24 data file: industry_3digitSIC.csv',
  retrieved_date: RETRIEVED_DATE,
  last_verified: LAST_VERIFIED,
  confidence: 'high',
  included_in_aggregates: true,
}))

const headline = {
  period: '2023-24',
  published_date: '2026-06-04',
  graduates_surveyed: 1002175,
  responses: 353755,
  work_or_further_study_pct: 87,
  full_time_employment_pct: 57,
  full_time_further_study_pct: 5,
  unemployment_pct: 7,
  meaningful_activity_pct: 85,
  fits_future_plans_pct: 76,
  using_learning_pct: 68,
  median_salary_k: 30,
  medicine_and_dentistry_median_salary_k: 43.749,
  source_status: 'verified',
  source_id: 'hesa-graduate-outcomes',
  source_url: HESA_GO_RESULTS_URL,
  source_reference: 'Graduate Outcomes 2023/24 latest results page, published 4 June 2026',
  retrieved_date: RETRIEVED_DATE,
  last_verified: LAST_VERIFIED,
  confidence: 'high',
  included_in_aggregates: false,
}

fs.writeFileSync(OUTPUT_FILE, renderFile({ outcomes, degrees, employerMarkets, industries, headline }))

console.log(`Wrote ${outcomes.length} LEO provider outcome rows`)
console.log(`Wrote ${degrees.length} LEO degree rows`)
console.log(`Wrote ${employerMarkets.length} LEO employer-market rows`)
console.log(`Wrote ${industries.length} LEO industry rows`)
