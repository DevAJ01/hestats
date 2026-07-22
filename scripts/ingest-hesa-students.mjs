import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const DEFAULT_SOURCE_FILE = path.join(os.homedir(), 'Downloads', 'figure-7.csv')
const SOURCE_FILE = process.env.HESTATS_HESA_STUDENTS_FIGURE7 || DEFAULT_SOURCE_FILE
const GENERATED_FILE = path.join(ROOT, 'src/app/data/generated/studentRecords.ts')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')
const RETRIEVED_DATE = process.env.HESTATS_RETRIEVED_DATE || '2026-07-21'
const LAST_VERIFIED = process.env.HESTATS_LAST_VERIFIED || RETRIEVED_DATE

const ACADEMIC_YEAR = '2024-25'
const SOURCE_URL = 'https://www.hesa.ac.uk/data-and-analysis/sb273/figure-7.csv'
const RESOURCE_URL = 'https://ckan.publishing.service.gov.uk/dataset/higher-education-student-statistics-uk-2024-25/resource/b384f0c7-8072-43a9-8154-367f06806cf4'
const SOURCE_REFERENCE = 'Figure 7 - HE student enrolments by HE provider and permanent address 2024/25'

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

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing HESA Student Figure 7 CSV: ${filePath}\n` +
      `Download the official resource from ${RESOURCE_URL} or set HESTATS_HESA_STUDENTS_FIGURE7.`,
    )
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  const headerIndex = lines.findIndex((line) => /^"?UKPRN"?[,;]/i.test(line.replace(/^\uFEFF/, '')))
  if (headerIndex === -1) throw new Error(`Could not find UKPRN header in ${filePath}`)

  const headers = parseCsvLine(lines[headerIndex]).map((header, index) => (
    index === 0 ? header.replace(/^\uFEFF/, '').trim() : header.trim()
  ))

  return lines.slice(headerIndex + 1)
    .filter((line) => line.trim())
    .map((line) => {
      const cells = parseCsvLine(line)
      const row = {}
      headers.forEach((header, index) => {
        row[header] = cells[index] ?? ''
      })
      return row
    })
}

function parseNumber(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed || trimmed === '..' || /^suppressed$/i.test(trimmed)) return null
  const numeric = Number(trimmed.replace(/[,\s]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

function normaliseHeader(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function findHeader(headers, predicate, label) {
  const header = headers.find((item) => predicate(normaliseHeader(item)))
  if (!header) throw new Error(`Could not identify ${label} column in Figure 7 CSV. Headers: ${headers.join(', ')}`)
  return header
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

function aggregateRows(rows) {
  const headers = Object.keys(rows[0] ?? {})
  const ukprnHeader = findHeader(headers, (h) => h === 'ukprn', 'UKPRN')
  const providerHeader = findHeader(headers, (h) => h.includes('provider'), 'provider')
  const levelHeader = findHeader(headers, (h) => h.includes('level of study'), 'level of study')
  const modeHeader = findHeader(headers, (h) => h.includes('mode of study'), 'mode of study')
  const countryHeader = findHeader(headers, (h) => h === 'country of he provider', 'country of HE provider')
  const regionHeader = findHeader(headers, (h) => h === 'region of he provider', 'region of HE provider')
  const addressHeader = findHeader(headers, (h) => h.includes('permanent') || h.includes('domicile'), 'permanent address')
  const countHeader = findHeader(headers, (h) => h.includes('number') || h.includes('enrol'), 'enrolment count')

  const byUkprn = new Map()
  for (const row of rows) {
    // Figure 7 contains the same provider totals repeated across several
    // dimensional slices. Use only the canonical all-provider-dimensions view
    // and its published subtotal rows to avoid double-counting enrolments.
    if (
      normCell(row[levelHeader]) !== 'all' ||
      normCell(row[modeHeader]) !== 'all' ||
      normCell(row[countryHeader]) !== 'all' ||
      normCell(row[regionHeader]) !== 'all'
    ) continue

    const ukprn = String(row[ukprnHeader] ?? '').trim()
    if (!ukprn) continue
    const value = parseNumber(row[countHeader])
    if (value === null) continue

    const existing = byUkprn.get(ukprn) ?? {
      ukprn,
      provider: String(row[providerHeader] ?? '').trim(),
      total: null,
      uk: null,
      nonUk: null,
      unknown: null,
    }

    const address = normCell(row[addressHeader])
    if (address === 'total') existing.total = value
    else if (address === 'total uk') existing.uk = value
    else if (address === 'total non uk') existing.nonUk = value
    else if (address === 'not known') existing.unknown = value
    byUkprn.set(ukprn, existing)
  }

  return byUkprn
}

function normCell(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function js(value) {
  return JSON.stringify(value)
}

function renderRecords(records) {
  const rows = records.map((record) => `  {
    institution_id: ${js(record.institution_id)},
    ukprn: ${js(record.ukprn)},
    academic_year: ${js(record.academic_year)},
    total_enrolments: ${record.total_enrolments},
    uk_enrolments: ${record.uk_enrolments},
    non_uk_enrolments: ${record.non_uk_enrolments},
    unknown_domicile_enrolments: ${record.unknown_domicile_enrolments},
    source_status: 'verified',
    source_id: 'hesa-students',
    source_url: ${js(SOURCE_URL)},
    source_reference: ${js(SOURCE_REFERENCE)},
    retrieved_date: ${js(RETRIEVED_DATE)},
    last_verified: ${js(LAST_VERIFIED)},
    confidence: 'high',
    included_in_aggregates: true,
    notes: ${js(record.notes)},
  }`).join(',\n')

  return `import type { StudentEnrolmentRecord } from '../students'\n\nexport const verifiedStudentEnrolmentRecords: StudentEnrolmentRecord[] = [\n${rows}\n]\n`
}

const sourceRows = readCsv(SOURCE_FILE)
const studentRowsByUkprn = aggregateRows(sourceRows)
const institutions = parseInstitutions()
const records = []
const missing = []

for (const institution of institutions) {
  if (!institution.ukprn) {
    missing.push(`${institution.id} (UKPRN pending)`)
    continue
  }
  const sourceRow = studentRowsByUkprn.get(institution.ukprn)
  if (!sourceRow || [sourceRow.total, sourceRow.uk, sourceRow.nonUk, sourceRow.unknown].some((value) => value === null)) {
    missing.push(`${institution.id} (${institution.ukprn})`)
    continue
  }
  records.push({
    institution_id: institution.id,
    ukprn: institution.ukprn,
    academic_year: ACADEMIC_YEAR,
    total_enrolments: sourceRow.total,
    uk_enrolments: sourceRow.uk,
    non_uk_enrolments: sourceRow.nonUk,
    unknown_domicile_enrolments: sourceRow.unknown,
    notes: `HESA provider label: ${sourceRow.provider}`,
  })
}

records.sort((a, b) => a.institution_id.localeCompare(b.institution_id))
fs.writeFileSync(GENERATED_FILE, renderRecords(records))

console.log(`Wrote ${records.length} verified HESA student enrolment rows to ${GENERATED_FILE}`)
if (missing.length) {
  console.warn(`No Figure 7 row matched ${missing.length} platform institutions: ${missing.join(', ')}`)
}
