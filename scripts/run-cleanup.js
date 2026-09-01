const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("1. Pages tablosundaki sahte 'rehber-*' çerez sayfaları temizleniyor...");
  const { data: del, error: e1 } = await supabase
    .from('pages')
    .delete()
    .like('slug', 'rehber-%')
    .select('id, slug');

  if (e1) {
    console.error("Pages silme hatası:", e1.message);
  } else {
    console.log(`✅ ${del ? del.length : 0} adet sahte sayfa başarıyla silindi.`);
  }

  console.log("\n2. Articles içindeki etkinlikler taranıyor...");
  const { data: arts, error: aErr } = await supabase
    .from('articles')
    .select('*')
    .or('slug.ilike.%technoxtr%,slug.ilike.%odul%,slug.ilike.%sergisi%');

  if (aErr) {
    console.error("Articles sorgu hatası:", aErr.message);
  } else if (arts && arts.length > 0) {
    for (const art of arts) {
      console.log(`➡️ [cultural_events] tablosuna taşınıyor: ${art.title}`);
      const eventPayload = {
        title: art.title,
        slug: art.slug,
        summary: art.excerpt,
        description: art.content,
        cover_image: art.cover_image,
        city_slug: art.city_slug,
        event_type: art.title.toLowerCase().includes('tiyatro')
          ? 'tiyatro'
          : art.title.toLowerCase().includes('sergi')
          ? 'sergi'
          : 'konser',
        status: 'published',
        starts_at: new Date().toISOString(),
        is_featured: false,
        updated_at: new Date().toISOString(),
      };

      const { error: insErr } = await supabase
        .from('cultural_events')
        .upsert(eventPayload, { onConflict: 'slug' });

      if (!insErr) {
        await supabase.from('articles').delete().eq('id', art.id);
        console.log(`🗑️ Articles tablosundan kaldırıldı: ${art.title}`);
      } else {
        console.error(`❌ Hata (${art.slug}):`, insErr.message);
      }
    }
  }

  console.log("\n🎉 Veritabanı temizliği ve ayrıştırması tamamlandı!");
}

main().catch(console.error);
