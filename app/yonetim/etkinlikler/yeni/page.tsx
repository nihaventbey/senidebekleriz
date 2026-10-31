import { Metadata } from "next";
import { getAllCities } from "@/lib/data/cities";
import { EventForm } from "@/components/admin/event-form";
import { createEvent } from "@/lib/actions/events";

export const metadata: Metadata = {
  title: "Yeni Etkinlik",
};

type Props = {
  searchParams: Promise<{ sourceUrl?: string }>;
};

export default async function NewEventPage({ searchParams }: Props) {
  const { sourceUrl } = await searchParams;
  const cities = await getAllCities();

  return (
    <EventForm
      action={createEvent}
      cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
      defaultValues={sourceUrl ? { source_url: sourceUrl } : undefined}
    />
  );
}
