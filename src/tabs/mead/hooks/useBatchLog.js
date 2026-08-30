import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

// The three child tables all hang off a batch and are always read
// together, so one hook fetches all of them and exposes a mutation per
// table. Each mutation invalidates only its own list.
const TABLES = {
  readings:  { table: 'mead_readings',  orderBy: 'recorded_at' },
  additions: { table: 'mead_additions', orderBy: 'scheduled_at' },
  events:    { table: 'mead_events',    orderBy: 'occurred_at' },
}

async function fetchChild(table, orderBy, batchId) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('batch_id', batchId)
    .order(orderBy, { ascending: true })
  if (error) throw error
  return data
}

function useChild(key, batchId) {
  const { table, orderBy } = TABLES[key]
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['mead', key, batchId] })

  const query = useQuery({
    queryKey: ['mead', key, batchId],
    queryFn: () => fetchChild(table, orderBy, batchId),
    enabled: Boolean(batchId),
  })

  const add = useMutation({
    mutationFn: async (row) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from(table)
        .insert({ ...row, batch_id: batchId, user_id: user.id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  // Nutrient schedules are written four rows at a time.
  const addMany = useMutation({
    mutationFn: async (rows) => {
      if (!rows.length) return
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from(table)
        .insert(rows.map((r) => ({ ...r, batch_id: batchId, user_id: user.id })))
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const { error } = await supabase.from(table).update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { ...query, add, addMany, update, remove }
}

export function useBatchLog(batchId) {
  return {
    readings:  useChild('readings', batchId),
    additions: useChild('additions', batchId),
    events:    useChild('events', batchId),
  }
}
