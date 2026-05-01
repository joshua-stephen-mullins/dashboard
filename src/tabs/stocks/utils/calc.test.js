import { describe, it, expect } from 'vitest'
import { calcHolding, calcPortfolio, fmtUsd, fmtPct, fmtChange } from './calc'

function makeHolding(ticker, shares, avg_cost) {
  return { ticker, shares, avg_cost }
}

function makeQuote(c, d = 0) {
  return { data: { c, d } }
}

describe('calcHolding', () => {
  it('returns null when quoteData is null', () => {
    expect(calcHolding(makeHolding('AAPL', 10, 150), null)).toBeNull()
  })

  it('returns null when quoteData is undefined', () => {
    expect(calcHolding(makeHolding('AAPL', 10, 150), undefined)).toBeNull()
  })

  it('returns null when current price is null', () => {
    expect(calcHolding(makeHolding('AAPL', 10, 150), { c: null })).toBeNull()
  })

  it('calculates total value correctly', () => {
    const result = calcHolding(makeHolding('AAPL', 10, 150), { c: 200 })
    expect(result.totalValue).toBe(2000)
  })

  it('calculates a positive P/L correctly', () => {
    const result = calcHolding(makeHolding('AAPL', 10, 150), { c: 200 })
    expect(result.plDollar).toBe(500)
    expect(result.plPercent).toBeCloseTo(33.33, 1)
  })

  it('calculates a negative P/L correctly', () => {
    const result = calcHolding(makeHolding('AAPL', 10, 200), { c: 150 })
    expect(result.plDollar).toBe(-500)
    expect(result.plPercent).toBeCloseTo(-25, 1)
  })

  it('returns zero P/L when current price equals avg cost', () => {
    const result = calcHolding(makeHolding('AAPL', 10, 150), { c: 150 })
    expect(result.plDollar).toBe(0)
    expect(result.plPercent).toBe(0)
  })

  it('returns zero plPercent when avg cost is zero', () => {
    const result = calcHolding(makeHolding('AAPL', 10, 0), { c: 150 })
    expect(result.plPercent).toBe(0)
  })

  it('exposes the current price on the result', () => {
    const result = calcHolding(makeHolding('AAPL', 10, 150), { c: 200 })
    expect(result.currentPrice).toBe(200)
  })
})

describe('calcPortfolio', () => {
  it('returns zero totals and correct positions count for an empty holdings list', () => {
    const result = calcPortfolio([], {})
    expect(result.totalValue).toBe(0)
    expect(result.totalPL).toBe(0)
    expect(result.totalDayChange).toBe(0)
    expect(result.positions).toBe(0)
  })

  it('skips holdings with no quote data', () => {
    const holdings = [makeHolding('AAPL', 10, 150)]
    const result = calcPortfolio(holdings, {})
    expect(result.totalValue).toBe(0)
    expect(result.positions).toBe(1)
  })

  it('skips holdings where current price is null', () => {
    const holdings = [makeHolding('AAPL', 10, 150)]
    const quotes = { AAPL: { data: { c: null, d: 0 } } }
    const result = calcPortfolio(holdings, quotes)
    expect(result.totalValue).toBe(0)
  })

  it('sums total value across multiple holdings', () => {
    const holdings = [makeHolding('AAPL', 10, 150), makeHolding('TSLA', 5, 200)]
    const quotes = { AAPL: makeQuote(200), TSLA: makeQuote(300) }
    const result = calcPortfolio(holdings, quotes)
    expect(result.totalValue).toBe(3500)
  })

  it('calculates total P/L correctly', () => {
    const holdings = [makeHolding('AAPL', 10, 150), makeHolding('TSLA', 5, 200)]
    const quotes = { AAPL: makeQuote(200), TSLA: makeQuote(300) }
    const result = calcPortfolio(holdings, quotes)
    expect(result.totalPL).toBe(1000)
  })

  it('calculates total day change by summing shares * d across holdings', () => {
    const holdings = [makeHolding('AAPL', 10, 150), makeHolding('TSLA', 5, 200)]
    const quotes = { AAPL: makeQuote(200, 2), TSLA: makeQuote(300, -4) }
    const result = calcPortfolio(holdings, quotes)
    expect(result.totalDayChange).toBe(0)
  })

  it('treats missing d field as zero day change', () => {
    const holdings = [makeHolding('AAPL', 10, 150)]
    const quotes = { AAPL: { data: { c: 200 } } }
    const result = calcPortfolio(holdings, quotes)
    expect(result.totalDayChange).toBe(0)
  })

  it('reports positions as the total number of holdings regardless of quote availability', () => {
    const holdings = [makeHolding('AAPL', 10, 150), makeHolding('STFGX', 50, 14)]
    const quotes = { AAPL: makeQuote(200) }
    const result = calcPortfolio(holdings, quotes)
    expect(result.positions).toBe(2)
  })

  it('calculates dayChangePct relative to previous value', () => {
    const holdings = [makeHolding('AAPL', 10, 150)]
    const quotes = { AAPL: makeQuote(110, 10) }
    const result = calcPortfolio(holdings, quotes)
    // prevValue = 10 * 110 - 10 * 10 = 1100 - 100 = 1000
    // dayChangePct = 100 / 1000 * 100 = 10%
    expect(result.dayChangePct).toBeCloseTo(10, 5)
  })

  it('returns zero dayChangePct when prevValue is zero', () => {
    const holdings = [makeHolding('AAPL', 10, 150)]
    const quotes = { AAPL: makeQuote(0, 0) }
    const result = calcPortfolio(holdings, quotes)
    expect(result.dayChangePct).toBe(0)
  })
})

describe('fmtUsd', () => {
  it('formats a positive value as USD currency', () => {
    expect(fmtUsd(1234.5)).toBe('$1,234.50')
  })

  it('formats zero', () => {
    expect(fmtUsd(0)).toBe('$0.00')
  })

  it('formats a negative value', () => {
    expect(fmtUsd(-50)).toBe('-$50.00')
  })

  it('rounds to two decimal places', () => {
    expect(fmtUsd(1.005)).toBe('$1.01')
  })
})

describe('fmtPct', () => {
  it('prefixes positive values with a + sign', () => {
    expect(fmtPct(5.5)).toBe('+5.50%')
  })

  it('does not double-prefix negative values', () => {
    expect(fmtPct(-3.25)).toBe('-3.25%')
  })

  it('formats zero with a + sign', () => {
    expect(fmtPct(0)).toBe('+0.00%')
  })

  it('rounds to two decimal places', () => {
    expect(fmtPct(1.456)).toBe('+1.46%')
  })
})

describe('fmtChange', () => {
  it('prefixes a positive dollar change with +', () => {
    expect(fmtChange(2.5)).toBe('+$2.50')
  })

  it('formats a negative dollar change correctly', () => {
    expect(fmtChange(-10)).toBe('-$10.00')
  })

  it('formats zero as +$0.00', () => {
    expect(fmtChange(0)).toBe('+$0.00')
  })
})
