import { describe, it, expect } from 'vitest'
import {
  abv,
  apparentAttenuation,
  sweetnessBucket,
  strengthClass,
  sgToBrix,
  brixToSg,
  sugarBreakGravity,
  daysBetween,
  honeyCostPerBottle,
  fmtGravity,
  fmtAbv,
} from './calc'

describe('abv', () => {
  it('returns null when either gravity is missing', () => {
    expect(abv(null, 1.000)).toBeNull()
    expect(abv(1.100, null)).toBeNull()
  })

  it('applies the 131.25 factor', () => {
    expect(abv(1.100, 1.000)).toBeCloseTo(13.125, 3)
  })

  it('handles a sweet finish', () => {
    expect(abv(1.120, 1.020)).toBeCloseTo(13.125, 3)
  })
})

describe('apparentAttenuation', () => {
  it('returns 100% for a fully dry mead', () => {
    expect(apparentAttenuation(1.100, 1.000)).toBeCloseTo(100, 5)
  })

  it('returns a partial value for a sweet mead', () => {
    expect(apparentAttenuation(1.100, 1.020)).toBeCloseTo(80, 5)
  })

  it('returns null when og is at or below water', () => {
    expect(apparentAttenuation(1.000, 1.000)).toBeNull()
  })
})

describe('sweetnessBucket', () => {
  it('classifies dry below 1.010', () => {
    expect(sweetnessBucket(1.002)).toBe('dry')
  })

  it('classifies semi-sweet in the 1.010–1.025 band', () => {
    expect(sweetnessBucket(1.010)).toBe('semi-sweet')
    expect(sweetnessBucket(1.025)).toBe('semi-sweet')
  })

  it('classifies sweet above 1.025', () => {
    expect(sweetnessBucket(1.030)).toBe('sweet')
  })

  it('returns null without a final gravity', () => {
    expect(sweetnessBucket(null)).toBeNull()
  })
})

describe('strengthClass', () => {
  it('uses the BJCP boundaries', () => {
    expect(strengthClass(5)).toBe('hydromel')
    expect(strengthClass(7.5)).toBe('standard')
    expect(strengthClass(13.9)).toBe('standard')
    expect(strengthClass(14)).toBe('sack')
  })
})

describe('brix conversion', () => {
  it('converts water to roughly zero brix', () => {
    expect(sgToBrix(1.000)).toBeCloseTo(0, 1)
  })

  it('converts a typical mead must', () => {
    expect(sgToBrix(1.100)).toBeCloseTo(23.77, 1)
  })

  it('round-trips within a tenth of a brix', () => {
    const brix = sgToBrix(1.090)
    expect(sgToBrix(brixToSg(brix))).toBeCloseTo(brix, 1)
  })
})

describe('sugarBreakGravity', () => {
  it('finds the 1/3 break of a 1.100 must', () => {
    expect(sugarBreakGravity(1.100)).toBeCloseTo(1.0667, 4)
  })

  it('accepts another fraction', () => {
    expect(sugarBreakGravity(1.090, 2 / 3)).toBeCloseTo(1.030, 4)
  })
})

describe('daysBetween', () => {
  it('counts whole days elapsed', () => {
    const from = new Date('2026-08-01T00:00:00Z')
    const to = new Date('2026-08-15T00:00:00Z')
    expect(daysBetween(from, to)).toBe(14)
  })

  it('returns null for an unparseable date', () => {
    expect(daysBetween('not a date')).toBeNull()
  })
})

describe('honeyCostPerBottle', () => {
  it('divides cost across bottles', () => {
    expect(honeyCostPerBottle(60, 12)).toBe(5)
  })

  it('returns null with no bottles', () => {
    expect(honeyCostPerBottle(60, 0)).toBeNull()
  })
})

describe('formatters', () => {
  it('renders gravity to three places', () => {
    expect(fmtGravity(1.1)).toBe('1.100')
  })

  it('renders an em dash for missing values', () => {
    expect(fmtGravity(null)).toBe('—')
    expect(fmtAbv(null)).toBe('—')
  })
})
