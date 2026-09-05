import { useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import { supabase } from '../../../../lib/supabase'
import { STYLES, STATUSES, CARBONATION } from '../../utils/calc'
import { NITROGEN_NEEDS } from '../../utils/tosna'
import styles from './BatchFormModal.module.css'

const EMPTY = {
  name: '',
  batch_number: '',
  style: 'traditional',
  status: 'planning',
  vessel: '',
  carbonation: 'still',
  batch_size_gal: '',
  honey_varietal: '',
  honey_source: '',
  honey_lbs: '',
  honey_cost: '',
  water_gal: '',
  yeast_strain: '',
  yeast_nitrogen_need: 'medium',
  target_og: '',
  target_abv: '',
  og: '',
  fg: '',
  brew_date: '',
  pitch_date: '',
  bottled_date: '',
  bottle_count: '',
  bottles_remaining: '',
  bottle_size: '',
  carbonation_method: '',
  rating: '',
  tasting_notes: '',
  notes: '',
  tags: '',
  image_url: '',
  source_url: '',
  imageFile: null,
}

const NUMERIC = [
  'batch_size_gal', 'honey_lbs', 'honey_cost', 'water_gal',
  'target_og', 'target_abv', 'og', 'fg',
]
const INTEGER = ['batch_number', 'bottle_count', 'bottles_remaining', 'rating']
const DATES = ['brew_date', 'pitch_date', 'bottled_date']
const TEXT = [
  'vessel', 'honey_varietal', 'honey_source', 'yeast_strain',
  'bottle_size', 'carbonation_method', 'tasting_notes', 'notes', 'source_url',
]

function fromBatch(batch) {
  if (!batch) return EMPTY
  const out = { ...EMPTY }
  for (const key of Object.keys(EMPTY)) {
    if (key === 'imageFile') continue
    if (key === 'tags') {
      out.tags = (batch.tags ?? []).join(', ')
    } else if (batch[key] != null) {
      out[key] = String(batch[key])
    }
  }
  return out
}

export default function BatchFormModal({ batch, onSave, onClose }) {
  const [form, setForm] = useState(() => fromBatch(batch))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Give the batch a name.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      let imageUrl = form.image_url || null

      if (form.imageFile) {
        const { data: { user } } = await supabase.auth.getUser()
        const path = `${user.id}/${Date.now()}-${form.imageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('mead-images')
          .upload(path, form.imageFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('mead-images')
          .getPublicUrl(uploadData.path)
        imageUrl = publicUrl
      }

      const payload = {
        name: form.name.trim(),
        style: form.style,
        status: form.status,
        carbonation: form.carbonation,
        yeast_nitrogen_need: form.yeast_nitrogen_need,
        image_url: imageUrl,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }

      for (const key of NUMERIC) payload[key] = form[key] === '' ? null : Number(form[key])
      for (const key of INTEGER) payload[key] = form[key] === '' ? null : parseInt(form[key], 10)
      for (const key of DATES) payload[key] = form[key] === '' ? null : form[key]
      for (const key of TEXT) payload[key] = form[key].trim() === '' ? null : form[key].trim()

      // Bottling with no explicit remaining count means none are drunk yet.
      if (payload.bottle_count != null && payload.bottles_remaining == null) {
        payload.bottles_remaining = payload.bottle_count
      }

      await onSave(batch ? { id: batch.id, ...payload } : payload)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Could not save the batch.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={batch ? 'Edit batch' : 'New batch'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.sectionLabel}>Batch</p>

        <label className={styles.field}>
          Name
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Blackberry Melomel #3"
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            Batch #
            <input
              className={styles.input}
              type="number"
              value={form.batch_number}
              onChange={(e) => setField('batch_number', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Style
            <select
              className={styles.input}
              value={form.style}
              onChange={(e) => setField('style', e.target.value)}
            >
              {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            Status
            <select
              className={styles.input}
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            Vessel
            <input
              className={styles.input}
              value={form.vessel}
              onChange={(e) => setField('vessel', e.target.value)}
              placeholder="1 gal carboy"
            />
          </label>
          <label className={styles.field}>
            Carbonation
            <select
              className={styles.input}
              value={form.carbonation}
              onChange={(e) => setField('carbonation', e.target.value)}
            >
              {CARBONATION.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            Batch size (gal)
            <input
              className={styles.input}
              type="number"
              step="0.25"
              value={form.batch_size_gal}
              onChange={(e) => setField('batch_size_gal', e.target.value)}
            />
          </label>
        </div>

        <p className={styles.sectionLabel}>Honey &amp; must</p>

        <div className={styles.row}>
          <label className={styles.field}>
            Varietal
            <input
              className={styles.input}
              value={form.honey_varietal}
              onChange={(e) => setField('honey_varietal', e.target.value)}
              placeholder="orange blossom"
            />
          </label>
          <label className={styles.field}>
            Source
            <input
              className={styles.input}
              value={form.honey_source}
              onChange={(e) => setField('honey_source', e.target.value)}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            Honey (lbs)
            <input
              className={styles.input}
              type="number"
              step="0.1"
              value={form.honey_lbs}
              onChange={(e) => setField('honey_lbs', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Honey cost ($)
            <input
              className={styles.input}
              type="number"
              step="0.01"
              value={form.honey_cost}
              onChange={(e) => setField('honey_cost', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Water (gal)
            <input
              className={styles.input}
              type="number"
              step="0.25"
              value={form.water_gal}
              onChange={(e) => setField('water_gal', e.target.value)}
            />
          </label>
        </div>

        <p className={styles.sectionLabel}>Yeast</p>

        <div className={styles.row}>
          <label className={styles.field}>
            Strain
            <input
              className={styles.input}
              value={form.yeast_strain}
              onChange={(e) => setField('yeast_strain', e.target.value)}
              placeholder="Lalvin D47"
            />
          </label>
          <label className={styles.field}>
            Nitrogen need
            <select
              className={styles.input}
              value={form.yeast_nitrogen_need}
              onChange={(e) => setField('yeast_nitrogen_need', e.target.value)}
            >
              {NITROGEN_NEEDS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </label>
        </div>
        <p className={styles.hint}>
          Nitrogen need drives the TOSNA dose size — low 0.75, medium 0.90, high 1.25.
        </p>

        <p className={styles.sectionLabel}>Gravity &amp; dates</p>

        <div className={styles.row}>
          <label className={styles.field}>
            Target OG
            <input
              className={styles.input}
              type="number"
              step="0.001"
              value={form.target_og}
              onChange={(e) => setField('target_og', e.target.value)}
              placeholder="1.100"
            />
          </label>
          <label className={styles.field}>
            OG
            <input
              className={styles.input}
              type="number"
              step="0.001"
              value={form.og}
              onChange={(e) => setField('og', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            FG
            <input
              className={styles.input}
              type="number"
              step="0.001"
              value={form.fg}
              onChange={(e) => setField('fg', e.target.value)}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            Brew date
            <input
              className={styles.input}
              type="date"
              value={form.brew_date}
              onChange={(e) => setField('brew_date', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Pitch date
            <input
              className={styles.input}
              type="date"
              value={form.pitch_date}
              onChange={(e) => setField('pitch_date', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Bottled
            <input
              className={styles.input}
              type="date"
              value={form.bottled_date}
              onChange={(e) => setField('bottled_date', e.target.value)}
            />
          </label>
        </div>

        <p className={styles.sectionLabel}>Packaging</p>

        <div className={styles.row}>
          <label className={styles.field}>
            Bottles
            <input
              className={styles.input}
              type="number"
              value={form.bottle_count}
              onChange={(e) => setField('bottle_count', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Remaining
            <input
              className={styles.input}
              type="number"
              value={form.bottles_remaining}
              onChange={(e) => setField('bottles_remaining', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Bottle size
            <input
              className={styles.input}
              value={form.bottle_size}
              onChange={(e) => setField('bottle_size', e.target.value)}
              placeholder="750 ml"
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            Carbonation method
            <input
              className={styles.input}
              value={form.carbonation_method}
              onChange={(e) => setField('carbonation_method', e.target.value)}
              placeholder="still / priming sugar / forced"
            />
          </label>
          <label className={styles.field}>
            Rating (1–5)
            <input
              className={styles.input}
              type="number"
              min="1"
              max="5"
              value={form.rating}
              onChange={(e) => setField('rating', e.target.value)}
            />
          </label>
        </div>

        <p className={styles.sectionLabel}>Notes &amp; photo</p>

        <label className={styles.field}>
          Tasting notes
          <textarea
            className={styles.textarea}
            rows={2}
            value={form.tasting_notes}
            onChange={(e) => setField('tasting_notes', e.target.value)}
          />
        </label>

        <label className={styles.field}>
          Batch notes
          <textarea
            className={styles.textarea}
            rows={3}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </label>

        <label className={styles.field}>
          Tags (comma separated)
          <input
            className={styles.input}
            value={form.tags}
            onChange={(e) => setField('tags', e.target.value)}
            placeholder="fruit, experiment"
          />
        </label>

        <label className={styles.field}>
          Photo upload
          <input
            className={styles.input}
            type="file"
            accept="image/*"
            onChange={(e) => setField('imageFile', e.target.files[0] ?? null)}
          />
        </label>

        <label className={styles.field}>
          …or image URL
          <input
            className={styles.input}
            value={form.image_url}
            onChange={(e) => setField('image_url', e.target.value)}
            placeholder="https://…"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Save batch'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
