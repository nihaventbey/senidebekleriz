import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const guaranteedImages: Record<string, string> = {
  "istanbul-en-etkileyici-tarihi-muzeler": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop",
  "gobeklitepe-tarihin-sifir-noktasi": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop",
  "kapadokya-yeralti-sehirleri-derinkuyu-kaymakli": "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?q=80&w=1200&auto=format&fit=crop",
  "efes-antik-kenti-ve-celsus-kutuphanesi": "https://images.unsplash.com/photo-1599818816930-b99b552aa2c7?q=80&w=1200&auto=format&fit=crop",
  "pamukkale-ve-hierapolis-antik-kenti": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=1200&auto=format&fit=crop",
  "sumela-manastiri-trabzon-rehberi": "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop",
  "nemrut-dagi-dev-heykelleri-adiyaman": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop",
  "troya-antik-kenti-canakkale": "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop",
  "catalhoyuk-neolitik-kenti-konya": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop",
  "anadolu-medeniyetleri-muzesi-ankara": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1200&auto=format&fit=crop",
  "zeugma-mozaik-muzesi-gaziantep": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1200&auto=format&fit=crop",
  "ani-harabeleri-kars-tarihi": "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop",
  "aspendos-antik-tiyatrosu-antalya": "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop",
  "hattusas-antik-kenti-corum-hititler": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop",
  "bergama-pergamon-antik-kenti-izmir": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1200&auto=format&fit=crop",
  "safranbolu-evleri-osmanli-mimarisi-karabuk": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop",
  "ishak-pasa-sarayi-agri-dogubayazit": "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop",
  "istanbul-arkeoloji-muzeleri-rehberi": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop",
  "aphrodisias-antik-kenti-aydin": "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop",
  "mardin-tas-evleri-ve-tarihi-manastirlari": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop",
  "bursa-ulu-camii-ve-cumalikizik-rehberi": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop",
  "sagalassos-antik-kenti-burdur": "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop",
  "rize-zilkale-ve-tarihi-kemer-kopruler": "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop",
  "van-kalesi-ve-akdamar-kilisesi-van": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop",
  "edirne-selimiye-camii-mimar-sinan": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop",
  "mersin-kizkalesi-cennet-cehennem-obruklari": "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop",
  "aizanoi-antik-kenti-kutahya-zeus-tapinagi": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1200&auto=format&fit=crop",
  "kastamonu-mahmut-bey-camii-ahsap-mimari": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop",
  "sinop-tarihi-cezaevi-ve-sinop-kalesi": "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop",
  "sivas-divrigi-ulu-camii-ve-darussifikasi": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop"
};

async function applyGuaranteedImages() {
  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const articles = JSON.parse(raw);

  console.log(`Applying guaranteed CDN images to all ${articles.length} articles...\n`);

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    const img = guaranteedImages[art.slug];
    if (img) {
      art.cover_image = img;
      art.content = art.content.replace(/!\[.*?\]\(https?:\/\/[^\)]+\)/g, `![${art.title}](${img})`);
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(articles, null, 2), "utf-8");
  console.log("✅ data/articles.json updated with guaranteed working CDN images!");

  let successCount = 0;
  for (const article of articles) {
    const payload = {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      cover_image: article.cover_image,
      city_slug: article.city_slug,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      is_published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("articles")
      .upsert(payload, { onConflict: "slug" });

    if (!error) successCount++;
  }

  console.log(`🎉 ${successCount} articles updated in Supabase database!`);
}

applyGuaranteedImages().catch(console.error);
