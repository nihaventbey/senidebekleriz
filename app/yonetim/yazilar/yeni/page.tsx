import { Metadata } from "next";
import { ArticleForm } from "@/components/admin/article-form";
import { createArticle } from "@/lib/actions/articles";
import { getAllCities } from "@/lib/data/cities";

export const metadata: Metadata = {
  title: "Yeni Yazı",
};

export default async function NewArticlePage() {
  const cities = await getAllCities();

  return (
    <ArticleForm
      action={createArticle}
      cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
    />
  );
}
