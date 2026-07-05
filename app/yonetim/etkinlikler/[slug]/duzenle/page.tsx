import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCities } from "@/lib/data/cities";
import { getAdminEventBySlug } from "@/lib/data/admin-events";
import { EventForm } from "@/components/admin/event-form";
import { updateEvent, deleteEvent } from "@/lib/actions/events";

export const metadata: Metadata = {
  title: "Etkinlik Düzenle",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditEventPage({ params }: Props) {
  const { slug } = await params;
  const [event, cities] = await Promise.all([
    getAdminEventBySlug(slug),
    getAllCities(),
  ]);

  if (!event) notFound();

  const eventId = event.id;

  async function updateAction(formData: FormData) {
    "use server";
    await updateEvent(slug, formData);
  }

  async function deleteAction() {
    "use server";
    await deleteEvent(eventId);
  }

  return (
    <EventForm
      action={updateAction}
      deleteAction={deleteAction}
      cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
      defaultValues={event}
    />
  );
}
