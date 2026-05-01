import { useMemo } from 'react'
import { useFollowedTeams } from './hooks/useFollowedTeams'
import { useFollowedPlayers } from './hooks/useFollowedPlayers'
import { useFixtures } from './hooks/useFixtures'
import FixtureList from './components/FixtureList/FixtureList'
import FollowingPanel from './components/FollowingPanel/FollowingPanel'
import styles from './Soccer.module.css'

export default function SoccerTab() {
  const {
    data: teams = [],
    follow: followTeam,
    unfollow: unfollowTeam,
  } = useFollowedTeams()

  const {
    data: players = [],
    follow: followPlayer,
    unfollow: unfollowPlayer,
  } = useFollowedPlayers()

  const teamIds = useMemo(() => {
    const fromTeams = teams.map((t) => t.team_id)
    const fromPlayers = players.filter((p) => p.team_id).map((p) => p.team_id)
    return [...new Set([...fromTeams, ...fromPlayers])]
  }, [teams, players])

  const { fixtures, isLoading, isError } = useFixtures(teamIds)
  const hasFollows = teams.length > 0 || players.length > 0

  const playersByTeamId = useMemo(() => {
    const map = {}
    for (const p of players) {
      if (!p.team_id) continue
      if (!map[p.team_id]) map[p.team_id] = []
      map[p.team_id].push(p.player_name)
    }
    return map
  }, [players])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fixtures</h1>
        {fixtures.length > 0 && (
          <span className={styles.fixtureCount}>{fixtures.length} upcoming</span>
        )}
      </header>

      <section className={styles.fixtures}>
        <FixtureList
          fixtures={fixtures}
          isLoading={isLoading}
          isError={isError}
          hasFollows={hasFollows}
          playersByTeamId={playersByTeamId}
        />
      </section>

      <div className={styles.sidebar}>
        <FollowingPanel
          teams={teams}
          players={players}
          onFollowTeam={(payload) => followTeam.mutate(payload)}
          onUnfollowTeam={(id) => unfollowTeam.mutate(id)}
          onFollowPlayer={(payload) => followPlayer.mutate(payload)}
          onUnfollowPlayer={(id) => unfollowPlayer.mutate(id)}
        />
      </div>
    </div>
  )
}
