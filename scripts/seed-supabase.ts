import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { turkeyCities } from "../data/turkey-cities";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const categories = [
  { name: "Tarihi Yer", slug: "tarihi-yer", icon: "Landmark", color: "#8B5CF6", is_active: true },
  { name: "Müzeler", slug: "muzeler", icon: "Camera", color: "#F59E0B", is_active: true },
  { name: "Sanat Mekanları", slug: "sanat-mekanlari", icon: "Palette", color: "#EC4899", is_active: true },
  { name: "Parklar", slug: "parklar", icon: "TreePine", color: "#10B981", is_active: true },
];

import { AD_SLOT_OPTIONS } from "../lib/ads/slots";

const adPlacements = AD_SLOT_OPTIONS.map((option) => ({
  name: option.label,
  position: option.position,
  is_active: true,
}));

async function seedCities() {
  const cityData = turkeyCities.map((c) => ({
    name: c.name,
    slug: c.slug,
    region: c.region,
    description: c.description,
    lat: c.lat,
    lng: c.lng,
    population: c.population,
    is_active: true,
  }));

  const { error } = await supabase.from("cities").upsert(cityData, {
    onConflict: "slug",
  });
  if (error) throw new Error(`Cities seed error: ${error.message}`);
  console.log(`✅ ${cityData.length} şehir eklendi`);
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
  console.log(`✅ ${formattedPlaces.length} mekan eklendi (İstanbul - Wikidata)`);

  await seedPlaceCategories(places);
}

async function seedPlaceCategories(places: Array<Record<string, unknown>>) {
  const { data: categoryRows, error: catError } = await supabase
    .from("categories")
    .select("id, slug");

  if (catError || !categoryRows) {
    throw new Error(`Categories lookup error: ${catError?.message}`);
  }

  const categoryMap = new Map(categoryRows.map((c) => [c.slug, c.id]));

  const { data: placeRows, error: placeError } = await supabase
    .from("places")
    .select("id, slug");

  if (placeError || !placeRows) {
    throw new Error(`Places lookup error: ${placeError?.message}`);
  }

  const placeMap = new Map(placeRows.map((p) => [p.slug, p.id]));

  const placeCategories: Array<{ place_id: string; category_id: string }> = [];

  for (const place of places) {
    const placeId = placeMap.get(place.slug as string);
    const categoryId = categoryMap.get(place.category as string);

    if (placeId && categoryId) {
      placeCategories.push({ place_id: placeId, category_id: categoryId });
    }
  }

  if (placeCategories.length === 0) {
    console.log("ℹ️  Kategori ilişkisi eklenecek mekan bulunamadı");
    return;
  }

  const { error } = await supabase
    .from("place_categories")
    .upsert(placeCategories, { onConflict: "place_id, category_id" });

  if (error) throw new Error(`Place categories seed error: ${error.message}`);
  console.log(`✅ ${placeCategories.length} mekan-kategori ilişkisi eklendi`);
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

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@senidebekleriz.com";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required."
    );
  }

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const adminExists = existingUsers?.users?.some(
    (u) => u.email === adminEmail
  );

  if (adminExists) {
    const existingUser = existingUsers?.users?.find((u) => u.email === adminEmail);
    if (existingUser) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: adminPassword,
          user_metadata: { full_name: "Admin", role: "admin" },
        }
      );
      if (updateError) {
        console.error("Admin şifresi güncellenemedi:", updateError.message);
      } else {
        console.log("✅ Admin şifresi güncellendi");
      }
    }
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: "Admin", role: "admin" },
  });

  if (error) throw new Error(`Admin user seed error: ${error.message}`);
  console.log("✅ Admin kullanıcısı oluşturuldu:", data.user.email);
}

async function main() {
  console.log("Supabase veri aktarımı başlıyor...\n");

  await seedCities();
  await seedCategories();
  await seedPlaces();
  await seedPages();
  await seedAdPlacements();
  await seedAdminUser();

  console.log("\n🎉 Tüm veriler başarıyla aktarıldı!");
  console.log("\n📌 Diğer şehirlerin mekanlarını çekmek için:");
  console.log("   npm run fetch-places          # Tüm şehirler");
  console.log("   npm run fetch-places ankara    # Tek şehir");
}

main().catch((err) => {
  console.error("\n❌ Hata:", err.message);
  process.exit(1);
});
