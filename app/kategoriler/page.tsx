import { Metadata } from "next";
import { getAllCategories } from "@/lib/data/categories";
import { resolveAllCategoryCovers } from "@/lib/data/category-images";
import { CategoriesExplorer } from "@/components/categories/categories-explorer";

export const metadata: Metadata = {
  title: "Kategoriler",
  description:
    "Mekanları kategoriye göre keşfedin. Müzeler, tarihi yerler, sanat mekanları ve daha fazlası.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, covers] = await Promise.all([
    getAllCategories(),
    resolveAllCategoryCovers(),
  ]);

  const categoryItems = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    description: category.description,
    icon: category.icon,
    coverImage: covers[category.slug]?.url ?? null,
  }));

  return <CategoriesExplorer categories={categoryItems} />;
}
