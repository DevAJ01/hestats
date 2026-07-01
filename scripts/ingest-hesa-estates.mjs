import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const SOURCE_FILE = process.env.HESTATS_HESA_ESTATES_CSV || path.join('/Users/ashanj/Downloads', 'hesa-estates-provider.csv')
const OUTPUT_FILE = path.join(ROOT, 'src/app/data/generated/estateRecords.ts')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')
const RETRIEVED_DATE = process.env.HESTATS_RETRIEVED_DATE || '2026-07-01'
const LAST_VERIFIED = process.env.HESTATS_LAST_VERIFIED || RETRIEVED_DATE
const SOURCE_URL = 'https://www.hesa.ac.uk/data-and-analysis/estates/environmental'
const SOURCE_REFERENCE = 'HESA Estates Management provider-level source extract, 2015/16 to 2023/24'

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
    throw new Error(`Missing HESA Estates source CSV: ${filePath}. Set HESTATS_HESA_ESTATES_CSV to an official HESA Estates provider-level CSV.`)
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
    total_estate_area_sqm: ${record.total_estate_area_sqm},
    academic_estate_area_sqm: ${record.academic_estate_area_sqm},
    residential_estate_area_sqm: ${record.residential_estate_area_sqm},
    scope1_2_emissions_tonnes_co2e: ${record.scope1_2_emissions_tonnes_co2e},
    energy_consumption_kwh: ${record.energy_consumption_kwh},
    water_consumption_m3: ${record.water_consumption_m3},
    waste_tonnes: ${record.waste_tonnes},
    condition_a_b_pct: ${record.condition_a_b_pct},
    source_status: 'verified',
    source_id: 'hesa-estates',
    source_url: ${js(SOURCE_URL)},
    source_reference: ${js(SOURCE_REFERENCE)},
    retrieved_date: ${js(RETRIEVED_DATE)},
    last_verified: ${js(LAST_VERIFIED)},
    confidence: 'high',
    included_in_aggregates: true,
    notes: ${js(record.notes)},
  }`).join(',\n')
  return `import type { EstateRecord } from '../estates'\n\nexport const verifiedEstateRecords: EstateRecord[] = [\n${rows}\n]\n`
}

const sourceRows = readCsv(SOURCE_FILE)
const headers = Object.keys(sourceRows[0] ?? {})
const ukprnHeader = findHeader(headers, ['ukprn'])
const yearHeader = findHeader(headers, ['academic year', 'year'])
const metricHeaders = {
  total_estate_area_sqm: findHeader(headers, ['total estate area', 'total net internal area', 'gross internal area']),
  academic_estate_area_sqm: findHeader(headers, ['academic estate area', 'academic net internal area']),
  residential_estate_area_sqm: findHeader(headers, ['residential estate area', 'residential net internal area']),
  scope1_2_emissions_tonnes_co2e: findHeader(headers, ['scope 1 2 emissions', 'scope 1 and 2 emissions', 'carbon emissions']),
  energy_consumption_kwh: findHeader(headers, ['energy consumption kwh', 'total energy consumption']),
  water_consumption_m3: findHeader(headers, ['water consumption m3', 'water consumed']),
  waste_tonnes: findHeader(headers, ['waste tonnes', 'total waste']),
  condition_a_b_pct: findHeader(headers, ['condition a b pct', 'condition a b percentage']),
}

if (!ukprnHeader || !yearHeader) throw new Error(`Estates CSV requires UKPRN and year columns. Headers: ${headers.join(', ')}`)
if (!Object.values(metricHeaders).some(Boolean)) throw new Error(`Estates CSV contains no recognised provider-level estates metric columns. Headers: ${headers.join(', ')}`)

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
    notes: `HESA Estates provider extract row for ${institution.canonical_name}.`,
  }
  for (const [key, header] of Object.entries(metricHeaders)) {
    record[key] = header ? parseNumber(row[header]) : null
  }
  if (Object.keys(metricHeaders).some((key) => record[key] !== null)) records.push(record)
}

fs.writeFileSync(OUTPUT_FILE, renderRecords(records))
console.log(`Wrote ${records.length} verified HESA Estates rows to ${OUTPUT_FILE}`)
