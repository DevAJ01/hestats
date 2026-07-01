import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const SOURCE_FILE = process.env.HESTATS_HESA_STAFF_CSV || path.join('/Users/ashanj/Downloads', 'hesa-staff-provider.csv')
const OUTPUT_FILE = path.join(ROOT, 'src/app/data/generated/staffRecords.ts')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')
const RETRIEVED_DATE = process.env.HESTATS_RETRIEVED_DATE || '2026-07-01'
const LAST_VERIFIED = process.env.HESTATS_LAST_VERIFIED || RETRIEVED_DATE
const SOURCE_URL = 'https://www.hesa.ac.uk/data-and-analysis/staff/working-in-he'
const SOURCE_REFERENCE = 'HESA Staff open data provider-level source extract, 2015/16 to 2024/25'

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
    throw new Error(`Missing HESA Staff source CSV: ${filePath}. Set HESTATS_HESA_STAFF_CSV to an official HESA Staff provider-level CSV.`)
  }
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter((line) => line.trim())
  const headers = parseCsvLine(lines[0]).map((header, index) => index === 0 ? header.replace(/^\uFEFF/, '').trim() : header.trim())
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    const row = {}
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? ''
    })
    return row
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

function norm(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function findHeader(headers, candidates) {
  return headers.find((header) => candidates.some((candidate) => norm(header).includes(candidate)))
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

function js(value) {
  return JSON.stringify(value)
}

function renderRecords(records) {
  const rows = records.map((record) => `  {
    institution_id: ${js(record.institution_id)},
    ukprn: ${js(record.ukprn)},
    academic_year: ${js(record.academic_year)},
    total_staff_fte: ${record.total_staff_fte},
    academic_staff_fte: ${record.academic_staff_fte},
    non_academic_staff_fte: ${record.non_academic_staff_fte},
    total_staff_headcount: ${record.total_staff_headcount},
    academic_staff_headcount: ${record.academic_staff_headcount},
    non_academic_staff_headcount: ${record.non_academic_staff_headcount},
    female_staff_pct: ${record.female_staff_pct},
    non_uk_staff_pct: ${record.non_uk_staff_pct},
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

const sourceRows = readCsv(SOURCE_FILE)
const headers = Object.keys(sourceRows[0] ?? {})
const ukprnHeader = findHeader(headers, ['ukprn'])
const yearHeader = findHeader(headers, ['academic year', 'year'])
const metricHeaders = {
  total_staff_fte: findHeader(headers, ['total staff fte', 'staff fte total']),
  academic_staff_fte: findHeader(headers, ['academic staff fte']),
  non_academic_staff_fte: findHeader(headers, ['non academic staff fte', 'professional services staff fte']),
  total_staff_headcount: findHeader(headers, ['total staff headcount', 'staff headcount total']),
  academic_staff_headcount: findHeader(headers, ['academic staff headcount']),
  non_academic_staff_headcount: findHeader(headers, ['non academic staff headcount', 'professional services staff headcount']),
  female_staff_pct: findHeader(headers, ['female staff pct', 'female staff percentage']),
  non_uk_staff_pct: findHeader(headers, ['non uk staff pct', 'non uk staff percentage', 'non uk nationality pct']),
}

if (!ukprnHeader || !yearHeader) throw new Error(`Staff CSV requires UKPRN and year columns. Headers: ${headers.join(', ')}`)
if (!Object.values(metricHeaders).some(Boolean)) throw new Error(`Staff CSV contains no recognised provider-level staff metric columns. Headers: ${headers.join(', ')}`)

const institutions = parseInstitutions()
const byUkprn = new Map(institutions.filter((row) => row.ukprn).map((row) => [row.ukprn, row]))
const records = []

for (const row of sourceRows) {
  const ukprn = String(row[ukprnHeader] ?? '').trim()
  const institution = byUkprn.get(ukprn)
  const academicYear = normalYear(row[yearHeader])
  if (!institution || !academicYear) continue
  const record = {
    institution_id: institution.id,
    ukprn,
    academic_year: academicYear,
    notes: `HESA Staff provider extract row for ${institution.canonical_name}.`,
  }
  for (const [key, header] of Object.entries(metricHeaders)) {
    record[key] = header ? parseNumber(row[header]) : null
  }
  if (Object.keys(metricHeaders).some((key) => record[key] !== null)) records.push(record)
}

fs.writeFileSync(OUTPUT_FILE, renderRecords(records))
console.log(`Wrote ${records.length} verified HESA Staff rows to ${OUTPUT_FILE}`)
