const BASE_URL = 'https://finnhub.io/api/v1'
const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY

export async function finnhubGet(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  url.searchParams.set('token', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Finnhub error: ${res.status}`)
  return res.json()
}
