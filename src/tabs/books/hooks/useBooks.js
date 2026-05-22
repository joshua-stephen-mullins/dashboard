import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

async function fetchBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function useBooks() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
  })

  const add = useMutation({
    mutationFn: async (book) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('books').insert({ ...book, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  })

  const update = useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const { error } = await supabase.from('books').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  })

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('books').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  })

  return { ...query, add, update, remove }
}
