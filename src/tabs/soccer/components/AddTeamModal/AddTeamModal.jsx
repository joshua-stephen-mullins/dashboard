import { useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import { searchTeams } from '../../../../lib/football'
import styles from './AddTeamModal.module.css'

export default function AddTeamModal({ onClose, onFollow, followedTeamIds }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    setSearchError(null)
    try {
      const data = await searchTeams(query.trim())
      setResults(data)
    } catch {
      setSearchError('Search failed. Try again.')
    } finally {
      setIsSearching(false)
    }
  }

  function handleFollow(result) {
    const { team, venue } = result
    const league = venue?.city ?? ''
    onFollow({
      team_id: team.id,
      team_name: team.name,
      league: team.country ?? league,
    })
    onClose()
  }

  return (
    <Modal title="Follow a Team" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSearch}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search team name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className={styles.btnPrimary} type="submit" disabled={isSearching}>
          {isSearching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {searchError && <p className={styles.error}>{searchError}</p>}

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r) => {
            const alreadyFollowed = followedTeamIds.includes(r.team.id)
            return (
              <li key={r.team.id} className={styles.result}>
                <img className={styles.logo} src={r.team.logo} alt={r.team.name} />
                <div className={styles.info}>
                  <span className={styles.name}>{r.team.name}</span>
                  <span className={styles.country}>{r.team.country}</span>
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
        <p className={styles.noResults}>No teams found.</p>
      )}
    </Modal>
  )
}
