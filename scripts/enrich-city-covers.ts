import { createClient } from "@supabase/supabase-js";
import { suggestAndApplyCityCover } from "../lib/ingest/apply-city-cover";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DELAY_MS = parseInt(process.env.DELAY_MS || "1200");

type CityRow = {
  id: string;
  name: string;
  slug: string;
  cover_image: string | null;
  cover_image_source?: string | null;
  cover_image_locked?: boolean | null;
  wikidata_id?: string | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const replaceSource = args
    .find((a) => a.startsWith("--replace-source="))
    ?.split("=")[1];
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    replaceSource: replaceSource || null,
    city: args.find((a) => a.startsWith("--city="))?.split("=")[1],
  };
}

async function fetchCities(opts: ReturnType<typeof parseArgs>): Promise<{
  cities: CityRow[];
  error?: string;
}> {
  const selectWithMeta =
    "id, name, slug, cover_image, cover_image_source, cover_image_locked, wikidata_id";

  let query = supabase
    .from("cities")
    .select(selectWithMeta)
    .eq("is_active", true)
    .order("name");

  if (opts.city) {
    query = query.eq("slug", opts.city);
  } else if (opts.replaceSource) {
    query = query.eq("cover_image_source", opts.replaceSource);
  } else if (!opts.force) {
    query = query.is("cover_image", null);
  }

  const { data, error } = await query;

  if (!error) {
    return { cities: (data || []) as CityRow[] };
  }

  if (!error.message.includes("cover_image_source")) {
    return { cities: [], error: error.message };
  }

  let fallbackQuery = supabase
    .from("cities")
    .select("id, name, slug, cover_image, wikidata_id")
    .eq("is_active", true)
    .order("name");

  if (opts.city) {
    fallbackQuery = fallbackQuery.eq("slug", opts.city);
  } else if (!opts.force) {
    fallbackQuery = fallbackQuery.is("cover_image", null);
  }

  const fallback = await fallbackQuery;
  if (fallback.error) {
    return { cities: [], error: fallback.error.message };
  }

  return { cities: (fallback.data || []) as CityRow[] };
}

function shouldProcessCity(city: CityRow, opts: ReturnType<typeof parseArgs>): boolean {
  if (city.cover_image_locked) return false;
  if (opts.replaceSource && city.cover_image_source !== opts.replaceSource) {
    return false;
  }
  if (!opts.force && !opts.replaceSource && city.cover_image) {
    return false;
  }
  return true;
}

async function main() {
  const opts = parseArgs();
  console.log("=== Şehir Kapak Görseli Zenginleştirme ===\n");
  console.log(
    `Mod: ${opts.dryRun ? "dry-run" : "yazma"} | force=${opts.force} | replace-source=${opts.replaceSource || "yok"}`
  );

  const { cities, error } = await fetchCities(opts);
  if (error) {
    console.error("Veritabanı hatası:", error);
    return;
  }

  const targets = cities.filter((city) => shouldProcessCity(city, opts));
  console.log(`${targets.length} şehir işlenecek...\n`);

  let enriched = 0;
  let skipped = 0;

  for (const city of targets) {
    process.stdout.write(`[${city.name}]... `);

    if (city.cover_image_locked) {
      console.log("ATLADI (kilitli)");
      skipped++;
      continue;
    }

    if (opts.dryRun) {
      const preview = await suggestAndApplyCityCover(city.slug, { apply: false });
      console.log(
        `OK [dry-run] ${preview.source || "yok"}${preview.note ? ` (${preview.note})` : ""}`
      );
      enriched++;
      await sleep(DELAY_MS);
      continue;
    }

    const result = await suggestAndApplyCityCover(city.slug, { apply: true });

    if (result.status === "skipped") {
      console.log(`ATLADI (${result.message})`);
      skipped++;
    } else if (result.status === "error") {
      console.log(`HATA: ${result.message}`);
      skipped++;
    } else {
      console.log(`OK +kapak (${result.source})`);
      enriched++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n=== Tamamlandı ===`);
  console.log(`Kapak eklenen: ${enriched}`);
  console.log(`Atılan: ${skipped}`);
}

main().catch(console.error);
