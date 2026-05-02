import { useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import { EVENT_COLORS } from '../../utils/calendar'
import styles from './EventFormModal.module.css'

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

function buildInitialState(event, prefillDate) {
  if (!event) {
    return {
      title: '',
      date: prefillDate ?? '',
      end_date: '',
      start_time: '',
      end_time: '',
      location: '',
      color: 'blue',
      notes: '',
    }
  }
  return {
    title: event.title,
    date: event.date,
    end_date: event.end_date ?? '',
    start_time: event.start_time ?? '',
    end_time: event.end_time ?? '',
    location: event.location ?? '',
    color: event.color,
    notes: event.notes ?? '',
  }
}

export default function EventFormModal({ event, prefillDate, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(() => buildInitialState(event, prefillDate))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isEdit = Boolean(event?.id)

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title.trim(),
        date: form.date,
        end_date: form.end_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        location: form.location.trim() || null,
        color: form.color,
        notes: form.notes.trim() || null,
      }
      await onSave(isEdit ? { id: event.id, ...payload } : payload)
      onClose()
    } catch (e) {
      setError(e.message ?? 'Failed to save event')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Event' : 'Add Event'}
      onClose={onClose}
      closeOnOverlay={false}
      closeOnEscape={false}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Title
          <input
            className={styles.input}
            type="text"
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            required
            autoFocus
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label}>
            Start date
            <input
              className={styles.input}
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            End date
            <input
              className={styles.input}
              type="date"
              value={form.end_date}
              min={form.date || undefined}
              onChange={(e) => setField('end_date', e.target.value)}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.label}>
            Start time
            <input
              className={styles.input}
              type="time"
              value={form.start_time}
              onChange={(e) => setField('start_time', e.target.value)}
            />
          </label>
          <label className={styles.label}>
            End time
            <input
              className={styles.input}
              type="time"
              value={form.end_time}
              onChange={(e) => setField('end_time', e.target.value)}
            />
          </label>
        </div>

        <label className={styles.label}>
          Location
          <input
            className={styles.input}
            type="text"
            placeholder="Optional"
            value={form.location}
            onChange={(e) => setField('location', e.target.value)}
          />
        </label>

        <div className={styles.colorRow}>
          <span className={styles.colorLabel}>Color</span>
          <div className={styles.swatches}>
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={[
                  styles.swatch,
                  COLOR_CLASS[c],
                  form.color === c && styles.swatchSelected,
                ].filter(Boolean).join(' ')}
                onClick={() => setField('color', c)}
                aria-label={c}
                aria-pressed={form.color === c}
              />
            ))}
          </div>
        </div>

        <label className={styles.label}>
          Notes
          <textarea
            className={styles.textarea}
            placeholder="Optional"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            rows={3}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          {isEdit && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={onDelete}
            >
              Delete
            </button>
          )}
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Event'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
