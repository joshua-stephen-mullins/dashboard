export function filterBatches(batches, { search = '', styles = [], status = null, tags = [] } = {}) {
  const q = search.trim().toLowerCase()

  return batches.filter((b) => {
    if (q) {
      const haystack = [b.name, b.honey_varietal, b.yeast_strain, b.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    if (styles.length && !styles.includes(b.style)) return false
    if (status && b.status !== status) return false
    if (tags.length && !tags.every((t) => (b.tags ?? []).includes(t))) return false

    return true
  })
}

// Doses that are due now: never given, and either past their scheduled
// time or past their gravity trigger.
export function dueDoses(additions, latestGravity = null, now = new Date()) {
  return additions.filter((a) => {
    if (a.added_at) return false
    if (a.category !== 'nutrient') return false

    const timeDue = a.scheduled_at && new Date(a.scheduled_at) <= now
    const gravityDue =
      latestGravity != null &&
      a.gravity_at_addition != null &&
      latestGravity <= a.gravity_at_addition

    return Boolean(timeDue || gravityDue)
  })
}
