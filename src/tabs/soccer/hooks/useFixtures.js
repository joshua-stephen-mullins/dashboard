import { useQueries } from '@tanstack/react-query'
import { footballGet } from '../../../lib/football'
import { deduplicateFixtures, sortFixturesByDate } from '../utils/fixtures'

async function fetchTeamFixtures(teamId) {
  const data = await footballGet('fixtures', { team: teamId, next: 7 })
  return data.response ?? []
}

export function useFixtures(teamIds) {
  const results = useQueries({
    queries: teamIds.map((id) => ({
      queryKey: ['fixtures', id],
      queryFn: () => fetchTeamFixtures(id),
      staleTime: 30 * 60 * 1000,
      enabled: !!id,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)
  const allFixtures = results.flatMap((r) => r.data ?? [])
  const fixtures = sortFixturesByDate(deduplicateFixtures(allFixtures))

  return { fixtures, isLoading, isError }
}
