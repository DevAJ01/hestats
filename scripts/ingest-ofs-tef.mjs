import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const SOURCE_FILE = process.env.HESTATS_OFS_TEF_CSV || path.join('/Users/ashanj/Downloads', 'ofs-tef-2023-ratings.csv')
const OUTPUT_FILE = path.join(ROOT, 'src/app/data/generated/tefRecords.ts')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')
const RETRIEVED_DATE = process.env.HESTATS_RETRIEVED_DATE || '2026-07-01'
const LAST_VERIFIED = process.env.HESTATS_LAST_VERIFIED || RETRIEVED_DATE
const SOURCE_URL = 'https://www.officeforstudents.org.uk/for-providers/quality-and-standards/tef-2023-ratings/'
const SOURCE_REFERENCE = 'OfS TEF 2023 ratings. TEF ratings are assessment ratings, not annual rankings.'

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
    throw new Error(`Missing OfS TEF ratings CSV: ${filePath}. Set HESTATS_OFS_TEF_CSV to an official OfS TEF ratings export.`)
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

function normalRating(value) {
  const text = String(value ?? '').trim().toLowerCase()
  if (!text) return null
  if (text.includes('requires')) return 'Requires improvement'
  if (text.includes('gold')) return 'Gold'
  if (text.includes('silver')) return 'Silver'
  if (text.includes('bronze')) return 'Bronze'
  return null
}

function js(value) {
  return JSON.stringify(value)
}

function renderRecords(records) {
  const rows = records.map((record) => `  {
    institution_id: ${js(record.institution_id)},
    ukprn: ${js(record.ukprn)},
    assessment_year: '2023',
    valid_academic_years: ['2023-24', '2024-25', '2025-26', '2026-27'],
    overall_rating: ${js(record.overall_rating)},
    student_experience_rating: ${js(record.student_experience_rating)},
    student_outcomes_rating: ${js(record.student_outcomes_rating)},
    source_status: 'verified',
    source_id: 'ofs-tef',
    source_url: ${js(SOURCE_URL)},
    source_reference: ${js(SOURCE_REFERENCE)},
    retrieved_date: ${js(RETRIEVED_DATE)},
    last_verified: ${js(LAST_VERIFIED)},
    confidence: 'high',
    included_in_aggregates: true,
    notes: ${js(record.notes)},
  }`).join(',\n')
  return `import type { TefRecord } from '../tef'\n\nexport const verifiedTefRecords: TefRecord[] = [\n${rows}\n]\n`
}

const sourceRows = readCsv(SOURCE_FILE)
const headers = Object.keys(sourceRows[0] ?? {})
const ukprnHeader = findHeader(headers, ['ukprn'])
const overallHeader = findHeader(headers, ['overall rating', 'published overall rating'])
const experienceHeader = findHeader(headers, ['student experience rating', 'published student experience rating'])
const outcomesHeader = findHeader(headers, ['student outcomes rating', 'published student outcomes rating'])
const providerHeader = findHeader(headers, ['provider', 'name'])

if (!ukprnHeader || !overallHeader) throw new Error(`TEF CSV requires UKPRN and overall rating columns. Headers: ${headers.join(', ')}`)

const institutions = parseInstitutions()
const byUkprn = new Map(institutions.filter((row) => row.ukprn).map((row) => [row.ukprn, row]))
const records = []

for (const row of sourceRows) {
  const ukprn = String(row[ukprnHeader] ?? '').trim()
  const institution = byUkprn.get(ukprn)
  const overall = normalRating(row[overallHeader])
  if (!institution || !overall) continue
  records.push({
    institution_id: institution.id,
    ukprn,
    overall_rating: overall,
    student_experience_rating: experienceHeader ? normalRating(row[experienceHeader]) : null,
    student_outcomes_rating: outcomesHeader ? normalRating(row[outcomesHeader]) : null,
    notes: `OfS TEF 2023 provider label: ${providerHeader ? row[providerHeader] : institution.canonical_name}`,
  })
}

fs.writeFileSync(OUTPUT_FILE, renderRecords(records))
console.log(`Wrote ${records.length} verified OfS TEF rows to ${OUTPUT_FILE}`)
