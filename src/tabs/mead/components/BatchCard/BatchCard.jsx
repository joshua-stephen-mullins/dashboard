import { abv, fmtAbv, fmtGravity, sweetnessBucket, daysBetween, STYLES, STATUSES } from '../../utils/calc'
import styles from './BatchCard.module.css'

const styleLabel = (v) => STYLES.find((s) => s.value === v)?.label ?? v
const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label ?? v

export default function BatchCard({ batch, onClick }) {
  const currentAbv = abv(batch.og, batch.fg)
  const sweetness = sweetnessBucket(batch.fg)
  const age = daysBetween(batch.brew_date)

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.thumb}>
        {batch.image_url ? (
          <img className={styles.image} src={batch.image_url} alt="" />
        ) : (
          <span className={styles.placeholder} aria-hidden="true">🍯</span>
        )}
        <span className={`${styles.status} ${styles[batch.status] ?? ''}`}>
          {statusLabel(batch.status)}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{batch.name}</h3>
        <p className={styles.meta}>
          {styleLabel(batch.style)}
          {batch.honey_varietal ? ` · ${batch.honey_varietal}` : ''}
        </p>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>OG</dt>
            <dd className={styles.statValue}>{fmtGravity(batch.og)}</dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>FG</dt>
            <dd className={styles.statValue}>{fmtGravity(batch.fg)}</dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>ABV</dt>
            <dd className={styles.statValue}>{fmtAbv(currentAbv)}</dd>
          </div>
        </dl>

        <div className={styles.footer}>
          {sweetness && <span className={styles.tag}>{sweetness}</span>}
          {age != null && <span className={styles.age}>day {age}</span>}
        </div>
      </div>
    </button>
  )
}
