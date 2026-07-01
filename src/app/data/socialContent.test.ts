import { describe, expect, it } from 'vitest'
import { AVAILABLE_YEARS } from './financials'
import { buildSocialStories, composeSocialPost, getSocialStudioSummary } from './socialContent'

describe('social content extraction', () => {
  it('builds source-aware stories from the latest verified finance rows', () => {
    const year = AVAILABLE_YEARS[0]
    const stories = buildSocialStories(year)
    const summary = getSocialStudioSummary(year)

    expect(summary.verifiedRows).toBeGreaterThan(0)
    expect(stories.length).toBeGreaterThan(4)
    expect(stories[0].sourceLine).toContain('verified rows only')
    expect(stories.every((story) => story.year === year)).toBe(true)
    expect(stories.every((story) => story.evidence.length > 0)).toBe(true)
  })

  it('keeps X drafts within the platform character limit', () => {
    const stories = buildSocialStories(AVAILABLE_YEARS[0]).slice(0, 5)

    for (const story of stories) {
      const post = composeSocialPost(story, 'x', 'sector', 'briefing')
      expect(post.characterCount).toBeLessThanOrEqual(post.limit)
      expect(post.body).toContain('#HEStats')
    }
  })
})
