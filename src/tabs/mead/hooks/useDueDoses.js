import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { dueDoses } from '../utils/filters'

// Counts nutrient doses that are actually due across every batch.
//
// A dose can come due two ways — its scheduled time passing, or the batch
// dropping to its trigger gravity — and the gravity case is relative to that
// batch's own latest reading. So this pulls the pending doses and the most
// recent gravity per batch, then evaluates each batch separately.
async function fetchDueDoseCount() {
  const [pending, gravities] = await Promise.all([
    supabase
      .from('mead_additions')
      .select('id, batch_id, category, scheduled_at, added_at, gravity_at_addition')
      .eq('category', 'nutrient')
      .is('added_at', null),
    supabase
      .from('mead_readings')
      .select('batch_id, gravity, recorded_at')
      .not('gravity', 'is', null)
      .order('recorded_at', { ascending: false }),
  ])

  if (pending.error) throw pending.error
  if (gravities.error) throw gravities.error

  // Ordered newest first, so the first row seen for a batch is its latest.
  const latestGravity = new Map()
  for (const r of gravities.data ?? []) {
    if (!latestGravity.has(r.batch_id)) latestGravity.set(r.batch_id, Number(r.gravity))
  }

  const byBatch = new Map()
  for (const dose of pending.data ?? []) {
    if (!byBatch.has(dose.batch_id)) byBatch.set(dose.batch_id, [])
    byBatch.get(dose.batch_id).push(dose)
  }

  let count = 0
  for (const [batchId, doses] of byBatch) {
    count += dueDoses(doses, latestGravity.get(batchId) ?? null).length
  }
  return count
}

export function useDueDoses() {
  return useQuery({
    queryKey: ['mead_due_doses'],
    queryFn: fetchDueDoseCount,
  })
}
