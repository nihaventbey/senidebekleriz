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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Yeni Blog Yazısı</h1>
      <ArticleForm
        action={createArticle}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </div>
  );
}
