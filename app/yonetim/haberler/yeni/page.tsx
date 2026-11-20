import { Metadata } from "next";
import { getAllCities } from "@/lib/data/cities";
import { createNews } from "@/lib/actions/news";
import { NewsForm } from "@/components/admin/news-form";

export const metadata: Metadata = {
  title: "Yeni Kültür Haberi Ekle",
};

export const maxDuration = 60;

type Props = {
  searchParams: Promise<{ sourceUrl?: string }>;
};

export default async function NewNewsPage({ searchParams }: Props) {
  const { sourceUrl } = await searchParams;
  const cities = await getAllCities();

  return (
    <NewsForm
      action={createNews}
      cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
      initialSourceUrl={sourceUrl}
    />
  );
}
