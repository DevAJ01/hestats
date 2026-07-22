import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const SOURCE_FILE = process.env.HESTATS_WIKIDATA_PROFILES_JSON || path.join('/tmp', 'hestats-wikidata-profiles.json')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')

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

function normaliseWebsite(value) {
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return ''
  }
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
  if (!fs.existsSync(SOURCE_FILE)) throw new Error(`Missing Wikidata SPARQL JSON result: ${SOURCE_FILE}`)
  const bindings = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8')).results?.bindings ?? []
  const profilesByUkprn = new Map()

  for (const binding of bindings) {
    const ukprn = binding.ukprn?.value
    if (!/^100\d{5}$/.test(ukprn ?? '')) continue
    const profile = profilesByUkprn.get(ukprn) ?? { years: new Set(), websites: new Set() }
    const year = Number(String(binding.inception?.value ?? '').slice(0, 4))
    if (Number.isInteger(year) && year >= 1000 && year <= new Date().getFullYear()) profile.years.add(year)
    const website = normaliseWebsite(binding.website?.value)
    if (website) profile.websites.add(website)
    profilesByUkprn.set(ukprn, profile)
  }

  const institutions = parseInstitutions()
  let foundedUpdates = 0
  let websiteUpdates = 0
  for (const institution of institutions) {
    if (!institution.ukprn) continue
    const profile = profilesByUkprn.get(institution.ukprn)
    if (!profile) continue
    if (institution.founded === 0 && profile.years.size) {
      institution.founded = Math.min(...profile.years)
      foundedUpdates += 1
    }
    if (!institution.official_website && profile.websites.size) {
      institution.official_website = [...profile.websites].sort()[0]
      websiteUpdates += 1
    }
  }

  const source = [
    "import { Institution } from './types'", '',
    'export const institutions: Institution[] = [',
    ...institutions.map(rowToSource),
    ']', '',
    'export function getInstitutionById(id: string): Institution | undefined {',
    '  return institutions.find(i => i.id === id)',
    '}', '',
    'export function getInstitutionByUkprn(ukprn: string): Institution | undefined {',
    '  return institutions.find(i => i.ukprn === ukprn)',
    '}', '',
  ].join('\n')

  fs.writeFileSync(INSTITUTIONS_FILE, source)
  console.log(JSON.stringify({ wikidataUkprns: profilesByUkprn.size, foundedUpdates, websiteUpdates }, null, 2))
}

main()
