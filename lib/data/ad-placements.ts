import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdPlacementConfig = {
  adUnitId: string;
  adFormat: string | null;
  adLayoutKey: string | null;
};

type AdPlacementRowBasic = {
  position: string;
  ad_unit_id: string | null;
};

type AdPlacementRowFull = AdPlacementRowBasic & {
  ad_format: string | null;
  ad_layout_key: string | null;
};

function toConfig(
  row: AdPlacementRowBasic,
  format: string | null = null,
  layoutKey: string | null = null
): AdPlacementConfig | null {
  const unitId = row.ad_unit_id?.trim();
  if (!unitId) return null;

  return {
    adUnitId: unitId,
    adFormat: format,
    adLayoutKey: layoutKey,
  };
}

export async function getActiveAdSlotMap(): Promise<
  Record<string, AdPlacementConfig>
> {
  const full = await supabaseAdmin
    .from("ad_placements")
    .select("position, ad_unit_id, ad_format, ad_layout_key")
    .eq("is_active", true)
    .not("ad_unit_id", "is", null);

  const map: Record<string, AdPlacementConfig> = {};

  if (full.error?.message?.includes("ad_format")) {
    const basic = await supabaseAdmin
      .from("ad_placements")
      .select("position, ad_unit_id")
      .eq("is_active", true)
      .not("ad_unit_id", "is", null);

    if (basic.error) {
      console.error("getActiveAdSlotMap error:", basic.error.message);
      return {};
    }

    for (const row of (basic.data || []) as AdPlacementRowBasic[]) {
      const config = toConfig(row);
      if (config) map[row.position] = config;
    }

    return map;
  }

  if (full.error) {
    console.error("getActiveAdSlotMap error:", full.error.message);
    return {};
  }

  for (const row of (full.data || []) as AdPlacementRowFull[]) {
    const config = toConfig(row, row.ad_format, row.ad_layout_key);
    if (config) map[row.position] = config;
  }

  return map;
}
