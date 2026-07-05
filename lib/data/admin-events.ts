import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CulturalEventRow, EventStatus } from "@/lib/events/types";

export type AdminEventListItem = {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  status: EventStatus;
  city_slug: string | null;
  source_name: string | null;
  starts_at: string | null;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
};

export async function getAdminEvents(
  status?: EventStatus
): Promise<AdminEventListItem[]> {
  let query = supabaseAdmin
    .from("cultural_events")
    .select(
      "id, title, slug, event_type, status, city_slug, source_name, starts_at, is_featured, published_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getAdminEvents error:", error.message);
    return [];
  }

  return (data || []) as AdminEventListItem[];
}

export async function getAdminEventBySlug(
  slug: string
): Promise<CulturalEventRow | undefined> {
  const { data, error } = await supabaseAdmin
    .from("cultural_events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return undefined;
  return data as CulturalEventRow;
}

export async function getAdminEventById(
  id: string
): Promise<CulturalEventRow | undefined> {
  const { data, error } = await supabaseAdmin
    .from("cultural_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return undefined;
  return data as CulturalEventRow;
}

export async function countPendingEvents(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("cultural_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review");

  if (error) return 0;
  return count || 0;
}
