import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables manually
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("🧹 Veritabanı temizleme ve içerik ayrıştırma işlemi başlatılıyor...\n");

  // 1. Pages tablosundaki sahte/çerez metinli rehber-* kayıtlarını sil
  console.log("1️⃣ Pages tablosundaki 'rehber-*' kayıtları temizleniyor...");
  const { data: deletedPages, error: delPagesErr } = await supabase
    .from("pages")
    .delete()
    .like("slug", "rehber-%")
    .select("id, slug, title");

  if (delPagesErr) {
    console.error("❌ Pages temizleme hatası:", delPagesErr.message);
  } else {
    console.log(`✅ Toplam ${deletedPages?.length || 0} adet çerez/KVKK metni içeren sahte sayfa silindi.`);
  }

  // 2. Articles tablosundaki etkinlikleri tespit et
  console.log("\n2️⃣ Articles tablosundaki etkinlik duyuruları kontrol ediliyor...");
  const { data: eventArticles, error: artErr } = await supabase
    .from("articles")
    .select("*")
    .or("slug.ilike.%technoxtr%,slug.ilike.%odul%,slug.ilike.%sergisi%");

  if (artErr) {
    console.error("❌ Articles sorgu hatası:", artErr.message);
  } else if (eventArticles && eventArticles.length > 0) {
    console.log(`📋 ${eventArticles.length} adet etkinlik bülteni tespit edildi, cultural_events tablosuna aktarılıyor...`);

    for (const art of eventArticles) {
      const eventPayload = {
        title: art.title,
        slug: art.slug,
        summary: art.excerpt,
        description: art.content,
        cover_image: art.cover_image,
        city_slug: art.city_slug,
        event_type: art.title.toLowerCase().includes("tiyatro")
          ? "Tiyatro"
          : art.title.toLowerCase().includes("sergi")
          ? "Sergi"
          : "Konser",
        status: "published",
        starts_at: new Date().toISOString(),
        is_featured: false,
        created_at: art.created_at,
        updated_at: new Date().toISOString(),
      };

      const { error: evtInsertErr } = await supabase
        .from("cultural_events")
        .upsert(eventPayload, { onConflict: "slug" });

      if (evtInsertErr) {
        console.error(`❌ Etkinlik aktarılamadı (${art.slug}):`, evtInsertErr.message);
      } else {
        console.log(`✅ [cultural_events] aktarıldı: ${art.title}`);
        // Remove from articles table
        await supabase.from("articles").delete().eq("id", art.id);
        console.log(`🗑️ [articles] tablosundan silindi: ${art.title}`);
      }
    }
  }

  console.log("\n🎉 1. Adım: Veritabanı Temizliği ve Ayrıştırma Başarıyla Tamamlandı!");
}

main().catch(console.error);
