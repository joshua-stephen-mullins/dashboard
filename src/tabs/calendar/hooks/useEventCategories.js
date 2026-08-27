import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

async function fetchCategories() {
  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export function useEventCategories() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['event_categories'],
    queryFn: fetchCategories,
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['event_categories'] })
    // Events carry category_id — a deleted category nulls it out server-side.
    qc.invalidateQueries({ queryKey: ['calendar_events'] })
  }

  const add = useMutation({
    mutationFn: async (category) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('event_categories')
        .insert({ ...category, user_id: user.id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const { error } = await supabase.from('event_categories').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('event_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { ...query, add, update, remove }
}
