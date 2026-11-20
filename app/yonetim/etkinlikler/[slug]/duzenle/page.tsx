import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCities } from "@/lib/data/cities";
import { getAdminEventBySlug } from "@/lib/data/admin-events";
import { getArtistCardSettings } from "@/lib/data/site-settings";
import { EventForm } from "@/components/admin/event-form";
import { updateEvent, deleteEvent } from "@/lib/actions/events";

export const metadata: Metadata = {
  title: "Etkinliği Düzenle",
};

export const maxDuration = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditEventPage({ params }: Props) {
  const { slug } = await params;
  const [event, cities, artistCardSettings] = await Promise.all([
    getAdminEventBySlug(slug),
    getAllCities(),
    getArtistCardSettings(),
  ]);

  if (!event) notFound();

  const boundUpdate = updateEvent.bind(null, event.slug);
  const boundDelete = deleteEvent.bind(null, event.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Etkinliği Düzenle</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Etkinlik başlığı, tarihi, mekânı, açıklaması ve kapak görselini güncelleyin.
        </p>
      </div>

      <EventForm
        action={boundUpdate}
        deleteAction={boundDelete}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        currentSlug={event.slug}
        defaultValues={event}
        globalShowArtistInfoCards={artistCardSettings.showArtistInfoCards}
      />
    </div>
  );
}
