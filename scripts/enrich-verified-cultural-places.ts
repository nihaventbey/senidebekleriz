import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { execFileSync } from "node:child_process";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

function curlJson<T>(url: string): T | null {
  try {
    const raw = execFileSync("curl", [
      "-s",
      "-H",
      "User-Agent: SeniDeBekleriz/1.0 (info@senidebekleriz.com)",
      "--max-time",
      "8",
      url,
    ]).toString("utf-8");
    if (!raw || !raw.trim().startsWith("{")) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type WikiSummary = {
  title: string;
  wikibase_item?: string;
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
  description?: string;
};

function getHighResWikimediaUrl(url?: string | null): string | null {
  if (!url) return null;
  // If thumbnail URL with /330px-... change to /1200px-...
  if (url.includes("/thumb/") && /\/\d+px-[^/]+$/.test(url)) {
    return url.replace(/\/\d+px-([^/]+)$/, "/1200px-$1").split("?")[0];
  }
  return url.split("?")[0];
}

async function main() {
  console.log("🔍 Doğrulanmış Kültür & Müze Mekanlarını Zenginleştirme Başlatılıyor...\n");

  // 1. Fetch active cultural places that either have a wikidata_id OR match museum/tarihi-yer
  const { data: places, error } = await supabase
    .from("places")
    .select("id, name, slug, wikidata_id, cover_image, description, is_featured")
    .eq("is_active", true)
    .not("wikidata_id", "is", null);

  if (error || !places) {
    console.error("Veritabanından mekanlar çekilemedi:", error);
    return;
  }

  console.log(`Toplam ${places.length} adet doğrulanabilir (Wikidata ID'li) aktif mekan inceleniyor...`);

  let updatedCount = 0;
  let imageAddedCount = 0;
  let descAddedCount = 0;

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const qid = place.wikidata_id!;
    const cleanName = place.name.trim();

    // Check if place needs image or description
    const needsImage = !place.cover_image || place.cover_image.includes("unsplash");
    const needsDesc = !place.description || place.description.length < 50 || place.description.startsWith("tr:");

    if (!needsImage && !needsDesc) {
      continue;
    }

    // Attempt direct summary by place name
    let summary = curlJson<WikiSummary>(
      `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`
    );

    // If no direct summary or QID doesn't match, search Wikipedia
    if (!summary || summary.wikibase_item !== qid) {
      const searchRes = curlJson<{ query?: { search?: Array<{ title: string }> } }>(
        `https://tr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          cleanName
        )}&srlimit=3&format=json`
      );

      const candidates = searchRes?.query?.search || [];
      for (const cand of candidates) {
        const candSum = curlJson<WikiSummary>(
          `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cand.title)}`
        );
        if (candSum && candSum.wikibase_item === qid) {
          summary = candSum;
          break;
        }
      }
    }

    // If still not matched, check if summary has title match
    if (!summary || !summary.extract) {
      continue;
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const rawImg = summary.originalimage?.source || summary.thumbnail?.source;
    const finalImg = getHighResWikimediaUrl(rawImg);

    // Validate that image is not a generic svg icon or logo
    if (needsImage && finalImg && !finalImg.toLowerCase().endsWith(".svg")) {
      updates.cover_image = finalImg;
      imageAddedCount++;
    }

    if (needsDesc && summary.extract && summary.extract.length > 40) {
      updates.description = summary.extract;
      descAddedCount++;
    }

    if (Object.keys(updates).length > 1) {
      const { error: updErr } = await supabase
        .from("places")
        .update(updates)
        .eq("id", place.id);

      if (!updErr) {
        updatedCount++;
        console.log(`[${updatedCount}] ✅ ${place.name}:`, {
          hasImage: Boolean(updates.cover_image),
          hasDesc: Boolean(updates.description),
        });
      }
    }

    // Rate-limit friendly pause (80ms)
    await new Promise((r) => setTimeout(r, 80));
  }

  console.log(`\n🎉 Zenginleştirme Tamamlandı!`);
  console.log(`Toplam Güncellenen Mekan: ${updatedCount}`);
  console.log(`Eklenen Gerçek Görsel: ${imageAddedCount}`);
  console.log(`Zenginleştirilen Açıklama: ${descAddedCount}`);
}

main().catch(console.error);
