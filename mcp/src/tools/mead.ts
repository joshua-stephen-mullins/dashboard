import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Env, ok, err } from "../index.js";

const STYLE = z.enum(["traditional", "melomel", "cyser", "pyment", "metheglin", "braggot", "other"]);
const STATUS = z.enum(["planning", "primary", "secondary", "bulk_aging", "bottled", "drinking", "archived"]);
const NITROGEN = z.enum(["low", "medium", "high"]);
const CARBONATION = z.enum(["still", "petillant", "sparkling"]);

const YEAST_FACTORS: Record<string, number> = { low: 0.75, medium: 0.9, high: 1.25 };

// Mirrors src/tabs/mead/utils/calc.js — the same cubic and the same
// 131.25 factor, so the assistant and the UI never disagree.
const sgToBrix = (sg: number) =>
  ((182.4601 * sg - 775.6821) * sg + 1262.7794) * sg - 669.5622;

const abv = (og: number | null, fg: number | null) =>
  og == null || fg == null ? null : (og - fg) * 131.25;

// Matches parsePitchDate in src/tabs/mead/utils/tosna.js. A `date` column
// arrives as "YYYY-MM-DD", which parses as UTC midnight and renders a day
// early west of Greenwich, so anchor it to local midnight instead.
function parsePitchDate(value: string | null): Date | null {
  if (!value) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function registerMeadTools(server: McpServer, supabase: SupabaseClient, env: Env) {
  server.tool(
    "list_mead_batches",
    "List all mead batches (name, style, status, gravities, bottles remaining)",
    { status: STATUS.optional() },
    async ({ status }) => {
      let query = supabase
        .from("mead_batches")
        .select("id, name, style, status, og, fg, brew_date, bottles_remaining, honey_varietal, yeast_strain")
        .eq("user_id", env.USER_ID);

      if (status) query = query.eq("status", status);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) return err(error.message);

      const enriched = (data ?? []).map((b) => ({
        ...b,
        abv: abv(b.og == null ? null : Number(b.og), b.fg == null ? null : Number(b.fg)),
      }));
      return ok(JSON.stringify(enriched, null, 2));
    }
  );

  server.tool(
    "get_mead_batch",
    "Get a mead batch with its full log — readings, nutrient additions, and process events",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { data: batch, error } = await supabase
        .from("mead_batches")
        .select("*")
        .eq("id", id)
        .eq("user_id", env.USER_ID)
        .single();

      if (error) return err(error.message);

      const [readings, additions, events] = await Promise.all([
        supabase.from("mead_readings").select("*").eq("batch_id", id).order("recorded_at"),
        supabase.from("mead_additions").select("*").eq("batch_id", id).order("scheduled_at"),
        supabase.from("mead_events").select("*").eq("batch_id", id).order("occurred_at"),
      ]);

      return ok(JSON.stringify({
        ...batch,
        abv: abv(batch.og == null ? null : Number(batch.og), batch.fg == null ? null : Number(batch.fg)),
        readings: readings.data ?? [],
        additions: additions.data ?? [],
        events: events.data ?? [],
      }, null, 2));
    }
  );

  server.tool(
    "add_mead_batch",
    "Start a new mead batch",
    {
      name:                z.string().min(1),
      style:               STYLE.default("traditional"),
      status:              STATUS.default("planning"),
      batch_number:        z.number().int().positive().optional(),
      vessel:              z.string().optional(),
      carbonation:         CARBONATION.optional(),
      batch_size_gal:      z.number().positive().optional(),
      honey_varietal:      z.string().optional(),
      honey_source:        z.string().optional(),
      honey_lbs:           z.number().positive().optional(),
      honey_cost:          z.number().nonnegative().optional(),
      water_gal:           z.number().positive().optional(),
      yeast_strain:        z.string().optional(),
      yeast_nitrogen_need: NITROGEN.optional(),
      target_og:           z.number().optional(),
      target_abv:          z.number().optional(),
      og:                  z.number().optional(),
      brew_date:           z.string().optional(),
      pitch_date:          z.string().optional(),
      notes:               z.string().optional(),
      tags:                z.array(z.string()).optional(),
    },
    async (fields) => {
      const { data, error } = await supabase
        .from("mead_batches")
        .insert({ ...fields, user_id: env.USER_ID })
        .select("id, name")
        .single();

      if (error) return err(error.message);
      return ok(`Started "${data.name}" (id: ${data.id})`);
    }
  );

  server.tool(
    "update_mead_batch",
    "Update a mead batch by ID — only the fields you provide are changed (commonly status, fg, or bottle counts)",
    {
      id:                  z.string().uuid(),
      name:                z.string().min(1).optional(),
      style:               STYLE.optional(),
      status:              STATUS.optional(),
      vessel:              z.string().optional(),
      carbonation:         CARBONATION.optional(),
      batch_size_gal:      z.number().positive().optional(),
      honey_varietal:      z.string().optional(),
      honey_source:        z.string().optional(),
      honey_lbs:           z.number().positive().optional(),
      honey_cost:          z.number().nonnegative().optional(),
      yeast_strain:        z.string().optional(),
      yeast_nitrogen_need: NITROGEN.optional(),
      og:                  z.number().optional(),
      fg:                  z.number().optional(),
      brew_date:           z.string().optional(),
      pitch_date:          z.string().optional(),
      bottled_date:        z.string().optional(),
      bottle_count:        z.number().int().nonnegative().optional(),
      bottles_remaining:   z.number().int().nonnegative().optional(),
      bottle_size:         z.string().optional(),
      carbonation_method:  z.string().optional(),
      rating:              z.number().int().min(1).max(5).optional(),
      tasting_notes:       z.string().optional(),
      notes:               z.string().optional(),
      tags:                z.array(z.string()).optional(),
    },
    async ({ id, ...fields }) => {
      const updates = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      );

      if (Object.keys(updates).length === 0) return err("No fields provided to update");

      const { error } = await supabase
        .from("mead_batches")
        .update(updates)
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Batch updated.");
    }
  );

  server.tool(
    "delete_mead_batch",
    "Delete a mead batch and its entire log by ID",
    { id: z.string().uuid() },
    async ({ id }) => {
      const { error } = await supabase
        .from("mead_batches")
        .delete()
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (error) return err(error.message);
      return ok("Batch deleted.");
    }
  );

  server.tool(
    "log_mead_reading",
    "Record a fermentation reading (gravity, temperature, pH) for a batch",
    {
      batch_id:      z.string().uuid(),
      gravity:       z.number().optional(),
      temperature_f: z.number().optional(),
      ph:            z.number().optional(),
      degassed:      z.boolean().optional(),
      notes:         z.string().optional(),
      recorded_at:   z.string().optional(),
    },
    async ({ batch_id, recorded_at, ...fields }) => {
      const { error } = await supabase.from("mead_readings").insert({
        ...fields,
        batch_id,
        user_id: env.USER_ID,
        recorded_at: recorded_at ?? new Date().toISOString(),
      });

      if (error) return err(error.message);

      // pH below 3.0 stalls a fermentation, so it is worth saying out loud.
      const warning =
        fields.ph != null && fields.ph < 3.0
          ? " Warning: pH is below 3.0 — fermentation may stall. Consider potassium bicarbonate in 1/2 tsp increments."
          : "";
      return ok(`Reading logged.${warning}`);
    }
  );

  server.tool(
    "log_mead_addition",
    "Record something added to a batch — nutrients, fruit, spice, oak, acid, stabilizer, or backsweetening honey",
    {
      batch_id:            z.string().uuid(),
      product:             z.string().min(1),
      category:            z.enum(["nutrient", "fruit", "spice", "oak", "acid", "stabilizer", "honey", "other"]).default("other"),
      amount:              z.number().optional(),
      unit:                z.string().optional(),
      gravity_at_addition: z.number().optional(),
      notes:               z.string().optional(),
      added_at:            z.string().optional(),
    },
    async ({ batch_id, added_at, ...fields }) => {
      const { error } = await supabase.from("mead_additions").insert({
        ...fields,
        batch_id,
        user_id: env.USER_ID,
        added_at: added_at ?? new Date().toISOString(),
      });

      if (error) return err(error.message);
      return ok("Addition logged.");
    }
  );

  server.tool(
    "log_mead_event",
    "Record a process milestone — racking, degassing, stabilizing, backsweetening, fining, cold crashing, or bottling",
    {
      batch_id:    z.string().uuid(),
      event_type:  z.enum(["rack", "degas", "stabilize", "backsweeten", "fining", "oak", "cold_crash", "bottle", "taste", "other"]),
      gravity:     z.number().optional(),
      volume_lost: z.number().optional(),
      notes:       z.string().optional(),
      occurred_at: z.string().optional(),
    },
    async ({ batch_id, occurred_at, ...fields }) => {
      const { error } = await supabase.from("mead_events").insert({
        ...fields,
        batch_id,
        user_id: env.USER_ID,
        occurred_at: occurred_at ?? new Date().toISOString(),
      });

      if (error) return err(error.message);
      return ok("Event logged.");
    }
  );

  server.tool(
    "mead_tosna_schedule",
    "Calculate the TOSNA 3.0 Fermaid-O nutrient schedule for a batch, and optionally save the four doses to its log",
    {
      batch_id: z.string().uuid(),
      save:     z.boolean().default(false),
    },
    async ({ batch_id, save }) => {
      const { data: batch, error } = await supabase
        .from("mead_batches")
        .select("id, name, og, batch_size_gal, yeast_nitrogen_need, pitch_date")
        .eq("id", batch_id)
        .eq("user_id", env.USER_ID)
        .single();

      if (error) return err(error.message);

      const og = batch.og == null ? null : Number(batch.og);
      const gallons = batch.batch_size_gal == null ? null : Number(batch.batch_size_gal);
      const factor = YEAST_FACTORS[batch.yeast_nitrogen_need ?? "medium"];

      if (og == null || !gallons) {
        return err("The batch needs both an original gravity and a batch size before TOSNA can be calculated.");
      }

      const brix = sgToBrix(og);
      if (brix <= 0) return err("Original gravity is at or below water — nothing to ferment.");

      const total = (brix * 10 * gallons * factor) / 50;
      const perDose = total / 4;
      const sugarBreak = og - (og - 1) / 3;

      const pitch = parsePitchDate(batch.pitch_date);
      const at = (hours: number) =>
        pitch ? new Date(pitch.getTime() + hours * 3_600_000).toISOString() : null;

      const doses = [
        { dose_number: 1, scheduled_at: at(24),      trigger: "24h after pitch",  gravity_at_addition: null },
        { dose_number: 2, scheduled_at: at(48),      trigger: "48h after pitch",  gravity_at_addition: null },
        { dose_number: 3, scheduled_at: at(72),      trigger: "72h after pitch",  gravity_at_addition: null },
        { dose_number: 4, scheduled_at: at(24 * 7),  trigger: "1/3 sugar break, or day 7 — whichever comes first", gravity_at_addition: sugarBreak },
      ];

      if (save) {
        const { error: insertError } = await supabase.from("mead_additions").insert(
          doses.map((d) => ({
            user_id: env.USER_ID,
            batch_id,
            category: "nutrient",
            product: "Fermaid-O",
            amount: Number(perDose.toFixed(3)),
            unit: "g",
            dose_number: d.dose_number,
            scheduled_at: d.scheduled_at,
            gravity_at_addition: d.gravity_at_addition,
            notes: d.trigger,
          }))
        );
        if (insertError) return err(insertError.message);
      }

      return ok(JSON.stringify({
        batch: batch.name,
        og,
        brix: Number(brix.toFixed(2)),
        batch_size_gal: gallons,
        yeast_nitrogen_need: batch.yeast_nitrogen_need ?? "medium",
        yeast_factor: factor,
        total_fermaid_o_grams: Number(total.toFixed(2)),
        per_dose_grams: Number(perDose.toFixed(2)),
        one_third_sugar_break: Number(sugarBreak.toFixed(3)),
        doses,
        saved: save,
      }, null, 2));
    }
  );

  server.tool(
    "mead_doses_due",
    "List nutrient doses that are due now across all batches — past their scheduled time or past their gravity trigger",
    {},
    async () => {
      const { data, error } = await supabase
        .from("mead_additions")
        .select("id, batch_id, dose_number, product, amount, unit, scheduled_at, gravity_at_addition, mead_batches(name, status)")
        .eq("user_id", env.USER_ID)
        .eq("category", "nutrient")
        .is("added_at", null)
        .lte("scheduled_at", new Date().toISOString())
        .order("scheduled_at");

      if (error) return err(error.message);
      if (!data?.length) return ok("No nutrient doses are due.");
      return ok(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    "drink_mead_bottle",
    "Decrement the remaining bottle count for a batch after drinking or gifting one",
    {
      id:    z.string().uuid(),
      count: z.number().int().positive().default(1),
    },
    async ({ id, count }) => {
      const { data: batch, error } = await supabase
        .from("mead_batches")
        .select("name, bottles_remaining")
        .eq("id", id)
        .eq("user_id", env.USER_ID)
        .single();

      if (error) return err(error.message);
      if (batch.bottles_remaining == null) return err("This batch has no bottle count set.");

      const remaining = Math.max(0, batch.bottles_remaining - count);
      const { error: updateError } = await supabase
        .from("mead_batches")
        .update({ bottles_remaining: remaining })
        .eq("id", id)
        .eq("user_id", env.USER_ID);

      if (updateError) return err(updateError.message);
      return ok(`${remaining} bottle${remaining === 1 ? "" : "s"} of "${batch.name}" left.`);
    }
  );
}
