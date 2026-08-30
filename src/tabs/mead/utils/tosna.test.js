import { describe, it, expect } from 'vitest'
import { totalFermaidO, tosnaSchedule, goFermGrams, YEAST_FACTORS } from './tosna'
import { sgToBrix } from './calc'

describe('totalFermaidO', () => {
  it('follows the TOSNA formula', () => {
    const og = 1.100
    const expected = (sgToBrix(og) * 10 * 5 * 0.9) / 50
    expect(totalFermaidO({ og, batchSizeGal: 5, nitrogenNeed: 'medium' })).toBeCloseTo(expected, 6)
  })

  it('scales with the yeast nitrogen requirement', () => {
    const base = { og: 1.100, batchSizeGal: 5 }
    const low = totalFermaidO({ ...base, nitrogenNeed: 'low' })
    const high = totalFermaidO({ ...base, nitrogenNeed: 'high' })
    expect(high / low).toBeCloseTo(YEAST_FACTORS.high / YEAST_FACTORS.low, 6)
  })

  it('returns null without an OG or batch size', () => {
    expect(totalFermaidO({ og: null, batchSizeGal: 5 })).toBeNull()
    expect(totalFermaidO({ og: 1.100, batchSizeGal: 0 })).toBeNull()
  })

  it('returns null for a must at or below water', () => {
    expect(totalFermaidO({ og: 1.000, batchSizeGal: 5 })).toBeNull()
  })
})

describe('tosnaSchedule', () => {
  const pitchDate = '2026-08-01T12:00:00.000Z'

  it('splits the total into four equal doses', () => {
    const { totalGrams, perDoseGrams, doses } = tosnaSchedule({
      og: 1.100, batchSizeGal: 5, nitrogenNeed: 'medium', pitchDate,
    })
    expect(doses).toHaveLength(4)
    expect(perDoseGrams).toBeCloseTo(totalGrams / 4, 6)
    for (const d of doses) expect(d.amount).toBeCloseTo(perDoseGrams, 6)
  })

  it('schedules the first three doses at 24, 48 and 72 hours', () => {
    const { doses } = tosnaSchedule({ og: 1.100, batchSizeGal: 5, pitchDate })
    expect(doses[0].scheduledAt).toBe('2026-08-02T12:00:00.000Z')
    expect(doses[1].scheduledAt).toBe('2026-08-03T12:00:00.000Z')
    expect(doses[2].scheduledAt).toBe('2026-08-04T12:00:00.000Z')
  })

  it('gives the final dose both a day-7 date and a gravity trigger', () => {
    const { doses } = tosnaSchedule({ og: 1.100, batchSizeGal: 5, pitchDate })
    const last = doses[3]
    expect(last.scheduledAt).toBe('2026-08-08T12:00:00.000Z')
    expect(last.triggerGravity).toBeCloseTo(1.0667, 4)
  })

  it('still returns doses when no pitch date is set', () => {
    const { doses } = tosnaSchedule({ og: 1.100, batchSizeGal: 5, pitchDate: null })
    expect(doses).toHaveLength(4)
    for (const d of doses) expect(d.scheduledAt).toBeNull()
  })

  it('returns null when the inputs are incomplete', () => {
    expect(tosnaSchedule({ og: null, batchSizeGal: 5 })).toBeNull()
  })

  // Postgres date columns arrive as "YYYY-MM-DD", which JS parses as UTC
  // midnight. West of Greenwich that renders as the previous calendar day,
  // so every dose used to display one day early.
  it('anchors a date-only pitch date to local midnight, not UTC', () => {
    const { doses } = tosnaSchedule({ og: 1.100, batchSizeGal: 1, pitchDate: '2026-08-31' })
    const day = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    expect(day(doses[0].scheduledAt)).toBe('Sep 1')
    expect(day(doses[1].scheduledAt)).toBe('Sep 2')
    expect(day(doses[2].scheduledAt)).toBe('Sep 3')
    expect(day(doses[3].scheduledAt)).toBe('Sep 7')
  })
})

describe('goFermGrams', () => {
  it('doses 1.25 g per gram of yeast', () => {
    expect(goFermGrams(8)).toBe(10)
  })

  it('returns null without a yeast weight', () => {
    expect(goFermGrams(0)).toBeNull()
  })
})
