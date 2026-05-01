import { useQueries } from '@tanstack/react-query'
import { footballGet } from '../../../lib/football'

async function fetchTeamFixtures(teamId) {
  const data = await footballGet('fixtures', { team: teamId, next: 7 })
  return data.response ?? []
}

function deduplicateAndSort(allFixtures) {
  const seen = new Set()
  const unique = []
  for (const f of allFixtures) {
    if (!seen.has(f.fixture.id)) {
      seen.add(f.fixture.id)
      unique.push(f)
    }
  }
  return unique.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))
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
  const fixtures = deduplicateAndSort(allFixtures)

  return { fixtures, isLoading, isError }
}
