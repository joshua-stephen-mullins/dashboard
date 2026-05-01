import { useState, useRef, useEffect } from 'react'
import Modal from '../../../../components/Modal/Modal'
import { searchPlayers } from '../../../../lib/football'
import styles from './AddPlayerModal.module.css'

const LEAGUES = [
  { id: 39,  name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 78,  name: 'Bundesliga' },
  { id: 61,  name: 'Ligue 1' },
  { id: 253, name: 'MLS' },
  { id: 88,  name: 'Eredivisie' },
  { id: 2,   name: 'Champions League' },
  { id: 3,   name: 'Europa League' },
]

function LeaguePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = LEAGUES.find((l) => l.id === value)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className={styles.picker} ref={ref}>
      <button type="button" className={styles.pickerBtn} onClick={() => setOpen((o) => !o)}>
        <span>{selected?.name}</span>
        <span className={styles.pickerChevron}>▾</span>
      </button>
      {open && (
        <ul className={styles.pickerList}>
          {LEAGUES.map((l) => (
            <li
              key={l.id}
              className={`${styles.pickerItem} ${l.id === value ? styles.pickerItemActive : ''}`}
              onClick={() => { onChange(l.id); setOpen(false) }}
            >
              {l.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AddPlayerModal({ onClose, onFollow, followedPlayerIds }) {
  const [query, setQuery] = useState('')
  const [leagueId, setLeagueId] = useState(LEAGUES[0].id)
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    setSearchError(null)
    try {
      const data = await searchPlayers(query.trim(), leagueId)
      setResults(data)
    } catch {
      setSearchError('Search failed. Try again.')
    } finally {
      setIsSearching(false)
    }
  }

  function handleFollow(result) {
    const { player, statistics } = result
    const currentTeam = statistics?.[0]?.team
    onFollow({
      player_id: player.id,
      player_name: player.name,
      team_name: currentTeam?.name ?? '',
      team_id: currentTeam?.id ?? null,
      photo_url: player.photo ?? null,
    })
    onClose()
  }

  return (
    <Modal title="Follow a Player" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSearch}>
        <LeaguePicker value={leagueId} onChange={setLeagueId} />
        <div className={styles.formRow}>
          <input
            className={styles.input}
            type="text"
            placeholder="Search player name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className={styles.btnPrimary} type="submit" disabled={isSearching}>
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {searchError && <p className={styles.error}>{searchError}</p>}

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r) => {
            const currentTeam = r.statistics?.[0]?.team
            const alreadyFollowed = followedPlayerIds.includes(r.player.id)
            return (
              <li key={r.player.id} className={styles.result}>
                <img
                  className={styles.photo}
                  src={r.player.photo}
                  alt={r.player.name}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <div className={styles.info}>
                  <span className={styles.name}>{r.player.name}</span>
                  {currentTeam && (
                    <div className={styles.team}>
                      <img className={styles.teamLogo} src={currentTeam.logo} alt={currentTeam.name} />
                      <span className={styles.teamName}>{currentTeam.name}</span>
                    </div>
                  )}
                </div>
                <button
                  className={alreadyFollowed ? styles.btnFollowed : styles.btnFollow}
                  onClick={() => !alreadyFollowed && handleFollow(r)}
                  disabled={alreadyFollowed}
                >
                  {alreadyFollowed ? 'Following' : 'Follow'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {results.length === 0 && !isSearching && query && !searchError && (
        <p className={styles.noResults}>No players found.</p>
      )}
    </Modal>
  )
}
