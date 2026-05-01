export function deduplicateFixtures(fixtures) {
  const seen = new Set()
  const unique = []
  for (const f of fixtures) {
    if (!seen.has(f.fixture.id)) {
      seen.add(f.fixture.id)
      unique.push(f)
    }
  }
  return unique
}

export function sortFixturesByDate(fixtures) {
  return [...fixtures].sort(
    (a, b) => new Date(a.fixture.date) - new Date(b.fixture.date)
  )
}

export function groupFixturesByDate(fixtures) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  function sameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  function formatLabel(dateStr) {
    const date = new Date(dateStr)
    if (sameDay(date, today)) return 'Today'
    if (sameDay(date, tomorrow)) return 'Tomorrow'
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const groups = new Map()
  for (const f of fixtures) {
    const label = formatLabel(f.fixture.date)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(f)
  }
  return groups
}
