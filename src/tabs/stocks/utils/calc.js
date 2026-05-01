export function calcHolding(holding, quoteData) {
  if (!quoteData || quoteData.c == null) return null
  const currentPrice = quoteData.c
  const totalValue = holding.shares * currentPrice
  const totalCost = holding.shares * holding.avg_cost
  const plDollar = totalValue - totalCost
  const plPercent = totalCost > 0 ? (plDollar / totalCost) * 100 : 0
  return { currentPrice, totalValue, plDollar, plPercent }
}

export function calcPortfolio(holdings, quotes) {
  let totalValue = 0
  let totalCost = 0
  let totalDayChange = 0

  for (const h of holdings) {
    const q = quotes[h.ticker]?.data
    if (!q || q.c == null) continue
    totalValue += h.shares * q.c
    totalCost += h.shares * h.avg_cost
    totalDayChange += h.shares * (q.d ?? 0)
  }

  const prevValue = totalValue - totalDayChange
  const dayChangePct = prevValue > 0 ? (totalDayChange / prevValue) * 100 : 0

  return {
    totalValue,
    totalPL: totalValue - totalCost,
    totalDayChange,
    dayChangePct,
    positions: holdings.length,
  }
}

export function fmtUsd(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function fmtPct(n) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export function fmtChange(n) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${fmtUsd(n)}`
}
