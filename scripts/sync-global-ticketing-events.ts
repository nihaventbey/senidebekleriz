import { supabaseAdmin } from "@/lib/supabase/admin";
import { researchArtistInfoCard } from "@/lib/ai/research-artist-info";
import { buildEventRawPayload } from "@/lib/events/event-payload";
import { syncGlobalTicketingEvents } from "@/lib/events/sync-global-ticketing";
import { normalizeArtistInfoCard } from "@/lib/events/artist-info-card";

const MAJOR_EVENT_MATCH_REGEX =
  /(orchestra|orkestra|filarmoni|philharmonic|symphony|senfoni|ballet|bale|koreograf|choreograph|tour|bifo|viktoria mullova|david garrett|yoko ono|jethro tull|black veil brides|ragheb alama|evgeny grinko|charlotte cardin|saint levant|caribou|mario frangoulis|korolova)/i;

async function backfillExistingArtistInfoCards() {
  const { data: rows, error } = await supabaseAdmin
    .from("cultural_events")
    .select("id, title, slug, summary, description, event_type, is_free, raw_payload")
    .in("status", ["published", "pending_review"])
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(80);

  if (error || !rows) {
    console.error("Existing events fetch error:", error?.message);
    return 0;
  }

  let updatedCount = 0;

  for (const row of rows) {
    const existingCard = normalizeArtistInfoCard(
      (row.raw_payload as Record<string, unknown> | null)?.artist_info_card
    );
    if (existingCard) continue;

    if (!MAJOR_EVENT_MATCH_REGEX.test(row.title)) continue;

    console.log(`🔎 Araştırılıyor: ${row.title}`);
    try {
      const card = await researchArtistInfoCard({
        title: row.title,
        summary: row.summary,
        description: row.description,
        eventType: row.event_type,
      });

      if (!card) {
        console.log(`   ⏭️  Resmi kaynak eşleşmedi.`);
        continue;
      }

      const nextPayload = buildEventRawPayload(
        row.raw_payload as Record<string, unknown> | null,
        {
          isFree: Boolean(row.is_free),
          artistInfoCard: card,
        }
      );

      const { error: updErr } = await supabaseAdmin
        .from("cultural_events")
        .update({
          raw_payload: nextPayload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updErr) {
        console.error(`   ❌ Güncellenemedi (${row.slug}):`, updErr.message);
      } else {
        updatedCount++;
        console.log(
          `   ✅ Kart eklendi: ${card.entityName} (${card.officialWebsite || "wiki"})`
        );
      }
    } catch (err) {
      console.error(`   ⚠️ Hata (${row.slug}):`, err);
    }
  }

  return updatedCount;
}

async function main() {
  console.log("🌍 Biletleme sitelerinden dünyaca ünlü etkinlikler çekiliyor...\n");

  const syncResult = await syncGlobalTicketingEvents({
    limit: 10,
    autoPublish: true,
    enrichArtistCards: true,
  });

  console.log("Senkronizasyon özeti:", JSON.stringify(syncResult, null, 2));

  console.log(
    "\n📚 Mevcut büyük uluslararası/orkestra etkinliklerine bilgi kartı ekleniyor...\n"
  );
  const backfilled = await backfillExistingArtistInfoCards();
  console.log(`\n🎉 Tamamlandı! Yeni eklenen: ${syncResult.itemsInserted}, bilgi kartı güncellenen mevcut kayıt: ${backfilled}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
