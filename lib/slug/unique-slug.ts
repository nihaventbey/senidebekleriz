import { randomInt } from "node:crypto";
import { cleanNewsSlug } from "@/lib/ai/clean-publisher";
import { slugify } from "@/lib/slugify";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const UNIQUE_SLUG_CODE_REGEX = /-\d{6}$/;

const MAX_SLUG_ATTEMPTS = 10;

export interface BuildUniqueSlugOptions {
  fallback?: string;
  citySlug?: string | null;
  maxLength?: number;
  code?: string;
  forceNewCode?: boolean;
}

export interface AllocateUniqueNewsSlugOptions {
  existingSlug?: string;
  preserveExisting?: boolean;
}

export interface AllocateUniqueEventSlugOptions {
  citySlug?: string | null;
  ignoreId?: string;
  existingSlug?: string;
  preserveExisting?: boolean;
}

/**
 * Generates a 6-digit numeric suffix (`100000`–`999999`) for collision-free URLs.
 */
export function generateNumericSlugCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

/**
 * Returns true if the slug already ends with `-DDDDDD`.
 */
export function hasUniqueSlugSuffix(slug: string): boolean {
  return UNIQUE_SLUG_CODE_REGEX.test(slug.trim());
}

function truncateAtWordBoundary(value: string, maxLength: number): string {
  const cleaned = value.replace(/^-+|-+$/g, "");
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const sliced = cleaned.slice(0, maxLength).replace(/-+$/g, "");
  if (cleaned[maxLength] !== "-" && sliced.includes("-")) {
    const lastHyphen = sliced.lastIndexOf("-");
    if (lastHyphen > 8) {
      return sliced.slice(0, lastHyphen).replace(/-+$/g, "");
    }
  }

  return sliced;
}

/**
 * Builds a clean ASCII slug with an optional city token and a trailing 6-digit numeric code.
 * Preserves an existing trailing 6-digit code unless `forceNewCode` or `code` is provided.
 */
export function buildUniqueSlug(
  rawBase: string,
  options: BuildUniqueSlugOptions = {}
): string {
  const maxLength = Math.max(24, options.maxLength ?? 100);
  const normalizedFallback = slugify(options.fallback || "") || "icerik";
  const baseSlug = slugify(rawBase) || normalizedFallback;

  const existingMatch = baseSlug.match(UNIQUE_SLUG_CODE_REGEX);
  const existingCode = existingMatch ? existingMatch[0].slice(1) : null;
  const stem =
    (existingMatch ? baseSlug.replace(UNIQUE_SLUG_CODE_REGEX, "") : baseSlug) ||
    normalizedFallback;

  const providedCode = options.code?.trim();
  const resolvedCode =
    providedCode ||
    (!options.forceNewCode && existingCode ? existingCode : generateNumericSlugCode());

  const normalizedCity = options.citySlug ? slugify(options.citySlug) : "";
  const shouldAppendCity =
    Boolean(normalizedCity) && !`-${stem}-`.includes(`-${normalizedCity}-`);

  const suffixWithHyphen = `-${resolvedCode}`;
  const maxStemLength = Math.max(12, maxLength - suffixWithHyphen.length);

  let combinedStem: string;
  if (shouldAppendCity) {
    const cityPart = `-${normalizedCity}`;
    const maxTitleLength = maxStemLength - cityPart.length;
    if (maxTitleLength >= 10) {
      const truncatedTitle =
        truncateAtWordBoundary(stem, maxTitleLength) || normalizedFallback;
      combinedStem = `${truncatedTitle}${cityPart}`;
    } else {
      combinedStem = truncateAtWordBoundary(`${stem}${cityPart}`, maxStemLength);
    }
  } else {
    combinedStem = truncateAtWordBoundary(stem, maxStemLength);
  }

  const finalStem = combinedStem || normalizedFallback.slice(0, maxStemLength);
  return `${finalStem}${suffixWithHyphen}`;
}

async function newsSlugExists(
  candidate: string,
  excludeSlug?: string
): Promise<boolean> {
  let query = supabaseAdmin
    .from("cultural_news")
    .select("id")
    .eq("slug", candidate);

  if (excludeSlug) {
    query = query.neq("slug", excludeSlug);
  }

  const { data } = await query.maybeSingle();
  return Boolean(data);
}

async function eventSlugExists(
  candidate: string,
  ignoreId?: string,
  excludeSlug?: string
): Promise<boolean> {
  let query = supabaseAdmin
    .from("cultural_events")
    .select("id")
    .eq("slug", candidate);

  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }
  if (excludeSlug) {
    query = query.neq("slug", excludeSlug);
  }

  const { data } = await query.maybeSingle();
  return Boolean(data);
}

/**
 * Allocates a DB-verified unique slug for a news article (`<title-slug>-<6-digit>`).
 * Preserves `existingSlug` when `preserveExisting` is enabled and the slug was not changed.
 */
export async function allocateUniqueNewsSlug(
  rawTitleOrSlug: string,
  options: AllocateUniqueNewsSlugOptions = {}
): Promise<string> {
  const existingSlug = options.existingSlug?.trim();
  const normalizedBase = cleanNewsSlug(
    rawTitleOrSlug,
    existingSlug || "kultur-haberi"
  );

  if (options.preserveExisting && existingSlug) {
    if (rawTitleOrSlug.trim() === existingSlug || normalizedBase === existingSlug) {
      return existingSlug;
    }

    const customCandidate = normalizedBase.slice(0, 100);
    if (!(await newsSlugExists(customCandidate, existingSlug))) {
      return customCandidate;
    }
  }

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = buildUniqueSlug(normalizedBase, {
      fallback: "kultur-haberi",
      forceNewCode: attempt > 0,
    });
    if (!(await newsSlugExists(candidate, existingSlug))) {
      return candidate;
    }
  }

  return buildUniqueSlug(normalizedBase, {
    fallback: "kultur-haberi",
    code: `${generateNumericSlugCode()}${randomInt(10, 99)}`,
  });
}

/**
 * Allocates a DB-verified unique slug for an event (`<title-slug>[-<city-slug>]-<6-digit>`).
 * Preserves `existingSlug` when `preserveExisting` is enabled and the slug was not changed.
 */
export async function allocateUniqueEventSlug(
  rawTitleOrSlug: string,
  options: AllocateUniqueEventSlugOptions = {}
): Promise<string> {
  const existingSlug = options.existingSlug?.trim();
  const normalizedBase =
    slugify(rawTitleOrSlug) || (existingSlug ? slugify(existingSlug) : "") || "etkinlik";

  if (options.preserveExisting && existingSlug) {
    if (rawTitleOrSlug.trim() === existingSlug || normalizedBase === existingSlug) {
      return existingSlug;
    }

    const customCandidate = normalizedBase.slice(0, 100);
    if (!(await eventSlugExists(customCandidate, options.ignoreId, existingSlug))) {
      return customCandidate;
    }
  }

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = buildUniqueSlug(normalizedBase, {
      fallback: "etkinlik",
      citySlug: options.citySlug,
      forceNewCode: attempt > 0,
    });
    if (!(await eventSlugExists(candidate, options.ignoreId, existingSlug))) {
      return candidate;
    }
  }

  return buildUniqueSlug(normalizedBase, {
    fallback: "etkinlik",
    citySlug: options.citySlug,
    code: `${generateNumericSlugCode()}${randomInt(10, 99)}`,
  });
}
