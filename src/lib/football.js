const BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY

export async function footballGet(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': API_KEY },
  })
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
  return res.json()
}
