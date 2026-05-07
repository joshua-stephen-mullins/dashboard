const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Maps our TSP- ticker format to fund names used by both data sources
const TICKER_TO_FUND: Record<string, string> = {
  'TSP-G':       'G Fund',
  'TSP-F':       'F Fund',
  'TSP-C':       'C Fund',
  'TSP-S':       'S Fund',
  'TSP-I':       'I Fund',
  'TSP-LINCOME': 'L Income',
  'TSP-L2025':   'L 2025',
  'TSP-L2030':   'L 2030',
  'TSP-L2035':   'L 2035',
  'TSP-L2040':   'L 2040',
  'TSP-L2045':   'L 2045',
  'TSP-L2050':   'L 2050',
  'TSP-L2055':   'L 2055',
  'TSP-L2060':   'L 2060',
  'TSP-L2065':   'L 2065',
  'TSP-L2070':   'L 2070',
  'TSP-L2075':   'L 2075',
}

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Try the official TSP CSV for two days of prices (needed for day change).
// Returns parsed rows keyed by date, or null if the endpoint is unavailable.
async function fetchTspCsv(startDate: string, endDate: string): Promise<Record<string, Record<string, number>> | null> {
  const url = `https://www.tsp.gov/data/fund-price-history.csv?startdate=${startDate}&enddate=${endDate}&Lfunds=1&InvFunds=1`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Dashboard/1.0)',
        'Accept': 'text/csv, text/plain, */*',
      },
    })
    if (!res.ok) return null
    const text = await res.text()

    const lines = text.trim().split('\n').filter(Boolean)
    if (lines.length < 2) return null

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
    const result: Record<string, Record<string, number>> = {}

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
      const date = values[0]
      if (!date) continue
      result[date] = {}
      for (let j = 1; j < headers.length; j++) {
        const price = parseFloat(values[j])
        if (!isNaN(price)) result[date][headers[j]] = price
      }
    }
    return result
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    // Current prices from dailytsp.com — public, no auth required
    const todayRes = await fetch('https://api.dailytsp.com/close/')
    if (!todayRes.ok) throw new Error('Failed to fetch TSP prices from dailytsp.com')
    const todayData = await todayRes.json()

    const todayDate = Object.keys(todayData)[0]
    const todayPrices = todayData[todayDate] as Record<string, number>

    // Try official TSP CSV for previous trading day to calculate day change
    const refDate = new Date(todayDate)
    const weekAgo = new Date(refDate)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const csvData = await fetchTspCsv(isoDate(weekAgo), isoDate(refDate))
    let prevPrices: Record<string, number> | null = null

    if (csvData) {
      const dates = Object.keys(csvData).sort()
      // Most recent entry that isn't today
      const prevDate = dates.filter((d) => d !== todayDate).at(-1)
      if (prevDate) prevPrices = csvData[prevDate]
    }

    // Build normalised quotes in Finnhub { c, d, dp } shape, keyed by TSP- ticker
    const quotes: Record<string, { c: number; d: number; dp: number }> = {}

    for (const [ticker, fundName] of Object.entries(TICKER_TO_FUND)) {
      const c = todayPrices[fundName]
      if (c == null) continue

      const prev = prevPrices?.[fundName]
      const d  = prev != null ? parseFloat((c - prev).toFixed(4)) : 0
      const dp = prev != null && prev > 0 ? parseFloat(((d / prev) * 100).toFixed(4)) : 0

      quotes[ticker] = { c, d, dp }
    }

    return jsonRes(quotes)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonRes({ error: message }, 500)
  }
})
