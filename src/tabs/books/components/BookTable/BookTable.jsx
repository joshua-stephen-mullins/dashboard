import { useState } from 'react'
import styles from './BookTable.module.css'

const STATUS_LABELS = {
  unread: 'Unread',
  reading: 'Reading',
  read: 'Read',
  dnf: 'DNF',
  lent_out: 'Lent out',
}

const COLUMNS = [
  { key: 'title',         label: 'Title' },
  { key: 'author',        label: 'Author' },
  { key: 'genre',         label: 'Genre' },
  { key: 'status',        label: 'Status' },
  { key: 'rating',        label: 'Rating' },
  { key: 'date_finished', label: 'Finished' },
  { key: 'page_count',    label: 'Pages' },
]

function sortBooks(books, col, dir) {
  if (!col) return books
  return [...books].sort((a, b) => {
    let av = a[col]
    let bv = b[col]
    if (col === 'genre') {
      av = (av ?? []).join(', ')
      bv = (bv ?? []).join(', ')
    }
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ? 1 : -1
    return 0
  })
}

function Stars({ rating }) {
  if (!rating) return <span className={styles.empty}>—</span>
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  )
}

export default function BookTable({ books, onRowClick }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleColClick(key) {
    if (sortCol === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortCol(null); setSortDir('asc') }
    } else {
      setSortCol(key)
      setSortDir('asc')
    }
  }

  const sorted = sortBooks(books, sortCol, sortDir)

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map(({ key, label }) => (
              <th
                key={key}
                className={`${styles.th} ${sortCol === key ? styles.sorted : ''}`}
                onClick={() => handleColClick(key)}
              >
                {label}
                {sortCol === key && (
                  <span className={styles.arrow}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((book) => (
            <tr key={book.id} className={styles.row} onClick={() => onRowClick(book)}>
              <td className={`${styles.td} ${styles.titleCell}`}>{book.title}</td>
              <td className={styles.td}>{book.author}</td>
              <td className={styles.td}>
                {book.genre?.length > 0 ? book.genre.join(', ') : <span className={styles.empty}>—</span>}
              </td>
              <td className={styles.td}>
                <span className={`${styles.badge} ${styles[book.status] ?? ''}`}>
                  {STATUS_LABELS[book.status] ?? book.status}
                </span>
              </td>
              <td className={styles.td}><Stars rating={book.rating} /></td>
              <td className={styles.td}>
                {book.date_finished
                  ? new Date(book.date_finished + 'T00:00:00').toLocaleDateString()
                  : <span className={styles.empty}>—</span>}
              </td>
              <td className={styles.td}>
                {book.page_count ?? <span className={styles.empty}>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
