import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import ts from 'typescript'

const ROOT = process.cwd()
const SOURCE_DIR = process.env.HESTATS_HESA_STAFF_DIR || path.join(os.homedir(), 'Downloads')
const SOURCES = {
  headcount: process.env.HESTATS_HESA_STAFF_TABLE1 || path.join(SOURCE_DIR, 'table-1.zip'),
  characteristics: process.env.HESTATS_HESA_STAFF_TABLE2 || path.join(SOURCE_DIR, 'table-2.zip'),
  fte: process.env.HESTATS_HESA_STAFF_TABLE11 || path.join(SOURCE_DIR, 'table-11.zip'),
  nationality: process.env.HESTATS_HESA_STAFF_TABLE24 || path.join(SOURCE_DIR, 'table-24.csv'),
}
const OUTPUT_FILE = path.join(ROOT, 'src/app/data/generated/staffRecords.ts')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')
const RETRIEVED_DATE = process.env.HESTATS_RETRIEVED_DATE || '2026-07-21'
const LAST_VERIFIED = process.env.HESTATS_LAST_VERIFIED || RETRIEVED_DATE
const SOURCE_URL = 'https://www.hesa.ac.uk/data-and-analysis/staff/releases'
const SOURCE_REFERENCE = 'HESA Staff open data tables 1, 2, 11 and 24, provider-level records, 2015/16 to 2024/25'
const STAFF_YEARS = new Set([
  '2024-25', '2023-24', '2022-23', '2021-22', '2020-21',
  '2019-20', '2018-19', '2017-18', '2016-17', '2015-16',
])

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

async function streamCsvRows(filePath, onRow) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing HESA Staff source file: ${filePath}`)

  let input
  let child = null
  let childError = ''
  if (filePath.endsWith('.zip')) {
    child = spawn('unzip', ['-p', filePath], { stdio: ['ignore', 'pipe', 'pipe'] })
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => { childError += chunk })
    input = child.stdout
  } else {
    input = fs.createReadStream(filePath, { encoding: 'utf8' })
  }

  const lines = readline.createInterface({ input, crlfDelay: Infinity })
  let headers = null
  for await (const rawLine of lines) {
    const line = rawLine.replace(/^\uFEFF/, '')
    if (line.startsWith('UKPRN,')) {
      headers = parseCsvLine(line).map((header) => header.trim())
      continue
    }
    if (!headers || !/^100\d{5},/.test(line)) continue
    const cells = parseCsvLine(line)
    const row = {}
    headers.forEach((header, index) => { row[header] = cells[index] ?? '' })
    onRow(row)
  }

  if (child) {
    const exitCode = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('close', resolve)
    })
    if (exitCode !== 0) throw new Error(`Could not read ${filePath} with unzip: ${childError.trim()}`)
  }
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
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'institutions' && ts.isArrayLiteralExpression(node.initializer)) {
      for (const element of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue
        const row = {}
        for (const property of element.properties) {
          if (!ts.isPropertyAssignment(property)) continue
          row[property.name.getText(file).replace(/^['"]|['"]$/g, '')] = literalValue(property.initializer)
        }
        rows.push(row)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return rows
}

function parseNumber(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed || trimmed === '..' || /^(x|c|suppressed)$/i.test(trimmed)) return null
  const parsed = Number(trimmed.replace(/[,%\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function normalYear(value) {
  const match = String(value ?? '').match(/(20\d{2})\D?(\d{2})/)
  return match ? `${match[1]}-${match[2]}` : ''
}

function norm(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function round(value, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function percentage(numerator, denominator) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number' || denominator <= 0) return null
  return round((numerator / denominator) * 100)
}

function recordKey(ukprn, year) {
  return `${ukprn}:${year}`
}

function emptyMetrics(institution, year) {
  return {
    institution_id: institution.id,
    ukprn: institution.ukprn,
    academic_year: year,
    provider_label: institution.canonical_name,
    total_staff_fte: null,
    academic_staff_fte: null,
    non_academic_staff_fte: null,
    total_staff_headcount: null,
    academic_staff_headcount: null,
    non_academic_staff_headcount: null,
    female_staff_pct: null,
    non_uk_staff_pct: null,
  }
}

function ensureMetrics(metricsByKey, institutionsByUkprn, ukprn, year, providerLabel) {
  const institution = institutionsByUkprn.get(ukprn)
  if (!institution || !STAFF_YEARS.has(year)) return null
  const key = recordKey(ukprn, year)
  const metrics = metricsByKey.get(key) ?? emptyMetrics(institution, year)
  if (providerLabel) metrics.provider_label = providerLabel
  metricsByKey.set(key, metrics)
  return metrics
}

function isAllProviderView(row) {
  return norm(row['Country of HE provider']) === 'all' && norm(row['Region of HE provider']) === 'all'
}

async function loadHeadcounts(metricsByKey, institutionsByUkprn) {
  await streamCsvRows(SOURCES.headcount, (row) => {
    if (
      !isAllProviderView(row) ||
      norm(row['Mode of employment']) !== 'all' ||
      norm(row['Atypical marker']) !== 'non atypical'
    ) return

    const marker = norm(row['Academic marker'])
    const category = norm(row['Activity standard occupational classification'])
    let field = null
    if (marker === 'academic' && category === 'total academic staff') field = 'academic_staff_headcount'
    if (marker === 'non academic' && category === 'total non academic staff') field = 'non_academic_staff_headcount'
    if (!field) return

    const year = normalYear(row['Academic year'])
    const metrics = ensureMetrics(metricsByKey, institutionsByUkprn, row.UKPRN, year, row['HE provider'])
    if (metrics) metrics[field] = parseNumber(row.Number)
  })
}

async function loadSexCharacteristics(metricsByKey, institutionsByUkprn) {
  const accumulators = new Map()
  await streamCsvRows(SOURCES.characteristics, (row) => {
    if (
      !isAllProviderView(row) ||
      norm(row['Terms of employment']) !== 'all' ||
      norm(row['Contract levels']) !== 'all' ||
      norm(row['Atypical marker']) !== 'non atypical' ||
      norm(row['Contract marker']) !== 'all excluding atypical' ||
      norm(row['Category marker']) !== 'sex'
    ) return

    const year = normalYear(row['Academic year'])
    const metrics = ensureMetrics(metricsByKey, institutionsByUkprn, row.UKPRN, year, row['HE provider'])
    if (!metrics) return
    const key = recordKey(row.UKPRN, year)
    const value = parseNumber(row.Number)
    const acc = accumulators.get(key) ?? { female: null, total: 0, suppressed: false, seen: 0 }
    acc.seen += 1
    if (value === null) acc.suppressed = true
    else {
      acc.total += value
      if (norm(row.Category) === 'female') acc.female = value
    }
    accumulators.set(key, acc)
  })

  for (const [key, acc] of accumulators) {
    const metrics = metricsByKey.get(key)
    if (!metrics || acc.suppressed || acc.seen === 0) continue
    metrics.total_staff_headcount = acc.total
    metrics.female_staff_pct = percentage(acc.female, acc.total)
  }
}

async function loadFte(metricsByKey, institutionsByUkprn) {
  const fieldByMarker = new Map([
    ['academic excluding atypical', 'academic_staff_fte'],
    ['non academic', 'non_academic_staff_fte'],
    ['all excluding academic atypical', 'total_staff_fte'],
  ])
  await streamCsvRows(SOURCES.fte, (row) => {
    if (
      !isAllProviderView(row) ||
      norm(row['Category marker']) !== 'cost centre' ||
      norm(row.Category) !== 'total all cost centres'
    ) return

    const field = fieldByMarker.get(norm(row['Contract marker']))
    if (!field) return
    const year = normalYear(row['Academic year'])
    const metrics = ensureMetrics(metricsByKey, institutionsByUkprn, row.UKPRN, year, row['HE provider'])
    if (metrics) metrics[field] = parseNumber(row.Number)
  })
}

async function loadNationality(metricsByKey, institutionsByUkprn) {
  const accumulators = new Map()
  await streamCsvRows(SOURCES.nationality, (row) => {
    if (
      !isAllProviderView(row) ||
      norm(row['Atypical marker']) !== 'non atypical' ||
      norm(row['Contract marker']) !== 'all excluding atypical' ||
      norm(row['Mode of employment']) !== 'all'
    ) return

    const category = norm(row.Nationality)
    if (!['european union', 'non european union', 'total'].includes(category)) return
    const year = normalYear(row['Academic year'])
    const metrics = ensureMetrics(metricsByKey, institutionsByUkprn, row.UKPRN, year, row['HE provider'])
    if (!metrics) return
    const key = recordKey(row.UKPRN, year)
    const acc = accumulators.get(key) ?? { eu: null, nonEu: null, total: null, suppressed: false }
    const value = parseNumber(row.Number)
    if (value === null) acc.suppressed = true
    else if (category === 'european union') acc.eu = value
    else if (category === 'non european union') acc.nonEu = value
    else if (category === 'total') acc.total = value
    accumulators.set(key, acc)
  })

  for (const [key, acc] of accumulators) {
    const metrics = metricsByKey.get(key)
    if (!metrics || acc.suppressed || acc.eu === null || acc.nonEu === null) continue
    metrics.non_uk_staff_pct = percentage(acc.eu + acc.nonEu, acc.total)
  }
}

function finaliseRecords(metricsByKey) {
  const valueFields = [
    'total_staff_fte', 'academic_staff_fte', 'non_academic_staff_fte',
    'total_staff_headcount', 'academic_staff_headcount', 'non_academic_staff_headcount',
    'female_staff_pct', 'non_uk_staff_pct',
  ]

  return [...metricsByKey.values()]
    .filter((record) => valueFields.some((field) => record[field] !== null))
    .map((record) => {
      if (
        record.total_staff_headcount === null &&
        record.academic_staff_headcount !== null &&
        record.non_academic_staff_headcount !== null
      ) {
        record.total_staff_headcount = record.academic_staff_headcount + record.non_academic_staff_headcount
      }
      const unavailable = valueFields.filter((field) => record[field] === null)
      return {
        ...record,
        notes: unavailable.length
          ? `HESA Staff provider label: ${record.provider_label}. Unavailable or suppressed metrics: ${unavailable.join(', ')}.`
          : `HESA Staff provider label: ${record.provider_label}.`,
      }
    })
    .sort((a, b) => {
      const institution = a.institution_id.localeCompare(b.institution_id)
      return institution !== 0 ? institution : b.academic_year.localeCompare(a.academic_year)
    })
}

function js(value) {
  return JSON.stringify(value)
}

function renderRecords(records) {
  const rows = records.map((record) => `  {
    institution_id: ${js(record.institution_id)},
    ukprn: ${js(record.ukprn)},
    academic_year: ${js(record.academic_year)},
    total_staff_fte: ${js(record.total_staff_fte)},
    academic_staff_fte: ${js(record.academic_staff_fte)},
    non_academic_staff_fte: ${js(record.non_academic_staff_fte)},
    total_staff_headcount: ${js(record.total_staff_headcount)},
    academic_staff_headcount: ${js(record.academic_staff_headcount)},
    non_academic_staff_headcount: ${js(record.non_academic_staff_headcount)},
    female_staff_pct: ${js(record.female_staff_pct)},
    non_uk_staff_pct: ${js(record.non_uk_staff_pct)},
    source_status: 'verified',
    source_id: 'hesa-staff',
    source_url: ${js(SOURCE_URL)},
    source_reference: ${js(SOURCE_REFERENCE)},
    retrieved_date: ${js(RETRIEVED_DATE)},
    last_verified: ${js(LAST_VERIFIED)},
    confidence: 'high',
    included_in_aggregates: true,
    notes: ${js(record.notes)},
  }`).join(',\n')
  return `import type { StaffRecord } from '../staff'\n\nexport const verifiedStaffRecords: StaffRecord[] = [\n${rows}\n]\n`
}

async function main() {
  const institutions = parseInstitutions()
  const institutionsByUkprn = new Map(institutions.filter((row) => row.ukprn).map((row) => [row.ukprn, row]))
  const metricsByKey = new Map()

  console.log('Reading HESA Staff Table 1 headcounts...')
  await loadHeadcounts(metricsByKey, institutionsByUkprn)
  console.log('Reading HESA Staff Table 2 characteristics...')
  await loadSexCharacteristics(metricsByKey, institutionsByUkprn)
  console.log('Reading HESA Staff Table 11 FTE...')
  await loadFte(metricsByKey, institutionsByUkprn)
  console.log('Reading HESA Staff Table 24 nationality...')
  await loadNationality(metricsByKey, institutionsByUkprn)

  const records = finaliseRecords(metricsByKey)
  fs.writeFileSync(OUTPUT_FILE, renderRecords(records))
  const coveredInstitutions = new Set(records.map((record) => record.institution_id))
  console.log(JSON.stringify({
    output: OUTPUT_FILE,
    trackedInstitutions: institutions.length,
    coveredInstitutions: coveredInstitutions.size,
    verifiedRows: records.length,
    pendingInstitutionYears: institutions.length * STAFF_YEARS.size - records.length,
  }, null, 2))
}

await main()
