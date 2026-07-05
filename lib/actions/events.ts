"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { importEventFromUrl } from "@/lib/ai/import-event-from-url";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminEventBySlug } from "@/lib/data/admin-events";
import { slugify } from "@/lib/slugify";
import type { EventType } from "@/lib/events/types";

function revalidateEventPaths() {
  revalidatePath("/");
  revalidatePath("/etkinlikler");
  revalidatePath("/yonetim/etkinlikler");
}

function toIsoDatetime(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function eventFromForm(formData: FormData) {
  const citySlug = (formData.get("city_slug") as string) || null;
  const startsAt = toIsoDatetime((formData.get("starts_at") as string) || null);
  const endsAt = toIsoDatetime((formData.get("ends_at") as string) || null);
  const expiresAt = toIsoDatetime(
    (formData.get("expires_at") as string) || null
  );

  return {
    title: formData.get("title") as string,
    slug: slugify(formData.get("slug") as string),
    summary: ((formData.get("summary") as string) || "").slice(0, 160),
    description: (formData.get("description") as string) || null,
    event_type: (formData.get("event_type") as EventType) || "duyuru",
    source_name: (formData.get("source_name") as string) || null,
    source_url: (formData.get("source_url") as string) || null,
    ticket_url: (formData.get("ticket_url") as string) || null,
    city_slug: citySlug && citySlug !== "none" ? citySlug : null,
    venue_name: (formData.get("venue_name") as string) || null,
    starts_at: startsAt,
    ends_at: endsAt,
    cover_image: (formData.get("cover_image") as string) || null,
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    is_featured: formData.get("is_featured") === "on",
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };
}

export async function createEvent(formData: FormData) {
  const data = eventFromForm(formData);
  const publishNow = formData.get("publish_now") === "on";

  const { error } = await supabaseAdmin.from("cultural_events").insert({
    ...data,
    status: publishNow ? "published" : "pending_review",
    published_at: publishNow ? new Date().toISOString() : null,
  });

  if (error) throw new Error(error.message);

  revalidateEventPaths();
  redirect("/yonetim/etkinlikler");
}

export async function updateEvent(slug: string, formData: FormData) {
  const data = eventFromForm(formData);
  const existing = await getAdminEventBySlug(slug);
  const wantsPublished = formData.get("is_published") === "on";

  const statusUpdate: {
    status?: "published" | "pending_review";
    published_at?: string | null;
  } = {};

  if (existing) {
    if (wantsPublished && existing.status !== "published") {
      statusUpdate.status = "published";
      statusUpdate.published_at = new Date().toISOString();
    } else if (!wantsPublished && existing.status === "published") {
      statusUpdate.status = "pending_review";
      statusUpdate.published_at = null;
    }
  }

  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      ...data,
      ...statusUpdate,
    })
    .eq("slug", slug);

  if (error) throw new Error(error.message);

  revalidateEventPaths();
  if (existing?.status === "published" || statusUpdate.status === "published") {
    revalidatePath(`/etkinlik/${slug}`);
  }
  redirect("/yonetim/etkinlikler");
}

export async function approveEvent(id: string) {
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function unpublishEvent(id: string) {
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      status: "pending_review",
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function rejectEvent(id: string) {
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function deleteEvent(id: string) {
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
  redirect("/yonetim/etkinlikler");
}

export async function importEventFromUrlAction(url: string) {
  const imported = await importEventFromUrl(url);

  if (!imported.is_cultural_event) {
    return { error: "Bu URL kültür/sanat etkinliği olarak sınıflandırılamadı." };
  }

  const slug = slugify(imported.title);
  const { data, error } = await supabaseAdmin
    .from("cultural_events")
    .insert({
      title: imported.title,
      slug,
      summary: imported.summary.slice(0, 160),
      event_type: imported.event_type,
      status: "pending_review",
      source_name: new URL(url).hostname,
      source_url: url,
      ticket_url: imported.ticket_url || url,
      city_slug: imported.city_slug,
      venue_name: imported.venue_name,
      starts_at: imported.starts_at,
      ends_at: imported.ends_at,
      cover_image: imported.cover_image || null,
      raw_payload: { imported },
      updated_at: new Date().toISOString(),
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Bu URL zaten kuyrukta veya yayında." };
    }
    return { error: error.message };
  }

  revalidateEventPaths();
  return { success: true, slug: data.slug };
}
