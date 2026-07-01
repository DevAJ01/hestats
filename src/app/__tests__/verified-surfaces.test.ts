import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = ['src/app/pages', 'src/app/components', 'src/app/data']
const SKIP = new Set(['src/app/data/generated'])
const FORBIDDEN = /\bprototype\b|modelled|modeled|synthetic|illustrative|AI-generated|HEStats AI/i

function walk(dir: string): string[] {
  if (SKIP.has(dir)) return []
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (SKIP.has(path)) return []
    const stat = statSync(path)
    if (stat.isDirectory()) return walk(path)
    return /\.(ts|tsx)$/.test(path) ? [path] : []
  })
}

describe('verified public surfaces', () => {
  it('does not reintroduce unsupported prototype or modelled public copy', () => {
    const matches = ROOTS
      .flatMap(walk)
      .filter((path) => !path.endsWith('validation.test.ts'))
      .flatMap((path) => {
        const text = readFileSync(path, 'utf8')
        return FORBIDDEN.test(text) ? [path] : []
      })

    expect(matches).toEqual([])
  })
})
