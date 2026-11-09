function getCuratedImageUrl(filename: string): string {
  const base = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://xoiqkiszarzmkncwxgjc.supabase.co"
  ).replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/media/events/curated/${filename}`;
}

export const CURATED_GENRE_IMAGES: Record<string, string> = {
  // Concerts
  "concert-classical": getCuratedImageUrl("concert-classical.webp"),
  "concert-jazz": getCuratedImageUrl("concert-jazz.webp"),
  "concert-rock": getCuratedImageUrl("concert-rock.webp"),
  // Theater
  "theatre-drama": getCuratedImageUrl("theatre-drama.webp"),
  "theatre-opera": getCuratedImageUrl("theatre-opera.webp"),
  "theatre-children": getCuratedImageUrl("theatre-children.webp"),
  // Exhibitions & Festivals
  "exhibition-art": getCuratedImageUrl("exhibition-art.webp"),
  "festival-heritage": getCuratedImageUrl("festival-heritage.webp"),
};

export type EventGenreKey =
  | "concert-classical"
  | "concert-jazz"
  | "concert-rock"
  | "theatre-drama"
  | "theatre-opera"
  | "theatre-children"
  | "exhibition-art"
  | "festival-heritage";

function normalizeTurkish(text: string): string {
  return (text || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr-TR")
    .trim();
}

/**
 * Checks if a candidate title is NOT a genuine single cultural event,
 * but rather a news question, municipal announcement, general roundup, or job notice.
 */
export function isNonEventTitle(title: string): boolean {
  if (!title) return true;
  const lower = normalizeTurkish(title);

  // News questions masquerading as events
  if (
    lower.endsWith("?") ||
    lower.includes("hangi etkinliklere ev sahipliği") ||
    lower.includes("neler var") ||
    lower.includes("ne zaman başlıyor") ||
    lower.includes("nasıl gidilir")
  ) {
    return true;
  }

  // Administrative / recruitment / official circulars
  if (
    lower.includes("işçi alım ilanı") ||
    lower.includes("yabancı dil sınavı") ||
    lower.includes("genelge") ||
    lower.includes("birim maliyetleri") ||
    lower.includes("meclis kararı") ||
    lower.includes("ihale ilanı") ||
    lower.includes("resmi ilan")
  ) {
    return true;
  }

  // Generic monthly agenda / program list titles that are not single events
  const genericKeywords = [
    "etkinlik programı",
    "etkinlik ajandası",
    "etkinlik takvimi",
    "etkinlik rehberi",
    "kültür sanat takvimi",
    "aylık program",
    "haftalık program",
    "bülteni",
  ];
  const isGenericRoundup = genericKeywords.some((kw) => lower.includes(kw));

  const singleEventKeywords = [
    "konseri",
    "tiyatrosu",
    "sergisi",
    "festivali",
    "oyunu",
    "resitali",
    "gösterisi",
  ];
  const isSingleEventForm = singleEventKeywords.some((kw) => lower.includes(kw));

  if (isGenericRoundup && !isSingleEventForm) {
    return true;
  }

  return false;
}

/**
 * Deterministically resolves a curated genre key based on event metadata.
 */
export function resolveCuratedGenreKey(event: {
  title: string;
  summary?: string | null;
  event_type?: string | null;
}): EventGenreKey {
  const text = normalizeTurkish(`${event.title} ${event.summary || ""}`);
  const type = normalizeTurkish(event.event_type || "");

  // Concert classification
  const isConcertType =
    type === "konser" ||
    text.includes("konser") ||
    text.includes("orkestra") ||
    text.includes("senfoni") ||
    text.includes("resital") ||
    text.includes("müzik");

  if (isConcertType) {
    const classicalKeywords = [
      "senfoni",
      "filarmoni",
      "flarmoni",
      "klasik",
      "oda müziği",
      "piyano",
      "keman",
      "çello",
      "tsm",
      "thm",
      "koro",
      "resital",
      "orkestra",
      "orchestra",
      "symphony",
      "sympho",
    ];
    if (classicalKeywords.some((kw) => text.includes(kw))) {
      return "concert-classical";
    }

    const jazzKeywords = [
      "jazz",
      "caz",
      "blues",
      "ritim",
      "akustik",
      "saksafon",
      "bi’bakıp",
      "groove",
    ];
    if (jazzKeywords.some((kw) => text.includes(kw))) {
      return "concert-jazz";
    }

    return "concert-rock";
  }

  // Theater classification
  const isTheaterType =
    type === "tiyatro" ||
    text.includes("tiyatro") ||
    text.includes("oyun") ||
    text.includes("sahne") ||
    text.includes("gösteri");

  if (isTheaterType) {
    const childrenKeywords = [
      "çocuk",
      "bebek",
      "masal",
      "kukla",
      "küçükler",
      "animasyon",
    ];
    if (childrenKeywords.some((kw) => text.includes(kw))) {
      return "theatre-children";
    }

    const operaKeywords = [
      "opera",
      "bale",
      "müzikal",
      "stand-up",
      "itiraf et",
      "şov",
      "tek kişilik gösteri",
    ];
    if (operaKeywords.some((kw) => text.includes(kw))) {
      return "theatre-opera";
    }

    return "theatre-drama";
  }

  // Exhibition classification
  const isExhibitionType =
    type === "sergi" ||
    text.includes("sergi") ||
    text.includes("resim") ||
    text.includes("heykel") ||
    text.includes("müze") ||
    text.includes("galeri") ||
    text.includes("bienal") ||
    text.includes("enstalasyon") ||
    text.includes("koleksiyon") ||
    text.includes("mozaik") ||
    text.includes("çini") ||
    text.includes("el sanatları");

  if (isExhibitionType) {
    return "exhibition-art";
  }

  // Festival classification
  const isFestivalType =
    type === "festival" ||
    text.includes("festival") ||
    text.includes("şenlik") ||
    text.includes("karnaval") ||
    text.includes("kültür yolu");

  if (isFestivalType) {
    return "festival-heritage";
  }

  // Fallbacks by keywords
  if (text.includes("çocuk")) return "theatre-children";
  if (text.includes("konser") || text.includes("şarkı")) return "concert-rock";
  if (text.includes("tiyatro") || text.includes("sahne")) return "theatre-drama";
  if (text.includes("sergi") || text.includes("sanat")) return "exhibition-art";

  return "festival-heritage";
}

/**
 * Returns a high-resolution WebP curated image URL for the given event.
 * Note: concert-rock is permanently banned from returning generic duplicate stock photos
 * and returns null so that CulturalCoverPlaceholder or authentic artist covers are used.
 */
export function resolveCuratedEventImage(event: {
  title: string;
  summary?: string | null;
  event_type?: string | null;
}): string | null {
  const genre = resolveCuratedGenreKey(event);
  if (genre === "concert-rock") {
    return null;
  }
  return CURATED_GENRE_IMAGES[genre] || null;
}


