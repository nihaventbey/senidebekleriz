import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { applyCityDescription } from "../lib/ingest/apply-city-description";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DELAY_MS = parseInt(process.env.DELAY_MS || "1200");

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
    all: args.includes("--all"),
  };
}

async function fetchSlugs(
  opts: ReturnType<typeof parseArgs>
): Promise<{ slugs: string[]; error?: string }> {
  let query = supabase
    .from("cities")
    .select("slug, description_source, intro_source_url")
    .eq("is_active", true)
    .order("name");

  if (opts.city) {
    query = query.eq("slug", opts.city);
  } else if (opts.replaceSource === "valilik") {
    query = query.or(
      "description_source.eq.valilik,and(description_source.is.null,intro_source_url.not.is.null)"
    );
  } else if (!opts.all && !opts.force) {
    query = query.or("description.is.null,description.eq.");
  }

  const { data, error } = await query;

  if (error) {
    if (
      error.message.includes("description_source") ||
      error.message.includes("intro_source_url")
    ) {
      const fallback = await supabase
        .from("cities")
        .select("slug")
        .eq("is_active", true)
        .order("name");
      if (fallback.error) {
        return { slugs: [], error: fallback.error.message };
      }
      return { slugs: (fallback.data || []).map((c) => c.slug) };
    }
    return { slugs: [], error: error.message };
  }

  return { slugs: (data || []).map((c) => c.slug) };
}

async function main() {
  const opts = parseArgs();
  const { slugs, error } = await fetchSlugs(opts);

  if (error) {
    console.error("Sorgu hatası:", error);
    process.exit(1);
  }

  if (slugs.length === 0) {
    console.log("Güncellenecek şehir bulunamadı.");
    return;
  }

  console.log(
    `${opts.dryRun ? "[dry-run] " : ""}${slugs.length} şehir işlenecek…`
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    if (opts.dryRun) {
      const { suggestCityDescription } = await import(
        "../lib/ingest/apply-city-description"
      );
      const preview = await suggestCityDescription(slug);
      if (preview.status === "success") {
        console.log(`\n--- ${slug} (${preview.source}) ---`);
        console.log(preview.description);
        updated++;
      } else {
        console.log(`${slug}: ${preview.message}`);
        failed++;
      }
    } else {
      const result = await applyCityDescription(slug, {
        apply: true,
        force: opts.force,
      });
      console.log(`${slug}: ${result.message}`);
      if (result.status === "success") updated++;
      else if (result.status === "skipped") skipped++;
      else failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `\nÖzet: ${updated} güncellendi, ${skipped} atlandı, ${failed} hata`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
