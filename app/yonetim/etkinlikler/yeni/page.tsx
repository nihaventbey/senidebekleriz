import { Metadata } from "next";
import { getAllCities } from "@/lib/data/cities";
import { getArtistCardSettings } from "@/lib/data/site-settings";
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
  const [cities, artistCardSettings] = await Promise.all([
    getAllCities(),
    getArtistCardSettings(),
  ]);

  return (
    <EventForm
      action={createEvent}
      cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
      initialSourceUrl={sourceUrl}
      defaultValues={sourceUrl ? { source_url: sourceUrl } : undefined}
      globalShowArtistInfoCards={artistCardSettings.showArtistInfoCards}
    />
  );
}
