import { Metadata } from "next";
import { getAllCities } from "@/lib/data/cities";
import { EventForm } from "@/components/admin/event-form";
import { createEvent } from "@/lib/actions/events";

export const metadata: Metadata = {
  title: "Yeni Kültür Etkinliği Ekle",
};

export const maxDuration = 60;

type Props = {
  searchParams: Promise<{ sourceUrl?: string }>;
};

export default async function NewEventPage({ searchParams }: Props) {
  const { sourceUrl } = await searchParams;
  const cities = await getAllCities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Yeni Kültür Etkinliği Ekle</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Konser, tiyatro, sergi veya festival kaydı oluşturun ya da URL yapıştırarak AI ile otomatik doldurun.
        </p>
      </div>

      <EventForm
        action={createEvent}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        initialSourceUrl={sourceUrl}
        defaultValues={sourceUrl ? { source_url: sourceUrl } : undefined}
      />
    </div>
  );
}
