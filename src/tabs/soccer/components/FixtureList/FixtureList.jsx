import FixtureCard from '../FixtureCard/FixtureCard'
import { groupFixturesByDate } from '../../utils/fixtures'
import styles from './FixtureList.module.css'

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

  const groups = groupFixturesByDate(fixtures)

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
