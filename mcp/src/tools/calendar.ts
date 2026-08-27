import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Env, ok, err } from "../index.js";

const COLOR_VALUES = ["blue", "green", "amber", "red", "teal", "purple", "orange", "pink"] as const;

export function registerCalendarTools(server: McpServer, supabase: SupabaseClient, env: Env) {
  server.tool(
    "list_events",
    "List calendar events within a date range (ISO dates: YYYY-MM-DD), optionally filtered by category or to incomplete items only",
    {
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      category_id: z.string().uuid().optional(),
      only_incomplete: z.boolean().optional(),
    },
    async ({ from, to, category_id, only_incomplete }) => {
      let query = supabase
        .from("calendar_events")
        .select("id, title, date, end_date, start_time, end_time, location, color, category_id, course, completed, notes")
        .eq("user_id", env.USER_ID)
        .gte("date", from)
        .lte("date", to);

      if (category_id) query = query.eq("category_id", category_id);
      if (only_incomplete) query = query.eq("completed", false);

      const { data, error } = await query
        .order("date")
        .order("start_time", { nullsFirst: true });

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "add_event",
    "Add a new calendar event. Pass category_id to file it under a category (see list_event_categories) — the category supplies the display color. course/completed only apply to coursework categories.",
    {
      title: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      location: z.string().optional(),
      color: z.enum(COLOR_VALUES).default("blue"),
      category_id: z.string().uuid().optional(),
      course: z.string().optional(),
      completed: z.boolean().optional(),
      notes: z.string().optional(),
    },
    async ({ title, date, end_date, start_time, end_time, location, color, category_id, course, completed, notes }) => {
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
          category_id: category_id ?? null,
          course: course ?? null,
          completed: completed ?? false,
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
      category_id: z.string().uuid().nullable().optional(),
      course: z.string().nullable().optional(),
      completed: z.boolean().optional(),
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

  server.tool(
    "list_event_categories",
    "List the calendar's event categories (School, Mead, Personal, …) with their colors and coursework flag",
    {},
    async () => {
      const { data, error } = await supabase
        .from("event_categories")
        .select("id, name, color, is_coursework, sort_order")
        .eq("user_id", env.USER_ID)
        .order("sort_order")
        .order("name");

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "add_event_category",
    "Create a new calendar event category",
    {
      name: z.string().min(1),
      color: z.enum(COLOR_VALUES).default("blue"),
      is_coursework: z.boolean().default(false),
    },
    async ({ name, color, is_coursework }) => {
      const { data, error } = await supabase
        .from("event_categories")
        .insert({ user_id: env.USER_ID, name, color, is_coursework })
        .select("id, name")
        .single();

      if (error) return err(error.message);
      return ok(`Created category "${data.name}" (id: ${data.id})`);
    }
  );

  server.tool(
    "update_event_category",
    "Update a calendar event category by its ID — only provided fields are changed",
    {
      id: z.string().uuid(),
      name: z.string().min(1).optional(),
      color: z.enum(COLOR_VALUES).optional(),
      is_coursework: z.boolean().optional(),
      sort_order: z.number().int().optional(),
    },
    async ({ id, ...fields }) => {
      const updates = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      );

      if (Object.keys(updates).length === 0) {
        return err("Provide at least one field to update");
      }

      const { error } = await supabase
        .from("event_categories")
        .update(updates)
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Category updated.");
    }
  );

  server.tool(
    "delete_event_category",
    "Delete a calendar event category by its ID. Its events are kept and become uncategorized.",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { error } = await supabase
        .from("event_categories")
        .delete()
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Category deleted. Its events are now uncategorized.");
    }
  );
}
