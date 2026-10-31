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
      "5",
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
  if (url.includes("/thumb/") && /\/\d+px-[^/]+$/.test(url)) {
    return url.replace(/\/\d+px-([^/]+)$/, "/1200px-$1").split("?")[0];
  }
  return url.split("?")[0];
}

async function processPlace(place: {
  id: string;
  name: string;
  wikidata_id: string | null;
  cover_image: string | null;
  description: string | null;
}): Promise<boolean> {
  const qid = place.wikidata_id!;
  const cleanName = place.name.trim();

  const needsImage = !place.cover_image || place.cover_image.includes("unsplash");
  const needsDesc = !place.description || place.description.length < 50 || place.description.startsWith("tr:");

  if (!needsImage && !needsDesc) return false;

  let summary = curlJson<WikiSummary>(
    `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`
  );

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

  if (!summary || !summary.extract) return false;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const rawImg = summary.originalimage?.source || summary.thumbnail?.source;
  const finalImg = getHighResWikimediaUrl(rawImg);

  if (needsImage && finalImg && !finalImg.toLowerCase().endsWith(".svg")) {
    updates.cover_image = finalImg;
  }

  if (needsDesc && summary.extract && summary.extract.length > 40) {
    updates.description = summary.extract;
  }

  if (Object.keys(updates).length > 1) {
    const { error } = await supabase
      .from("places")
      .update(updates)
      .eq("id", place.id);

    return !error;
  }

  return false;
}

async function main() {
  console.log("⚡ Hızlı ve Paralel Zenginleştirme Başlatılıyor...\n");

  const { data: places, error } = await supabase
    .from("places")
    .select("id, name, slug, wikidata_id, cover_image, description")
    .eq("is_active", true)
    .not("wikidata_id", "is", null);

  if (error || !places) {
    console.error("Mekanlar çekilemedi:", error);
    return;
  }

  const pending = places.filter((p) => {
    const needsImg = !p.cover_image || p.cover_image.includes("unsplash");
    const needsDesc = !p.description || p.description.length < 50 || p.description.startsWith("tr:");
    return needsImg || needsDesc;
  });

  console.log(`İşlenecek mekan sayısı: ${pending.length} / Toplam: ${places.length}`);

  let updated = 0;
  const CHUNK_SIZE = 6;

  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    const chunk = pending.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(chunk.map((p) => processPlace(p)));
    const successInChunk = results.filter(Boolean).length;
    updated += successInChunk;

    process.stdout.write(`İlerleme: [${Math.min(i + CHUNK_SIZE, pending.length)} / ${pending.length}] (Güncellenen: ${updated})\r`);
    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`\n\n🎉 Tamamlandı! Toplam ${updated} yeni mekan gerçek fotoğraf ve ansiklopedik içerikle zenginleştirildi.`);
}

main().catch(console.error);
