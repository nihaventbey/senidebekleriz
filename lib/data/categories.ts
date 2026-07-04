import { supabaseAdmin } from "@/lib/supabase/admin";

export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
};

const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    id: "tarihi-yer",
    name: "Tarihi Yer",
    slug: "tarihi-yer",
    icon: "Landmark",
    description:
      "Türkiye'nin zengin tarihinden izler taşıyan camiler, kiliseler, saraylar ve antik kalıntılar.",
  },
  {
    id: "muzeler",
    name: "Müzeler",
    slug: "muzeler",
    icon: "Camera",
    description:
      "Sanat, tarih ve kültürü bir araya getiren müzeler ve sergi alanları.",
  },
  {
    id: "parklar",
    name: "Parklar",
    slug: "parklar",
    icon: "TreePine",
    description:
      "Şehir içinde nefes alabileceğiniz yeşil alanlar, botanik bahçeleri ve parklar.",
  },
  {
    id: "restoranlar",
    name: "Restoranlar",
    slug: "restoranlar",
    icon: "Utensils",
    description:
      "Yerel lezzetlerden dünya mutfağına şehirlerin en iyi yeme-içme mekanları.",
  },
];

export async function getAllCategories(): Promise<CategoryData[]> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("getAllCategories error:", error.message);
    return DEFAULT_CATEGORIES;
  }

  if (!data || data.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  return data.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon || "Landmark",
    description: "",
  }));
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return DEFAULT_CATEGORIES.find((c) => c.slug === slug);
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon || "Landmark",
    description: "",
  };
}
