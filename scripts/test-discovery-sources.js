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

async function testFetchGoogleNewsRss(query) {
  const q = encodeURIComponent(query);
  const feedUrl = `https://news.google.com/rss/search?q=${q}&hl=tr&gl=TR&ceid=TR:tr`;
  console.log(`📡 Taranıyor: ${query}`);
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0" }
    });
    if (!res.ok) {
      console.log(`❌ Hata: ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const titles = [...xml.matchAll(/<title>(.*?)<\/title>/g)].map(m => m[1]).slice(1, 4);
    return titles;
  } catch (err) {
    console.log(`❌ Hata:`, err.message);
    return [];
  }
}

async function main() {
  console.log("🔍 Kültür Portalı ve Kültür Yolu Festivali canlı tarama testi...\n");
  
  const sources = [
    "site:kulturportali.gov.tr gezilecek yerler",
    "site:kulturyolufestivali.com",
    "Türkiye Kültür Yolu Festivali konser sergi"
  ];

  for (const s of sources) {
    const results = await testFetchGoogleNewsRss(s);
    console.log(`Bulunan Başlıklar (${results.length}):`);
    results.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));
    console.log("");
  }
}

main().catch(console.error);
