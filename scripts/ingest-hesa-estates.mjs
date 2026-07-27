import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { gunzipSync } from 'node:zlib'

const ROOT = process.cwd()
const OUTPUT_FILE = path.join(ROOT, 'src/app/data/generated/estateRecords.ts')
const METRICS_OUTPUT_FILE = path.join(ROOT, 'src/app/data/generated/estateMetricRecords.ts')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')
const RETRIEVED_DATE = process.env.HESTATS_RETRIEVED_DATE || '2026-07-26'
const LAST_VERIFIED = process.env.HESTATS_LAST_VERIFIED || RETRIEVED_DATE
const SOURCE_URL = 'https://www.hesa.ac.uk/data-and-analysis/estates/environmental'
const INCLUDE_ALL_LATEST_METRICS = process.env.HESTATS_ESTATE_METRIC_MODE === 'all'

const cliFiles = process.argv.slice(2)
const envFiles = (process.env.HESTATS_HESA_ESTATES_CSV || '')
  .split(path.delimiter)
  .map((value) => value.trim())
  .filter(Boolean)
const SOURCE_FILES = cliFiles.length ? cliFiles : envFiles

if (!SOURCE_FILES.length) {
  throw new Error('Provide one or more official HESA DT042 CSVs as arguments, or set HESTATS_HESA_ESTATES_CSV using the platform path delimiter.')
}

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

function clean(value) {
  return String(value ?? '').replace(/^\uFEFF+/, '').trim()
}

function norm(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function readHesaCsv(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing HESA Estates source CSV: ${filePath}`)
  const bytes = fs.readFileSync(filePath)
  const text = filePath.endsWith('.gz') ? gunzipSync(bytes).toString('utf8') : bytes.toString('utf8')
  const lines = text.split(/\r?\n/)
  const parsed = lines.map(parseCsvLine)
  const headerIndex = parsed.findIndex((cells) => norm(cells[0]) === 'ukprn')
  if (headerIndex < 0) throw new Error(`Could not find the UKPRN header row in ${filePath}`)

  const metadata = {}
  for (const cells of parsed.slice(0, headerIndex)) {
    const key = clean(cells[0]).replace(/:$/, '')
    if (key) metadata[key] = cells.slice(1).map(clean).filter(Boolean).join(' | ')
    const academicYearIndex = cells.findIndex((cell) => norm(cell) === 'academic year')
    if (academicYearIndex >= 0) metadata.AcademicYearFilter = clean(cells[academicYearIndex + 1])
  }

  const headers = parsed[headerIndex].map(clean)
  const rows = parsed.slice(headerIndex + 1)
    .filter((cells) => cells.some((cell) => clean(cell)))
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, clean(cells[index])])))

  return { filePath, metadata, headers, rows }
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
  const trimmed = clean(value)
  if (!trimmed || trimmed === '..' || /^(x|c|suppressed|not applicable)$/i.test(trimmed)) return null
  const parsed = Number(trimmed.replace(/[,%\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function normalYear(value) {
  const match = String(value ?? '').match(/(20\d{2})\D?(\d{2})/)
  return match ? `${match[1]}-${match[2]}` : ''
}

function filteredAcademicYear(metadata) {
  return normalYear(metadata.AcademicYearFilter ?? '')
}

function tableId(metadata) {
  return clean(metadata['Reference ID'] || metadata['Title'] || 'DT042')
}

function sourceLink(metadata) {
  return clean(metadata['Data source link'] || SOURCE_URL)
}

function unitFor(header) {
  const match = header.match(/\(([^)]+)\)\s*$/)
  if (match) return match[1].replace('m2', 'm²').replace('m3', 'm³')
  if (/number of|spaces/i.test(header)) return 'count'
  if (/percentage|percent/i.test(header)) return '%'
  return 'value'
}

function metricId(header) {
  return norm(header)
    .replace(/\btotal\b/g, '')
    .replace(/\bm2\b/g, 'sqm')
    .replace(/\bm3\b/g, 'm3')
    .replace(/\s+/g, '_')
    .replace(/^_|_$/g, '')
}

function categoryFor(header) {
  const value = norm(header)
  if (/building|site|grounds|playing fields|parking|cycle|internal area/.test(value)) return 'buildings'
  if (/emission|carbon/.test(value)) return 'emissions'
  if (/energy|electricity|fuel|renewable/.test(value)) return 'energy'
  if (/water/.test(value)) return 'water'
  if (/waste/.test(value)) return 'waste'
  if (/condition/.test(value)) return 'condition'
  return 'other'
}

const SUMMARY_FIELDS = new Map([
  ['total number of sites', 'total_sites'],
  ['total number of buildings', 'total_buildings'],
  ['total site area hectares', 'total_site_area_hectares'],
  ['total grounds area hectares', 'grounds_area_hectares'],
  ['total playing fields area hectares', 'playing_fields_area_hectares'],
  ['total gross internal area m2', 'total_estate_area_sqm'],
  ['non residential m2', 'academic_estate_area_sqm'],
  ['residential m2', 'residential_estate_area_sqm'],
  ['academic estate area m2', 'academic_estate_area_sqm'],
  ['residential estate area m2', 'residential_estate_area_sqm'],
  ['scope 1 and 2 emissions tonnes co2e', 'scope1_2_emissions_tonnes_co2e'],
  ['scope 1 2 emissions tonnes co2e', 'scope1_2_emissions_tonnes_co2e'],
  ['total scope 1 and 2 carbon emissions kg co2e', 'scope1_2_emissions_tonnes_co2e'],
  ['total energy consumption kwh', 'energy_consumption_kwh'],
  ['total fuel used in he provider owned vehicles litres', 'vehicle_fuel_litres'],
  ['total generation of electricity exported to grid kwh', 'electricity_exported_kwh'],
  ['total water consumption m3', 'water_consumption_m3'],
  ['total renewable energy generated onsite or offsite kwh', 'renewable_energy_generated_kwh'],
  ['total waste tonnes', 'waste_tonnes'],
  ['total waste mass tonnes', 'waste_tonnes'],
  ['dec epc a b percentage', 'epc_dec_a_b_pct'],
  ['total number of car parking spaces', 'car_parking_spaces'],
  ['total number of cycle spaces', 'cycle_spaces'],
])

function summaryValue(category, rawValue) {
  const key = SUMMARY_FIELDS.get(norm(category))
  if (!key) return null
  const value = key === 'scope1_2_emissions_tonnes_co2e' && norm(category).includes('kg co2e')
    ? Math.round((rawValue / 1000) * 1000) / 1000
    : rawValue
  return { key, value }
}

const SUMMARY_KEYS = [
  'total_sites',
  'total_buildings',
  'total_site_area_hectares',
  'grounds_area_hectares',
  'playing_fields_area_hectares',
  'total_estate_area_sqm',
  'academic_estate_area_sqm',
  'residential_estate_area_sqm',
  'scope1_2_emissions_tonnes_co2e',
  'energy_consumption_kwh',
  'vehicle_fuel_litres',
  'electricity_exported_kwh',
  'water_consumption_m3',
  'renewable_energy_generated_kwh',
  'waste_tonnes',
  'epc_dec_a_b_pct',
  'car_parking_spaces',
  'cycle_spaces',
]

function js(value) {
  return JSON.stringify(value)
}

function renderRecords(records) {
  const rows = records.map((record) => `  {
    institution_id: ${js(record.institution_id)},
    ukprn: ${js(record.ukprn)},
    academic_year: ${js(record.academic_year)},
${SUMMARY_KEYS.map((key) => `    ${key}: ${record[key] ?? 'null'},`).join('\n')}
    source_status: 'verified',
    source_id: 'hesa-estates',
    source_url: ${js(record.source_url)},
    source_reference: ${js(record.source_reference)},
    retrieved_date: ${js(RETRIEVED_DATE)},
    last_verified: ${js(LAST_VERIFIED)},
    confidence: 'high',
    included_in_aggregates: true,
    notes: ${js(record.notes)},
  }`).join(',\n')
  return `import type { EstateRecord } from '../estates'\n\nexport const verifiedEstateRecords: EstateRecord[] = [\n${rows}\n]\n`
}

function renderMetricRecords(records) {
  const rows = records.map((record) => `  ${JSON.stringify(record)},`).join('\n')
  return `import type { EstateMetricRecord } from '../estates'\n\nexport const verifiedEstateMetricRecords: EstateMetricRecord[] = [\n${rows}\n]\n`
}

const institutions = parseInstitutions()
const byUkprn = new Map(institutions.filter((row) => row.ukprn).map((row) => [String(row.ukprn), row]))
const extracts = SOURCE_FILES.map(readHesaCsv)
const summaryByKey = new Map()
const metricByKey = new Map()
const unmatchedUkprns = new Set()

for (const extract of extracts) {
  const reference = tableId(extract.metadata)
  const yearFromFilter = filteredAcademicYear(extract.metadata)
  const ukprnHeader = extract.headers.find((header) => norm(header) === 'ukprn')
  const providerHeader = extract.headers.find((header) => norm(header) === 'he provider')
  const yearHeader = extract.headers.find((header) => norm(header) === 'academic year')
  if (!ukprnHeader) throw new Error(`${extract.filePath} has no UKPRN column`)
  const metricHeaders = extract.headers.filter((header) => ![ukprnHeader, providerHeader, yearHeader].includes(header))
  const tableHeader = extract.headers.find((header) => norm(header) === 'table')
  const markerHeader = extract.headers.find((header) => norm(header) === 'category marker')
  const categoryHeader = extract.headers.find((header) => norm(header) === 'category')
  const valueHeader = extract.headers.find((header) => norm(header) === 'value')
  const isLongFormat = Boolean(tableHeader && categoryHeader && valueHeader)

  for (const row of extract.rows) {
    const ukprn = clean(row[ukprnHeader])
    const institution = byUkprn.get(ukprn)
    if (!institution) {
      if (ukprn) unmatchedUkprns.add(ukprn)
      continue
    }
    const rowReference = isLongFormat
      ? `DT042 ${clean(row[tableHeader]).replace('-', ' ')}`
      : reference
    const academicYear = normalYear(yearHeader ? row[yearHeader] : '') || yearFromFilter
    if (!academicYear) throw new Error(`No academic year found for ${reference}; keep an Academic year column or filter in the HESA export.`)
    const key = `${institution.id}:${academicYear}`
    const summary = summaryByKey.get(key) || {
      institution_id: institution.id,
      ukprn,
      academic_year: academicYear,
      source_url: SOURCE_URL,
      tables: new Set(),
      providers: new Set(),
    }
    summary.tables.add(rowReference)
    summary.providers.add(clean(providerHeader ? row[providerHeader] : institution.canonical_name))

    if (isLongFormat) {
      const category = clean(row[categoryHeader])
      const marker = clean(markerHeader ? row[markerHeader] : '')
      const value = parseNumber(row[valueHeader])
      if (value === null) {
        summaryByKey.set(key, summary)
        continue
      }
      const mapped = summaryValue(category, value)
      if (mapped) summary[mapped.key] = mapped.value

      const energyRatingMatch = norm(category).match(/^(non residential|residential) category ([a-g]) m2$/)
      if (energyRatingMatch && norm(marker).includes('gross internal area in dec or epc')) {
        summary._energyRatingTotal = (summary._energyRatingTotal ?? 0) + value
        if (energyRatingMatch[2] === 'a' || energyRatingMatch[2] === 'b') {
          summary._energyRatingAB = (summary._energyRatingAB ?? 0) + value
        }
      }

      if (academicYear === '2024-25' && (mapped || INCLUDE_ALL_LATEST_METRICS)) {
        const metricKey = metricId(`${rowReference} ${marker} ${category}`)
        const metric = {
          institution_id: institution.id,
          ukprn,
          academic_year: academicYear,
          metric_id: metricKey,
          metric_label: category.replace(/\s+/g, ' ').trim(),
          value,
          unit: unitFor(category),
          category: categoryFor(`${marker} ${category}`),
          source_table: rowReference,
          source_status: 'verified',
          source_id: 'hesa-estates',
          source_url: `https://www.hesa.ac.uk/data-and-analysis/estates/${clean(row[tableHeader]).toLowerCase()}`,
          source_reference: `${rowReference}; HESA full long-form DT042 archive`,
          retrieved_date: RETRIEVED_DATE,
          last_verified: LAST_VERIFIED,
          confidence: 'high',
          included_in_aggregates: true,
        }
        metricByKey.set(`${key}:${metricKey}`, metric)
      }
      summaryByKey.set(key, summary)
      continue
    }

    for (const header of metricHeaders) {
      const value = parseNumber(row[header])
      if (value === null) continue
      const mapped = summaryValue(header, value)
      if (mapped) summary[mapped.key] = mapped.value

      const metric = {
        institution_id: institution.id,
        ukprn,
        academic_year: academicYear,
        metric_id: metricId(header),
        metric_label: header.replace(/\s*\([^)]+\)\s*$/, ''),
        value,
        unit: unitFor(header),
        category: categoryFor(header),
        source_table: reference,
        source_status: 'verified',
        source_id: 'hesa-estates',
        source_url: sourceLink(extract.metadata),
        source_reference: `${reference}; HESA provider extract filtered to ${academicYear.replace('-', '/')}`,
        retrieved_date: RETRIEVED_DATE,
        last_verified: LAST_VERIFIED,
        confidence: 'high',
        included_in_aggregates: true,
      }
      metricByKey.set(`${key}:${metric.metric_id}`, metric)
    }
    summaryByKey.set(key, summary)
  }
}

const summaryRecords = [...summaryByKey.values()]
  .map((record) => {
    const tables = [...record.tables].sort()
    const derivedEnergyRating = record._energyRatingTotal > 0
      ? Math.round(((record._energyRatingAB ?? 0) / record._energyRatingTotal) * 1000) / 10
      : null
    return {
      ...Object.fromEntries(SUMMARY_KEYS.map((key) => [key, key === 'epc_dec_a_b_pct' ? (record[key] ?? derivedEnergyRating) : (record[key] ?? null)])),
      institution_id: record.institution_id,
      ukprn: record.ukprn,
      academic_year: record.academic_year,
      source_url: SOURCE_URL,
      source_reference: `${tables.join(' and ')} provider extracts; filtered to ${record.academic_year.replace('-', '/')}`,
      notes: `Reported HESA Estates values from ${tables.join(' and ')}. Missing tables and blank or suppressed cells remain null; they are not inferred as zero.`,
    }
  })
  .filter((record) => SUMMARY_KEYS.some((key) => record[key] !== null))
  .sort((a, b) => a.institution_id.localeCompare(b.institution_id) || b.academic_year.localeCompare(a.academic_year))

const metricRecords = [...metricByKey.values()]
  .sort((a, b) => a.institution_id.localeCompare(b.institution_id) || b.academic_year.localeCompare(a.academic_year) || a.metric_id.localeCompare(b.metric_id))

fs.writeFileSync(OUTPUT_FILE, renderRecords(summaryRecords))
fs.writeFileSync(METRICS_OUTPUT_FILE, renderMetricRecords(metricRecords))

console.log(JSON.stringify({
  sources: SOURCE_FILES,
  matched_provider_years: summaryRecords.length,
  normalised_metric_rows: metricRecords.length,
  metric_mode: INCLUDE_ALL_LATEST_METRICS ? 'all-latest' : 'summary-latest',
  unmatched_ukprns: [...unmatchedUkprns].sort(),
  outputs: [OUTPUT_FILE, METRICS_OUTPUT_FILE],
}, null, 2))
