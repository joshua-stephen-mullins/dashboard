import { useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import { supabase } from '../../../../lib/supabase'
import { lookupBook } from '../../utils/lookupBook'
import styles from './BookFormModal.module.css'

const STATUSES = [
  { value: 'unread',   label: 'Unread' },
  { value: 'reading',  label: 'Reading' },
  { value: 'read',     label: 'Read' },
  { value: 'dnf',      label: 'DNF' },
  { value: 'lent_out', label: 'Lent out' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function buildInitialState(book) {
  if (!book) {
    return {
      title: '',
      author: '',
      isbn: '',
      cover_url: '',
      coverFile: null,
      genre: '',
      page_count: '',
      status: 'unread',
      rating: '',
      date_started: '',
      date_finished: '',
      lent_to: '',
      notes: '',
      source_url: '',
      isbnInput: '',
    }
  }
  return {
    title: book.title ?? '',
    author: book.author ?? '',
    isbn: book.isbn ?? '',
    cover_url: book.cover_url ?? '',
    coverFile: null,
    genre: Array.isArray(book.genre) ? book.genre.join(', ') : (book.genre ?? ''),
    page_count: book.page_count ?? '',
    status: book.status ?? 'owned',
    rating: book.rating ?? '',
    date_started: book.date_started ?? '',
    date_finished: book.date_finished ?? '',
    lent_to: book.lent_to ?? '',
    notes: book.notes ?? '',
    source_url: book.source_url ?? '',
    isbnInput: '',
  }
}

export default function BookFormModal({ book, onSave, onClose }) {
  const [form, setForm] = useState(() => buildInitialState(book))
  const [looking, setLooking] = useState(false)
  const [lookupError, setLookupError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isEdit = Boolean(book?.id)

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleStatusChange(value) {
    setForm((f) => {
      const next = { ...f, status: value }
      if (value === 'reading' && !f.date_started) next.date_started = today()
      if (value === 'read' && !f.date_finished) next.date_finished = today()
      if (f.status === 'lent_out' && value !== 'lent_out') next.lent_to = ''
      return next
    })
  }

  function handleRating(value) {
    setField('rating', form.rating === value ? '' : value)
  }

  async function handleLookup() {
    if (!form.isbnInput.trim()) return
    setLooking(true)
    setLookupError(null)
    try {
      const result = await lookupBook(form.isbnInput.trim())
      setForm((f) => ({
        ...f,
        title: result.title ?? f.title,
        author: result.author ?? f.author,
        cover_url: result.cover_url ?? f.cover_url,
        page_count: result.page_count ?? f.page_count,
        source_url: result.source_url ?? f.source_url,
        isbn: f.isbnInput.trim(),
      }))
    } catch (e) {
      setLookupError(e.message ?? 'Lookup failed')
    } finally {
      setLooking(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.author.trim()) return
    setSaving(true)
    setError(null)
    try {
      let cover_url = form.cover_url || null

      if (form.coverFile) {
        const { data: { user } } = await supabase.auth.getUser()
        const path = `${user.id}/${Date.now()}-${form.coverFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(path, form.coverFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('book-covers')
          .getPublicUrl(uploadData.path)
        cover_url = publicUrl
      }

      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim() || null,
        cover_url,
        genre: form.genre.split(',').map((g) => g.trim()).filter(Boolean),
        page_count: form.page_count ? parseInt(form.page_count, 10) : null,
        status: form.status,
        rating: form.rating ? parseInt(form.rating, 10) : null,
        date_started: form.date_started || null,
        date_finished: form.date_finished || null,
        lent_to: form.status === 'lent_out' ? (form.lent_to.trim() || null) : null,
        notes: form.notes.trim() || null,
        source_url: form.source_url.trim() || null,
      }

      await onSave(isEdit ? { id: book.id, ...payload } : payload)
      onClose()
    } catch (e) {
      setError(e.message ?? 'Failed to save book')
      setSaving(false)
    }
  }

  const showStarted = ['reading', 'read', 'dnf'].includes(form.status)
  const showFinished = ['read', 'dnf'].includes(form.status)

  return (
    <Modal title={isEdit ? 'Edit Book' : 'Add Book'} onClose={onClose} closeOnOverlay={false} closeOnEscape={false}>
      <form onSubmit={handleSave} className={styles.form}>
        {!isEdit && (
          <>
            <div className={styles.lookupRow}>
              <input
                className={styles.input}
                type="text"
                placeholder="Enter ISBN to look up…"
                value={form.isbnInput}
                onChange={(e) => setField('isbnInput', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleLookup())}
              />
              <button
                type="button"
                className={styles.lookupBtn}
                onClick={handleLookup}
                disabled={looking || !form.isbnInput.trim()}
              >
                {looking ? 'Looking up…' : 'Look up'}
              </button>
            </div>
            {lookupError && <p className={styles.error}>{lookupError}</p>}
            <div className={styles.divider} />
          </>
        )}

        <div className={styles.row}>
          <label className={styles.label}>
            Title *
            <input
              className={styles.input}
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Author *
            <input
              className={styles.input}
              type="text"
              value={form.author}
              onChange={(e) => setField('author', e.target.value)}
              required
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.label}>
            ISBN
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. 9780743273565"
              value={form.isbn}
              onChange={(e) => setField('isbn', e.target.value)}
            />
          </label>
          <label className={styles.label}>
            Page count
            <input
              className={styles.input}
              type="number"
              min="1"
              value={form.page_count}
              onChange={(e) => setField('page_count', e.target.value)}
            />
          </label>
        </div>

        <label className={styles.label}>
          Genre
          <input
            className={styles.input}
            type="text"
            placeholder="fantasy, epic, series"
            value={form.genre}
            onChange={(e) => setField('genre', e.target.value)}
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label}>
            Cover image
            <input
              className={styles.input}
              type="file"
              accept="image/*"
              onChange={(e) => setField('coverFile', e.target.files[0] ?? null)}
            />
          </label>
          <label className={styles.label}>
            Cover URL
            <input
              className={styles.input}
              type="url"
              placeholder="https://…"
              value={form.cover_url}
              onChange={(e) => setField('cover_url', e.target.value)}
            />
          </label>
        </div>

        {form.coverFile && (
          <p className={styles.hint}>Uploaded file will be used as the cover.</p>
        )}

        <div className={styles.row}>
          <label className={styles.label}>
            Status *
            <select
              className={styles.select}
              value={form.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <div className={styles.label}>
            Rating
            <div className={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={styles.ratingStar}
                  onClick={() => handleRating(String(n))}
                  aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                >
                  <span className={Number(form.rating) >= n ? styles.starFilled : styles.starEmpty}>★</span>
                </button>
              ))}
              {form.rating && (
                <button type="button" className={styles.clearRating} onClick={() => setField('rating', '')}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {showStarted && (
          <label className={styles.label}>
            Date started
            <input
              className={styles.input}
              type="date"
              value={form.date_started}
              onChange={(e) => setField('date_started', e.target.value)}
            />
          </label>
        )}

        {showFinished && (
          <label className={styles.label}>
            Date finished
            <input
              className={styles.input}
              type="date"
              value={form.date_finished}
              onChange={(e) => setField('date_finished', e.target.value)}
            />
          </label>
        )}

        {form.status === 'lent_out' && (
          <label className={styles.label}>
            Lent to
            <input
              className={styles.input}
              type="text"
              placeholder="Name of person"
              value={form.lent_to}
              onChange={(e) => setField('lent_to', e.target.value)}
            />
          </label>
        )}

        <label className={styles.label}>
          Notes
          <textarea
            className={styles.textarea}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            rows={3}
          />
        </label>

        <label className={styles.label}>
          Source URL
          <input
            className={styles.input}
            type="url"
            placeholder="https://…"
            value={form.source_url}
            onChange={(e) => setField('source_url', e.target.value)}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Save Book'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
