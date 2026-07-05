import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { buildTemplateMeta, generateMeta } from "../lib/content/generate-meta";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const useAi = process.argv.includes("--ai");

async function metaFor(
  type: "place" | "city" | "event",
  args: { name: string; cityName?: string; description?: string | null }
) {
  if (useAi) return generateMeta({ type, ...args });
  return buildTemplateMeta({ type, ...args });
}

async function backfillPlaces(): Promise<number> {
  const { data, error } = await supabase
    .from("places")
    .select("id, name, description, meta_title, meta_description, cities(name)")
    .or("meta_title.is.null,meta_description.is.null");

  if (error) {
    console.error("places:", error.message);
    return 0;
  }

  let count = 0;
  for (const place of data || []) {
    const cities = place.cities as { name: string }[] | { name: string } | null;
    const cityName = Array.isArray(cities) ? cities[0]?.name : cities?.name;

    const meta = await metaFor("place", {
      name: place.name,
      cityName,
      description: place.description,
    });

    const { error: upErr } = await supabase
      .from("places")
      .update({
        meta_title: place.meta_title || meta.meta_title,
        meta_description: place.meta_description || meta.meta_description,
      })
      .eq("id", place.id);

    if (!upErr) count++;
  }
  return count;
}

async function backfillCities(): Promise<number> {
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, description, meta_title, meta_description")
    .or("meta_title.is.null,meta_description.is.null");

  if (error) {
    console.error("cities:", error.message);
    return 0;
  }

  let count = 0;
  for (const city of data || []) {
    const meta = await metaFor("city", {
      name: city.name,
      description: city.description,
    });

    const { error: upErr } = await supabase
      .from("cities")
      .update({
        meta_title: city.meta_title || meta.meta_title,
        meta_description: city.meta_description || meta.meta_description,
      })
      .eq("id", city.id);

    if (!upErr) count++;
  }
  return count;
}

async function backfillEvents(): Promise<number> {
  const { data, error } = await supabase
    .from("cultural_events")
    .select("id, title, summary, city_slug, meta_title, meta_description")
    .eq("status", "published")
    .or("meta_title.is.null,meta_description.is.null");

  if (error) {
    console.error("cultural_events:", error.message);
    return 0;
  }

  let count = 0;
  for (const event of data || []) {
    const meta = await metaFor("event", {
      name: event.title,
      cityName: event.city_slug || undefined,
      description: event.summary,
    });

    const { error: upErr } = await supabase
      .from("cultural_events")
      .update({
        meta_title: event.meta_title || meta.meta_title,
        meta_description: event.meta_description || meta.meta_description,
      })
      .eq("id", event.id);

    if (!upErr) count++;
  }
  return count;
}

async function main() {
  console.log(`=== Meta Backfill (${useAi ? "AI" : "şablon"}) ===\n`);

  const places = await backfillPlaces();
  console.log(`Mekan: ${places} güncellendi`);

  const cities = await backfillCities();
  console.log(`Şehir: ${cities} güncellendi`);

  const events = await backfillEvents();
  console.log(`Etkinlik: ${events} güncellendi`);

  console.log("\n=== Tamamlandı ===");
}

main().catch(console.error);
