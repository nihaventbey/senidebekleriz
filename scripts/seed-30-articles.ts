import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Hata: NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("🚀 30 adet blog yazısı Supabase veritabanına aktarılıyor...\n");

  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  const rawData = await fs.readFile(jsonPath, "utf-8");
  const articles = JSON.parse(rawData);

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

    if (error) {
      console.error(`❌ Yüklenemedi [${article.slug}]:`, error.message);
    } else {
      console.log(`✅ [${++successCount}/${articles.length}] ${article.title}`);
    }
  }

  console.log(`\n🎉 Toplam ${successCount} blog yazısı başarıyla eklendi/güncellendi!`);
}

main().catch((err) => {
  console.error("❌ Hata oluştu:", err.message);
  process.exit(1);
});
