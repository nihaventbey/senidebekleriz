import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  resolveArtistImage,
  isGenericStockConcertImage,
} from "../lib/events/artist-image-resolver";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SPECIFIC_TARGET_SLUGS = [
  "dedubluman-konseri",
  "prime-orchestra-rock-sympho-show",
  "ebru-yasar-konseri-antalya-kultur-yolu-festivali",
  "yuzyuzeyken-konusuruz-konseri",
  "jethro-tull-the-curiosity-tour-2026",
  "ragheb-alama-konseri",
  "ebru-gundes-ile-beraber-soyluyoruz",
  "mert-demir-konseri",
  "edis-konseri",
  "sefo-konseri-antalya-kultur-yolu-festivali",
  "gokhan-turkmen-konseri-antalya-kultur-yolu-festivali",
  "gokhan-tepe-konseri",
];

async function main() {
  console.log("=== Otantik Sanatçı Kapak Görseli Çözümleme ve Migrasyon ===\n");

  // Fetch all published events OR events with generic rock stock image OR specific target slugs
  const { data: allEvents, error } = await supabase
    .from("cultural_events")
    .select("id, slug, title, cover_image, status, event_type, summary");

  if (error) {
    console.error("Veritabanı okuma hatası:", error.message);
    process.exit(1);
  }

  const events = allEvents || [];
  console.log(`Toplam ${events.length} kayıt inceleniyor...\n`);

  let resolvedAuthenticCount = 0;
  let clearedToNullCount = 0;
  let alreadyCleanCount = 0;

  for (const event of events) {
    const isTarget = SPECIFIC_TARGET_SLUGS.includes(event.slug);
    const isConcert =
      event.event_type === "konser" ||
      /\b(konser|konseri|resital|senfoni|filarmoni|orkestra|turnesi|turne|canlı)\b/i.test(
        `${event.title} ${event.summary || ""}`
      );
    const hasGenericStock = isGenericStockConcertImage(event.cover_image);
    const hasCuratedConcertStock =
      isConcert && Boolean(event.cover_image?.includes("/events/curated/"));
    const hasPurgedFakeCover =
      Boolean(
        event.cover_image &&
          (event.cover_image.includes("senfonik.webp") ||
            event.cover_image.includes("enka-sanat.webp") ||
            event.cover_image.includes("eve-donus.webp") ||
            event.cover_image.includes("istanbul-sarkilari.webp") ||
            event.cover_image.includes("turk-muzigi-toplulugu.webp"))
      );

    // Only process if it has generic stock, or is a specific target slug, or is a concert needing review
    if (
      !hasGenericStock &&
      !hasCuratedConcertStock &&
      !hasPurgedFakeCover &&
      !isTarget &&
      !isConcert
    ) {
      alreadyCleanCount++;
      continue;
    }

    process.stdout.write(`İnceleniyor: [${event.slug}] "${event.title}"... `);

    // If it's a concert or target, attempt to resolve authentic artist photo
    let newCover: string | null = null;
    if (isConcert || isTarget) {
      newCover = await resolveArtistImage(event.title, event.slug);
    }

    if (newCover) {
      if (event.cover_image === newCover) {
        console.log(`ℹ️ Zaten güncel otantik görsel.`);
        alreadyCleanCount++;
      } else {
        const { error: updateError } = await supabase
          .from("cultural_events")
          .update({
            cover_image: newCover,
            updated_at: new Date().toISOString(),
          })
          .eq("id", event.id);

        if (updateError) {
          console.log(`❌ Güncelleme hatası: ${updateError.message}`);
        } else {
          console.log(`✅ OTANTİK GÖRSEL ATANDI -> ${newCover}`);
          resolvedAuthenticCount++;
        }
      }
    } else if (hasGenericStock || hasCuratedConcertStock || hasPurgedFakeCover) {
      // Banned generic stock or invalid photo must be set to NULL so CulturalCoverPlaceholder renders
      const { error: updateError } = await supabase
        .from("cultural_events")
        .update({
          cover_image: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      if (updateError) {
        console.log(`❌ Temizleme hatası: ${updateError.message}`);
      } else {
        console.log(`🧹 JENERİK/GEÇERSİZ GÖRSEL TEMİZLENDİ -> NULL (Placeholder Devrede)`);
        clearedToNullCount++;
      }
    } else {
      console.log(`ℹ️ Değişiklik gerekmedi.`);
      alreadyCleanCount++;
    }

    // Small delay to be polite to external APIs
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n================ ÖZET ================");
  console.log(`Doğrulanmış Otantik Sanatçı Görseli Eklenen: ${resolvedAuthenticCount}`);
  console.log(`Jenerik Stok Temizlenip NULL Yapılan: ${clearedToNullCount}`);
  console.log(`İşlem Gerektirmeyen: ${alreadyCleanCount}`);
  console.log("======================================\n");
}

main().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
