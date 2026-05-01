const BASE_URL = 'https://www.alphavantage.co/query'
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY

async function avGet(params) {
  const url = new URL(BASE_URL)
  Object.entries({ ...params, apikey: API_KEY }).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Alpha Vantage error: ${res.status}`)
  return res.json()
}

export async function avGetQuote(ticker) {
  const json = await avGet({ function: 'GLOBAL_QUOTE', symbol: ticker })
  const q = json['Global Quote']
  if (!q?.['05. price']) throw new Error(`No quote data for "${ticker}"`)
  return {
    c: parseFloat(q['05. price']),
    d: parseFloat(q['09. change']),
    dp: parseFloat(q['10. change percent'].replace('%', '')),
  }
}

export async function avGetProfile(ticker) {
  const json = await avGet({ function: 'OVERVIEW', symbol: ticker })
  if (!json?.Name) throw new Error(`No profile found for "${ticker}"`)
  return { name: json.Name }
}
