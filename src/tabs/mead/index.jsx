import { useMemo, useState } from 'react'
import { useMeadBatches } from './hooks/useMeadBatches'
import { useDueDoses } from './hooks/useDueDoses'
import { filterBatches } from './utils/filters'
import { STYLES, STATUSES } from './utils/calc'
import BatchCard from './components/BatchCard/BatchCard'
import BatchFormModal from './components/BatchFormModal/BatchFormModal'
import BatchDetailModal from './components/BatchDetailModal/BatchDetailModal'
import styles from './Mead.module.css'

// Two different states, and they ask different things of you: a fermenting
// batch wants nutrient doses and readings, an aging one wants to be left alone.
const FERMENTING = ['primary']
const AGING = ['secondary', 'bulk_aging']

export default function MeadTab() {
  const { data: batches = [], isLoading, add, update, remove } = useMeadBatches()
  const { data: dosesDue = 0 } = useDueDoses()

  const [search, setSearch] = useState('')
  const [filterStyle, setFilterStyle] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [formBatch, setFormBatch] = useState(undefined)
  const [formOpen, setFormOpen] = useState(false)

  const filtered = useMemo(
    () => filterBatches(batches, {
      search,
      styles: filterStyle ? [filterStyle] : [],
      status: filterStatus || null,
    }),
    [batches, search, filterStyle, filterStatus],
  )

  const summary = useMemo(() => {
    const fermenting = batches.filter((b) => FERMENTING.includes(b.status)).length
    const aging = batches.filter((b) => AGING.includes(b.status)).length
    const bottles = batches.reduce((sum, b) => sum + (b.bottles_remaining ?? 0), 0)
    return { fermenting, aging, bottles }
  }, [batches])

  // Keep the open detail modal pointed at fresh data after a mutation.
  const selectedBatch = selected ? batches.find((b) => b.id === selected.id) ?? null : null

  function openAdd() {
    setFormBatch(undefined)
    setFormOpen(true)
  }

  function openEdit(batch) {
    setSelected(null)
    setFormBatch(batch)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setFormBatch(undefined)
  }

  async function handleSave(payload) {
    if (payload.id) {
      await update.mutateAsync(payload)
    } else {
      await add.mutateAsync(payload)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Mead</h1>
          {batches.length > 0 && (
            <span className={styles.count}>
              {batches.length} batch{batches.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
        <button className={styles.addBtn} onClick={openAdd} type="button">
          + New Batch
        </button>
      </header>

      {batches.length > 0 && (
        <dl className={styles.summary}>
          <div className={styles.summaryStat}>
            <dt>Fermenting</dt>
            <dd>{summary.fermenting}</dd>
          </div>
          <div className={styles.summaryStat}>
            <dt>Aging</dt>
            <dd>{summary.aging}</dd>
          </div>
          <div className={styles.summaryStat}>
            <dt>Bottles on hand</dt>
            <dd>{summary.bottles}</dd>
          </div>
          <div className={styles.summaryStat}>
            <dt>Doses due</dt>
            <dd className={dosesDue > 0 ? styles.due : undefined}>{dosesDue}</dd>
          </div>
        </dl>
      )}

      <div className={styles.controls}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search by name, honey or yeast…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={styles.filterSelect}
          value={filterStyle}
          onChange={(e) => setFilterStyle(e.target.value)}
        >
          <option value="">All styles</option>
          {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map((batch) => (
            <BatchCard key={batch.id} batch={batch} onClick={() => setSelected(batch)} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🍯</span>
          {batches.length === 0 ? (
            <>
              <p className={styles.emptyText}>No batches yet</p>
              <p className={styles.emptySubtext}>
                Start one and the TOSNA schedule builds itself from your OG
              </p>
            </>
          ) : (
            <p className={styles.emptyText}>No batches match your filters</p>
          )}
        </div>
      )}

      {selectedBatch && (
        <BatchDetailModal
          batch={selectedBatch}
          onEdit={openEdit}
          onUpdate={(payload) => update.mutate(payload)}
          onDelete={(id) => remove.mutate(id)}
          onClose={() => setSelected(null)}
        />
      )}

      {formOpen && (
        <BatchFormModal
          batch={formBatch}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
