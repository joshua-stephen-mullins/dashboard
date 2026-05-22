import styles from './BookCard.module.css'

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

export default function BookCard({ book, onClick }) {
  return (
    <button className={styles.card} onClick={onClick} type="button">
      <div className={styles.cover}>
        {book.cover_url ? (
          <img className={styles.coverImg} src={book.cover_url} alt={book.title} />
        ) : (
          <div className={styles.coverPlaceholder}>📚</div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{book.title}</h3>
        <p className={styles.author}>{book.author}</p>

        <div className={styles.footer}>
          <span className={`${styles.status} ${styles[book.status] ?? ''}`}>
            {STATUS_LABELS[book.status] ?? book.status}
          </span>
          {book.rating != null && <Stars rating={book.rating} />}
        </div>
      </div>
    </button>
  )
}
