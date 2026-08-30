// TOSNA 3.0 — Tailored Organic Staggered Nutrient Addition.
//
// Total Fermaid-O = (Brix * 10 * gallons * yeastFactor) / 50, split into
// four equal doses given at 24h, 48h, 72h after pitch, and at the 1/3
// sugar break (or day 7, whichever comes first).
//
// The final dose is gravity-triggered, not time-triggered — the day-7
// date below is only the fallback, which is why dose 4 carries both.

import { sgToBrix, sugarBreakGravity } from './calc'

export const YEAST_FACTORS = {
  low: 0.75,
  medium: 0.9,
  high: 1.25,
}

export const NITROGEN_NEEDS = [
  { value: 'low',    label: 'Low (e.g. 71B, DV10)' },
  { value: 'medium', label: 'Medium (e.g. D47, K1-V1116)' },
  { value: 'high',   label: 'High (e.g. EC-1118, RC-212)' },
]

const HOURS = [24, 48, 72]

export function totalFermaidO({ og, batchSizeGal, nitrogenNeed = 'medium' }) {
  const factor = YEAST_FACTORS[nitrogenNeed]
  if (og == null || !batchSizeGal || factor == null) return null
  const brix = sgToBrix(og)
  if (brix == null || brix <= 0) return null
  return (brix * 10 * batchSizeGal * factor) / 50
}

// Returns four planned doses. `pitchDate` may be null — the schedule is
// still useful for planning, the dates just come back null.
export function tosnaSchedule({ og, batchSizeGal, nitrogenNeed = 'medium', pitchDate = null }) {
  const total = totalFermaidO({ og, batchSizeGal, nitrogenNeed })
  if (total == null) return null

  const perDose = total / 4
  const pitch = pitchDate ? new Date(pitchDate) : null
  const validPitch = pitch && !Number.isNaN(pitch.getTime()) ? pitch : null

  const doses = HOURS.map((hours, i) => ({
    doseNumber: i + 1,
    product: 'Fermaid-O',
    amount: perDose,
    unit: 'g',
    hoursAfterPitch: hours,
    scheduledAt: validPitch
      ? new Date(validPitch.getTime() + hours * 3_600_000).toISOString()
      : null,
    trigger: `${hours}h after pitch`,
  }))

  doses.push({
    doseNumber: 4,
    product: 'Fermaid-O',
    amount: perDose,
    unit: 'g',
    hoursAfterPitch: 24 * 7,
    scheduledAt: validPitch
      ? new Date(validPitch.getTime() + 7 * 86_400_000).toISOString()
      : null,
    triggerGravity: sugarBreakGravity(og),
    trigger: '1/3 sugar break, or day 7 — whichever comes first',
  })

  return { totalGrams: total, perDoseGrams: perDose, doses }
}

// GoFerm for rehydration is dosed off the yeast, not the must:
// 1.25 g per gram of yeast, in 20x its weight of water at 43°C.
export function goFermGrams(yeastGrams) {
  if (!yeastGrams) return null
  return yeastGrams * 1.25
}
