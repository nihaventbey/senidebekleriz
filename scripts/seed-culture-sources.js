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

const newSources = [
  {
    name: 'Kültür Portalı — Gezilecek Yerler & Müzeler',
    source_type: 'google_news_rss',
    query_or_url: 'site:kulturportali.gov.tr gezilecek yerler müze',
    is_active: true,
  },
  {
    name: 'Kültür Portalı — Kültür Mirası & Gelenekler',
    source_type: 'google_news_rss',
    query_or_url: 'site:kulturportali.gov.tr somut olmayan kültürel miras',
    is_active: true,
  },
  {
    name: 'Kültür Portalı — Festivaller & Mutfak Kültürü',
    source_type: 'google_news_rss',
    query_or_url: 'site:kulturportali.gov.tr festival gastronomi',
    is_active: true,
  },
  {
    name: 'Kültür Yolu Festivali — Konser, Sergi, Tiyatro',
    source_type: 'google_news_rss',
    query_or_url: 'site:kulturyolufestivali.com',
    is_active: true,
  },
  {
    name: 'Kültür Yolu Festivali — Şehir Festival Programları',
    source_type: 'google_news_rss',
    query_or_url: 'Türkiye Kültür Yolu Festivali konser sergi tiyatro',
    is_active: true,
  },
];

async function main() {
  console.log("🚀 Kültür Portalı ve Kültür Yolu Festivali kaynakları veritabanına ekleniyor...\n");

  for (const src of newSources) {
    // Check if already exists by name
    const { data: existing } = await supabase
      .from('discovery_sources')
      .select('id, name')
      .eq('name', src.name)
      .maybeSingle();

    if (existing) {
      console.log(`ℹ️ Zaten mevcut: ${src.name}`);
      await supabase
        .from('discovery_sources')
        .update({ query_or_url: src.query_or_url, is_active: true })
        .eq('id', existing.id);
    } else {
      const { error } = await supabase.from('discovery_sources').insert({
        ...src,
        created_at: new Date().toISOString(),
      });
      if (error) {
        console.error(`❌ Eklenemedi [${src.name}]:`, error.message);
      } else {
        console.log(`✅ Eklendi: ${src.name}`);
      }
    }
  }

  console.log("\n🎉 Tüm yeni kültür ve festival keşif kaynakları başarıyla yapılandırıldı!");
}

main().catch(console.error);
