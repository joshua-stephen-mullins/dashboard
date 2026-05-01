import { useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import { finnhubGet } from '../../../../lib/finnhub'
import { avGetProfile } from '../../../../lib/alphaVantage'
import styles from './HoldingFormModal.module.css'

function buildInitialState(holding) {
  if (!holding) {
    return { ticker: '', company_name: '', shares: '', avg_cost: '' }
  }
  return {
    ticker: holding.ticker,
    company_name: holding.company_name,
    shares: String(holding.shares),
    avg_cost: String(holding.avg_cost),
  }
}

export default function HoldingFormModal({ holding, onSave, onClose }) {
  const [form, setForm] = useState(() => buildInitialState(holding))
  const [looking, setLooking] = useState(false)
  const [lookupError, setLookupError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isEdit = Boolean(holding?.id)

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleLookup() {
    const ticker = form.ticker.trim().toUpperCase()
    if (!ticker) return
    setLooking(true)
    setLookupError(null)
    try {
      let name
      try {
        const data = await finnhubGet('stock/profile2', { symbol: ticker })
        if (!data?.name) throw new Error('empty')
        name = data.name
      } catch (fhErr) {
        if (!fhErr.message?.includes('403') && fhErr.message !== 'empty') throw fhErr
        // Finnhub doesn't cover this ticker — try Alpha Vantage
        const data = await avGetProfile(ticker)
        name = data.name
      }
      setForm((f) => ({ ...f, ticker, company_name: name }))
    } catch (e) {
      setLookupError(e.message?.includes('No profile')
        ? `Couldn't find "${ticker}" — enter the company name manually`
        : (e.message || 'Lookup failed')
      )
    } finally {
      setLooking(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.ticker.trim() || !form.company_name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ticker: form.ticker.trim().toUpperCase(),
        company_name: form.company_name.trim(),
        shares: parseFloat(form.shares),
        avg_cost: parseFloat(form.avg_cost),
      }
      await onSave(isEdit ? { id: holding.id, ...payload } : payload)
      onClose()
    } catch (e) {
      setError(e.message ?? 'Failed to save holding')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Holding' : 'Add Holding'}
      onClose={onClose}
      closeOnOverlay={false}
      closeOnEscape={false}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {!isEdit && (
          <div className={styles.lookupRow}>
            <label className={styles.label}>
              Ticker symbol
              <div className={styles.tickerRow}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. AAPL"
                  value={form.ticker}
                  onChange={(e) => setField('ticker', e.target.value.toUpperCase())}
                  required
                />
                <button
                  type="button"
                  className={styles.lookupBtn}
                  onClick={handleLookup}
                  disabled={looking || !form.ticker.trim()}
                >
                  {looking ? 'Looking up…' : 'Look up'}
                </button>
              </div>
            </label>
            {lookupError && <p className={styles.error}>{lookupError}</p>}
          </div>
        )}

        {isEdit && (
          <label className={styles.label}>
            Ticker
            <input className={styles.input} type="text" value={form.ticker} readOnly />
          </label>
        )}

        <label className={styles.label}>
          Company name
          <input
            className={styles.input}
            type="text"
            placeholder="Auto-filled on look up"
            value={form.company_name}
            onChange={(e) => setField('company_name', e.target.value)}
            required
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label}>
            Shares
            <input
              className={styles.input}
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={form.shares}
              onChange={(e) => setField('shares', e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Avg cost (USD)
            <input
              className={styles.input}
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={form.avg_cost}
              onChange={(e) => setField('avg_cost', e.target.value)}
              required
            />
          </label>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Holding'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
