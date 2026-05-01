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

export async function searchTeams(query) {
  const data = await footballGet('teams', { search: query })
  return data.response ?? []
}

// MLS and other calendar-year leagues use the current year as their season.
// European leagues run Aug-May so their season ID is the year they started.
const CALENDAR_YEAR_LEAGUES = new Set([253, 254, 307]) // MLS, USL, Liga MX

function getPlayerSearchSeason(leagueId) {
  const year = new Date().getFullYear()
  return CALENDAR_YEAR_LEAGUES.has(leagueId) ? year : year - 1
}

export async function searchPlayers(query, leagueId) {
  const season = getPlayerSearchSeason(leagueId)
  const data = await footballGet('players', { search: query, league: leagueId, season })
  return data.response ?? []
}
