import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

async function fetchEvents() {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export function useEvents() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['calendar_events'],
    queryFn: fetchEvents,
  })

  const add = useMutation({
    mutationFn: async (event) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('calendar_events').insert({ ...event, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  })

  const update = useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const { error } = await supabase.from('calendar_events').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  })

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  })

  return { ...query, add, update, remove }
}
