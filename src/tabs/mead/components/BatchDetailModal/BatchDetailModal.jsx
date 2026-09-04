import { useMemo, useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import FermentationChart from '../FermentationChart/FermentationChart'
import NutrientSchedule from '../NutrientSchedule/NutrientSchedule'
import BottleTracker from '../BottleTracker/BottleTracker'
import { useBatchLog } from '../../hooks/useBatchLog'
import {
  abv, apparentAttenuation, sweetnessBucket, strengthClass, daysBetween,
  fmtAbv, fmtGravity, fmtPh, fmtTemp, STYLES, STATUSES,
} from '../../utils/calc'
import styles from './BatchDetailModal.module.css'

const SECTIONS = [
  { key: 'overview',  label: 'Overview' },
  { key: 'readings',  label: 'Readings' },
  { key: 'nutrients', label: 'Nutrients' },
  { key: 'events',    label: 'Events' },
  { key: 'bottles',   label: 'Bottles' },
]

const EVENT_TYPES = [
  'rack', 'degas', 'stabilize', 'backsweeten', 'fining',
  'oak', 'cold_crash', 'bottle', 'taste', 'other',
]

const ADDITION_CATEGORIES = [
  'fruit', 'spice', 'oak', 'acid', 'stabilizer', 'honey', 'nutrient', 'other',
]

const styleLabel = (v) => STYLES.find((s) => s.value === v)?.label ?? v
const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label ?? v

const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'

const num = (v) => (v == null || v === '' ? null : Number(v))

export default function BatchDetailModal({ batch, onEdit, onUpdate, onDelete, onClose }) {
  const [section, setSection] = useState('overview')
  const [confirming, setConfirming] = useState(false)
  const { readings, additions, events } = useBatchLog(batch.id)

  const [reading, setReading] = useState({ gravity: '', temperature_f: '', ph: '', notes: '' })
  const [editingReading, setEditingReading] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [addition, setAddition] = useState({ category: 'fruit', product: '', amount: '', unit: 'g', notes: '' })
  const [event, setEvent] = useState({ event_type: 'rack', gravity: '', notes: '' })

  const readingRows = useMemo(() => readings.data ?? [], [readings.data])
  const additionRows = useMemo(() => additions.data ?? [], [additions.data])
  const eventRows = events.data ?? []

  // The most recent gravity reading, used to fire gravity-triggered
  // nutrient doses and to show where the batch actually is right now.
  const latestGravity = useMemo(() => {
    const withGravity = readingRows.filter((r) => r.gravity != null)
    if (!withGravity.length) return batch.fg == null ? num(batch.og) : Number(batch.fg)
    return Number(withGravity[withGravity.length - 1].gravity)
  }, [readingRows, batch.og, batch.fg])

  const og = num(batch.og)
  const currentAbv = abv(og, latestGravity)
  const finalAbv = abv(og, num(batch.fg))
  const age = daysBetween(batch.brew_date)

  function resetReadingForm() {
    setEditingReading(null)
    setReading({ gravity: '', temperature_f: '', ph: '', notes: '' })
  }

  // Every row delete routes through one confirm. The rows are small and
  // the edit button sits next to the delete, so a misclick is easy and
  // the log it destroys is not reconstructable.
  function confirmDelete() {
    if (!pendingDelete) return
    const { kind, id } = pendingDelete

    if (kind === 'reading') {
      readings.remove.mutate(id)
      if (editingReading?.id === id) resetReadingForm()
    } else if (kind === 'event') {
      events.remove.mutate(id)
    } else {
      additions.remove.mutate(id)
    }
  }

  function startEditReading(row) {
    setEditingReading(row)
    setReading({
      gravity: row.gravity ?? '',
      temperature_f: row.temperature_f ?? '',
      ph: row.ph ?? '',
      notes: row.notes ?? '',
    })
  }

  async function submitReading(e) {
    e.preventDefault()
    const fields = {
      gravity: num(reading.gravity),
      temperature_f: num(reading.temperature_f),
      ph: num(reading.ph),
      notes: reading.notes.trim() || null,
    }

    // An edit keeps the original recorded_at. The timestamp is the one
    // thing a correction must not overwrite — it's when the reading was
    // actually taken, not when the typo was noticed.
    if (editingReading) {
      await readings.update.mutateAsync({ id: editingReading.id, ...fields })
    } else {
      await readings.add.mutateAsync({ recorded_at: new Date().toISOString(), ...fields })
    }

    resetReadingForm()
  }

  async function submitAddition(e) {
    e.preventDefault()
    if (!addition.product.trim()) return
    await additions.add.mutateAsync({
      category: addition.category,
      product: addition.product.trim(),
      amount: num(addition.amount),
      unit: addition.unit || null,
      added_at: new Date().toISOString(),
      gravity_at_addition: latestGravity,
      notes: addition.notes.trim() || null,
    })
    setAddition({ category: 'fruit', product: '', amount: '', unit: 'g', notes: '' })
  }

  async function submitEvent(e) {
    e.preventDefault()
    await events.add.mutateAsync({
      event_type: event.event_type,
      occurred_at: new Date().toISOString(),
      gravity: num(event.gravity) ?? latestGravity,
      notes: event.notes.trim() || null,
    })
    setEvent({ event_type: 'rack', gravity: '', notes: '' })
  }

  // Persists the four planned TOSNA doses. The final dose stores its
  // 1/3-sugar-break gravity so it can fire on gravity, not just date.
  async function generateSchedule(plan) {
    await additions.addMany.mutateAsync(
      plan.doses.map((d) => ({
        category: 'nutrient',
        product: d.product,
        amount: Number(d.amount.toFixed(3)),
        unit: d.unit,
        dose_number: d.doseNumber,
        scheduled_at: d.scheduledAt,
        gravity_at_addition: d.triggerGravity ?? null,
        notes: d.trigger,
      })),
    )
  }

  function markGiven(dose, given) {
    additions.update.mutate({
      id: dose.id,
      added_at: given ? new Date().toISOString() : null,
    })
  }

  return (
    <>
      <Modal title={batch.name} onClose={onClose}>
        <nav className={styles.sectionNav}>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`${styles.sectionBtn} ${section === s.key ? styles.sectionActive : ''}`}
              onClick={() => setSection(s.key)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {section === 'overview' && (
          <div className={styles.stack}>
            {batch.image_url && <img className={styles.hero} src={batch.image_url} alt="" />}

            <p className={styles.subtitle}>
              {styleLabel(batch.style)} · {statusLabel(batch.status)}
              {age != null ? ` · day ${age}` : ''}
            </p>

            <dl className={styles.statGrid}>
              <div className={styles.stat}>
                <dt>OG</dt><dd>{fmtGravity(og)}</dd>
              </div>
              <div className={styles.stat}>
                <dt>Current SG</dt><dd>{fmtGravity(latestGravity)}</dd>
              </div>
              <div className={styles.stat}>
                <dt>FG</dt><dd>{fmtGravity(num(batch.fg))}</dd>
              </div>
              <div className={styles.stat}>
                <dt>ABV</dt><dd>{fmtAbv(finalAbv ?? currentAbv)}</dd>
              </div>
              <div className={styles.stat}>
                <dt>Attenuation</dt>
                <dd>
                  {apparentAttenuation(og, num(batch.fg) ?? latestGravity) == null
                    ? '—'
                    : `${apparentAttenuation(og, num(batch.fg) ?? latestGravity).toFixed(0)}%`}
                </dd>
              </div>
              <div className={styles.stat}>
                <dt>Sweetness</dt>
                <dd>{sweetnessBucket(num(batch.fg) ?? latestGravity) ?? '—'}</dd>
              </div>
              <div className={styles.stat}>
                <dt>Class</dt>
                <dd>{strengthClass(finalAbv ?? currentAbv) ?? '—'}</dd>
              </div>
              <div className={styles.stat}>
                <dt>Carbonation</dt><dd>{batch.carbonation ?? '—'}</dd>
              </div>
            </dl>

            <dl className={styles.detailList}>
              <div><dt>Honey</dt><dd>{[batch.honey_lbs && `${batch.honey_lbs} lb`, batch.honey_varietal].filter(Boolean).join(' ') || '—'}</dd></div>
              <div><dt>Source</dt><dd>{batch.honey_source ?? '—'}</dd></div>
              <div><dt>Batch size</dt><dd>{batch.batch_size_gal ? `${batch.batch_size_gal} gal` : '—'}</dd></div>
              <div><dt>Vessel</dt><dd>{batch.vessel ?? '—'}</dd></div>
              <div><dt>Yeast</dt><dd>{batch.yeast_strain ?? '—'}{batch.yeast_nitrogen_need ? ` (${batch.yeast_nitrogen_need} N)` : ''}</dd></div>
              <div><dt>Pitched</dt><dd>{batch.pitch_date ?? '—'}</dd></div>
              <div><dt>Bottled</dt><dd>{batch.bottled_date ?? '—'}</dd></div>
              <div><dt>Rating</dt><dd>{batch.rating ? `${batch.rating}/5` : '—'}</dd></div>
            </dl>

            {batch.tasting_notes && (
              <section>
                <p className={styles.sectionLabel}>Tasting notes</p>
                <p className={styles.prose}>{batch.tasting_notes}</p>
              </section>
            )}

            {batch.notes && (
              <section>
                <p className={styles.sectionLabel}>Recipe notes</p>
                <p className={styles.prose}>{batch.notes}</p>
              </section>
            )}

            <div className={styles.actions}>
              <button type="button" className={styles.ghostBtn} onClick={() => onEdit(batch)}>
                Edit
              </button>
              <button type="button" className={styles.dangerBtn} onClick={() => setConfirming(true)}>
                Delete
              </button>
            </div>
          </div>
        )}

        {section === 'readings' && (
          <div className={styles.stack}>
            <FermentationChart readings={readingRows} />

            <form className={styles.quickForm} onSubmit={submitReading}>
              <p className={styles.sectionLabel}>
                {editingReading
                  ? `Edit reading — ${fmtDateTime(editingReading.recorded_at)}`
                  : 'Log a reading'}
              </p>
              <div className={styles.quickRow}>
                <input className={styles.input} type="number" step="0.001" placeholder="SG"
                  value={reading.gravity} onChange={(e) => setReading({ ...reading, gravity: e.target.value })} />
                <input className={styles.input} type="number" step="0.1" placeholder="°F"
                  value={reading.temperature_f} onChange={(e) => setReading({ ...reading, temperature_f: e.target.value })} />
                <input className={styles.input} type="number" step="0.01" placeholder="pH"
                  value={reading.ph} onChange={(e) => setReading({ ...reading, ph: e.target.value })} />
              </div>
              <input className={styles.input} placeholder="Notes"
                value={reading.notes} onChange={(e) => setReading({ ...reading, notes: e.target.value })} />
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={readings.add.isPending || readings.update.isPending}
                >
                  {editingReading ? 'Update reading' : 'Add reading'}
                </button>
                {editingReading && (
                  <button type="button" className={styles.ghostBtn} onClick={resetReadingForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {readingRows.length > 0 && (
              <table className={styles.table}>
                <thead>
                  <tr><th>When</th><th>SG</th><th>Temp</th><th>pH</th><th /></tr>
                </thead>
                <tbody>
                  {[...readingRows].reverse().map((r) => (
                    <tr
                      key={r.id}
                      className={editingReading?.id === r.id ? styles.editingRow : undefined}
                    >
                      <td>{fmtDateTime(r.recorded_at)}</td>
                      <td>{fmtGravity(num(r.gravity))}</td>
                      <td>{fmtTemp(num(r.temperature_f))}</td>
                      <td>{fmtPh(num(r.ph))}</td>
                      <td>
                        <div className={styles.rowActions}>
                          <button type="button" className={styles.editBtn}
                            onClick={() => startEditReading(r)} aria-label="Edit reading">✎</button>
                          <button type="button" className={styles.removeBtn}
                            onClick={() => setPendingDelete({
                              kind: 'reading',
                              id: r.id,
                              label: `the reading from ${fmtDateTime(r.recorded_at)}`,
                            })}
                            aria-label="Delete reading">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {section === 'nutrients' && (
          <div className={styles.stack}>
            <NutrientSchedule
              batch={batch}
              additions={additionRows}
              latestGravity={latestGravity}
              onGenerate={generateSchedule}
              onMarkGiven={markGiven}
              onRemove={(dose) => setPendingDelete({
                kind: 'dose',
                id: dose.id,
                label: dose.dose_number ? `nutrient dose ${dose.dose_number}` : dose.product,
              })}
            />

            <form className={styles.quickForm} onSubmit={submitAddition}>
              <p className={styles.sectionLabel}>Other addition</p>
              <div className={styles.quickRow}>
                <select className={styles.input} value={addition.category}
                  onChange={(e) => setAddition({ ...addition, category: e.target.value })}>
                  {ADDITION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className={styles.input} placeholder="Product"
                  value={addition.product} onChange={(e) => setAddition({ ...addition, product: e.target.value })} />
                <input className={styles.input} type="number" step="0.01" placeholder="Amount"
                  value={addition.amount} onChange={(e) => setAddition({ ...addition, amount: e.target.value })} />
                <input className={styles.input} placeholder="Unit"
                  value={addition.unit} onChange={(e) => setAddition({ ...addition, unit: e.target.value })} />
              </div>
              <button type="submit" className={styles.saveBtn} disabled={additions.add.isPending}>
                Log addition
              </button>
            </form>

            {additionRows.filter((a) => a.category !== 'nutrient').length > 0 && (
              <ul className={styles.log}>
                {additionRows.filter((a) => a.category !== 'nutrient').map((a) => (
                  <li key={a.id} className={styles.logItem}>
                    <span className={styles.logType}>{a.category}</span>
                    <span className={styles.logBody}>
                      {a.product}
                      {a.amount != null ? ` · ${a.amount} ${a.unit ?? ''}` : ''}
                    </span>
                    <span className={styles.logWhen}>{fmtDateTime(a.added_at)}</span>
                    <button type="button" className={styles.removeBtn}
                      onClick={() => setPendingDelete({ kind: 'addition', id: a.id, label: a.product })}
                      aria-label="Delete addition">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {section === 'events' && (
          <div className={styles.stack}>
            <form className={styles.quickForm} onSubmit={submitEvent}>
              <p className={styles.sectionLabel}>Log an event</p>
              <div className={styles.quickRow}>
                <select className={styles.input} value={event.event_type}
                  onChange={(e) => setEvent({ ...event, event_type: e.target.value })}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
                <input className={styles.input} type="number" step="0.001" placeholder="SG"
                  value={event.gravity} onChange={(e) => setEvent({ ...event, gravity: e.target.value })} />
              </div>
              <input className={styles.input} placeholder="Notes"
                value={event.notes} onChange={(e) => setEvent({ ...event, notes: e.target.value })} />
              <button type="submit" className={styles.saveBtn} disabled={events.add.isPending}>
                Log event
              </button>
            </form>

            {eventRows.length > 0 ? (
              <ul className={styles.log}>
                {[...eventRows].reverse().map((ev) => (
                  <li key={ev.id} className={styles.logItem}>
                    <span className={styles.logType}>{ev.event_type.replace('_', ' ')}</span>
                    <span className={styles.logBody}>{ev.notes ?? ''}</span>
                    <span className={styles.logWhen}>{fmtDateTime(ev.occurred_at)}</span>
                    <button type="button" className={styles.removeBtn}
                      onClick={() => setPendingDelete({
                        kind: 'event',
                        id: ev.id,
                        label: `the ${ev.event_type.replace('_', ' ')} event`,
                      })}
                      aria-label="Delete event">✕</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.hint}>No racking, stabilizing or bottling logged yet.</p>
            )}
          </div>
        )}

        {section === 'bottles' && (
          <div className={styles.stack}>
            <BottleTracker
              batch={batch}
              onChange={(remaining) => onUpdate({ id: batch.id, bottles_remaining: remaining })}
            />
          </div>
        )}
      </Modal>

      {pendingDelete && (
        <ConfirmModal
          title="Delete this entry?"
          message={`${pendingDelete.label} will be removed from the log. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}

      {confirming && (
        <ConfirmModal
          title="Delete batch?"
          message={`"${batch.name}" and its whole log will be removed. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { onDelete(batch.id); onClose() }}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  )
}
