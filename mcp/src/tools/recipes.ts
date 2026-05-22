import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Env, ok, err } from "../index.js";

export function registerRecipeTools(server: McpServer, supabase: SupabaseClient, env: Env) {
  server.tool(
    "list_recipes",
    "List all saved recipes with name, tags, cook time, and servings",
    {},
    async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("id, name, tags, cook_time, servings, source_url")
        .eq("user_id", env.USER_ID)
        .order("created_at", { ascending: false });

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "get_recipe",
    "Get full details of a recipe by its ID",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .eq("user_id", env.USER_ID)
        .single();

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "import_recipe",
    "Import a recipe from a URL — parses the page and saves it to the recipe collection",
    { url: z.string().url() },
    async ({ url }) => {
      const parseRes = await fetch(`${env.SUPABASE_URL}/functions/v1/parse-recipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!parseRes.ok) {
        return err(`Failed to parse recipe: ${await parseRes.text()}`);
      }

      const parsed = await parseRes.json() as {
        name: string;
        ingredients: unknown;
        instructions: string;
        cook_time: string;
        servings: number;
        image_url: string | null;
      };

      const { data, error } = await supabase
        .from("recipes")
        .insert({
          user_id: env.USER_ID,
          name: parsed.name,
          ingredients: parsed.ingredients,
          instructions: parsed.instructions,
          cook_time: parsed.cook_time,
          servings: parsed.servings,
          image_url: parsed.image_url ?? null,
          source_url: url,
          tags: [],
        })
        .select("id, name")
        .single();

      if (error) return err(error.message);
      return ok(`Saved "${data.name}" (id: ${data.id})`);
    }
  );

  server.tool(
    "update_recipe",
    "Update fields on an existing recipe by its ID — all fields except id are optional",
    {
      id: z.string().uuid(),
      name: z.string().optional(),
      ingredients: z.unknown().optional(),
      instructions: z.string().optional(),
      tags: z.array(z.string()).optional(),
      servings: z.number().int().positive().optional(),
      cook_time: z.string().optional(),
      source_url: z.string().url().optional().nullable(),
      image_url: z.string().url().optional().nullable(),
    },
    async ({ id, ...fields }) => {
      const updates = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      );

      if (Object.keys(updates).length === 0) {
        return err("No fields provided to update.");
      }

      const { data, error } = await supabase
        .from("recipes")
        .update(updates)
        .eq("id", id)
        .eq("user_id", env.USER_ID)
        .select("id, name")
        .single();

      if (error) return err(error.message);
      return ok(`Updated "${data.name}" (id: ${data.id})`);
    }
  );

  server.tool(
    "delete_recipe",
    "Delete a recipe by its ID",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Recipe deleted.");
    }
  );
}
