import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { extractPageImageUrls } from "../lib/ai/extract-page-images";
import { uploadImageFromUrl } from "../lib/storage/upload-image-from-url";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DELAY_MS = parseInt(process.env.DELAY_MS || "1000");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPageImages(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (veri-zenginlestirme)" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return [];
    const html = await res.text();
    return extractPageImageUrls(html, res.url || url);
  } catch {
    return [];
  }
}

async function main() {
  console.log("=== Etkinlik Kapak Görseli Zenginleştirme ===\n");

  const { data: events, error } = await supabase
    .from("cultural_events")
    .select("id, slug, title, source_url, cover_image")
    .eq("status", "published")
    .is("cover_image", null)
    .not("source_url", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Veritabanı hatası:", error.message);
    return;
  }

  const targets = events || [];
  console.log(`${targets.length} etkinlik işlenecek...\n`);

  let enriched = 0;
  let skipped = 0;

  for (const event of targets) {
    process.stdout.write(`[${event.title}]... `);

    const images = await fetchPageImages(event.source_url!);
    if (images.length === 0) {
      console.log("ATLADI (görsel bulunamadı)");
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    const publicUrl = await uploadImageFromUrl(
      images[0],
      `events/${event.slug}/cover`
    );
    if (!publicUrl) {
      console.log("ATLADI (yükleme başarısız)");
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    const { error: updateError } = await supabase
      .from("cultural_events")
      .update({
        cover_image: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);

    if (updateError) {
      console.log(`HATA: ${updateError.message}`);
      skipped++;
    } else {
      console.log("OK +kapak");
      enriched++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n=== Tamamlandı ===`);
  console.log(`Kapak eklenen: ${enriched}`);
  console.log(`Atılan: ${skipped}`);
}

main().catch(console.error);
