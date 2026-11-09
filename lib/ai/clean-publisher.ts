import { slugify } from "@/lib/slugify";

/**
 * Known news agencies, wire services, and publisher brands in Turkey and internationally.
 */
export const KNOWN_PUBLISHER_AGENCIES = [
  "Anadolu Ajans[ıi]",
  "AA",
  "İhlas Haber Ajans[ıi]",
  "İHA",
  "IHA",
  "Demirören Haber Ajans[ıi]",
  "DHA",
  "ANKA Haber Ajans[ıi]",
  "ANKA",
  "TRT Haber",
  "TRT",
  "Reuters",
  "Associated Press",
  "AP",
  "AFP",
  "Agence France-Presse",
  "Habertürk",
  "Hürriyet",
  "Milliyet Sanat",
  "Milliyet",
  "Sabah",
  "Sözcü",
  "Cumhuriyet",
  "NTV",
  "CNN Türk",
  "Euronews Türkçe",
  "Euronews",
  "BBC News Türkçe",
  "BBC Türkçe",
  "Bianet",
  "Diken",
  "Gazete Duvar",
  "T24",
  "BirGün",
  "Taka Gazetesi",
  "Taka",
  "İhlas",
  "Ensonhaber",
  "Haberler\\.com",
  "Kültür Portalı",
  "T\\.C\\.\\s*Kültür\\s*ve\\s*Turizm\\s*Bakanlığı",
  "Arkeofili",
  "Arkitera",
  "Sanat Atak",
  "Argonotlar",
] as const;

/**
 * Isolated slug tokens to purge from URL slugs and storage image paths.
 */
export const AGENCY_SLUG_TOKENS = [
  "anadolu-ajansi",
  "ihlas-haber-ajansi",
  "demiroren-haber-ajansi",
  "anka-haber-ajansi",
  "trt-haber",
  "taka-gazetesi",
  "cnn-turk",
  "ensonhaber",
  "haberler-com",
  "milliyet-sanat",
  "aa",
  "iha",
  "dha",
  "anka",
  "reuters",
  "afp",
  "haberturk",
  "hurriyet",
  "milliyet",
  "sabah",
  "sozcu",
  "cumhuriyet",
  "ntv",
] as const;

/**
 * Strips news agency datelines, prefixes, suffixes, and brackets from news titles or text.
 * Leaves authentic Turkish words (e.g. "Anka Kuşu", "Ankara", "saat") untouched.
 */
export function cleanPublisherText(text: string): string {
  if (!text) return "";
  let res = text.trim();

  // 1. Strip Datelines at start: e.g. "İSTANBUL (AA) -", "ANKARA (İHA) --", "İZMİR (DHA):"
  res = res.replace(
    /^[A-ZÇĞİÖŞÜa-zçğıöşü\s]{2,25}\s*[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT|DHA-İHA|REUTERS|AFP|AP)\s*[\)\]]\s*[-–—:]*\s*/i,
    ""
  );

  // 2. Strip Bracketed agency prefixes at start: e.g. "[AA] ", "(İHA) ", "[ÖZEL HABER] ", "[FLAŞ] "
  res = res.replace(
    /^[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT\s*HABER|REUTERS|AFP|AP|SON\s*DAKİKA|ÖZEL\s*HABER|FLAŞ|CANLI)\s*[\)\]]\s*[-–—:]*\s*/i,
    ""
  );

  // 3. Strip Standalone agency prefix with punctuation delimiter at start: e.g. "AA - ", "İHA: ", "DHA / "
  // Requires punctuation delimiter ([-–—:/|]) so "Anka Kuşu" or "Ankara" is NOT touched!
  res = res.replace(
    /^(AA|İHA|IHA|DHA|ANKA|TRT\s*HABER|REUTERS|AFP|AP|SON\s*DAKİKA|FLAŞ)\s*[-–—:/|]+\s*/i,
    ""
  );

  // 4. Strip Agency Suffixes at end: e.g. "- Anadolu Ajansı", "| İHA", "- DHA", "/ TRT Haber"
  const suffixAgenciesPattern = KNOWN_PUBLISHER_AGENCIES.join("|");
  const suffixRegex = new RegExp(
    `\\s*[-–—|/\\\\:]+\\s*(${suffixAgenciesPattern})(?:\\s*\\([^)]*\\)|\\s*\\[[^\\]]*\\]|\\s*[-–—|/\\\\:]\\s*(?:güncelleme|tarih|haber|son\\s*dakika|özel).*|\\s*)*$`,
    "i"
  );
  res = res.replace(suffixRegex, "");

  // 5. Strip trailing parentheses or brackets with agency name: e.g. "(AA)", "[İHA]", "(DHA)"
  res = res.replace(
    /\s*[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT\s*HABER|REUTERS|AFP|AP)\s*[\)\]]\s*$/i,
    ""
  );

  return res.replace(/\s{2,}/g, " ").trim();
}

/**
 * Strips isolated agency tokens from a slug.
 * e.g. "istanbul-aa-ayasofya" -> "istanbul-ayasofya"
 * e.g. "troya-kazisi-aa" -> "troya-kazisi"
 * e.g. "iha-tarihi-konaklar-yenileniyor" -> "tarihi-konaklar-yenileniyor"
 */
export function cleanAgencySlug(slug: string): string {
  if (!slug) return "";
  let cleaned = slug;
  let prev = "";

  // Repeat passes until no tokens match (handles cases like "-aa-iha-")
  while (prev !== cleaned) {
    prev = cleaned;
    for (const token of AGENCY_SLUG_TOKENS) {
      const regex = new RegExp(`(^|-)${token}(?=-|$)`, "g");
      cleaned = cleaned.replace(regex, "$1");
    }
    cleaned = cleaned.replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  return cleaned;
}

/**
 * Clean a news title and generate a guaranteed agency-free slug.
 */
export function cleanNewsSlug(
  titleOrSlug: string,
  fallback = "kultur-haberi"
): string {
  const cleanedTitle = cleanPublisherText(titleOrSlug || "");
  const rawSlug = slugify(cleanedTitle || titleOrSlug || "");
  const safeSlug = cleanAgencySlug(rawSlug);
  return safeSlug || fallback;
}

/**
 * Strips leading datelines from news paragraphs.
 * e.g. "İSTANBUL (AA) - Tarihi camide restorasyon..." -> "Tarihi camide restorasyon..."
 */
export function stripDatelineFromParagraph(text: string): string {
  if (!text) return "";
  return text
    .replace(
      /^[A-ZÇĞİÖŞÜa-zçğıöşü\s]{2,25}\s*[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT|DHA-İHA|REUTERS|AFP|AP)\s*[\)\]]\s*[-–—:]*\s*/i,
      ""
    )
    .trim();
}
