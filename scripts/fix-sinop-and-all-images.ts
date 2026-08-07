import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Guaranteed non-tropical, authentic historical architecture photos
const castleFortressImage = "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=1200&auto=format&fit=crop"; // Ancient stone fortress wall & castle tower
const mosqueImage = "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop"; // Classic Ottoman Seljuk architecture
const ruinImage = "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop"; // Ancient Greco-Roman stone columns

async function fixSinop() {
  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const articles = JSON.parse(raw);

  console.log(`Fixing Sinop and tropical resort URLs across ${articles.length} articles...\n`);

  // Tropical pool resort URL to eradicate
  const tropicalUrl = "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop";

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];

    if (art.slug === "sinop-tarihi-cezaevi-ve-sinop-kalesi") {
      art.cover_image = castleFortressImage;
      art.content = art.content.replace(new RegExp(tropicalUrl, "g"), castleFortressImage);
      art.content = art.content.replace(/!\[.*?\]\(https?:\/\/[^\)]+\)/g, `![Sinop Kalesi Surları](${castleFortressImage})`);
      console.log(`✅ Sinop cover_image updated to Stone Fortress: ${art.cover_image}`);
    }

    if (art.cover_image.includes("1563911302283")) {
      art.cover_image = (art.slug.includes("zilkale") || art.slug.includes("kalesi") || art.slug.includes("sarayi")) 
        ? castleFortressImage 
        : ruinImage;
      art.content = art.content.replace(new RegExp(tropicalUrl, "g"), art.cover_image);
      console.log(`✅ Replaced tropical photo in ${art.slug} -> ${art.cover_image}`);
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(articles, null, 2), "utf-8");
  console.log("\n🎉 data/articles.json updated! Tropical resort photo completely eliminated.");

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

fixSinop().catch(console.error);
