import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cities = [
  {
    name: "İstanbul",
    slug: "istanbul",
    region: "Marmara",
    description:
      "İki kıtanın buluştuğu, binlerce yıllık tarihi, Boğaz'ın eşsiz manzarası ve sonsuz keşif imkanlarıyla Türkiye'nin en büyük metropolü.",
    lat: 41.0082,
    lng: 28.9784,
    population: 15460000,
    is_active: true,
  },
  {
    name: "İzmir",
    slug: "izmir",
    region: "Ege",
    description:
      "Ege'nin incisi, masmavi kıyıları, antik kentleri ve sıcak insanlarıyla İzmir.",
    lat: 38.4192,
    lng: 27.1287,
    population: 4363000,
    is_active: true,
  },
  {
    name: "Ankara",
    slug: "ankara",
    region: "İç Anadolu",
    description:
      "Türkiye'nin başkenti, müzeleri, anıtları ve modern yaşamıyla Ankara.",
    lat: 39.9334,
    lng: 32.8597,
    population: 5503000,
    is_active: true,
  },
];

const categories = [
  { name: "Tarihi Yer", slug: "tarihi-yer", icon: "Landmark", color: "#8B5CF6" },
  { name: "Müzeler", slug: "muzeler", icon: "Camera", color: "#F59E0B" },
  { name: "Parklar", slug: "parklar", icon: "TreePine", color: "#10B981" },
  { name: "Restoranlar", slug: "restoranlar", icon: "Utensils", color: "#EF4444" },
];

const adPlacements = [
  { name: "Header Banner", position: "header", is_active: true },
  { name: "Hero Altı", position: "hero-bottom", is_active: true },
  { name: "Liste Arası", position: "list-inline", is_active: true },
  { name: "İçerik İçi", position: "content-inline", is_active: true },
  { name: "Sidebar", position: "sidebar", is_active: true },
  { name: "Footer Öncesi", position: "footer-top", is_active: true },
];

async function seedCities() {
  const { error } = await supabase.from("cities").upsert(cities, {
    onConflict: "slug",
  });
  if (error) throw new Error(`Cities seed error: ${error.message}`);
  console.log("✅ Şehirler eklendi");
}

async function seedCategories() {
  const { error } = await supabase.from("categories").upsert(categories, {
    onConflict: "slug",
  });
  if (error) throw new Error(`Categories seed error: ${error.message}`);
  console.log("✅ Kategoriler eklendi");
}

async function seedPlaces() {
  const { data: cityData } = await supabase
    .from("cities")
    .select("id, slug")
    .eq("slug", "istanbul")
    .single();

  if (!cityData) {
    throw new Error("İstanbul şehri bulunamadı");
  }

  const placesPath = path.join(process.cwd(), "data", "istanbul-places.json");
  const placesJson = await fs.readFile(placesPath, "utf-8");
  const places = JSON.parse(placesJson);

  const formattedPlaces = places.map((place: Record<string, unknown>) => ({
    city_id: cityData.id,
    name: place.name,
    slug: place.slug,
    description: place.description,
    lat: place.lat,
    lng: place.lng,
    source: place.source,
    wikidata_id: place.wikidata_id,
    is_active: true,
    is_featured: false,
  }));

  const { error } = await supabase
    .from("places")
    .upsert(formattedPlaces, { onConflict: "slug" });

  if (error) throw new Error(`Places seed error: ${error.message}`);
  console.log(`✅ ${formattedPlaces.length} mekan eklendi`);
}

async function seedPages() {
  const pagesPath = path.join(process.cwd(), "data", "pages.json");
  const pagesJson = await fs.readFile(pagesPath, "utf-8");
  const pages = JSON.parse(pagesJson).map((page: Record<string, unknown>) => ({
    slug: page.slug,
    title: page.title,
    content: page.content,
    meta_title: page.meta_title,
    meta_description: page.meta_description,
    is_published: true,
  }));

  const { error } = await supabase.from("pages").upsert(pages, {
    onConflict: "slug",
  });
  if (error) throw new Error(`Pages seed error: ${error.message}`);
  console.log("✅ Sayfalar eklendi");
}

async function seedAdPlacements() {
  const { error } = await supabase.from("ad_placements").upsert(adPlacements, {
    onConflict: "position",
  });
  if (error) throw new Error(`Ad placements seed error: ${error.message}`);
  console.log("✅ Reklam pozisyonları eklendi");
}

async function main() {
  console.log("Supabase veri aktarımı başlıyor...\n");

  await seedCities();
  await seedCategories();
  await seedPlaces();
  await seedPages();
  await seedAdPlacements();

  console.log("\n🎉 Tüm veriler başarıyla aktarıldı!");
}

main().catch((err) => {
  console.error("\n❌ Hata:", err.message);
  process.exit(1);
});
