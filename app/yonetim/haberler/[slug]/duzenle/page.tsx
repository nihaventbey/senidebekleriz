import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCities } from "@/lib/data/cities";
import { getAdminNewsBySlug } from "@/lib/data/admin-news";
import { updateNews, deleteNews } from "@/lib/actions/news";
import { NewsForm } from "@/components/admin/news-form";

export const metadata: Metadata = {
  title: "Haberi Düzenle",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditNewsPage({ params }: Props) {
  const { slug } = await params;
  const [news, cities] = await Promise.all([
    getAdminNewsBySlug(slug),
    getAllCities(),
  ]);

  if (!news) {
    notFound();
  }

  const boundUpdate = updateNews.bind(null, news.slug);
  const boundDelete = deleteNews.bind(null, news.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Haberi Düzenle</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Haber başlığı, metni, kategorisi ve kapak görselini güncelleyin.
        </p>
      </div>

      <NewsForm
        action={boundUpdate}
        deleteAction={boundDelete}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        currentSlug={news.slug}
        defaultValues={{
          title: news.title,
          slug: news.slug,
          summary: news.summary || "",
          content: news.content,
          category: news.category,
          cover_image: news.cover_image,
          city_slug: news.city_slug,
          source_name: news.source_name,
          source_url: news.source_url,
          is_published: news.is_published,
          is_featured: news.is_featured,
        }}
      />
    </div>
  );
}
