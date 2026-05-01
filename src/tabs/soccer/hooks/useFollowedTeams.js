import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

async function fetchFollowedTeams() {
  const { data, error } = await supabase
    .from('soccer_followed_teams')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export function useFollowedTeams() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['soccer_followed_teams'],
    queryFn: fetchFollowedTeams,
  })

  const follow = useMutation({
    mutationFn: async ({ team_id, team_name, league }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('soccer_followed_teams')
        .insert({ user_id: user.id, team_id, team_name, league })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soccer_followed_teams'] }),
  })

  const unfollow = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('soccer_followed_teams')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soccer_followed_teams'] }),
  })

  return { ...query, follow, unfollow }
}
