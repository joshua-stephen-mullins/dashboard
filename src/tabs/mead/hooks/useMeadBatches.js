import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

async function fetchBatches() {
  const { data, error } = await supabase
    .from('mead_batches')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function useMeadBatches() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['mead_batches'] })

  const query = useQuery({
    queryKey: ['mead_batches'],
    queryFn: fetchBatches,
  })

  const add = useMutation({
    mutationFn: async (batch) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('mead_batches')
        .insert({ ...batch, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const { error } = await supabase.from('mead_batches').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('mead_batches').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { ...query, add, update, remove }
}
