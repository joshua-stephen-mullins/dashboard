import { UNCATEGORIZED } from '../../utils/calendar'
import styles from './CategoryBar.module.css'

const COLOR_CLASS = {
  blue: styles.dotBlue,
  green: styles.dotGreen,
  amber: styles.dotAmber,
  red: styles.dotRed,
  teal: styles.dotTeal,
  purple: styles.dotPurple,
  orange: styles.dotOrange,
  pink: styles.dotPink,
}

export default function CategoryBar({ categories, selected, onToggle, onClear, onManage, counts }) {
  const filtering = selected.size > 0

  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={[styles.chip, !filtering && styles.chipActive].filter(Boolean).join(' ')}
        onClick={onClear}
        aria-pressed={!filtering}
      >
        All
      </button>

      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          className={[styles.chip, selected.has(c.id) && styles.chipActive].filter(Boolean).join(' ')}
          onClick={() => onToggle(c.id)}
          aria-pressed={selected.has(c.id)}
        >
          <span className={[styles.dot, COLOR_CLASS[c.color]].filter(Boolean).join(' ')} />
          {c.name}
          {counts?.[c.id] > 0 && <span className={styles.count}>{counts[c.id]}</span>}
        </button>
      ))}

      {counts?.[UNCATEGORIZED] > 0 && (
        <button
          type="button"
          className={[styles.chip, selected.has(UNCATEGORIZED) && styles.chipActive].filter(Boolean).join(' ')}
          onClick={() => onToggle(UNCATEGORIZED)}
          aria-pressed={selected.has(UNCATEGORIZED)}
        >
          <span className={[styles.dot, styles.dotNone].join(' ')} />
          Uncategorized
          <span className={styles.count}>{counts[UNCATEGORIZED]}</span>
        </button>
      )}

      <button type="button" className={styles.manageBtn} onClick={onManage}>
        Manage categories
      </button>
    </div>
  )
}
