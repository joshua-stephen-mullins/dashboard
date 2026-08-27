import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  toDateStr,
  getMonthGrid,
  formatMonthYear,
  getUpcomingEvents,
  formatEventDate,
  layoutWeekEvents,
  categoriesById,
  eventColor,
  isCoursework,
  filterEventsByCategory,
  getOpenAssignments,
  UNCATEGORIZED,
} from './calendar'

describe('toDateStr', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toDateStr(new Date(2024, 0, 5))).toBe('2024-01-05')
    expect(toDateStr(new Date(2024, 11, 31))).toBe('2024-12-31')
  })
})

describe('getMonthGrid', () => {
  it('always returns weeks of 7 cells', () => {
    const weeks = getMonthGrid(2024, 0) // Jan 2024
    expect(weeks.every((w) => w.length === 7)).toBe(true)
  })

  it('has correct number of current-month cells', () => {
    const weeks = getMonthGrid(2024, 1) // Feb 2024 (29 days, leap year)
    const currentMonthCells = weeks.flat().filter((c) => c.isCurrentMonth)
    expect(currentMonthCells).toHaveLength(29)
  })

  it('first current-month cell is the 1st', () => {
    const weeks = getMonthGrid(2024, 2) // March 2024
    const first = weeks.flat().find((c) => c.isCurrentMonth)
    expect(first.date).toBe('2024-03-01')
  })

  it('last current-month cell is the last day', () => {
    const weeks = getMonthGrid(2024, 2) // March 2024 (31 days)
    const currentMonth = weeks.flat().filter((c) => c.isCurrentMonth)
    expect(currentMonth.at(-1).date).toBe('2024-03-31')
  })

  it('marks today correctly', () => {
    const now = new Date(2024, 4, 15) // May 15 2024
    vi.setSystemTime(now)
    const weeks = getMonthGrid(2024, 4)
    const todayCells = weeks.flat().filter((c) => c.isToday)
    expect(todayCells).toHaveLength(1)
    expect(todayCells[0].date).toBe('2024-05-15')
    vi.useRealTimers()
  })

  it('month starting on Monday has no leading cells', () => {
    // Jan 2025 starts on Wednesday — use Jan 2024 which starts on Monday
    const weeks = getMonthGrid(2024, 0)
    expect(weeks[0][0].date).toBe('2024-01-01')
    expect(weeks[0][0].isCurrentMonth).toBe(true)
  })
})

describe('formatMonthYear', () => {
  it('formats month and year correctly', () => {
    expect(formatMonthYear(2024, 0)).toBe('January 2024')
    expect(formatMonthYear(2024, 11)).toBe('December 2024')
  })
})

describe('getUpcomingEvents', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 4, 10)) // May 10 2024
  })
  afterEach(() => vi.useRealTimers())

  const events = [
    { id: '1', date: '2024-05-08', start_time: null, title: 'Past' },
    { id: '2', date: '2024-05-10', start_time: null, title: 'Today' },
    { id: '3', date: '2024-05-12', start_time: '09:00', title: 'Future morning' },
    { id: '4', date: '2024-05-12', start_time: '14:00', title: 'Future afternoon' },
    { id: '5', date: '2024-05-15', start_time: null, title: 'Later' },
    { id: '6', date: '2024-06-01', start_time: null, title: 'June' },
  ]

  it('excludes past events', () => {
    const upcoming = getUpcomingEvents(events)
    expect(upcoming.find((e) => e.id === '1')).toBeUndefined()
  })

  it('includes today and future events', () => {
    const upcoming = getUpcomingEvents(events)
    expect(upcoming.map((e) => e.id)).toContain('2')
  })

  it('sorts by date then start_time', () => {
    const upcoming = getUpcomingEvents(events, 10)
    const futureDay = upcoming.filter((e) => e.date === '2024-05-12')
    expect(futureDay[0].id).toBe('3')
    expect(futureDay[1].id).toBe('4')
  })

  it('limits to count', () => {
    expect(getUpcomingEvents(events, 3)).toHaveLength(3)
  })
})

describe('formatEventDate', () => {
  it('formats date without time', () => {
    expect(formatEventDate('2024-05-10', null)).toBe('Fri, May 10')
  })

  it('formats date with AM time', () => {
    expect(formatEventDate('2024-05-10', '09:30')).toBe('Fri, May 10 · 9:30 AM')
  })

  it('formats date with PM time', () => {
    expect(formatEventDate('2024-05-10', '14:00')).toBe('Fri, May 10 · 2:00 PM')
  })

  it('handles midnight', () => {
    expect(formatEventDate('2024-05-10', '00:00')).toBe('Fri, May 10 · 12:00 AM')
  })

  it('handles noon', () => {
    expect(formatEventDate('2024-05-10', '12:00')).toBe('Fri, May 10 · 12:00 PM')
  })
})

describe('layoutWeekEvents', () => {
  // Week of Sun 2024-05-05 → Sat 2024-05-11
  const week = [
    { date: '2024-05-05' }, { date: '2024-05-06' }, { date: '2024-05-07' },
    { date: '2024-05-08' }, { date: '2024-05-09' }, { date: '2024-05-10' },
    { date: '2024-05-11' },
  ]

  it('excludes events outside the week', () => {
    const events = [
      { id: '1', date: '2024-05-01', end_date: '2024-05-04' },
      { id: '2', date: '2024-05-12', end_date: null },
    ]
    const { positioned } = layoutWeekEvents(events, week)
    expect(positioned).toHaveLength(0)
  })

  it('places a single-day event at the correct column', () => {
    const events = [{ id: '1', date: '2024-05-07', end_date: null }]
    const { positioned } = layoutWeekEvents(events, week)
    expect(positioned[0].colStart).toBe(2)
    expect(positioned[0].colEnd).toBe(2)
    expect(positioned[0].track).toBe(0)
  })

  it('spans a multi-day event across columns', () => {
    const events = [{ id: '1', date: '2024-05-07', end_date: '2024-05-09' }]
    const { positioned } = layoutWeekEvents(events, week)
    expect(positioned[0].colStart).toBe(2)
    expect(positioned[0].colEnd).toBe(4)
  })

  it('clamps an event starting before the week to col 0', () => {
    const events = [{ id: '1', date: '2024-05-01', end_date: '2024-05-06' }]
    const { positioned } = layoutWeekEvents(events, week)
    expect(positioned[0].colStart).toBe(0)
    expect(positioned[0].colEnd).toBe(1)
  })

  it('clamps an event ending after the week to col 6', () => {
    const events = [{ id: '1', date: '2024-05-09', end_date: '2024-05-15' }]
    const { positioned } = layoutWeekEvents(events, week)
    expect(positioned[0].colStart).toBe(4)
    expect(positioned[0].colEnd).toBe(6)
  })

  it('stacks non-overlapping events in the same track', () => {
    const events = [
      { id: '1', date: '2024-05-05', end_date: '2024-05-06' },
      { id: '2', date: '2024-05-08', end_date: '2024-05-09' },
    ]
    const { positioned, trackCount } = layoutWeekEvents(events, week)
    expect(trackCount).toBe(1)
    expect(positioned[0].track).toBe(0)
    expect(positioned[1].track).toBe(0)
  })

  it('stacks overlapping events in different tracks', () => {
    const events = [
      { id: '1', date: '2024-05-05', end_date: '2024-05-08' },
      { id: '2', date: '2024-05-07', end_date: '2024-05-10' },
    ]
    const { positioned, trackCount } = layoutWeekEvents(events, week)
    expect(trackCount).toBe(2)
    expect(positioned[0].track).not.toBe(positioned[1].track)
  })

  it('reports trackCount 0 for an empty week', () => {
    const { trackCount } = layoutWeekEvents([], week)
    expect(trackCount).toBe(0)
  })
})

describe('category helpers', () => {
  const school = { id: 'c1', name: 'School', color: 'red', is_coursework: true }
  const mead = { id: 'c2', name: 'Mead', color: 'amber', is_coursework: false }
  const byId = categoriesById([school, mead])

  it('takes the color from the event category', () => {
    expect(eventColor({ category_id: 'c1', color: 'blue' }, byId)).toBe('red')
  })

  it('falls back to the event color when uncategorized', () => {
    expect(eventColor({ category_id: null, color: 'teal' }, byId)).toBe('teal')
  })

  it('falls back to the event color when the category is missing', () => {
    expect(eventColor({ category_id: 'gone', color: 'teal' }, byId)).toBe('teal')
  })

  it('flags coursework only for coursework categories', () => {
    expect(isCoursework({ category_id: 'c1' }, byId)).toBe(true)
    expect(isCoursework({ category_id: 'c2' }, byId)).toBe(false)
    expect(isCoursework({ category_id: null }, byId)).toBe(false)
  })
})

describe('filterEventsByCategory', () => {
  const events = [
    { id: '1', category_id: 'c1' },
    { id: '2', category_id: 'c2' },
    { id: '3', category_id: null },
  ]

  it('returns everything when nothing is selected', () => {
    expect(filterEventsByCategory(events, new Set())).toHaveLength(3)
  })

  it('keeps only the selected categories', () => {
    const result = filterEventsByCategory(events, new Set(['c1']))
    expect(result.map((e) => e.id)).toEqual(['1'])
  })

  it('matches uncategorized events under the uncategorized key', () => {
    const result = filterEventsByCategory(events, new Set([UNCATEGORIZED]))
    expect(result.map((e) => e.id)).toEqual(['3'])
  })
})

describe('getOpenAssignments', () => {
  const school = { id: 'c1', name: 'School', color: 'red', is_coursework: true }
  const byId = categoriesById([school, { id: 'c2', name: 'Mead', is_coursework: false }])

  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 4, 10)) // May 10 2024
  })
  afterEach(() => vi.useRealTimers())

  const events = [
    { id: 'done', title: 'Done', date: '2024-05-12', category_id: 'c1', completed: true },
    { id: 'late', title: 'Late', date: '2024-05-01', category_id: 'c1', completed: false },
    { id: 'soon', title: 'Soon', date: '2024-05-12', category_id: 'c1', completed: false },
    { id: 'later', title: 'Later', date: '2024-05-20', category_id: 'c1', completed: false },
    { id: 'mead', title: 'Rack', date: '2024-05-11', category_id: 'c2', completed: false },
  ]

  it('lists only incomplete coursework, overdue first', () => {
    const result = getOpenAssignments(events, byId)
    expect(result.map((e) => e.id)).toEqual(['late', 'soon', 'later'])
    expect(result[0].overdue).toBe(true)
    expect(result[1].overdue).toBe(false)
  })

  it('uses end_date to decide whether a multi-day assignment is overdue', () => {
    const spanning = [{ id: 'span', date: '2024-05-01', end_date: '2024-05-15', category_id: 'c1', completed: false }]
    expect(getOpenAssignments(spanning, byId)[0].overdue).toBe(false)
  })

  it('respects the count cap', () => {
    expect(getOpenAssignments(events, byId, 2)).toHaveLength(2)
  })
})
