import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { uploadImageFromUrl } from "../lib/storage/upload-image-from-url";
import { updateCityCoverImage } from "../lib/ingest/script-db";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WIKI_TR_API = "https://tr.wikipedia.org/w/api.php";
const DELAY_MS = parseInt(process.env.DELAY_MS || "1200");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findCityThumbnail(cityName: string): Promise<string | null> {
  try {
    const query = `${cityName} ili`;
    const searchUrl = `${WIKI_TR_API}?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=1&format=json&origin=*`;

    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (veri-zenginlestirme)" },
    });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const title = searchData.query?.search?.[0]?.title;
    if (!title) return null;

    const pageUrl = `${WIKI_TR_API}?action=query&titles=${encodeURIComponent(
      title
    )}&prop=pageimages&piprop=thumbnail&pithumbsize=1200&format=json&origin=*`;

    const pageRes = await fetch(pageUrl, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (veri-zenginlestirme)" },
    });
    if (!pageRes.ok) return null;

    const pageData = await pageRes.json();
    const pages = pageData.query?.pages;
    const page = pages
      ? (Object.values(pages)[0] as Record<string, unknown>)
      : null;
    return (page?.thumbnail as { source: string })?.source || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("=== Şehir Kapak Görseli Zenginleştirme ===\n");

  const onlySlug = process.argv
    .find((arg) => arg.startsWith("--city="))
    ?.split("=")[1];

  let query = supabase
    .from("cities")
    .select("id, name, slug, cover_image")
    .eq("is_active", true)
    .is("cover_image", null)
    .order("name");

  if (onlySlug) {
    query = supabase
      .from("cities")
      .select("id, name, slug, cover_image")
      .eq("slug", onlySlug)
      .is("cover_image", null);
  }

  const { data: cities, error } = await query;
  if (error) {
    console.error("Veritabanı hatası:", error.message);
    return;
  }

  const targets = cities || [];
  console.log(`${targets.length} şehir işlenecek...\n`);

  let enriched = 0;
  let skipped = 0;

  for (const city of targets) {
    process.stdout.write(`[${city.name}]... `);

    const thumbnail = await findCityThumbnail(city.name);
    if (!thumbnail) {
      console.log("ATLADI (görsel bulunamadı)");
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    const publicUrl = await uploadImageFromUrl(
      thumbnail,
      `cities/${city.slug}/cover`
    );
    if (!publicUrl) {
      console.log("ATLADI (yükleme başarısız)");
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    const updateError = await updateCityCoverImage(supabase, city.id, publicUrl);

    if (updateError) {
      console.log(`HATA: ${updateError}`);
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
