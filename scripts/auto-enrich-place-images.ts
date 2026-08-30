import fs from "fs";
import path from "path";

// Load .env.local manually before loading Supabase
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...vals] = trimmed.split("=");
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}
const WIKI_TR_API = "https://tr.wikipedia.org/w/api.php";

async function fetchWikipediaData(placeName: string, cityName: string) {
  try {
    const searchQuery = `${placeName} ${cityName}`;
    const searchUrl = `${WIKI_TR_API}?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=1&format=json`;

    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (gezi-rehberi)" },
    });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const title = searchData.query?.search?.[0]?.title;
    if (!title) return null;

    const detailUrl = `${WIKI_TR_API}?action=query&titles=${encodeURIComponent(title)}&prop=extracts|pageimages&exintro=1&explaintext=1&exlimit=1&piprop=thumbnail&pithumbsize=1000&format=json`;
    const detailRes = await fetch(detailUrl, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (gezi-rehberi)" },
    });
    if (!detailRes.ok) return null;

    const detailData = await detailRes.json();
    const pages = detailData.query?.pages;
    const page = pages ? (Object.values(pages)[0] as any) : null;

    if (!page || page.missing !== undefined) return null;

    return {
      extract: page.extract || null,
      thumbnail: page.thumbnail?.source || null,
    };
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log("🚀 Görselsiz ve zayıf mekanları otomatik zenginleştirme işlemi başlatılıyor...");

  const { supabaseAdmin } = await import("../lib/supabase/admin");

  // 1. Görseli eksik olan mekanları çek
  const { data: places, error } = await supabaseAdmin
    .from("places")
    .select("id, name, slug, description, cover_image, source, city_id, cities(name)")
    .eq("is_active", true)
    .is("cover_image", null)
    .limit(100);

  if (error || !places) {
    console.error("Mekanlar çekilemedi:", error?.message);
    return;
  }

  console.log(`📋 Toplam ${places.length} adet görselsiz mekan inceleniyor...`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const place of places) {
    const cityName = (place.cities as any)?.name || "";
    const wikiData = await fetchWikipediaData(place.name, cityName);

    const updates: Record<string, any> = {};

    if (wikiData?.thumbnail) {
      updates.cover_image = wikiData.thumbnail;
    }

    if (!place.description && wikiData?.extract && wikiData.extract.length > 30) {
      updates.description = wikiData.extract;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabaseAdmin
        .from("places")
        .update(updates)
        .eq("id", place.id);

      if (!updateErr) {
        console.log(`✅ Zenginleştirildi: [${cityName}] ${place.name} ${updates.cover_image ? "🖼️ Fotoğraf eklendi" : ""}`);
        updatedCount++;
      } else {
        console.error(`❌ Hata (${place.name}):`, updateErr.message);
      }
    } else {
      skippedCount++;
    }

    // Rate limiting delay
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n🎉 Otomatik Zenginleştirme Tamamlandı!`);
  console.log(`📸 Güncellenen Mekan Sayısı: ${updatedCount}`);
  console.log(`⏩ Değişiklik Yapılmayan: ${skippedCount}`);
}

main().catch(console.error);
