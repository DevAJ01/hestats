import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const DEFAULT_SOURCE_DIR = '/Users/ashanj/Downloads'
const SOURCE_DIR = process.env.HESTATS_HESA_FINANCE_DIR || DEFAULT_SOURCE_DIR
const GENERATED_FILE = path.join(ROOT, 'src/app/data/generated/financialRecords.ts')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')
const RETRIEVED_DATE = process.env.HESTATS_RETRIEVED_DATE || '2026-07-01'
const LAST_VERIFIED = process.env.HESTATS_LAST_VERIFIED || RETRIEVED_DATE

const HESA_FINANCE_TABLES = {
  table1: {
    id: 'DT031 Table 1',
    path: path.join(SOURCE_DIR, 'table-1.csv'),
    url: 'https://www.hesa.ac.uk/data-and-analysis/finances/table-1.csv',
  },
  table3: {
    id: 'DT031 Table 3',
    path: path.join(SOURCE_DIR, 'table-3.csv'),
    url: 'https://www.hesa.ac.uk/data-and-analysis/finances/table-3.csv',
  },
  table9: {
    id: 'DT031 Table 9',
    path: path.join(SOURCE_DIR, 'table-9.csv'),
    url: 'https://www.hesa.ac.uk/data-and-analysis/finances/table-9.csv',
  },
  table14: {
    id: 'DT031 Table 14',
    path: path.join(SOURCE_DIR, 'table-14.csv'),
    url: 'https://www.hesa.ac.uk/data-and-analysis/finances/table-14.csv',
  },
}

const AVAILABLE_YEARS = [
  '2024-25', '2023-24', '2022-23', '2021-22', '2020-21',
  '2019-20', '2018-19', '2017-18', '2016-17', '2015-16',
]

const PROVIDER_YEAR_OVERRIDES = {
  regents: {
    '2017/18': '10003331',
    '2018/19': '10003331',
  },
}

const MANUAL_PROVIDER_UKPRNS = {
  bishop: '10007811',
  birkbeck: '10007760',
  city: '10001478',
  goldsmiths: '10002718',
  imperial: '10003270',
  northumbria: '10001282',
  qmu: '10005337',
  regents: '10086591',
  royalholloway: '10005553',
  solent: '10006022',
  stmarysbel: '10008026',
  trinitylaban: '10008017',
  uclan: '10007141',
  uwe: '10007164',
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

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing HESA source file: ${filePath}`)
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  const headerIndex = lines.findIndex((line) => line.replace(/^\uFEFF/, '').startsWith('UKPRN,'))
  if (headerIndex === -1) throw new Error(`Could not find UKPRN header in ${filePath}`)

  const headers = parseCsvLine(lines[headerIndex]).map((header, index) => (
    index === 0 ? header.replace(/^\uFEFF/, '') : header
  ))

  return lines.slice(headerIndex + 1)
    .filter(Boolean)
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
  if (!trimmed || trimmed === '..' || trimmed === 'Suppressed') return null
  const negative = /^\(.*\)$/.test(trimmed)
  const numeric = Number(trimmed.replace(/[(),]/g, ''))
  if (!Number.isFinite(numeric)) return null
  return negative ? -numeric : numeric
}

function toFiscalYear(academicYear) {
  return academicYear.replace('/', '-').replace(/-(\d{2})$/, '-$1')
}

function toGbpM(value) {
  const numeric = parseNumber(value)
  if (numeric === null) return null
  return round(numeric / 1000, 3)
}

function round(value, digits = 3) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function ratioPct(numerator, denominator) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number' || denominator === 0) return null
  return round((numerator / denominator) * 100, 1)
}

function js(value) {
  return JSON.stringify(value)
}

function normaliseName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\b(the|university|of)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
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

function buildProviderIndexes(table1Rows) {
  const byUkprn = new Map()
  const byName = new Map()

  for (const row of table1Rows) {
    const ukprn = row.UKPRN
    const name = row['HE Provider']
    if (!ukprn || byUkprn.has(ukprn)) continue
    const provider = { ukprn, name, country: row['Country of HE provider'] }
    byUkprn.set(ukprn, provider)
    byName.set(normaliseName(name), provider)
  }

  return { byUkprn, byName }
}

function resolveInstitutionUkprns(institutions, providerIndexes) {
  const resolved = new Map()
  const unresolved = []

  for (const institution of institutions) {
    const manualUkprn = MANUAL_PROVIDER_UKPRNS[institution.id]
    const provider = manualUkprn
      ? providerIndexes.byUkprn.get(manualUkprn)
      : providerIndexes.byName.get(normaliseName(institution.canonical_name)) ||
        providerIndexes.byName.get(normaliseName(institution.short_name))

    if (provider) {
      resolved.set(institution.id, provider)
    } else {
      unresolved.push(institution)
    }
  }

  if (unresolved.length) {
    throw new Error(`Could not resolve HESA providers for: ${unresolved.map((row) => row.id).join(', ')}`)
  }

  return resolved
}

function updateInstitutionUkprns(resolvedProviders) {
  let source = fs.readFileSync(INSTITUTIONS_FILE, 'utf8')

  for (const [id, provider] of resolvedProviders) {
    const rowPattern = new RegExp(`(\\{ id: '${id}',[^\\n]+?ukprn: )([^,]+)([^\\n]+?\\})`)
    source = source.replace(rowPattern, (_match, before, _oldValue, after) => {
      return `${before}'${provider.ukprn}'${after.replace(", metadata_status: 'pending'", '')}`
    })
  }

  fs.writeFileSync(INSTITUTIONS_FILE, source)
}

function allRowsByKey(rows, keyParts) {
  const map = new Map()
  for (const row of rows) {
    if ((row['Year End Month'] ?? '').trim() !== 'All') continue
    const key = keyParts.map((part) => String(row[part] ?? '').trim()).join('|')
    map.set(key, row)
  }
  return map
}

function buildFinancialRows(institutions, resolvedProviders, providerIndexes, sources) {
  const table1 = allRowsByKey(sources.table1, ['UKPRN', 'Academic year', 'Category marker', 'Category'])
  const table3 = allRowsByKey(sources.table3, ['UKPRN', 'Academic Year', 'Category Marker', 'Category'])
  const table9 = allRowsByKey(sources.table9, ['UKPRN', 'Academic year', 'Type of operation', 'Type of asset', 'Source of funds'])
  const table14 = allRowsByKey(sources.table14, ['UKPRN', 'Academic Year', 'KFI ratio title'])
  const records = []
  const provenance = []
  const missing = []

  function metric1(ukprn, year, marker, category) {
    return toGbpM(table1.get(`${ukprn}|${year}|${marker}|${category}`)?.['Value(£000s)'])
  }

  function metric3(ukprn, year, marker, category) {
    return toGbpM(table3.get(`${ukprn}|${year}|${marker}|${category}`)?.['Value(£000s)'])
  }

  function metric9(ukprn, year) {
    return toGbpM(table9.get(`${ukprn}|${year}|Total capital expenditure|Total capital expenditure|Total actual spend`)?.['Value(£000s)'])
  }

  function ratio14(ukprn, year, title) {
    const value = parseNumber(table14.get(`${ukprn}|${year}|${title}`)?.['Value (Ratio)'])
    return value === null ? null : round(value, 1)
  }

  for (const institution of institutions) {
    const provider = resolvedProviders.get(institution.id)
    for (const fiscalYear of AVAILABLE_YEARS) {
      const academicYear = fiscalYear.replace('-', '/')
      const rowUkprn = PROVIDER_YEAR_OVERRIDES[institution.id]?.[academicYear] ?? provider.ukprn
      const rowProvider = providerIndexes.byUkprn.get(rowUkprn) ?? provider
      const revenue = metric1(rowUkprn, academicYear, 'Income', 'Total income')
      const expenditure = metric1(rowUkprn, academicYear, 'Expenditure', 'Total expenditure')

      if (revenue === null || expenditure === null) {
        missing.push(`${institution.id}:${fiscalYear}`)
        continue
      }

      const research = metric1(rowUkprn, academicYear, 'Income', 'Research grants and contracts')
      const tuition = metric1(rowUkprn, academicYear, 'Income', 'Tuition fees and education contracts')
      const staffCosts = metric1(rowUkprn, academicYear, 'Expenditure', 'Staff costs')
      const operatingSurplus = metric1(
        rowUkprn,
        academicYear,
        'Surplus/(deficit) before other gains/losses and share of surplus/(deficit) in joint ventures and associates',
        'Surplus/(deficit) before other gains/losses and share of surplus/(deficit) in joint ventures and associates',
      )
      const cash = metric3(rowUkprn, academicYear, 'Current assets', 'Cash and cash equivalents')
      const currentBorrowing = metric3(rowUkprn, academicYear, 'Creditors - amounts falling due within one year', 'Bank loans and external borrowing')
      const longBorrowing = metric3(rowUkprn, academicYear, 'Creditors: amounts falling due after more than one year', 'Bank loans and external borrowing')
      const borrowing = typeof currentBorrowing === 'number' || typeof longBorrowing === 'number'
        ? round((currentBorrowing ?? 0) + (longBorrowing ?? 0), 3)
        : null
      const netAssets = metric3(rowUkprn, academicYear, 'Total net assets', 'Total net assets/(liabilities)')
      const capitalExpenditure = metric9(rowUkprn, academicYear)
      const surplus = operatingSurplus ?? round(revenue - expenditure, 3)
      const surplusMargin = ratio14(rowUkprn, academicYear, 'Surplus/(deficit) as a % of total income') ?? ratioPct(surplus, revenue)
      const liquidityDays = ratio14(rowUkprn, academicYear, 'Net liquidity days')
      const otherIncome = typeof research === 'number' && typeof tuition === 'number'
        ? round(revenue - research - tuition, 3)
        : null
      const borrowingBurden = typeof borrowing === 'number' && revenue > 0 ? borrowing / revenue : 0
      const riskFlag = surplusMargin !== null && (surplusMargin < 0 || (liquidityDays !== null && liquidityDays < 30) || borrowingBurden > 1)
        ? 'High'
        : surplusMargin !== null && (surplusMargin < 3 || (liquidityDays !== null && liquidityDays < 90) || borrowingBurden > 0.5)
          ? 'Medium'
          : 'Low'

      records.push({
        institution_id: institution.id,
        fiscal_year: fiscalYear,
        published: 'May-26',
        revenue_gbp_m: revenue,
        surplus_gbp_m: surplus,
        surplus_margin_pct: surplusMargin,
        research_income_gbp_m: research,
        tuition_fee_income_gbp_m: tuition,
        other_income_gbp_m: otherIncome,
        staff_costs_gbp_m: staffCosts,
        total_expenditure_gbp_m: expenditure,
        cash_gbp_m: cash,
        borrowing_gbp_m: borrowing,
        liquidity_days: liquidityDays,
        international_fte_pct: null,
        student_fte_total: null,
        capital_expenditure_gbp_m: capitalExpenditure,
        net_assets_gbp_m: netAssets,
        risk_flag: riskFlag,
        source_pdf: HESA_FINANCE_TABLES.table1.url,
        source_page: 'DT031 Tables 1, 3, 9 and 14',
        status: 'found',
        data_source: 'verified',
        confidence: 'high',
        included_in_aggregates: true,
      })

      provenance.push({
        institution_id: institution.id,
        fiscal_year: fiscalYear,
        source_id: 'hesa-finance',
        publication: 'HESA HE Provider Data: Finance',
        source_url: 'https://www.hesa.ac.uk/data-and-analysis/finances',
        page_reference: 'DT031 Tables 1, 3, 9 and 14',
        retrieved_date: RETRIEVED_DATE,
        last_verified: LAST_VERIFIED,
        confidence: 'high',
        notes: `Provider matched to ${rowProvider.name} (${rowUkprn}). Monetary values are converted from HESA GBP thousands to GBP millions. other_income_gbp_m is derived as total income minus tuition fee and research income.`,
      })
    }
  }

  return { records, provenance, missing }
}

function emitGeneratedFile(records, provenance) {
  fs.mkdirSync(path.dirname(GENERATED_FILE), { recursive: true })

  const rows = records
    .sort((a, b) => {
      const institution = a.institution_id.localeCompare(b.institution_id)
      if (institution !== 0) return institution
      return b.fiscal_year.localeCompare(a.fiscal_year)
    })
    .map((row) => `  ${js(row)},`)
    .join('\n')

  const sourceRows = provenance
    .sort((a, b) => {
      const institution = a.institution_id.localeCompare(b.institution_id)
      if (institution !== 0) return institution
      return b.fiscal_year.localeCompare(a.fiscal_year)
    })
    .map((row) => `  ${js(row)},`)
    .join('\n')

  const source = `import type { FinancialYear } from '../types'\nimport type { RecordProvenance } from '../sources'\n\nexport const verifiedFinancialRecords: FinancialYear[] = [\n${rows}\n]\n\nexport const generatedFinancialProvenance: RecordProvenance[] = [\n${sourceRows}\n]\n`

  fs.writeFileSync(GENERATED_FILE, source)
}

function main() {
  const sources = {
    table1: readCsv(HESA_FINANCE_TABLES.table1.path),
    table3: readCsv(HESA_FINANCE_TABLES.table3.path),
    table9: readCsv(HESA_FINANCE_TABLES.table9.path),
    table14: readCsv(HESA_FINANCE_TABLES.table14.path),
  }

  const institutions = parseInstitutions()
  const providerIndexes = buildProviderIndexes(sources.table1)
  const resolvedProviders = resolveInstitutionUkprns(institutions, providerIndexes)
  updateInstitutionUkprns(resolvedProviders)

  const { records, provenance, missing } = buildFinancialRows(institutions, resolvedProviders, providerIndexes, sources)
  emitGeneratedFile(records, provenance)

  console.log(JSON.stringify({
    sourceDir: SOURCE_DIR,
    institutions: institutions.length,
    verifiedRows: records.length,
    provenanceRows: provenance.length,
    pendingRows: institutions.length * AVAILABLE_YEARS.length - records.length,
    missing,
  }, null, 2))
}

main()
