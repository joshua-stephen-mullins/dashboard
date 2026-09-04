import { useMemo } from 'react'
import { tosnaSchedule } from '../../utils/tosna'
import { dueDoses } from '../../utils/filters'
import { fmtGravity } from '../../utils/calc'
import styles from './NutrientSchedule.module.css'

// A planned dose is anchored to midnight of its day, so showing a time
// would imply a precision the date-only pitch_date does not have. A dose
// that was actually given has a real timestamp worth showing.
function fmtDay(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default function NutrientSchedule({ batch, additions, latestGravity, onGenerate, onMarkGiven, onRemove }) {
  const nutrientDoses = additions.filter((a) => a.category === 'nutrient')

  const plan = useMemo(
    () => tosnaSchedule({
      og: batch.og == null ? null : Number(batch.og),
      batchSizeGal: batch.batch_size_gal == null ? null : Number(batch.batch_size_gal),
      nitrogenNeed: batch.yeast_nitrogen_need ?? 'medium',
      pitchDate: batch.pitch_date,
    }),
    [batch.og, batch.batch_size_gal, batch.yeast_nitrogen_need, batch.pitch_date],
  )

  const due = useMemo(
    () => new Set(dueDoses(nutrientDoses, latestGravity).map((d) => d.id)),
    [nutrientDoses, latestGravity],
  )

  if (!plan) {
    return (
      <p className={styles.hint}>
        Set an original gravity and batch size to calculate the TOSNA schedule.
      </p>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <div className={styles.summaryStat}>
          <span className={styles.summaryLabel}>Total Fermaid-O</span>
          <span className={styles.summaryValue}>{plan.totalGrams.toFixed(1)} g</span>
        </div>
        <div className={styles.summaryStat}>
          <span className={styles.summaryLabel}>Per dose ×4</span>
          <span className={styles.summaryValue}>{plan.perDoseGrams.toFixed(2)} g</span>
        </div>
        <div className={styles.summaryStat}>
          <span className={styles.summaryLabel}>1/3 sugar break</span>
          <span className={styles.summaryValue}>
            {fmtGravity(plan.doses[3].triggerGravity)}
          </span>
        </div>
      </div>

      {nutrientDoses.length === 0 ? (
        <div className={styles.generate}>
          <p className={styles.hint}>
            Four doses at 24h, 48h, 72h, and the 1/3 sugar break (or day 7,
            whichever comes first).
          </p>
          <button
            type="button"
            className={styles.generateBtn}
            onClick={() => onGenerate(plan)}
          >
            Save this schedule
          </button>
        </div>
      ) : (
        <ul className={styles.doses}>
          {nutrientDoses.map((dose) => {
            const given = Boolean(dose.added_at)
            return (
              <li
                key={dose.id}
                className={`${styles.dose} ${given ? styles.given : ''} ${due.has(dose.id) ? styles.due : ''}`}
              >
                <label className={styles.doseCheck}>
                  <input
                    type="checkbox"
                    checked={given}
                    onChange={(e) => onMarkGiven(dose, e.target.checked)}
                  />
                  <span className={styles.doseName}>
                    {dose.dose_number ? `Dose ${dose.dose_number}` : dose.product}
                  </span>
                </label>

                <span className={styles.doseAmount}>
                  {dose.amount == null ? '—' : `${Number(dose.amount).toFixed(2)} ${dose.unit ?? 'g'}`}
                </span>

                <span className={styles.doseWhen}>
                  {given ? `given ${fmtDateTime(dose.added_at)}` : fmtDay(dose.scheduled_at)}
                </span>

                {due.has(dose.id) && !given && <span className={styles.dueTag}>due</span>}

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => onRemove(dose)}
                  aria-label={`Remove dose ${dose.dose_number ?? ''}`}
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
