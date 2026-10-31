const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
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

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Hata: NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY bulunamadı.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sources = [
  // 1) Direct RSS Feeds (Ulusal Kültür-Sanat Gazete & Yayın Feeds)
  {
    name: 'TRT Haber — Kültür Sanat (Doğrudan RSS)',
    source_type: 'rss',
    query_or_url: 'https://www.trthaber.com/kultur_sanat_articles.rss',
    is_active: true,
  },
  {
    name: 'Cumhuriyet — Kültür Sanat (Doğrudan RSS)',
    source_type: 'rss',
    query_or_url: 'https://www.cumhuriyet.com.tr/rss/kultur-sanat',
    is_active: true,
  },
  {
    name: 'Gazete Duvar — Kültür Sanat (Doğrudan RSS)',
    source_type: 'rss',
    query_or_url: 'https://www.gazeteduvar.com.tr/rss/kultur-sanat',
    is_active: true,
  },
  {
    name: 'Habertürk — Kültür Sanat (Doğrudan RSS)',
    source_type: 'rss',
    query_or_url: 'https://www.haberturk.com/rss/kategori/kultur-sanat.xml',
    is_active: true,
  },

  // 2) Regional & Local Press News (Google News RSS - 7 Coğrafi Bölge & Yerel Gazeteler)
  {
    name: 'Ege & İzmir Kültür-Sanat (Yerel Basın)',
    source_type: 'google_news_rss',
    query_or_url: 'İzmir OR Aydın OR Muğla kültür sanat sergi tiyatro festival',
    is_active: true,
  },
  {
    name: 'Marmara & Trakya Kültür-Sanat (Bursa, Çanakkale, Edirne)',
    source_type: 'google_news_rss',
    query_or_url: 'Bursa OR Çanakkale OR Edirne OR Balıkesir müze kültür festival',
    is_active: true,
  },
  {
    name: 'Akdeniz Kültür-Sanat (Antalya, Adana, Mersin)',
    source_type: 'google_news_rss',
    query_or_url: 'Antalya OR Adana OR Mersin OR Hatay kültür sanat festival konser',
    is_active: true,
  },
  {
    name: 'İç Anadolu Kültür-Sanat (Ankara, Konya, Eskişehir)',
    source_type: 'google_news_rss',
    query_or_url: 'Ankara OR Konya OR Eskişehir OR Nevşehir kültür sergi müze',
    is_active: true,
  },
  {
    name: 'Karadeniz Kültür-Sanat (Trabzon, Samsun, Rize)',
    source_type: 'google_news_rss',
    query_or_url: 'Trabzon OR Samsun OR Rize OR Sinop kültür sanat festival',
    is_active: true,
  },
  {
    name: 'Güneydoğu & Doğu Tarihi Miras (Gaziantep, Şanlıurfa, Mardin)',
    source_type: 'google_news_rss',
    query_or_url: 'Gaziantep OR Diyarbakır OR Şanlıurfa OR Mardin OR Van müze festival kültür',
    is_active: true,
  },

  // 3) Specialized Cultural Heritage, Archaeology & Stage Arts
  {
    name: 'Arkeoloji & Antik Kent Kazı Keşifleri',
    source_type: 'google_news_rss',
    query_or_url: 'arkeoloji kazı antik kent Türkiye',
    is_active: true,
  },
  {
    name: 'Tarihi Restorasyon & Kültürel Miras',
    source_type: 'google_news_rss',
    query_or_url: 'restorasyon tarihi cami kilise konak Türkiye',
    is_active: true,
  },
  {
    name: 'Devlet Tiyatroları & Sahne Sanatları',
    source_type: 'google_news_rss',
    query_or_url: 'Devlet Tiyatroları OR Şehir Tiyatroları prömiyer oyun',
    is_active: true,
  },
  {
    name: 'Türkiye Kültür Yolu Festivali',
    source_type: 'google_news_rss',
    query_or_url: 'Türkiye Kültür Yolu Festivali konser sergi tiyatro',
    is_active: true,
  },
];

async function main() {
  console.log("🚀 Zenginleştirilmiş kültür-sanat, yerel basın ve doğrudan RSS kaynakları yapılandırılıyor...\n");

  for (const src of sources) {
    const { data: existing } = await supabase
      .from('discovery_sources')
      .select('id, name')
      .eq('name', src.name)
      .maybeSingle();

    if (existing) {
      console.log(`🔄 Güncellendi: ${src.name}`);
      await supabase
        .from('discovery_sources')
        .update({
          source_type: src.source_type,
          query_or_url: src.query_or_url,
          is_active: true
        })
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

  // Deactivate obsolete/stale sources like generic single-query ones
  const obsoleteNames = [
    'Kültür Portalı — Gezilecek Yerler & Müzeler',
    'Kültür Portalı — Kültür Mirası & Gelenekler',
    'Kültür Portalı — Festivaller & Mutfak Kültürü',
    'Kültür Yolu Festivali — Konser, Sergi, Tiyatro',
  ];

  for (const obsName of obsoleteNames) {
    await supabase
      .from('discovery_sources')
      .update({ is_active: false })
      .eq('name', obsName);
  }

  console.log("\n🎉 Tüm keşif kaynakları başarıyla güncellendi ve aktif edildi!");
}

main().catch(console.error);
