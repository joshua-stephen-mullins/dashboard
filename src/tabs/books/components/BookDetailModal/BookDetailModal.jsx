import { useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import styles from './BookDetailModal.module.css'

const STATUS_LABELS = {
  unread: 'Unread',
  reading: 'Reading',
  read: 'Read',
  dnf: 'DNF',
  lent_out: 'Lent out',
}

function Stars({ rating }) {
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  )
}

function formatDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function BookDetailModal({ book, onEdit, onDelete, onClose }) {
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    await onDelete(book.id)
    onClose()
  }

  return (
    <Modal title={book.title} onClose={onClose}>
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.coverWrap}>
            {book.cover_url ? (
              <img className={styles.cover} src={book.cover_url} alt={book.title} />
            ) : (
              <div className={styles.coverPlaceholder}>📚</div>
            )}
          </div>

          <div className={styles.meta}>
            <p className={styles.author}>{book.author}</p>

            <span className={`${styles.badge} ${styles[book.status] ?? ''}`}>
              {STATUS_LABELS[book.status] ?? book.status}
            </span>

            {book.rating != null && <Stars rating={book.rating} />}

            {book.genre?.length > 0 && (
              <div className={styles.genres}>
                {book.genre.map((g) => (
                  <span key={g} className={styles.genre}>{g}</span>
                ))}
              </div>
            )}

            {book.page_count && (
              <p className={styles.detail}>{book.page_count} pages</p>
            )}

            {book.date_started && (
              <p className={styles.detail}>Started {formatDate(book.date_started)}</p>
            )}

            {book.date_finished && (
              <p className={styles.detail}>Finished {formatDate(book.date_finished)}</p>
            )}

            {book.status === 'lent_out' && book.lent_to && (
              <p className={styles.detail}>Lent to {book.lent_to}</p>
            )}

            {book.isbn && (
              <p className={styles.isbn}>ISBN {book.isbn}</p>
            )}
          </div>
        </div>

        {book.notes && (
          <div className={styles.notes}>
            <p className={styles.notesLabel}>Notes</p>
            <p className={styles.notesText}>{book.notes}</p>
          </div>
        )}

        {book.source_url && (
          <a
            className={styles.sourceLink}
            href={book.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={confirming ? styles.confirmBtn : styles.deleteBtn}
            onClick={handleDelete}
          >
            {confirming ? 'Confirm delete?' : 'Delete'}
          </button>
          {confirming && (
            <button type="button" className={styles.cancelDeleteBtn} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          )}
          <button type="button" className={styles.editBtn} onClick={() => onEdit(book)}>
            Edit
          </button>
        </div>
      </div>
    </Modal>
  )
}
