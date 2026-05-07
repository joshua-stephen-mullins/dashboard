import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Env, ok, err } from "../index.js";

const FOOTBALL_BASE = "https://v3.football.api-sports.io";

async function fetchFixtures(teamId: number, apiKey: string) {
  const res = await fetch(`${FOOTBALL_BASE}/fixtures?team=${teamId}&next=7`, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
  const json = await res.json() as { response: unknown[] };
  return json.response;
}

export function registerFixtureTools(server: McpServer, supabase: SupabaseClient, env: Env) {
  server.tool(
    "list_followed_teams",
    "List all soccer teams the user is currently following",
    {},
    async () => {
      const { data, error } = await supabase
        .from("soccer_followed_teams")
        .select("id, team_id, team_name, league")
        .eq("user_id", env.USER_ID)
        .order("team_name");

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "list_followed_players",
    "List all soccer players the user is currently following",
    {},
    async () => {
      const { data, error } = await supabase
        .from("soccer_followed_players")
        .select("id, player_id, player_name, team_name")
        .eq("user_id", env.USER_ID)
        .order("player_name");

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "get_fixtures",
    "Get upcoming fixtures (next 7 days) for all followed teams and players",
    {},
    async () => {
      const [teamsRes, playersRes] = await Promise.all([
        supabase
          .from("soccer_followed_teams")
          .select("team_id, team_name")
          .eq("user_id", env.USER_ID),
        supabase
          .from("soccer_followed_players")
          .select("team_id, player_name")
          .eq("user_id", env.USER_ID)
          .not("team_id", "is", null),
      ]);

      if (teamsRes.error) return err(teamsRes.error.message);
      if (playersRes.error) return err(playersRes.error.message);

      const teamIds = new Set<number>([
        ...(teamsRes.data ?? []).map((t) => t.team_id),
        ...(playersRes.data ?? []).map((p) => p.team_id).filter(Boolean),
      ]);

      if (teamIds.size === 0) return ok("No followed teams or players.");

      const allFixtures = await Promise.all(
        [...teamIds].map((id) => fetchFixtures(id, env.FOOTBALL_API_KEY))
      );

      const seen = new Set<number>();
      const deduplicated = allFixtures.flat().filter((f: any) => {
        if (seen.has(f.fixture.id)) return false;
        seen.add(f.fixture.id);
        return true;
      });

      deduplicated.sort((a: any, b: any) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );

      const summary = deduplicated.map((f: any) => ({
        date: f.fixture.date,
        home: f.teams.home.name,
        away: f.teams.away.name,
        league: f.league.name,
        status: f.fixture.status.short,
      }));

      return ok(JSON.stringify(summary, null, 2));
    }
  );

  server.tool(
    "follow_team",
    "Follow a soccer team by their API-Football team ID",
    {
      team_id: z.number().int().positive(),
      team_name: z.string(),
      league: z.string(),
    },
    async ({ team_id, team_name, league }) => {
      const { error } = await supabase
        .from("soccer_followed_teams")
        .insert({ user_id: env.USER_ID, team_id, team_name, league });

      if (error) return err(error.message);
      return ok(`Now following ${team_name}.`);
    }
  );

  server.tool(
    "unfollow_team",
    "Unfollow a soccer team by the row ID returned from list_followed_teams",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { error } = await supabase
        .from("soccer_followed_teams")
        .delete()
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Team unfollowed.");
    }
  );
}
