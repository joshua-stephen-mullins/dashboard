import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Env, ok, err } from "../index.js";

export function registerStockTools(server: McpServer, supabase: SupabaseClient, env: Env) {
  server.tool(
    "list_holdings",
    "List all stock portfolio holdings with ticker, company name, shares, and average cost",
    {},
    async () => {
      const { data, error } = await supabase
        .from("stocks_holdings")
        .select("id, ticker, company_name, shares, avg_cost")
        .eq("user_id", env.USER_ID)
        .order("ticker");

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "add_holding",
    "Add a new stock holding to the portfolio",
    {
      ticker: z.string().min(1).toUpperCase(),
      company_name: z.string().min(1),
      shares: z.number().positive(),
      avg_cost: z.number().positive(),
    },
    async ({ ticker, company_name, shares, avg_cost }) => {
      const { data, error } = await supabase
        .from("stocks_holdings")
        .insert({ user_id: env.USER_ID, ticker, company_name, shares, avg_cost })
        .select("id, ticker")
        .single();

      if (error) return err(error.message);
      return ok(`Added ${data.ticker} (id: ${data.id})`);
    }
  );

  server.tool(
    "update_holding",
    "Update shares or average cost for an existing holding by its ID",
    {
      id: z.string().uuid(),
      shares: z.number().positive().optional(),
      avg_cost: z.number().positive().optional(),
    },
    async ({ id, shares, avg_cost }) => {
      const updates: Record<string, number> = {};
      if (shares !== undefined) updates.shares = shares;
      if (avg_cost !== undefined) updates.avg_cost = avg_cost;

      if (Object.keys(updates).length === 0) {
        return err("Provide at least one of: shares, avg_cost");
      }

      const { error } = await supabase
        .from("stocks_holdings")
        .update(updates)
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Holding updated.");
    }
  );

  server.tool(
    "delete_holding",
    "Remove a stock holding from the portfolio by its ID",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { error } = await supabase
        .from("stocks_holdings")
        .delete()
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Holding deleted.");
    }
  );
}
