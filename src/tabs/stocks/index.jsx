import { useMemo, useState } from 'react'
import { useHoldings } from './hooks/useHoldings'
import { useStockQuotes } from './hooks/useStockQuotes'
import { calcPortfolio } from './utils/calc'
import PortfolioSummary from './components/PortfolioSummary/PortfolioSummary'
import HoldingsTable from './components/HoldingsTable/HoldingsTable'
import HoldingFormModal from './components/HoldingFormModal/HoldingFormModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import styles from './Stocks.module.css'

export default function StocksTab() {
  const { data: holdings = [], isLoading, add, update, remove } = useHoldings()

  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])
  const { quotes, isLoading: quotesLoading } = useStockQuotes(tickers)

  const summary = useMemo(() => calcPortfolio(holdings, quotes), [holdings, quotes])

  const [isPrivate, setIsPrivate] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editHolding, setEditHolding] = useState(undefined)
  const [deleteId, setDeleteId] = useState(null)

  function openAdd() {
    setEditHolding(undefined)
    setFormOpen(true)
  }

  function openEdit(holding) {
    setEditHolding(holding)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditHolding(undefined)
  }

  async function handleSave(payload) {
    if (payload.id) {
      await update.mutateAsync(payload)
    } else {
      await add.mutateAsync(payload)
    }
  }

  async function confirmDelete() {
    await remove.mutateAsync(deleteId)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Stocks</h1>
        </div>
        <div className={styles.headerRight}>
          <label className={styles.privacyToggle}>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Privacy mode
          </label>
          <button className={styles.addBtn} type="button" onClick={openAdd}>
            + Add Holding
          </button>
        </div>
      </header>

      {holdings.length > 0 && (
        <PortfolioSummary summary={summary} isPrivate={isPrivate} />
      )}

      {isLoading ? (
        <div className={styles.loadingRow}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : holdings.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📈</span>
          <p className={styles.emptyText}>No holdings yet</p>
          <p className={styles.emptySubtext}>Add a holding to start tracking your portfolio</p>
        </div>
      ) : (
        <HoldingsTable
          holdings={holdings}
          quotes={quotes}
          quotesLoading={quotesLoading}
          isPrivate={isPrivate}
          onEdit={openEdit}
          onDelete={setDeleteId}
        />
      )}

      {formOpen && (
        <HoldingFormModal
          holding={editHolding}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Remove holding"
          message="This holding will be permanently removed from your portfolio."
          confirmLabel="Remove"
          danger
          onConfirm={confirmDelete}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
