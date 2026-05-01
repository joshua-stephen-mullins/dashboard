import { fmtUsd, fmtChange, fmtPct } from '../../utils/calc'
import styles from './PortfolioSummary.module.css'

const REDACTED = '••••'

export default function PortfolioSummary({ summary, isPrivate }) {
  const { totalValue, totalDayChange, dayChangePct, positions } = summary
  const dayIsPositive = totalDayChange >= 0

  return (
    <div className={styles.row}>
      <div className={styles.card}>
        <span className={styles.label}>Portfolio Value</span>
        <span className={styles.value}>
          {isPrivate ? REDACTED : fmtUsd(totalValue)}
        </span>
      </div>

      <div className={styles.card}>
        <span className={styles.label}>Day Change</span>
        {isPrivate ? (
          <span className={styles.value}>{REDACTED}</span>
        ) : (
          <span className={`${styles.value} ${dayIsPositive ? styles.positive : styles.negative}`}>
            {fmtChange(totalDayChange)}{' '}
            <span className={styles.pct}>({fmtPct(dayChangePct)})</span>
          </span>
        )}
      </div>

      <div className={styles.card}>
        <span className={styles.label}>Positions</span>
        <span className={styles.value}>{positions}</span>
      </div>
    </div>
  )
}
