import styles from './FixtureCard.module.css'

const STATUS_MAP = {
  NS: { label: 'Upcoming', variant: 'upcoming' },
  '1H': { label: 'Live', variant: 'live' },
  HT: { label: 'Half Time', variant: 'live' },
  '2H': { label: 'Live', variant: 'live' },
  ET: { label: 'Extra Time', variant: 'live' },
  P: { label: 'Penalties', variant: 'live' },
  FT: { label: 'Full Time', variant: 'finished' },
  AET: { label: 'After ET', variant: 'finished' },
  PEN: { label: 'After Pens', variant: 'finished' },
  CANC: { label: 'Cancelled', variant: 'cancelled' },
  PST: { label: 'Postponed', variant: 'cancelled' },
}

function formatKickoff(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function PlayerTags({ players }) {
  if (!players?.length) return null
  return (
    <div className={styles.playerTags}>
      {players.map((name) => (
        <span key={name} className={styles.playerTag}>{name}</span>
      ))}
    </div>
  )
}

export default function FixtureCard({ fixture, playersByTeamId = {} }) {
  const { fixture: info, league, teams, goals } = fixture
  const status = STATUS_MAP[info.status.short] ?? { label: info.status.short, variant: 'upcoming' }
  const isLive = status.variant === 'live'
  const isFinished = status.variant === 'finished'

  const homePlayers = playersByTeamId[teams.home.id]
  const awayPlayers = playersByTeamId[teams.away.id]

  return (
    <div className={styles.card}>
      <div className={styles.meta}>
        <span className={styles.league}>{league.name}</span>
        <span className={`${styles.status} ${styles[status.variant]}`}>{status.label}</span>
      </div>

      <div className={styles.matchup}>
        <div className={styles.team}>
          <PlayerTags players={homePlayers} />
          <img className={styles.logo} src={teams.home.logo} alt={teams.home.name} />
          <span className={styles.teamName}>{teams.home.name}</span>
        </div>

        <div className={styles.score}>
          {isLive || isFinished ? (
            <span className={styles.scoreValue}>
              {goals.home ?? 0} – {goals.away ?? 0}
            </span>
          ) : (
            <span className={styles.kickoff}>{formatKickoff(info.date)}</span>
          )}
        </div>

        <div className={`${styles.team} ${styles.teamAway}`}>
          <PlayerTags players={awayPlayers} />
          <img className={styles.logo} src={teams.away.logo} alt={teams.away.name} />
          <span className={styles.teamName}>{teams.away.name}</span>
        </div>
      </div>
    </div>
  )
}
