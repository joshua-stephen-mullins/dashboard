import FixtureCard from '../FixtureCard/FixtureCard'
import styles from './FixtureList.module.css'

function formatGroupLabel(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function groupByDate(fixtures) {
  const groups = new Map()
  for (const f of fixtures) {
    const label = formatGroupLabel(f.fixture.date)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(f)
  }
  return groups
}

export default function FixtureList({ fixtures, isLoading, isError, hasFollows, playersByTeamId = {} }) {
  if (!hasFollows) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Follow some teams or players to see upcoming fixtures.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Loading fixtures…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Failed to load fixtures. Check your API key.</p>
      </div>
    )
  }

  if (fixtures.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No fixtures in the next 7 days.</p>
      </div>
    )
  }

  const groups = groupByDate(fixtures)

  return (
    <div className={styles.list}>
      {[...groups.entries()].map(([label, group]) => (
        <div key={label} className={styles.group}>
          <h3 className={styles.dateLabel}>{label}</h3>
          <div className={styles.cards}>
            {group.map((f) => (
              <FixtureCard
                key={f.fixture.id}
                fixture={f}
                playersByTeamId={playersByTeamId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
