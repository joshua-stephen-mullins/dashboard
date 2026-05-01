import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { deduplicateFixtures, sortFixturesByDate, groupFixturesByDate } from './fixtures'

function makeFixture(id, date) {
  return { fixture: { id, date }, teams: { home: {}, away: {} } }
}

describe('deduplicateFixtures', () => {
  it('returns all fixtures when there are no duplicates', () => {
    const fixtures = [makeFixture(1, '2026-05-01'), makeFixture(2, '2026-05-02')]
    expect(deduplicateFixtures(fixtures)).toHaveLength(2)
  })

  it('removes duplicate fixtures with the same id', () => {
    const fixtures = [makeFixture(1, '2026-05-01'), makeFixture(1, '2026-05-01'), makeFixture(2, '2026-05-02')]
    expect(deduplicateFixtures(fixtures)).toHaveLength(2)
  })

  it('keeps the first occurrence when deduplicating', () => {
    const a = makeFixture(1, '2026-05-01')
    const b = makeFixture(1, '2026-05-01')
    const result = deduplicateFixtures([a, b])
    expect(result[0]).toBe(a)
  })

  it('returns an empty array when given an empty array', () => {
    expect(deduplicateFixtures([])).toEqual([])
  })
})

describe('sortFixturesByDate', () => {
  it('sorts fixtures in chronological order', () => {
    const fixtures = [
      makeFixture(3, '2026-05-03T15:00:00'),
      makeFixture(1, '2026-05-01T10:00:00'),
      makeFixture(2, '2026-05-02T20:00:00'),
    ]
    const sorted = sortFixturesByDate(fixtures)
    expect(sorted.map((f) => f.fixture.id)).toEqual([1, 2, 3])
  })

  it('does not mutate the original array', () => {
    const fixtures = [makeFixture(2, '2026-05-02'), makeFixture(1, '2026-05-01')]
    sortFixturesByDate(fixtures)
    expect(fixtures[0].fixture.id).toBe(2)
  })

  it('returns an empty array when given an empty array', () => {
    expect(sortFixturesByDate([])).toEqual([])
  })
})

describe('groupFixturesByDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('labels a fixture on today as "Today"', () => {
    const fixtures = [makeFixture(1, '2026-05-01T20:00:00')]
    const groups = groupFixturesByDate(fixtures)
    expect(groups.has('Today')).toBe(true)
  })

  it('labels a fixture on tomorrow as "Tomorrow"', () => {
    const fixtures = [makeFixture(1, '2026-05-02T15:00:00')]
    const groups = groupFixturesByDate(fixtures)
    expect(groups.has('Tomorrow')).toBe(true)
  })

  it('formats future dates beyond tomorrow as a readable label', () => {
    const fixtures = [makeFixture(1, '2026-05-05T15:00:00')]
    const groups = groupFixturesByDate(fixtures)
    const keys = [...groups.keys()]
    expect(keys[0]).not.toBe('Today')
    expect(keys[0]).not.toBe('Tomorrow')
    expect(keys[0]).toMatch(/Tue/)
  })

  it('groups multiple fixtures on the same day together', () => {
    const fixtures = [
      makeFixture(1, '2026-05-01T15:00:00'),
      makeFixture(2, '2026-05-01T20:00:00'),
    ]
    const groups = groupFixturesByDate(fixtures)
    expect(groups.get('Today')).toHaveLength(2)
  })

  it('creates separate groups for different days', () => {
    const fixtures = [
      makeFixture(1, '2026-05-01T15:00:00'),
      makeFixture(2, '2026-05-02T15:00:00'),
    ]
    const groups = groupFixturesByDate(fixtures)
    expect(groups.size).toBe(2)
  })

  it('returns an empty map when given an empty array', () => {
    const groups = groupFixturesByDate([])
    expect(groups.size).toBe(0)
  })
})
