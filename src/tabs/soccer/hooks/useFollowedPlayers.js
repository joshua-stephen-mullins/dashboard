import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

async function fetchFollowedPlayers() {
  const { data, error } = await supabase
    .from('soccer_followed_players')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export function useFollowedPlayers() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['soccer_followed_players'],
    queryFn: fetchFollowedPlayers,
  })

  const follow = useMutation({
    mutationFn: async ({ player_id, player_name, team_name, team_id, photo_url }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('soccer_followed_players')
        .insert({ user_id: user.id, player_id, player_name, team_name, team_id, photo_url })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soccer_followed_players'] }),
  })

  const unfollow = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('soccer_followed_players')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soccer_followed_players'] }),
  })

  return { ...query, follow, unfollow }
}
