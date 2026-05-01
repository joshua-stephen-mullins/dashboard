import { calcHolding, fmtUsd, fmtChange, fmtPct } from '../../utils/calc'
import styles from './HoldingsTable.module.css'

const REDACTED = '••••'

function QuoteCell({ children, isLoading }) {
  if (isLoading) return <span className={styles.muted}>—</span>
  return children
}

export default function HoldingsTable({ holdings, quotes, quotesLoading, isPrivate, onEdit, onDelete }) {
  if (holdings.length === 0) return null

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Ticker</th>
            <th className={styles.th}>Company</th>
            <th className={`${styles.th} ${styles.right}`}>Price</th>
            <th className={`${styles.th} ${styles.right}`}>Shares</th>
            <th className={`${styles.th} ${styles.right}`}>Avg Cost</th>
            <th className={`${styles.th} ${styles.right}`}>Value</th>
            <th className={`${styles.th} ${styles.right}`}>P/L ($)</th>
            <th className={`${styles.th} ${styles.right}`}>P/L (%)</th>
            <th className={styles.th} />
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const quoteResult = quotes[h.ticker]
            const quoteData = quoteResult?.data
            const loading = quoteResult?.isLoading ?? quotesLoading
            const calc = calcHolding(h, quoteData)
            const pricePositive = quoteData?.d != null ? quoteData.d >= 0 : null

            return (
              <tr key={h.id} className={styles.row}>
                <td className={styles.td}>
                  <span className={styles.ticker}>{h.ticker}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.company}>{h.company_name}</span>
                </td>
                <td className={`${styles.td} ${styles.right}`}>
                  <QuoteCell isLoading={loading}>
                    <span className={pricePositive === null ? '' : pricePositive ? styles.positive : styles.negative}>
                      {quoteData ? fmtUsd(quoteData.c) : '—'}
                    </span>
                  </QuoteCell>
                </td>
                <td className={`${styles.td} ${styles.right}`}>
                  {isPrivate ? <span className={styles.redacted}>{REDACTED}</span> : h.shares}
                </td>
                <td className={`${styles.td} ${styles.right}`}>
                  {isPrivate ? <span className={styles.redacted}>{REDACTED}</span> : fmtUsd(h.avg_cost)}
                </td>
                <td className={`${styles.td} ${styles.right}`}>
                  {isPrivate ? (
                    <span className={styles.redacted}>{REDACTED}</span>
                  ) : (
                    <QuoteCell isLoading={loading}>
                      {calc ? fmtUsd(calc.totalValue) : '—'}
                    </QuoteCell>
                  )}
                </td>
                <td className={`${styles.td} ${styles.right}`}>
                  {isPrivate ? (
                    <span className={styles.redacted}>{REDACTED}</span>
                  ) : (
                    <QuoteCell isLoading={loading}>
                      {calc ? (
                        <span className={calc.plDollar >= 0 ? styles.positive : styles.negative}>
                          {fmtChange(calc.plDollar)}
                        </span>
                      ) : '—'}
                    </QuoteCell>
                  )}
                </td>
                <td className={`${styles.td} ${styles.right}`}>
                  {isPrivate ? (
                    <span className={styles.redacted}>{REDACTED}</span>
                  ) : (
                    <QuoteCell isLoading={loading}>
                      {calc ? (
                        <span className={calc.plPercent >= 0 ? styles.positive : styles.negative}>
                          {fmtPct(calc.plPercent)}
                        </span>
                      ) : '—'}
                    </QuoteCell>
                  )}
                </td>
                <td className={`${styles.td} ${styles.actionCell}`}>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onEdit(h)}
                      title="Edit holding"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => onDelete(h.id)}
                      title="Delete holding"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
