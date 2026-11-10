/**
 * Cover image focal point (X/Y axis) helper.
 *
 * Stores non-destructive focal coordinates in the URL hash (`#pos=X,Y`)
 * or parses existing `?pos=X,Y` / `#pos=X,Y` parameters so every table
 * (`cultural_news`, `cultural_events`, `articles`, `cities`) supports
 * custom X/Y panning without database schema migrations.
 *
 * Smart Portrait Default:
 * When no custom focal point is specified, defaults to `x = 50`, `y = 22`
 * (`object-position: 50% 22%`, upper-third rule of thirds) instead of CSS's
 * `50% 50%` vertical center, preventing heads/faces from being cropped in
 * landscape (`16:9` / `21:9`) card and hero containers.
 */

export const DEFAULT_FOCAL_X = 50;
export const DEFAULT_FOCAL_Y = 22;

export type CoverImagePosition = {
  /** Clean image URL without `#pos=...` hash (safe for OpenGraph / JSON-LD) */
  src: string;
  /** Original full value including `#pos=X,Y` if present */
  rawUrl: string;
  /** Horizontal focal point percentage (0 = left edge, 50 = center, 100 = right edge) */
  x: number;
  /** Vertical focal point percentage (0 = top edge, 22 = upper-third head-safe default, 50 = center, 100 = bottom edge) */
  y: number;
  /** Ready-to-use CSS `object-position` string, e.g. `"50% 22%"` */
  objectPosition: string;
  /** Whether the URL explicitly contained custom focal coordinates */
  hasCustomPosition: boolean;
};

function clampPercent(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

const HASH_POS_REGEX = /#pos=(\d{1,3}(?:\.\d+)?)[,:](\d{1,3}(?:\.\d+)?)$/i;
const QUERY_POS_REGEX = /([?&])pos=(\d{1,3}(?:\.\d+)?)[,:](\d{1,3}(?:\.\d+)?)(?=&|#|$)/i;

/**
 * Parses a cover image URL and extracts its X/Y focal coordinates.
 */
export function parseCoverImage(
  rawUrl: string | null | undefined,
  defaultX: number = DEFAULT_FOCAL_X,
  defaultY: number = DEFAULT_FOCAL_Y
): CoverImagePosition {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    const x = clampPercent(defaultX, DEFAULT_FOCAL_X);
    const y = clampPercent(defaultY, DEFAULT_FOCAL_Y);
    return {
      src: "",
      rawUrl: "",
      x,
      y,
      objectPosition: `${x}% ${y}%`,
      hasCustomPosition: false,
    };
  }

  // 1. Check `#pos=X,Y` at the end of the URL
  const hashMatch = trimmed.match(HASH_POS_REGEX);
  if (hashMatch) {
    const x = clampPercent(Number(hashMatch[1]), defaultX);
    const y = clampPercent(Number(hashMatch[2]), defaultY);
    const cleanSrc = trimmed.replace(HASH_POS_REGEX, "");
    return {
      src: cleanSrc,
      rawUrl: trimmed,
      x,
      y,
      objectPosition: `${x}% ${y}%`,
      hasCustomPosition: true,
    };
  }

  // 2. Check `?pos=X,Y` or `&pos=X,Y` in query string
  const queryMatch = trimmed.match(QUERY_POS_REGEX);
  if (queryMatch) {
    const x = clampPercent(Number(queryMatch[2]), defaultX);
    const y = clampPercent(Number(queryMatch[3]), defaultY);
    let cleanSrc = trimmed.replace(QUERY_POS_REGEX, (_full, prefix) =>
      prefix === "?" ? "?" : ""
    );
    cleanSrc = cleanSrc.replace(/\?&/, "?").replace(/\?$/, "");
    return {
      src: cleanSrc,
      rawUrl: trimmed,
      x,
      y,
      objectPosition: `${x}% ${y}%`,
      hasCustomPosition: true,
    };
  }

  const x = clampPercent(defaultX, DEFAULT_FOCAL_X);
  const y = clampPercent(defaultY, DEFAULT_FOCAL_Y);

  return {
    src: trimmed,
    rawUrl: trimmed,
    x,
    y,
    objectPosition: `${x}% ${y}%`,
    hasCustomPosition: false,
  };
}

/**
 * Encodes X/Y focal coordinates onto a cover image URL using `#pos=X,Y`.
 * If X and Y match the default (`50, 22`) and `keepDefaultHash` is false,
 * returns the clean URL without a hash.
 */
export function formatCoverImageUrl(
  rawUrl: string | null | undefined,
  x: number,
  y: number,
  keepHashAlways: boolean = true
): string {
  const parsed = parseCoverImage(rawUrl);
  if (!parsed.src) return "";

  const clampedX = clampPercent(x, DEFAULT_FOCAL_X);
  const clampedY = clampPercent(y, DEFAULT_FOCAL_Y);

  if (
    !keepHashAlways &&
    clampedX === DEFAULT_FOCAL_X &&
    clampedY === DEFAULT_FOCAL_Y
  ) {
    return parsed.src;
  }

  return `${parsed.src}#pos=${clampedX},${clampedY}`;
}
