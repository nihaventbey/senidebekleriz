import { readFileSync } from "fs";
import { join } from "path";
import {
  scrapeValilikIntro,
  type ValilikSource,
} from "../lib/ingest/valilik-scraper";
import {
  bridgeIntroToSupabase,
  createBridgeClient,
} from "../lib/ingest/supabase-bridge";
import { pickCoverImage } from "../lib/ai/pick-cover-image";
import { filterImageCandidatesBySize } from "../lib/ai/extract-page-images";
import { uploadImageFromUrl } from "../lib/storage/upload-image-from-url";

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
    publish: args.includes("--publish"),
    withCover: args.includes("--with-cover"),
    city: cityArg,
  };
}

function loadSources(): ValilikSource[] {
  const path = join(process.cwd(), "data", "valilik-sources.json");
  return JSON.parse(readFileSync(path, "utf8")) as ValilikSource[];
}

async function main() {
  const opts = parseArgs();
  console.log("=== Valilik Tanıtım Tarayıcı ===");
  console.log(
    `Mod: ${opts.dryRun ? "dry-run" : "yazma"} | force=${opts.force} | publish=${opts.publish} | kapak=${opts.withCover ? "açık" : "kapalı"}`
  );
  if (opts.withCover && !process.env.GEMINI_API_KEY) {
    console.log("Uyarı: --with-cover için GEMINI_API_KEY gerekli.\n");
  }

  const db = opts.dryRun ? null : createBridgeClient();

  let sources = loadSources();
  if (opts.city) {
    sources = sources.filter((s) => s.slug === opts.city);
    if (sources.length === 0) {
      console.error(`Şehir bulunamadı: ${opts.city}`);
      return;
    }
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const source of sources) {
    process.stdout.write(`[${source.name}] taranıyor... `);

    const intro = await scrapeValilikIntro(source);
    if (!intro) {
      console.log("BAŞARISIZ (içerik alınamadı)");
      failed++;
      await sleep(DELAY_MS);
      continue;
    }

    let coverUrl: string | null = null;
    if (
      opts.withCover &&
      process.env.GEMINI_API_KEY &&
      intro.imageUrls.length > 0
    ) {
      const filteredUrls = await filterImageCandidatesBySize(intro.imageUrls);
      const pick = await pickCoverImage({
        entityName: intro.name,
        entityType: "city",
        pageUrl: intro.sourceUrl,
        pageText: intro.pageText,
        candidateUrls: filteredUrls,
      });

      if (pick.selectedUrl && !opts.dryRun) {
        coverUrl = await uploadImageFromUrl(
          pick.selectedUrl,
          `cities/${intro.slug}/cover`
        );
      } else if (pick.selectedUrl) {
        coverUrl = pick.selectedUrl;
      }
    }

    if (opts.dryRun || !db) {
      console.log(
        `[dry-run] başlık="${intro.title.slice(0, 40)}" metin=${intro.pageText.length}c kapak=${coverUrl ? "seçildi" : "yok"}`
      );
      success++;
      await sleep(DELAY_MS);
      continue;
    }

    const result = await bridgeIntroToSupabase(db, intro, coverUrl, {
      force: opts.force,
      publish: opts.publish,
      dryRun: false,
    });

    if (result.status === "success") {
      console.log(`OK (${result.message})`);
      success++;
    } else if (result.status === "skipped") {
      console.log(`ATLANDI (${result.message})`);
      skipped++;
    } else {
      console.log(`HATA (${result.message})`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log("\n=== Tamamlandı ===");
  console.log(`Başarılı: ${success} | Atlanan: ${skipped} | Başarısız: ${failed}`);
}

main().catch(console.error);
