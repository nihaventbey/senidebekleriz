import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_HERO_SETTINGS,
  normalizeHeroSettings,
  type HeroSettings,
} from "@/lib/settings/hero";
import {
  DEFAULT_BRAND_SETTINGS,
  normalizeBrandSettings,
  type BrandSettings,
} from "@/lib/settings/branding";

export {
  DEFAULT_HERO_SETTINGS,
  normalizeHeroSettings,
  type HeroEffect,
  type HeroOverlayTone,
  type HeroSettings,
} from "@/lib/settings/hero";

export {
  DEFAULT_BRAND_SETTINGS,
  normalizeBrandSettings,
  type BrandSettings,
} from "@/lib/settings/branding";

const SETTINGS_BUCKET = "site-settings";
const HERO_SETTINGS_PATH = "settings/hero.json";
const BRAND_SETTINGS_PATH = "settings/branding.json";

async function ensureSettingsBucket(): Promise<void> {
  const { data } = await supabaseAdmin.storage.getBucket(SETTINGS_BUCKET);
  if (data) return;

  await supabaseAdmin.storage.createBucket(SETTINGS_BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 64,
    allowedMimeTypes: ["application/json"],
  });
}

export async function getHeroSettings(): Promise<HeroSettings> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(SETTINGS_BUCKET)
      .download(HERO_SETTINGS_PATH);

    if (error || !data) return DEFAULT_HERO_SETTINGS;

    const text = await data.text();
    return normalizeHeroSettings(JSON.parse(text));
  } catch {
    return DEFAULT_HERO_SETTINGS;
  }
}

export async function saveHeroSettings(
  settings: HeroSettings
): Promise<{ error?: string }> {
  const payload = JSON.stringify(normalizeHeroSettings(settings), null, 2);

  await ensureSettingsBucket();

  const { error } = await supabaseAdmin.storage
    .from(SETTINGS_BUCKET)
    .upload(HERO_SETTINGS_PATH, Buffer.from(payload), {
      contentType: "application/json",
      cacheControl: "0",
      upsert: true,
    });

  if (error) return { error: error.message };
  return {};
}

export async function getBrandSettings(): Promise<BrandSettings> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(SETTINGS_BUCKET)
      .download(BRAND_SETTINGS_PATH);

    if (error || !data) return DEFAULT_BRAND_SETTINGS;

    const text = await data.text();
    return normalizeBrandSettings(JSON.parse(text));
  } catch {
    return DEFAULT_BRAND_SETTINGS;
  }
}

export async function saveBrandSettings(
  settings: BrandSettings
): Promise<{ error?: string }> {
  const payload = JSON.stringify(normalizeBrandSettings(settings), null, 2);

  await ensureSettingsBucket();

  const { error } = await supabaseAdmin.storage
    .from(SETTINGS_BUCKET)
    .upload(BRAND_SETTINGS_PATH, Buffer.from(payload), {
      contentType: "application/json",
      cacheControl: "0",
      upsert: true,
    });

  if (error) return { error: error.message };
  return {};
}
