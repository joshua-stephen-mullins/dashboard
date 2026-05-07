import { supabase } from './supabase'

// Human-readable names for TSP- tickers, used for local lookup in the add-holding form
export const TSP_FUND_NAMES = {
  'TSP-G':       'TSP G Fund (Government Securities)',
  'TSP-F':       'TSP F Fund (Fixed Income Index)',
  'TSP-C':       'TSP C Fund (Common Stock Index)',
  'TSP-S':       'TSP S Fund (Small Cap Stock Index)',
  'TSP-I':       'TSP I Fund (International Stock Index)',
  'TSP-LINCOME': 'TSP L Income Fund',
  'TSP-L2025':   'TSP L 2025 Fund',
  'TSP-L2030':   'TSP L 2030 Fund',
  'TSP-L2035':   'TSP L 2035 Fund',
  'TSP-L2040':   'TSP L 2040 Fund',
  'TSP-L2045':   'TSP L 2045 Fund',
  'TSP-L2050':   'TSP L 2050 Fund',
  'TSP-L2055':   'TSP L 2055 Fund',
  'TSP-L2060':   'TSP L 2060 Fund',
  'TSP-L2065':   'TSP L 2065 Fund',
  'TSP-L2070':   'TSP L 2070 Fund',
  'TSP-L2075':   'TSP L 2075 Fund',
}

// Returns all TSP fund quotes as { 'TSP-C': { c, d, dp }, ... }
export async function tspGetAllQuotes() {
  const { data, error } = await supabase.functions.invoke('tsp-quote')
  if (error) throw new Error(error.message ?? 'TSP quote fetch failed')
  if (data?.error) throw new Error(data.error)
  return data
}
