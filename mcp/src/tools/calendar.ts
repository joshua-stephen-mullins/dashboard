import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Env, ok, err } from "../index.js";

const COLOR_VALUES = ["blue", "green", "amber", "red", "teal", "purple", "orange", "pink"] as const;

export function registerCalendarTools(server: McpServer, supabase: SupabaseClient, env: Env) {
  server.tool(
    "list_events",
    "List calendar events within a date range (ISO dates: YYYY-MM-DD)",
    {
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    },
    async ({ from, to }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, title, date, end_date, start_time, end_time, location, color, notes")
        .eq("user_id", env.USER_ID)
        .gte("date", from)
        .lte("date", to)
        .order("date")
        .order("start_time", { nullsFirst: true });

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "add_event",
    "Add a new calendar event",
    {
      title: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      location: z.string().optional(),
      color: z.enum(COLOR_VALUES).default("blue"),
      notes: z.string().optional(),
    },
    async ({ title, date, end_date, start_time, end_time, location, color, notes }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          user_id: env.USER_ID,
          title,
          date,
          end_date: end_date ?? null,
          start_time: start_time ?? null,
          end_time: end_time ?? null,
          location: location ?? null,
          color,
          notes: notes ?? null,
        })
        .select("id, title, date")
        .single();

      if (error) return err(error.message);
      return ok(`Created "${data.title}" on ${data.date} (id: ${data.id})`);
    }
  );

  server.tool(
    "update_event",
    "Update an existing calendar event by its ID — only provided fields are changed",
    {
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      location: z.string().nullable().optional(),
      color: z.enum(COLOR_VALUES).optional(),
      notes: z.string().nullable().optional(),
    },
    async ({ id, ...fields }) => {
      const updates = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      );

      if (Object.keys(updates).length === 0) {
        return err("Provide at least one field to update");
      }

      const { error } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Event updated.");
    }
  );

  server.tool(
    "delete_event",
    "Delete a calendar event by its ID",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Event deleted.");
    }
  );
}
