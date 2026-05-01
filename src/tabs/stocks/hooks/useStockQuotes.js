import { useQueries } from '@tanstack/react-query'
import { finnhubGet } from '../../../lib/finnhub'
import { avGetQuote } from '../../../lib/alphaVantage'

const FH_STALE  = 60 * 1000            // 1 minute
const AV_STALE  = 4 * 60 * 60 * 1000  // 4 hours — NAV updates once daily

function is403(result) {
  return result?.error?.message?.includes('403')
}

export function useStockQuotes(tickers) {
  // First pass: Finnhub for every ticker
  const fhResults = useQueries({
    queries: tickers.map((ticker) => ({
      queryKey: ['stock_quote_fh', ticker],
      queryFn: () => finnhubGet('quote', { symbol: ticker }),
      staleTime: FH_STALE,
      retry: false,
      refetchOnWindowFocus: true,
    })),
  })

  // Tickers that Finnhub rejected with 403 fall back to Alpha Vantage
  const avTickers = tickers.filter((_, i) => is403(fhResults[i]))

  const avResults = useQueries({
    queries: avTickers.map((ticker) => ({
      queryKey: ['stock_quote_av', ticker],
      queryFn: () => avGetQuote(ticker),
      staleTime: AV_STALE,
      retry: false,
      refetchOnWindowFocus: false,
    })),
  })

  // Merge into a single quotes map, preferring AV result for fallen-back tickers
  const quotes = {}
  tickers.forEach((ticker, i) => {
    if (is403(fhResults[i])) {
      const avIdx = avTickers.indexOf(ticker)
      quotes[ticker] = avResults[avIdx]
    } else {
      quotes[ticker] = fhResults[i]
    }
  })

  return {
    quotes,
    isLoading: fhResults.some((r) => r.isLoading) || avResults.some((r) => r.isLoading),
  }
}
