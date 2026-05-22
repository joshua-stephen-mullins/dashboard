import { supabase } from '../../../lib/supabase'

export async function lookupBook(isbn) {
  const { data, error } = await supabase.functions.invoke('lookup-book', {
    body: { isbn: isbn.trim() },
  })
  if (error) {
    const body = await error.context?.json?.().catch(() => null)
    throw new Error(body?.error ?? error.message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}
