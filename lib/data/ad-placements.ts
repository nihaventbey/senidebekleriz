import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdPlacementConfig = {
  adUnitId: string;
  adFormat: string | null;
  adLayoutKey: string | null;
};

export async function getActiveAdSlotMap(): Promise<
  Record<string, AdPlacementConfig>
> {
  const full = await supabaseAdmin
    .from("ad_placements")
    .select("position, ad_unit_id, ad_format, ad_layout_key")
    .eq("is_active", true)
    .not("ad_unit_id", "is", null);

  const result =
    full.error?.message?.includes("ad_format")
      ? await supabaseAdmin
          .from("ad_placements")
          .select("position, ad_unit_id")
          .eq("is_active", true)
          .not("ad_unit_id", "is", null)
      : full;

  if (result.error) {
    console.error("getActiveAdSlotMap error:", result.error.message);
    return {};
  }

  const map: Record<string, AdPlacementConfig> = {};

  for (const row of result.data || []) {
    const unitId = row.ad_unit_id?.trim();
    if (!unitId) continue;

    map[row.position] = {
      adUnitId: unitId,
      adFormat: "ad_format" in row ? (row.ad_format ?? null) : null,
      adLayoutKey:
        "ad_layout_key" in row ? (row.ad_layout_key ?? null) : null,
    };
  }

  return map;
}
