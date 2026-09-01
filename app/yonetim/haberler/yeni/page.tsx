import { Metadata } from "next";
import { getAllCities } from "@/lib/data/cities";
import { createNews } from "@/lib/actions/news";
import { NewsForm } from "@/components/admin/news-form";

export const metadata: Metadata = {
  title: "Yeni Kültür Haberi Ekle",
};

export default async function NewNewsPage() {
  const cities = await getAllCities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Yeni Kültür Haberi Ekle</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Arkeoloji, müze, restorasyon veya kültür-sanat haberi oluşturun veya URL yapıştırarak AI ile üretin.
        </p>
      </div>

      <NewsForm
        action={createNews}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </div>
  );
}
