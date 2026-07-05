export type HeroEffect = "none" | "pan" | "zoom" | "parallax";
export type HeroOverlayTone = "light" | "dark";

export type HeroSettings = {
  enabled: boolean;
  imageUrl: string | null;
  effect: HeroEffect;
  overlayTone: HeroOverlayTone;
  /** 0–90 arası; arka plan görselinin üzerine binen karartma/aydınlatma yüzdesi */
  overlayOpacity: number;
  /** 0–12 px arası blur */
  blur: number;
};

export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  enabled: false,
  imageUrl: null,
  effect: "pan",
  overlayTone: "light",
  overlayOpacity: 70,
  blur: 0,
};

const HERO_EFFECTS: HeroEffect[] = ["none", "pan", "zoom", "parallax"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHeroSettings(raw: unknown): HeroSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_HERO_SETTINGS;
  const obj = raw as Record<string, unknown>;

  const effect = HERO_EFFECTS.includes(obj.effect as HeroEffect)
    ? (obj.effect as HeroEffect)
    : DEFAULT_HERO_SETTINGS.effect;

  return {
    enabled: obj.enabled === true,
    imageUrl:
      typeof obj.imageUrl === "string" && obj.imageUrl.length > 0
        ? obj.imageUrl
        : null,
    effect,
    overlayTone: obj.overlayTone === "dark" ? "dark" : "light",
    overlayOpacity: clamp(Number(obj.overlayOpacity) || 0, 0, 90),
    blur: clamp(Number(obj.blur) || 0, 0, 12),
  };
}
