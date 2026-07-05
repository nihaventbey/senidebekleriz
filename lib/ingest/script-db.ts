import type { SupabaseClient } from "@supabase/supabase-js";

/** Kolon yoksa (migration öncesi) yalnızca temel alanları günceller. */
export async function updateCityCoverImage(
  supabase: SupabaseClient,
  cityId: string,
  publicUrl: string,
  source: "wikimedia" | "valilik" = "wikimedia"
): Promise<string | null> {
  const withSource = await supabase
    .from("cities")
    .update({
      cover_image: publicUrl,
      cover_image_source: source,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cityId);

  if (!withSource.error) return null;

  if (
    !withSource.error.message.includes("cover_image_source") &&
    !withSource.error.message.includes("cover_image_locked")
  ) {
    return withSource.error.message;
  }

  const basic = await supabase
    .from("cities")
    .update({
      cover_image: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cityId);

  return basic.error?.message ?? null;
}

/** Kolon yoksa (migration öncesi) yalnızca temel alanları günceller. */
export async function updatePlaceCoverImage(
  supabase: SupabaseClient,
  placeId: string,
  publicUrl: string
): Promise<string | null> {
  const withSource = await supabase
    .from("places")
    .update({
      cover_image: publicUrl,
      cover_image_source: "wikimedia",
      updated_at: new Date().toISOString(),
    })
    .eq("id", placeId);

  if (!withSource.error) return null;

  if (
    !withSource.error.message.includes("cover_image_source") &&
    !withSource.error.message.includes("cover_image_locked")
  ) {
    return withSource.error.message;
  }

  const basic = await supabase
    .from("places")
    .update({
      cover_image: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", placeId);

  return basic.error?.message ?? null;
}
