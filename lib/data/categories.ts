import { supabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORY_ICON_NAMES } from "@/lib/data/category-icons";

export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
};

const EXCLUDED_CATEGORY_SLUGS = new Set(["restoranlar"]);

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "tarihi-yer":
    "Türkiye'nin zengin tarihinden izler taşıyan camiler, kiliseler, saraylar, anıtlar ve antik kalıntılar.",
  muzeler:
    "Sanat, arkeoloji ve kültürü bir araya getiren müzeler ile sergi alanları.",
  "sanat-mekanlari":
    "Galeriler, tiyatrolar, sanat merkezleri ve çağdaş sanat mekanları.",
  parklar:
    "Tarihi parklar, botanik bahçeleri ve kültürel peyzaj alanları.",
};

const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    id: "tarihi-yer",
    name: "Tarihi Yer",
    slug: "tarihi-yer",
    icon: "Landmark",
    description: CATEGORY_DESCRIPTIONS["tarihi-yer"],
  },
  {
    id: "muzeler",
    name: "Müzeler",
    slug: "muzeler",
    icon: "LibraryBig",
    description: CATEGORY_DESCRIPTIONS.muzeler,
  },
  {
    id: "sanat-mekanlari",
    name: "Sanat Mekanları",
    slug: "sanat-mekanlari",
    icon: "Palette",
    description: CATEGORY_DESCRIPTIONS["sanat-mekanlari"],
  },
  {
    id: "parklar",
    name: "Parklar",
    slug: "parklar",
    icon: "TreePine",
    description: CATEGORY_DESCRIPTIONS.parklar,
  },
];

function mapCategoryRow(category: {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}): CategoryData {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: CATEGORY_ICON_NAMES[category.slug] || category.icon || "Landmark",
    description: CATEGORY_DESCRIPTIONS[category.slug] || "",
  };
}

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

  const rows = (data || []).filter((c) => !EXCLUDED_CATEGORY_SLUGS.has(c.slug));

  if (rows.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  return rows.map(mapCategoryRow);
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryData | undefined> {
  if (EXCLUDED_CATEGORY_SLUGS.has(slug)) {
    return undefined;
  }

  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return DEFAULT_CATEGORIES.find((c) => c.slug === slug);
  }

  return mapCategoryRow(data);
}
