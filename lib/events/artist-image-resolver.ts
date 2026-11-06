import { slugify } from "@/lib/slugify";
import { getMediaPublicUrl } from "@/lib/storage/upload-image-from-url";
import { turkeyCities } from "@/data/turkey-cities";
import {
  resolveCuratedEventImage,
  CURATED_GENRE_IMAGES,
} from "@/lib/events/artist-matcher";

async function getSupabaseAdmin() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }
  const mod = await import("@/lib/supabase/admin");
  return mod.supabaseAdmin;
}

export const GENERIC_STOCK_CONCERT_IMAGE =
  CURATED_GENRE_IMAGES["concert-rock"] ||
  "https://xoiqkiszarzmkncwxgjc.supabase.co/storage/v1/object/public/media/events/curated/concert-rock.webp";

const WIKI_USER_AGENT = "SeniDeBekleriz/1.0 (info@senidebekleriz.com)";
const DEEZER_USER_AGENT = "SeniDeBekleriz/1.0 (info@senidebekleriz.com)";

const CITY_NAMES_SET = new Set(
  turkeyCities.map((c) => normalizeTurkish(c.name))
);

function normalizeTurkish(text: string): string {
  return (text || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr-TR")
    .trim();
}

/**
 * Checks if a given image URL belongs to generic curated concert stock images
 * (including concert-rock, concert-jazz, concert-classical).
 */
export function isGenericStockConcertImage(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes("concert-rock.webp") ||
    url.includes("/events/curated/concert-")
  );
}

export function normalizeForMatching(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLocaleLowerCase("tr-TR")
    .replace(/\([^)]*\)/g, "") // strip parenthesized notes e.g. (band), (group)
    .replace(/[^a-z0-9]/g, "");
}

function cleanCandidateString(str: string): string {
  let s = str || "";

  // Remove bracketed / parenthesized text like (Harbiye), [Live], (Canlı)
  s = s.replace(/\([^)]*\)/g, " ");
  s = s.replace(/\[[^\]]*\]/g, " ");

  // Remove collaborative concert phrases
  s = s.replace(/\s*\bile\s+beraber\s+söylüyoruz\b.*$/i, "");
  s = s.replace(/\s*\bile\b.*$/i, "");
  s = s.replace(/['’]l[ea]\b.*$/i, ""); // e.g. Suzan Kardeş’le ...

  // Remove concert / show suffixes
  s = s.replace(
    /\s*\b(konseri|konserleri|konser|resitali|turnesi|canlı|live|akustik)\b.*$/i,
    ""
  );
  s = s.replace(
    /\s*\b(rock sympho show|sympho show|symphony show|show|gösterisi)\b.*$/i,
    ""
  );
  s = s.replace(/\s*\b(the curiosity tour|tour)\s*\d*.*$/i, "");
  s = s.replace(/\s*\bkültür\s+yolu\s+festivali\b.*$/i, "");

  // Remove music genres / song collection / makam suffixes
  s = s.replace(
    /\s*\b(şarkıları|şarkılar|türküleri|türküler|ezgileri|ezgiler|nağmeleri|nağmeler|köçekçeler|faslı|fasıl)\b.*$/i,
    ""
  );

  // Remove venue / stage suffixes
  s = s.replace(
    /\s*\b(açıkhava|acikhava|harbiye|bostancı|konser salonu|kültür merkezi|sahnesi|sahne)\b.*$/i,
    ""
  );

  // Remove quotes and dashes
  s = s.replace(/["'“”«»]/g, "");
  s = s.replace(/[–—]/g, "-");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/^[-–—:,./\s]+|[-–—:,./\s]+$/g, "").trim();

  return s;
}

const GENERIC_WORDS = new Set([
  "konser",
  "konseri",
  "konserleri",
  "senfonik",
  "senfoni",
  "filarmoni",
  "resital",
  "resitali",
  "orkestra",
  "orkestrasi",
  "koro",
  "korosu",
  "festival",
  "festivali",
  "tiyatro",
  "oyun",
  "oyunu",
  "sergi",
  "sergisi",
  "etkinlik",
  "etkinligi",
  "duyuru",
  "duyurusu",
  "kultur",
  "sanat",
  "programi",
  "ajandasi",
  "dinleti",
  "dinletisi",
  "gosteri",
  "gosterisi",
  "canli",
  "akustik",
  "turne",
  "turnesi",
  "bulten",
  "haber",
  "makam",
  "fasil",
  "fasli",
  "hicazkar",
  "nihavend",
  "rast",
  "ussak",
  "huseyni",
  "hicaz",
  "kurdilihicazkar",
  "segah",
  "saba",
  "enka sanat",
  "aassm",
  "akm",
  "b.times",
  "btimes",
]);

/**
 * Extracts clean artist name candidates from an event title.
 * Examples:
 * - "Dedublüman Konseri" -> ["Dedublüman"]
 * - "Prime Orchestra Rock Sympho Show" -> ["Prime Orchestra"]
 * - "Ebru Yaşar Konseri - Antalya Kültür Yolu Festivali" -> ["Ebru Yaşar"]
 * - "Jethro Tull - The Curiosity Tour 2026" -> ["Jethro Tull"]
 * - "Ebru Gündeş ile Beraber Söylüyoruz" -> ["Ebru Gündeş"]
 * - "Yüzyüzeyken Konuşuruz Konseri" -> ["Yüzyüzeyken Konuşuruz"]
 * - "Ragheb Alama Konseri" -> ["Ragheb Alama"]
 */
export function extractArtistCandidates(title: string): string[] {
  if (!title || typeof title !== "string") return [];
  const raw = title.trim();
  const candidates: string[] = [];

  // Split by common delimiters: - , – , — , | , / , :
  const segments = raw.split(/\s*[-–—|/:]\s*/).filter(Boolean);

  let primary = segments[0] || raw;
  let secondary = segments[1];

  // If primary segment looks like a festival/series/venue rather than artist:
  const lowerPrimary = normalizeTurkish(primary);
  if (
    segments.length > 1 &&
    (lowerPrimary.includes("festival") ||
      lowerPrimary.includes("şenlik") ||
      lowerPrimary.includes("bizlik masalar") ||
      lowerPrimary.includes("etkinlik") ||
      lowerPrimary.includes("ajanda") ||
      lowerPrimary.includes("program"))
  ) {
    primary = segments[1];
    secondary = segments[0];
  }

  const cleanedPrimary = cleanCandidateString(primary);
  if (cleanedPrimary) candidates.push(cleanedPrimary);

  if (secondary) {
    const cleanedSecondary = cleanCandidateString(secondary);
    if (cleanedSecondary && !candidates.includes(cleanedSecondary)) {
      candidates.push(cleanedSecondary);
    }
  }

  // Also clean the full title
  const cleanedFull = cleanCandidateString(raw);
  if (cleanedFull && !candidates.includes(cleanedFull)) {
    candidates.push(cleanedFull);
  }

  // Handle multi-artist strings with '&' or 've'
  const multiCandidates: string[] = [];
  for (const c of candidates) {
    if (c.includes("&") || /\s+ve\s+/i.test(c)) {
      const parts = c
        .split(/\s*(?:&|\bve\b)\s*/i)
        .map(cleanCandidateString)
        .filter(Boolean);
      for (const p of parts) {
        if (!candidates.includes(p) && !multiCandidates.includes(p)) {
          multiCandidates.push(p);
        }
      }
    }
  }

  return [...candidates, ...multiCandidates]
    .map((c) => c.trim())
    .filter((c) => {
      if (c.length < 2) return false;
      const lower = normalizeTurkish(c);
      if (GENERIC_WORDS.has(lower)) return false;
      if (CITY_NAMES_SET.has(lower)) return false;
      if (/^\d+$/.test(c)) return false;
      return true;
    });
}

export function isDummyDeezerImage(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim();
  if (
    trimmed.includes("images/artist//") ||
    trimmed.includes("/artist//") ||
    trimmed.includes("artist/default") ||
    trimmed.includes("blank")
  ) {
    return true;
  }
  return false;
}

export function isArtistNameMatch(query: string, candidateName: string): boolean {
  const qClean = normalizeForMatching(query);
  const cClean = normalizeForMatching(candidateName);
  if (!qClean || !cClean) return false;
  if (qClean === cClean) return true;

  // Collaboration split segments (e.g. "Dedublüman & Çağrı Telkıvıran", "Halil Sezai feat. Cem Adrian")
  const collabRegex = /\s*(?:&|\/|\bfeat\.?|\bft\.?|\bfeaturing\b|\bve\b|\bwith\b|\+)\s*/i;
  const cSegments = candidateName
    .split(collabRegex)
    .map(normalizeForMatching)
    .filter(Boolean);
  if (cSegments.includes(qClean)) return true;

  const qSegments = query
    .split(collabRegex)
    .map(normalizeForMatching)
    .filter(Boolean);
  if (qSegments.includes(cClean)) return true;

  return false;
}

/**
 * Searches Deezer API for an authentic artist press photo.
 * Filters out dummy placeholder images, prioritizes exact name matches,
 * and ranks results by `nb_fan`.
 */
export async function fetchDeezerArtistImage(
  artistName: string
): Promise<string | null> {
  try {
    const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(
      artistName
    )}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": DEEZER_USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const list: Array<{
      id: number;
      name: string;
      picture?: string;
      picture_medium?: string;
      picture_big?: string;
      picture_xl?: string;
      nb_fan?: number;
    }> = data?.data || [];

    if (!Array.isArray(list) || list.length === 0) return null;

    // Filter by name similarity and valid (non-dummy) picture
    const validCandidates = list.filter((item) => {
      if (!isArtistNameMatch(artistName, item.name)) return false;
      const pic =
        item.picture_xl ||
        item.picture_big ||
        item.picture_medium ||
        item.picture;
      return !isDummyDeezerImage(pic);
    });

    if (validCandidates.length === 0) return null;

    const targetNorm = normalizeForMatching(artistName);

    // Rank: exact match first, then nb_fan descending
    validCandidates.sort((a, b) => {
      const aExact = normalizeForMatching(a.name) === targetNorm ? 1 : 0;
      const bExact = normalizeForMatching(b.name) === targetNorm ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return (b.nb_fan || 0) - (a.nb_fan || 0);
    });

    const best = validCandidates[0];
    const bestPic =
      best.picture_xl ||
      best.picture_big ||
      best.picture_medium ||
      best.picture ||
      null;

    return bestPic;
  } catch (err) {
    console.warn(`[Deezer] search failed for "${artistName}":`, err);
    return null;
  }
}

function isValidArtistWikipediaPage(page: {
  title?: string;
  terms?: { description?: string[] };
  extract?: string;
  thumbnail?: { source?: string };
}): boolean {
  if (!page || !page.thumbnail?.source) return false;
  const src = page.thumbnail.source;

  // Reject icons, diagrams, logos, buildings, bridges, flags
  if (
    src.endsWith(".svg") ||
    src.includes("Disambig") ||
    src.includes("Flag_of") ||
    src.includes("Coat_of_arms") ||
    src.includes("Question_mark") ||
    src.includes("Headquarters") ||
    src.includes("Bridge") ||
    src.includes("Building") ||
    src.includes("Hotel")
  ) {
    return false;
  }

  const descList = page.terms?.description || [];
  const descAndExtract = `${descList.join(" ")} ${page.extract || ""}`.toLowerCase();

  const nonArtistPatterns = [
    "voleybolcu",
    "futbolcu",
    "basketbolcu",
    "sporcu",
    "şirket",
    "sirket",
    "holding",
    "inşaat",
    "insaat",
    "köprü",
    "kopru",
    "bina",
    "cami",
    "ada",
    "ilçe",
    "ilce",
    "mahalle",
    "film",
    "filmi",
    "filmidir",
    "dizi",
    "dizisi",
    "dizisidir",
    "roman",
    "kitap",
    "disambiguation",
    "anlam ayrımı",
  ];

  const musicKeywords = [
    "şarkıcı",
    "sarkici",
    "müzisyen",
    "muzisyen",
    "müzik",
    "muzik",
    "grup",
    "rock",
    "pop",
    "sanatçı",
    "sanatci",
    "orkestra",
    "besteci",
    "solist",
    "vokal",
    "gitar",
    "keman",
    "tenor",
    "soprano",
    "piyanist",
    "çellist",
    "caz",
    "rap",
    "hip hop",
    "korosu",
    "koro",
    "türkücü",
    "singer",
    "musician",
    "music",
    "band",
    "orchestra",
    "composer",
    "violinist",
    "performer",
    "trio",
    "quartet",
    "ensemble",
    "pianist",
    "guitarist",
    "vocalist",
  ];

  const hasNonArtist = nonArtistPatterns.some((pattern) =>
    descAndExtract.includes(pattern)
  );
  const hasMusic = musicKeywords.some((pattern) =>
    descAndExtract.includes(pattern)
  );

  if (hasNonArtist && !hasMusic) {
    return false;
  }

  // If text is available, ensure it is relevant to music / performing arts
  if (descAndExtract.trim().length > 0 && !hasMusic) {
    return false;
  }

  return true;
}

/**
 * Secondary fallback: TR and EN Wikipedia API for authentic artist photos.
 * Uses `pageterms` and introductory `extracts` to verify that the matched page belongs to a real musical artist.
 */
export async function fetchWikipediaArtistImage(
  artistName: string
): Promise<string | null> {
  const languages = ["tr", "en"];

  for (const lang of languages) {
    // 1. Direct pageimages + pageterms + extracts check
    try {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        artistName
      )}&prop=pageimages|pageterms|extracts&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=1200&format=json&origin=*`;

      const res = await fetch(url, {
        headers: { "User-Agent": WIKI_USER_AGENT },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages || {};
        for (const pid of Object.keys(pages)) {
          const page = pages[pid];
          if (!page.missing && isValidArtistWikipediaPage(page)) {
            return page.thumbnail.source;
          }
        }
      }
    } catch {
      // Continue to search
    }

    // 2. Search check if direct title had no thumbnail
    try {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        artistName
      )}&srlimit=3&format=json&origin=*`;

      const sRes = await fetch(searchUrl, {
        headers: { "User-Agent": WIKI_USER_AGENT },
        signal: AbortSignal.timeout(8000),
      });

      if (sRes.ok) {
        const sData = await sRes.json();
        const searchResults: Array<{ title: string }> =
          sData.query?.search || [];

        for (const hit of searchResults) {
          if (!isArtistNameMatch(artistName, hit.title)) continue;

          const pageUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
            hit.title
          )}&prop=pageimages|pageterms|extracts&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=1200&format=json&origin=*`;

          const pRes = await fetch(pageUrl, {
            headers: { "User-Agent": WIKI_USER_AGENT },
            signal: AbortSignal.timeout(8000),
          });

          if (pRes.ok) {
            const pData = await pRes.json();
            const pages = pData.query?.pages || {};
            for (const pid of Object.keys(pages)) {
              const page = pages[pid];
              if (!page.missing && isValidArtistWikipediaPage(page)) {
                return page.thumbnail.source;
              }
            }
          }
        }
      }
    } catch {
      // Continue to next language
    }
  }

  return null;
}

/**
 * Downloads image buffer, converts with sharp to WebP, and uploads to
 * Supabase Storage bucket `media` at path `events/artists/<slug>.webp`.
 */
export async function downloadAndStoreArtistImage(
  sourceImageUrl: string,
  artistSlug: string
): Promise<string | null> {
  const safeSlug = slugify(artistSlug || "artist") || "artist";
  const storagePath = `events/artists/${safeSlug}.webp`;

  try {
    const res = await fetch(sourceImageUrl, {
      headers: {
        "User-Agent": WIKI_USER_AGENT,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!res.ok) return null;
    if (isDummyDeezerImage(res.url)) return null;

    const arrayBuffer = await res.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    if (inputBuffer.length < 600) return null;

    const sharpMod = await import("sharp");
    const sharpFn = sharpMod.default || sharpMod;

    const webpBuffer = await sharpFn(inputBuffer, { failOn: "none" })
      .rotate()
      .resize({
        width: 1400,
        height: 1400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 4 })
      .toBuffer();

    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.warn("[Storage] Supabase credentials missing, skipping storage upload");
      return null;
    }

    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(storagePath, webpBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (error) {
      console.error(`[Storage] Failed to upload ${storagePath}:`, error.message);
      return null;
    }

    return getMediaPublicUrl(storagePath);
  } catch (err) {
    console.error(`[Storage] downloadAndStoreArtistImage failed for ${sourceImageUrl}:`, err);
    return null;
  }
}

/**
 * Resolves an authentic artist press photo from Deezer (or TR/EN Wikipedia fallback),
 * processes it to WebP, stores it in Supabase, and returns its public URL.
 * If no authentic photo is found, returns null.
 */
export async function resolveArtistImage(
  title: string,
  slugHint?: string
): Promise<string | null> {
  const candidates = extractArtistCandidates(title);
  if (candidates.length === 0) return null;

  for (const candidate of candidates) {
    const artistSlug = slugify(candidate) || slugify(slugHint || "") || "artist";
    const existingUrl = getMediaPublicUrl(`events/artists/${artistSlug}.webp`);

    // Check if authentic WebP already exists in Supabase Storage cache
    try {
      const checkRes = await fetch(existingUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
      });
      if (
        checkRes.ok &&
        checkRes.headers.get("content-type")?.includes("image")
      ) {
        return existingUrl;
      }
    } catch {
      // Continue to search upstream APIs
    }

    // 1. Try Deezer
    const deezerPhoto = await fetchDeezerArtistImage(candidate);
    if (deezerPhoto) {
      const stored = await downloadAndStoreArtistImage(deezerPhoto, artistSlug);
      if (stored) return stored;
    }

    // 2. Try Wikipedia fallback
    const wikiPhoto = await fetchWikipediaArtistImage(candidate);
    if (wikiPhoto) {
      const stored = await downloadAndStoreArtistImage(wikiPhoto, artistSlug);
      if (stored) return stored;
    }
  }

  return null;
}

/**
 * Unified cover image resolver for events.
 * BANS duplicate generic concert stock photos permanently.
 *
 * For concerts:
 * - Attempts to find authentic artist photo via Deezer / Wikipedia.
 * - If found, returns authentic stored WebP image.
 * - If not found, checks sourceCover (if valid & not generic stock).
 * - If still not found, returns NULL so CulturalCoverPlaceholder renders.
 *
 * For non-concerts:
 * - Returns clean sourceCover if valid.
 * - Otherwise falls back to curated non-concert category image.
 */
export async function resolveArtistOrEventCover(event: {
  title: string;
  summary?: string | null;
  event_type?: string | null;
  sourceCover?: string | null;
  slug?: string;
}): Promise<string | null> {
  const textToScan = `${event.title} ${event.summary || ""}`.toLowerCase();
  const isConcert =
    event.event_type === "konser" ||
    /\b(konser|konseri|konserleri|resital|senfoni|filarmoni|orkestra|akustik|turnesi)\b/i.test(
      textToScan
    );

  const cleanSource =
    isGenericStockConcertImage(event.sourceCover) ||
    (isConcert && event.sourceCover?.includes("/events/curated/"))
      ? null
      : event.sourceCover || null;

  if (isConcert) {
    // Attempt authentic artist photo resolution
    const authenticArtistImage = await resolveArtistImage(
      event.title,
      event.slug
    );
    if (authenticArtistImage) {
      return authenticArtistImage;
    }

    // If sourceCover is a genuine non-stock image, keep it
    if (cleanSource) {
      return cleanSource;
    }

    // NEVER assign generic duplicate stock concert image!
    // Return null so CulturalCoverPlaceholder renders typographic seal.
    return null;
  }

  // Non-concert events (theatre, exhibition, festival, etc.)
  if (cleanSource) {
    return cleanSource;
  }

  const curated = resolveCuratedEventImage(event);
  if (isGenericStockConcertImage(curated)) {
    return null;
  }

  return curated;
}
