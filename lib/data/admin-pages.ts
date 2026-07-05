import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminPageListItem = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  updated_at: string;
};

export async function getAdminPages(): Promise<AdminPageListItem[]> {
  const { data, error } = await supabaseAdmin
    .from("pages")
    .select("id, title, slug, is_published, updated_at")
    .order("title");

  if (error) {
    console.error("getAdminPages error:", error.message);
    return [];
  }

  return data || [];
}
