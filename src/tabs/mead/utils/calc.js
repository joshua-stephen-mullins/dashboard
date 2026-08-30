// Derived mead values. Nothing here is ever stored in the database —
// ABV, attenuation, and sweetness are recomputed from og/fg so they
// can never drift from the gravity readings they come from.

export const STYLES = [
  { value: 'traditional', label: 'Traditional' },
  { value: 'melomel',     label: 'Melomel (fruit)' },
  { value: 'cyser',       label: 'Cyser (apple)' },
  { value: 'pyment',      label: 'Pyment (grape)' },
  { value: 'metheglin',   label: 'Metheglin (spice)' },
  { value: 'braggot',     label: 'Braggot (malt)' },
  { value: 'other',       label: 'Other' },
]

export const STATUSES = [
  { value: 'planning',    label: 'Planning' },
  { value: 'primary',     label: 'Primary' },
  { value: 'secondary',   label: 'Secondary' },
  { value: 'bulk_aging',  label: 'Bulk aging' },
  { value: 'bottled',     label: 'Bottled' },
  { value: 'drinking',    label: 'Drinking' },
  { value: 'archived',    label: 'Archived' },
]

export const CARBONATION = [
  { value: 'still',      label: 'Still' },
  { value: 'petillant',  label: 'Pétillant' },
  { value: 'sparkling',  label: 'Sparkling' },
]

// The standard homebrew approximation. Good enough below ~20% ABV,
// which covers every mead short of a stalled sack.
export function abv(og, fg) {
  if (og == null || fg == null) return null
  return (og - fg) * 131.25
}

export function apparentAttenuation(og, fg) {
  if (og == null || fg == null || og <= 1) return null
  return ((og - fg) / (og - 1)) * 100
}

// BJCP declares sweetness as a perception, but FG is the honest
// starting point for a log. Buckets follow the common mead convention.
export function sweetnessBucket(fg) {
  if (fg == null) return null
  if (fg < 1.010) return 'dry'
  if (fg <= 1.025) return 'semi-sweet'
  return 'sweet'
}

// BJCP strength classes for mead.
export function strengthClass(abvValue) {
  if (abvValue == null) return null
  if (abvValue < 7.5) return 'hydromel'
  if (abvValue < 14) return 'standard'
  return 'sack'
}

// Cubic approximation used across the homebrewing world.
export function sgToBrix(sg) {
  if (sg == null) return null
  return ((182.4601 * sg - 775.6821) * sg + 1262.7794) * sg - 669.5622
}

export function brixToSg(brix) {
  if (brix == null) return null
  return brix / (258.6 - (brix / 258.2) * 227.1) + 1
}

// The 1/3 sugar break — where the last TOSNA dose is due if it
// arrives before day 7.
export function sugarBreakGravity(og, fraction = 1 / 3) {
  if (og == null) return null
  return og - (og - 1) * fraction
}

export function daysBetween(from, to = new Date()) {
  if (!from) return null
  const start = from instanceof Date ? from : new Date(from)
  if (Number.isNaN(start.getTime())) return null
  return Math.floor((to - start) / 86_400_000)
}

export function honeyCostPerBottle(cost, bottleCount) {
  if (cost == null || !bottleCount) return null
  return cost / bottleCount
}

export function fmtGravity(sg) {
  return sg == null ? '—' : sg.toFixed(3)
}

export function fmtAbv(value) {
  return value == null ? '—' : `${value.toFixed(1)}%`
}

export function fmtTemp(f) {
  return f == null ? '—' : `${Math.round(f)}°F`
}

export function fmtPh(value) {
  return value == null ? '—' : value.toFixed(2)
}
