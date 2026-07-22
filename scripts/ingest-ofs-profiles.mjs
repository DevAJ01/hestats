import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const SOURCE_FILE = process.env.HESTATS_OFS_REGISTER_JSON || path.join('/tmp', 'hestats-ofs-register-rows.json')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')

const HESA_REGION_LABELS = new Set([
  'north east',
  'north west',
  'yorkshire and the humber',
  'east midlands',
  'west midlands',
  'east of england',
  'south east',
  'south west',
])

const COUNTY_OR_REGION_LABELS = new Set([
  ...HESA_REGION_LABELS,
  'bedfordshire', 'berkshire', 'buckinghamshire', 'cambridgeshire', 'cheshire',
  'cornwall', 'county durham', 'cumbria', 'derbyshire', 'devon', 'dorset',
  'east sussex', 'essex', 'gloucestershire', 'greater london', 'greater manchester',
  'hampshire', 'herefordshire', 'hertfordshire', 'isle of wight', 'kent',
  'lancashire', 'leicestershire', 'lincolnshire', 'merseyside', 'norfolk',
  'north yorkshire', 'northamptonshire', 'northumberland', 'nottinghamshire',
  'oxfordshire', 'rutland', 'shropshire', 'somerset', 'south yorkshire',
  'staffordshire', 'suffolk', 'surrey', 'tyne and wear', 'warwickshire',
  'west midlands', 'west sussex', 'west yorkshire', 'wiltshire', 'worcestershire',
  'bucks', 'sussex',
])

const CITY_CORRECTIONS = new Map([
  ['pontetfract', 'Pontefract'],
])

function literalValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.NullKeyword) return null
  return undefined
}

function parseInstitutions() {
  const source = fs.readFileSync(INSTITUTIONS_FILE, 'utf8')
  const file = ts.createSourceFile('institutions.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const rows = []

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

function normaliseWebsite(value) {
  const text = String(value ?? '').trim()
  if (!text || text === '0' || /^not applicable$/i.test(text)) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    return url.hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return ''
  }
}

function cityFromAddress(value) {
  const lines = String(value ?? '')
    .split(/\r?\n|,/)
    .map((line) => line.trim().replace(/,$/, ''))
    .filter(Boolean)
    .filter((line) => !/^(united kingdom|england)$/i.test(line))
  const postcodeIndex = lines.findIndex((line) => /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(line))
  const addressLines = postcodeIndex >= 0 ? lines.slice(0, postcodeIndex) : lines
  if (!addressLines.length) return ''
  const last = addressLines.at(-1)
  const city = COUNTY_OR_REGION_LABELS.has(norm(last)) && addressLines.length > 1 ? addressLines.at(-2) : last
  return CITY_CORRECTIONS.get(norm(city)) ?? city
}

function singleQuoted(value) {
  if (value === null) return 'null'
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function rowToSource(row) {
  const optional = []
  if (row.metadata_status) optional.push(`metadata_status: ${singleQuoted(row.metadata_status)}`)
  if (row.mission_group) optional.push(`mission_group: ${singleQuoted(row.mission_group)}`)
  return `  { id: ${singleQuoted(row.id)}, canonical_name: ${singleQuoted(row.canonical_name)}, short_name: ${singleQuoted(row.short_name)}, ukprn: ${singleQuoted(row.ukprn)}, ${optional.length ? `${optional.join(', ')}, ` : ''}nation: ${singleQuoted(row.nation)}, official_website: ${singleQuoted(row.official_website)}, logo_initial: ${singleQuoted(row.logo_initial)}, founded: ${Number(row.founded) || 0}, city: ${singleQuoted(row.city)} },`
}

function main() {
  if (!fs.existsSync(SOURCE_FILE)) {
    throw new Error(`Missing OfS Register JSON row matrix: ${SOURCE_FILE}. Set HESTATS_OFS_REGISTER_JSON.`)
  }

  const sourceRows = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))
  const registerByUkprn = new Map()
  for (const row of sourceRows.slice(1)) {
    const ukprn = String(row[3] ?? '').replace(/\.0$/, '').trim()
    if (!/^100\d{5}$/.test(ukprn)) continue
    registerByUkprn.set(ukprn, {
      legalName: String(row[0] ?? '').trim(),
      address: String(row[4] ?? '').trim(),
      website: normaliseWebsite(row[6]),
    })
  }

  const institutions = parseInstitutions()
  let websiteUpdates = 0
  let cityUpdates = 0
  let matched = 0

  for (const institution of institutions) {
    if (institution.nation !== 'England' || !institution.ukprn) continue
    const registered = registerByUkprn.get(institution.ukprn)
    if (!registered) continue
    matched += 1

    if (!institution.official_website && registered.website) {
      institution.official_website = registered.website
      websiteUpdates += 1
    }

    const city = cityFromAddress(registered.address)
    if ((HESA_REGION_LABELS.has(norm(institution.city)) || institution.founded === 0) && city && city !== institution.city) {
      institution.city = city
      cityUpdates += 1
    }
  }

  const source = [
    "import { Institution } from './types'",
    '',
    'export const institutions: Institution[] = [',
    ...institutions.map(rowToSource),
    ']',
    '',
    'export function getInstitutionById(id: string): Institution | undefined {',
    '  return institutions.find(i => i.id === id)',
    '}',
    '',
    'export function getInstitutionByUkprn(ukprn: string): Institution | undefined {',
    '  return institutions.find(i => i.ukprn === ukprn)',
    '}',
    '',
  ].join('\n')

  fs.writeFileSync(INSTITUTIONS_FILE, source)
  console.log(JSON.stringify({
    registerRows: registerByUkprn.size,
    matchedEnglishInstitutions: matched,
    websiteUpdates,
    cityUpdates,
  }, null, 2))
}

main()
