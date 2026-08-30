import { Metadata } from "next";
import { getAllCategories } from "@/lib/data/categories";
import { resolveAllCategoryCovers } from "@/lib/data/category-images";
import { CategoriesExplorer } from "@/components/categories/categories-explorer";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";

export const metadata: Metadata = {
  title: "Kategoriler",
  description:
    "Mekanları kategoriye göre keşfedin. Müzeler, tarihi yerler, sanat mekanları ve daha fazlası.",
  alternates: {
    canonical: "/kategoriler",
  },
  openGraph: {
    title: "Kategoriler | Türkiye Kültür ve Sanat Rehberi",
    description:
      "Mekanları kategoriye göre keşfedin. Müzeler, tarihi yerler, sanat mekanları ve daha fazlası.",
    type: "website",
  },
};

export const revalidate = 604800;

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

  const heroMosaic = [
    "tarihi-yer",
    "muzeler",
    "sanat-mekanlari",
    "parklar",
  ]
    .map((slug) => covers[slug]?.url)
    .filter((url): url is string => Boolean(url));

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Ana Sayfa", path: "/" },
          { name: "Kategoriler", path: "/kategoriler" },
        ]}
      />
      <CategoriesExplorer categories={categoryItems} heroMosaic={heroMosaic} />
    </>
  );
}
