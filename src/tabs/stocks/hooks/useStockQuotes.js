import { useQueries, useQuery } from '@tanstack/react-query'
import { finnhubGet } from '../../../lib/finnhub'
import { avGetQuote } from '../../../lib/alphaVantage'
import { tspGetAllQuotes } from '../../../lib/tsp'

const FH_STALE  = 60 * 1000           // 1 minute
const AV_STALE  = 4 * 60 * 60 * 1000  // 4 hours — mutual fund NAV updates once daily
const TSP_STALE = 4 * 60 * 60 * 1000  // 4 hours — TSP prices update once daily after close

function is403(result) {
  return result?.error?.message?.includes('403')
}

export function useStockQuotes(tickers) {
  const tspTickers    = tickers.filter((t) => t.startsWith('TSP-'))
  const marketTickers = tickers.filter((t) => !t.startsWith('TSP-'))

  // First pass: Finnhub for all non-TSP tickers
  const fhResults = useQueries({
    queries: marketTickers.map((ticker) => ({
      queryKey: ['stock_quote_fh', ticker],
      queryFn: () => finnhubGet('quote', { symbol: ticker }),
      staleTime: FH_STALE,
      retry: false,
      refetchOnWindowFocus: true,
    })),
  })

  // Alpha Vantage fallback for any ticker Finnhub rejected with 403
  const avTickers = marketTickers.filter((_, i) => is403(fhResults[i]))
  const avResults = useQueries({
    queries: avTickers.map((ticker) => ({
      queryKey: ['stock_quote_av', ticker],
      queryFn: () => avGetQuote(ticker),
      staleTime: AV_STALE,
      retry: false,
      refetchOnWindowFocus: false,
    })),
  })

  // Single query for all TSP funds — one edge function call covers every TSP- holding
  const tspQuery = useQuery({
    queryKey: ['tsp_prices'],
    queryFn: tspGetAllQuotes,
    staleTime: TSP_STALE,
    enabled: tspTickers.length > 0,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Merge into a single quotes map
  const quotes = {}

  marketTickers.forEach((ticker, i) => {
    if (is403(fhResults[i])) {
      quotes[ticker] = avResults[avTickers.indexOf(ticker)]
    } else {
      quotes[ticker] = fhResults[i]
    }
  })

  tspTickers.forEach((ticker) => {
    quotes[ticker] = {
      data: tspQuery.data?.[ticker],
      isLoading: tspQuery.isLoading,
      error: tspQuery.error,
    }
  })

  return {
    quotes,
    isLoading:
      fhResults.some((r) => r.isLoading) ||
      avResults.some((r) => r.isLoading) ||
      tspQuery.isLoading,
  }
}
