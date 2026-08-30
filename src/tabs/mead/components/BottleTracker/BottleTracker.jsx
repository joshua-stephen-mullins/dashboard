import { honeyCostPerBottle } from '../../utils/calc'
import styles from './BottleTracker.module.css'

// Rendered as discrete pips rather than a progress bar: a bar's width
// would have to be an inline style, which the project forbids, and one
// pip per bottle is what the count actually means anyway.
export default function BottleTracker({ batch, onChange }) {
  const total = batch.bottle_count ?? 0
  const remaining = batch.bottles_remaining ?? 0
  const perBottle = honeyCostPerBottle(
    batch.honey_cost == null ? null : Number(batch.honey_cost),
    total,
  )

  if (!total) {
    return (
      <p className={styles.hint}>
        Set a bottle count when you package this batch to track what is left.
      </p>
    )
  }

  const pips = Array.from({ length: total }, (_, i) => i < remaining)

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.count}>
          {remaining} <span className={styles.of}>of {total} left</span>
        </span>
        {batch.bottle_size && <span className={styles.size}>{batch.bottle_size}</span>}
      </div>

      <div className={styles.pips} aria-label={`${remaining} of ${total} bottles remaining`}>
        {pips.map((full, i) => (
          <span key={i} className={`${styles.pip} ${full ? styles.full : styles.emptyPip}`} />
        ))}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onChange(Math.max(0, remaining - 1))}
          disabled={remaining <= 0}
        >
          Drink one
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onChange(Math.min(total, remaining + 1))}
          disabled={remaining >= total}
        >
          Undo
        </button>
        {perBottle != null && (
          <span className={styles.cost}>${perBottle.toFixed(2)} / bottle in honey</span>
        )}
      </div>
    </div>
  )
}
