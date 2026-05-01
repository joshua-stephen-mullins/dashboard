import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

async function fetchHoldings() {
  const { data, error } = await supabase
    .from('stocks_holdings')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export function useHoldings() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['stocks_holdings'],
    queryFn: fetchHoldings,
  })

  const add = useMutation({
    mutationFn: async (holding) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('stocks_holdings').insert({ ...holding, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stocks_holdings'] }),
  })

  const update = useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const { error } = await supabase.from('stocks_holdings').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stocks_holdings'] }),
  })

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('stocks_holdings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stocks_holdings'] }),
  })

  return { ...query, add, update, remove }
}
