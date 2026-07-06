import { config } from "dotenv";
config({ path: ".env.local" });

import { loadBelediyeSources } from "../lib/ingest/belediye-sources";
import { scrapeBelediyePlaces } from "../lib/ingest/belediye-scraper";
import {
  bridgeBelediyePlacesToSupabase,
  createBelediyeBridgeClient,
} from "../lib/ingest/belediye-bridge";

const DELAY_MS = parseInt(process.env.DELAY_MS || "2500");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const cityArg = args.find((a) => a.startsWith("--city="))?.split("=")[1];
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    city: cityArg,
  };
}

async function main() {
  const opts = parseArgs();
  console.log("=== Belediye Gezilecek Yerler Tarayıcı ===");
  console.log(
    `Mod: ${opts.dryRun ? "dry-run" : "yazma"} | force=${opts.force}`
  );

  let sources = loadBelediyeSources();
  if (opts.city) {
    sources = sources.filter((source) => source.slug === opts.city);
    if (sources.length === 0) {
      console.error("Şehir bulunamadı:", opts.city);
      process.exit(1);
    }
  }

  const db = opts.dryRun ? null : createBelediyeBridgeClient();

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    console.log(
      `\n[${i + 1}/${sources.length}] ${source.name} — ${source.baseUrl}`
    );

    try {
      const places = await scrapeBelediyePlaces(source, {
        onListUrl: (url) => console.log(`  Liste: ${url}`),
      });

      console.log(`  ${places.length} aday mekan`);
      for (const place of places) {
        console.log(`    • ${place.name} (${place.slug})`);
      }

      if (!db) {
        console.log(`  dry-run: ${places.length} mekan yazılmadı`);
      } else {
        const result = await bridgeBelediyePlacesToSupabase(
          db,
          source.slug,
          places,
          { force: opts.force, dryRun: false }
        );
        console.log(`  → ${result.status}: ${result.message}`);
      }
    } catch (error) {
      console.error(
        "  Hata:",
        error instanceof Error ? error.message : error
      );
    }

    if (i < sources.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log("\nTamamlandı.");
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
