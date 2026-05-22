import { useMemo, useState } from 'react'
import { useBooks } from './hooks/useBooks'
import { filterBooks } from './utils/filters'
import BookCard from './components/BookCard/BookCard'
import BookTable from './components/BookTable/BookTable'
import BookFormModal from './components/BookFormModal/BookFormModal'
import BookDetailModal from './components/BookDetailModal/BookDetailModal'
import styles from './Books.module.css'

const STATUSES = [
  { value: 'unread',   label: 'Unread' },
  { value: 'reading',  label: 'Reading' },
  { value: 'read',     label: 'Read' },
  { value: 'dnf',      label: 'DNF' },
  { value: 'lent_out', label: 'Lent out' },
]

export default function BooksTab() {
  const { data: books = [], isLoading, add, update, remove } = useBooks()

  const [view, setView] = useState('grid')
  const [search, setSearch] = useState('')
  const [filterGenres, setFilterGenres] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRating, setFilterRating] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [formBook, setFormBook] = useState(undefined)
  const [formOpen, setFormOpen] = useState(false)

  const allGenres = useMemo(() => {
    const set = new Set()
    for (const b of books) {
      for (const g of b.genre ?? []) set.add(g)
    }
    return [...set].sort()
  }, [books])

  const filtered = useMemo(
    () => filterBooks(books, {
      search,
      genres: filterGenres,
      status: filterStatus || null,
      rating: filterRating ? parseInt(filterRating, 10) : null,
    }),
    [books, search, filterGenres, filterStatus, filterRating],
  )

  function toggleGenre(g) {
    setFilterGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  function openAdd() {
    setFormBook(undefined)
    setFormOpen(true)
  }

  function openEdit(book) {
    setSelectedBook(null)
    setFormBook(book)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setFormBook(undefined)
  }

  async function handleSave(payload) {
    if (payload.id) {
      await update.mutateAsync(payload)
    } else {
      await add.mutateAsync(payload)
    }
  }

  async function handleDelete(id) {
    await remove.mutateAsync(id)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Books</h1>
          {books.length > 0 && (
            <span className={styles.count}>{books.length} in library</span>
          )}
        </div>
        <button className={styles.addBtn} onClick={openAdd} type="button">
          + Add Book
        </button>
      </header>

      <div className={styles.controls}>
        <div className={styles.controlsRow}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>
            ))}
          </select>

          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('grid')}
              aria-label="Grid view"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${view === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('table')}
              aria-label="Table view"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <rect x="1" y="2" width="14" height="2" rx="1" />
                <rect x="1" y="7" width="14" height="2" rx="1" />
                <rect x="1" y="12" width="14" height="2" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {allGenres.length > 0 && (
          <div className={styles.genreFilters}>
            {allGenres.map((g) => (
              <button
                key={g}
                type="button"
                className={`${styles.genreFilter} ${filterGenres.includes(g) ? styles.active : ''}`}
                onClick={() => toggleGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingRow}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : filtered.length > 0 ? (
        view === 'grid' ? (
          <div className={styles.grid}>
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        ) : (
          <BookTable books={filtered} onRowClick={setSelectedBook} />
        )
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📚</span>
          {books.length === 0 ? (
            <>
              <p className={styles.emptyText}>No books yet</p>
              <p className={styles.emptySubtext}>Add one manually or look up by ISBN</p>
            </>
          ) : (
            <p className={styles.emptyText}>No books match your filters</p>
          )}
        </div>
      )}

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onEdit={openEdit}
          onDelete={handleDelete}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {formOpen && (
        <BookFormModal
          book={formBook}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
