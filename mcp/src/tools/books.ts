import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Env, ok, err } from "../index.js";

export function registerBookTools(server: McpServer, supabase: SupabaseClient, env: Env) {
  server.tool(
    "list_books",
    "List all books in the library (title, author, status, rating, genre)",
    {},
    async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, status, rating, genre, date_finished")
        .eq("user_id", env.USER_ID)
        .order("created_at", { ascending: false });

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "get_book",
    "Get full details of a book by its ID",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .eq("user_id", env.USER_ID)
        .single();

      if (error) return err(error.message);
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "add_book",
    "Add a new book manually to the library",
    {
      title:         z.string().min(1),
      author:        z.string().min(1),
      status:        z.enum(["unread", "reading", "read", "dnf", "lent_out"]),
      isbn:          z.string().optional(),
      cover_url:     z.string().url().optional(),
      genre:         z.array(z.string()).optional(),
      page_count:    z.number().int().positive().optional(),
      rating:        z.number().int().min(1).max(5).optional(),
      date_started:  z.string().optional(),
      date_finished: z.string().optional(),
      lent_to:       z.string().optional(),
      notes:         z.string().optional(),
      source_url:    z.string().url().optional(),
    },
    async (fields) => {
      const { data, error } = await supabase
        .from("books")
        .insert({ ...fields, user_id: env.USER_ID })
        .select("id, title")
        .single();

      if (error) return err(error.message);
      return ok(`Saved "${data.title}" (id: ${data.id})`);
    }
  );

  server.tool(
    "lookup_book_by_isbn",
    "Look up a book by ISBN via Open Library and add it to the library",
    {
      isbn:   z.string().min(1),
      status: z.enum(["unread", "reading", "read", "dnf", "lent_out"]).default("unread"),
    },
    async ({ isbn, status }) => {
      const lookupRes = await fetch(`${env.SUPABASE_URL}/functions/v1/lookup-book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ isbn }),
      });

      if (!lookupRes.ok) {
        const body = await lookupRes.json().catch(() => ({ error: lookupRes.statusText })) as { error?: string };
        return err(body.error ?? `Lookup failed (${lookupRes.status})`);
      }

      const book = await lookupRes.json() as {
        title: string | null;
        author: string | null;
        cover_url: string | null;
        page_count: number | null;
        source_url: string | null;
        error?: string;
      };

      if (book.error) return err(book.error);
      if (!book.title || !book.author) return err("Incomplete book data returned from Open Library");

      const { data, error } = await supabase
        .from("books")
        .insert({
          user_id:    env.USER_ID,
          title:      book.title,
          author:     book.author,
          cover_url:  book.cover_url ?? null,
          page_count: book.page_count ?? null,
          source_url: book.source_url ?? null,
          isbn,
          status,
          genre:      [],
        })
        .select("id, title")
        .single();

      if (error) return err(error.message);
      return ok(`Saved "${data.title}" (id: ${data.id})`);
    }
  );

  server.tool(
    "update_book",
    "Update a book by ID — only the fields you provide are changed (commonly used to change status or rating)",
    {
      id:            z.string().uuid(),
      title:         z.string().min(1).optional(),
      author:        z.string().min(1).optional(),
      status:        z.enum(["unread", "reading", "read", "dnf", "lent_out"]).optional(),
      isbn:          z.string().optional(),
      cover_url:     z.string().url().optional(),
      genre:         z.array(z.string()).optional(),
      page_count:    z.number().int().positive().optional(),
      rating:        z.number().int().min(1).max(5).optional(),
      date_started:  z.string().optional(),
      date_finished: z.string().optional(),
      lent_to:       z.string().optional(),
      notes:         z.string().optional(),
      source_url:    z.string().url().optional(),
    },
    async ({ id, ...fields }) => {
      const updates = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      );

      if (Object.keys(updates).length === 0) return err("No fields provided to update");

      const { error } = await supabase
        .from("books")
        .update(updates)
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Book updated.");
    }
  );

  server.tool(
    "delete_book",
    "Delete a book by its ID",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Book deleted.");
    }
  );
}
