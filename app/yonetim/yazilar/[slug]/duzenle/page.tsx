import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/article-form";
import { updateArticle, deleteArticle } from "@/lib/actions/articles";
import { getAdminArticleBySlug } from "@/lib/data/admin-articles";
import { getAllCities } from "@/lib/data/cities";

export const metadata: Metadata = {
  title: "Yazı Düzenle",
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, cities] = await Promise.all([
    getAdminArticleBySlug(slug),
    getAllCities(),
  ]);

  if (!article) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Yazı Düzenle</h1>
      <ArticleForm
        currentSlug={slug}
        action={updateArticle.bind(null, slug)}
        deleteAction={deleteArticle.bind(null, article.id)}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        defaultValues={{
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          cover_image: article.cover_image,
          city_slug: article.city_slug,
          meta_title: article.meta_title,
          meta_description: article.meta_description,
          is_published: article.is_published,
        }}
      />
    </div>
  );
}
