"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// Cities
export async function createCity(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    slug: slugify(formData.get("slug") as string),
    region: formData.get("region") as string,
    description: formData.get("description") as string,
    lat: parseFloat(formData.get("lat") as string) || 0,
    lng: parseFloat(formData.get("lng") as string) || 0,
    population: parseInt(formData.get("population") as string) || 0,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabaseAdmin.from("cities").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/sehirler");
  revalidatePath("/yonetim/sehirler");
  redirect("/yonetim/sehirler");
}

export async function updateCity(slug: string, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    slug: slugify(formData.get("slug") as string),
    region: formData.get("region") as string,
    description: formData.get("description") as string,
    lat: parseFloat(formData.get("lat") as string) || 0,
    lng: parseFloat(formData.get("lng") as string) || 0,
    population: parseInt(formData.get("population") as string) || 0,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabaseAdmin
    .from("cities")
    .update(data)
    .eq("slug", slug);
  if (error) throw new Error(error.message);

  revalidatePath("/sehirler");
  revalidatePath("/yonetim/sehirler");
  redirect("/yonetim/sehirler");
}

export async function deleteCity(id: string) {
  const { error } = await supabaseAdmin.from("cities").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/sehirler");
  revalidatePath("/yonetim/sehirler");
}

// Categories
export async function createCategory(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    slug: slugify(formData.get("slug") as string),
    icon: formData.get("icon") as string,
    color: formData.get("color") as string,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabaseAdmin.from("categories").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/kategoriler");
  revalidatePath("/yonetim/kategoriler");
  redirect("/yonetim/kategoriler");
}

export async function updateCategory(slug: string, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    slug: slugify(formData.get("slug") as string),
    icon: formData.get("icon") as string,
    color: formData.get("color") as string,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabaseAdmin
    .from("categories")
    .update(data)
    .eq("slug", slug);
  if (error) throw new Error(error.message);

  revalidatePath("/kategoriler");
  revalidatePath("/yonetim/kategoriler");
  redirect("/yonetim/kategoriler");
}

export async function deleteCategory(id: string) {
  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/kategoriler");
  revalidatePath("/yonetim/kategoriler");
}

// Places
export async function createPlace(formData: FormData) {
  const { data: city } = await supabaseAdmin
    .from("cities")
    .select("id")
    .eq("slug", formData.get("city_slug") as string)
    .single();

  if (!city) throw new Error("Şehir bulunamadı");

  const placeData = {
    city_id: city.id,
    name: formData.get("name") as string,
    slug: slugify(formData.get("slug") as string),
    description: formData.get("description") as string,
    address: formData.get("address") as string,
    lat: parseFloat(formData.get("lat") as string) || 0,
    lng: parseFloat(formData.get("lng") as string) || 0,
    source: formData.get("source") as string,
    is_active: formData.get("is_active") === "on",
  };

  const { data: place, error } = await supabaseAdmin
    .from("places")
    .insert(placeData)
    .select()
    .single();

  if (error || !place) throw new Error(error?.message || "Mekan oluşturulamadı");

  // Link to category
  const categorySlug = formData.get("category_slug") as string;
  if (categorySlug) {
    const { data: category } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (category) {
      await supabaseAdmin
        .from("place_categories")
        .insert({ place_id: place.id, category_id: category.id });
    }
  }

  revalidatePath("/sehirler");
  revalidatePath("/yonetim/mekanlar");
  redirect("/yonetim/mekanlar");
}

export async function updatePlace(slug: string, formData: FormData) {
  const placeData = {
    name: formData.get("name") as string,
    slug: slugify(formData.get("slug") as string),
    description: formData.get("description") as string,
    address: formData.get("address") as string,
    lat: parseFloat(formData.get("lat") as string) || 0,
    lng: parseFloat(formData.get("lng") as string) || 0,
    source: formData.get("source") as string,
    is_active: formData.get("is_active") === "on",
  };

  const { data: place, error } = await supabaseAdmin
    .from("places")
    .update(placeData)
    .eq("slug", slug)
    .select()
    .single();

  if (error || !place) throw new Error(error?.message || "Mekan güncellenemedi");

  // Update category link
  const categorySlug = formData.get("category_slug") as string;
  if (categorySlug) {
    const { data: category } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (category) {
      await supabaseAdmin
        .from("place_categories")
        .delete()
        .eq("place_id", place.id);
      await supabaseAdmin
        .from("place_categories")
        .insert({ place_id: place.id, category_id: category.id });
    }
  }

  revalidatePath("/sehirler");
  revalidatePath("/yonetim/mekanlar");
  redirect("/yonetim/mekanlar");
}

export async function deletePlace(id: string) {
  const { error } = await supabaseAdmin.from("places").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/sehirler");
  revalidatePath("/yonetim/mekanlar");
}

// Pages
export async function createPage(formData: FormData) {
  const data = {
    title: formData.get("title") as string,
    slug: slugify(formData.get("slug") as string),
    content: formData.get("content") as string,
    meta_title: formData.get("meta_title") as string,
    meta_description: formData.get("meta_description") as string,
    is_published: formData.get("is_published") === "on",
  };

  const { error } = await supabaseAdmin.from("pages").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/yonetim/sayfalar");
  redirect("/yonetim/sayfalar");
}

export async function updatePage(slug: string, formData: FormData) {
  const data = {
    title: formData.get("title") as string,
    slug: slugify(formData.get("slug") as string),
    content: formData.get("content") as string,
    meta_title: formData.get("meta_title") as string,
    meta_description: formData.get("meta_description") as string,
    is_published: formData.get("is_published") === "on",
  };

  const { error } = await supabaseAdmin
    .from("pages")
    .update(data)
    .eq("slug", slug);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/yonetim/sayfalar");
  redirect("/yonetim/sayfalar");
}

export async function deletePage(id: string) {
  const { error } = await supabaseAdmin.from("pages").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/yonetim/sayfalar");
}

// Ad Placements
export async function createAdPlacement(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    position: formData.get("position") as string,
    ad_unit_id: formData.get("ad_unit_id") as string,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabaseAdmin.from("ad_placements").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/yonetim/reklamlar");
  redirect("/yonetim/reklamlar");
}

export async function updateAdPlacement(id: string, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    position: formData.get("position") as string,
    ad_unit_id: formData.get("ad_unit_id") as string,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabaseAdmin
    .from("ad_placements")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/yonetim/reklamlar");
  redirect("/yonetim/reklamlar");
}

export async function deleteAdPlacement(id: string) {
  const { error } = await supabaseAdmin
    .from("ad_placements")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/yonetim/reklamlar");
}
