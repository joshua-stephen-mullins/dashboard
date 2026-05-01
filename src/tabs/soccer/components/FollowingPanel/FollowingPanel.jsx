import { useState } from 'react'
import AddTeamModal from '../AddTeamModal/AddTeamModal'
import AddPlayerModal from '../AddPlayerModal/AddPlayerModal'
import styles from './FollowingPanel.module.css'

export default function FollowingPanel({ teams, players, onFollowTeam, onUnfollowTeam, onFollowPlayer, onUnfollowPlayer }) {
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)

  const followedTeamIds = teams.map((t) => t.team_id)
  const followedPlayerIds = players.map((p) => p.player_id)

  return (
    <aside className={styles.panel}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Teams</span>
          <button className={styles.addBtn} onClick={() => setShowTeamModal(true)}>+ Follow</button>
        </div>
        {teams.length === 0 ? (
          <p className={styles.empty}>No teams followed.</p>
        ) : (
          <ul className={styles.list}>
            {teams.map((t) => (
              <li key={t.id} className={styles.item}>
                <span className={styles.itemName}>{t.team_name}</span>
                <button className={styles.unfollowBtn} onClick={() => onUnfollowTeam(t.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Players</span>
          <button className={styles.addBtn} onClick={() => setShowPlayerModal(true)}>+ Follow</button>
        </div>
        {players.length === 0 ? (
          <p className={styles.empty}>No players followed.</p>
        ) : (
          <ul className={styles.list}>
            {players.map((p) => (
              <li key={p.id} className={styles.item}>
                {p.photo_url && (
                  <img className={styles.playerPhoto} src={p.photo_url} alt={p.player_name} />
                )}
                <div className={styles.playerInfo}>
                  <span className={styles.itemName}>{p.player_name}</span>
                  <span className={styles.teamHint}>{p.team_name}</span>
                </div>
                <button className={styles.unfollowBtn} onClick={() => onUnfollowPlayer(p.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showTeamModal && (
        <AddTeamModal
          onClose={() => setShowTeamModal(false)}
          onFollow={onFollowTeam}
          followedTeamIds={followedTeamIds}
        />
      )}

      {showPlayerModal && (
        <AddPlayerModal
          onClose={() => setShowPlayerModal(false)}
          onFollow={onFollowPlayer}
          followedPlayerIds={followedPlayerIds}
        />
      )}
    </aside>
  )
}
