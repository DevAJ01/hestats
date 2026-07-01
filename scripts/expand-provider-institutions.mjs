import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const SOURCE_DIR = process.env.HESTATS_HESA_FINANCE_DIR || '/Users/ashanj/Downloads'
const TABLE_1 = path.join(SOURCE_DIR, 'table-1.csv')
const INSTITUTIONS_FILE = path.join(ROOT, 'src/app/data/institutions.ts')
const TARGET_PROVIDER_COUNT = 304

const EXCLUDED_FINANCE_ONLY_UKPRNS = new Set([
  '10008574', // The University of Wales (central functions)
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

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing source file: ${filePath}`)
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  const headerIndex = lines.findIndex((line) => line.replace(/^\uFEFF/, '').startsWith('UKPRN,'))
  if (headerIndex === -1) throw new Error(`Could not find UKPRN header in ${filePath}`)
  const headers = parseCsvLine(lines[headerIndex]).map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, '') : header))

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

function slugify(value) {
  const slug = String(value)
    .replace(/\[[^\]]+\]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/\b(the|limited|ltd|company)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
  return slug || 'provider'
}

function shortName(name) {
  return name
    .replace(/\s*\[[^\]]+\]\s*/g, ' ')
    .replace(/^The\s+/i, '')
    .replace(/\s+Limited$/i, '')
    .replace(/\s+Ltd$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function initials(name) {
  const words = shortName(name)
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !['and', 'of', 'the', 'for'].includes(word.toLowerCase()))
  return (words.slice(0, 2).map((word) => word[0]).join('') || 'HE').toUpperCase().slice(0, 2)
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
  const currentRows = parseInstitutions()
  const tableRows = readCsv(TABLE_1)
  const currentUkprns = new Set(currentRows.map((row) => row.ukprn).filter(Boolean))
  const currentIds = new Set(currentRows.map((row) => row.id))

  const financeProviders = tableRows
    .filter((row) =>
      row['Academic year'] === '2024/25' &&
      row['Year End Month'] === 'All' &&
      /^100\d{5}$/.test(row.UKPRN) &&
      !EXCLUDED_FINANCE_ONLY_UKPRNS.has(row.UKPRN)
    )
    .map((row) => ({
      ukprn: row.UKPRN,
      name: row['HE Provider'],
      nation: row['Country of HE provider'],
      location: row['Region of HE provider'] || row['Country of HE provider'],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const additions = []
  for (const provider of financeProviders) {
    if (currentUkprns.has(provider.ukprn)) continue
    let id = slugify(provider.name)
    if (currentIds.has(id)) id = `${id}-${provider.ukprn}`
    currentIds.add(id)
    currentUkprns.add(provider.ukprn)
    additions.push({
      id,
      canonical_name: provider.name,
      short_name: shortName(provider.name),
      ukprn: provider.ukprn,
      nation: provider.nation,
      official_website: '',
      logo_initial: initials(provider.name),
      founded: 0,
      city: provider.location,
    })
  }

  const expanded = [...currentRows, ...additions]
  if (expanded.length !== TARGET_PROVIDER_COUNT) {
    throw new Error(`Expected ${TARGET_PROVIDER_COUNT} institution rows after expansion, found ${expanded.length}. Additions: ${additions.length}`)
  }

  const source = [
    "import { Institution } from './types'",
    '',
    'export const institutions: Institution[] = [',
    ...expanded.map(rowToSource),
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
  console.log(`Expanded institutions from ${currentRows.length} to ${expanded.length} using ${additions.length} HESA finance provider rows.`)
}

main()
