import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

async function fetchRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function useRecipes() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
  })

  const add = useMutation({
    mutationFn: async (recipe) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('recipes').insert({ ...recipe, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })

  const update = useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const { error } = await supabase.from('recipes').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })

  return { ...query, add, update, remove }
}
