import { useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import { EVENT_COLORS } from '../../utils/calendar'
import styles from './CategoryManagerModal.module.css'

const COLOR_CLASS = {
  blue: styles.swatchBlue,
  green: styles.swatchGreen,
  amber: styles.swatchAmber,
  red: styles.swatchRed,
  teal: styles.swatchTeal,
  purple: styles.swatchPurple,
  orange: styles.swatchOrange,
  pink: styles.swatchPink,
}

function Swatches({ value, onChange }) {
  return (
    <div className={styles.swatches}>
      {EVENT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={[
            styles.swatch,
            COLOR_CLASS[c],
            value === c && styles.swatchSelected,
          ].filter(Boolean).join(' ')}
          onClick={() => onChange(c)}
          aria-label={c}
          aria-pressed={value === c}
        />
      ))}
    </div>
  )
}

export default function CategoryManagerModal({ categories, onAdd, onUpdate, onDelete, onClose }) {
  const [draft, setDraft] = useState({ name: '', color: 'blue', is_coursework: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  // Names are edited locally and committed on blur — one mutation per rename,
  // not one per keystroke.
  const [names, setNames] = useState({})

  async function run(fn) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function commitName(category) {
    const next = (names[category.id] ?? category.name).trim()
    setNames((n) => {
      const next = { ...n }
      delete next[category.id]
      return next
    })
    if (!next || next === category.name) return
    await run(() => onUpdate({ id: category.id, name: next }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    const name = draft.name.trim()
    if (!name) return
    await run(async () => {
      await onAdd({ ...draft, name, sort_order: categories.length })
      setDraft({ name: '', color: 'blue', is_coursework: false })
    })
  }

  return (
    <Modal title="Categories" onClose={onClose}>
      <div className={styles.wrap}>
        {categories.length === 0 ? (
          <p className={styles.empty}>
            No categories yet. Add one below — School, Mead, Personal…
          </p>
        ) : (
          <ul className={styles.list}>
            {categories.map((c) => (
              <li key={c.id} className={styles.row}>
                <input
                  className={styles.nameInput}
                  type="text"
                  value={names[c.id] ?? c.name}
                  onChange={(e) => setNames((n) => ({ ...n, [c.id]: e.target.value }))}
                  onBlur={() => commitName(c)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  aria-label={`${c.name} name`}
                />

                <Swatches
                  value={c.color}
                  onChange={(color) => run(() => onUpdate({ id: c.id, color }))}
                />

                <label className={styles.checkLabel} title="Events in this category get a course field and a done toggle">
                  <input
                    type="checkbox"
                    checked={c.is_coursework}
                    onChange={(e) => run(() => onUpdate({ id: c.id, is_coursework: e.target.checked }))}
                  />
                  Coursework
                </label>

                {confirmId === c.id ? (
                  <span className={styles.confirm}>
                    <button
                      type="button"
                      className={styles.confirmBtn}
                      onClick={() => run(async () => { await onDelete(c.id); setConfirmId(null) })}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className={styles.cancelSmall}
                      onClick={() => setConfirmId(null)}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setConfirmId(c.id)}
                    aria-label={`Delete ${c.name}`}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className={styles.hint}>
          Deleting a category keeps its events — they just become uncategorized.
        </p>

        <form onSubmit={handleAdd} className={styles.addForm}>
          <input
            className={styles.nameInput}
            type="text"
            placeholder="New category"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <Swatches value={draft.color} onChange={(color) => setDraft((d) => ({ ...d, color }))} />
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={draft.is_coursework}
              onChange={(e) => setDraft((d) => ({ ...d, is_coursework: e.target.checked }))}
            />
            Coursework
          </label>
          <button type="submit" className={styles.addBtn} disabled={busy || !draft.name.trim()}>
            Add
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </Modal>
  )
}
