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
  "NTV Haber",
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
  "Yeni Şafak",
  "Türkiye Gazetesi",
  "Karar",
  "Akşam",
  "Star",
  "Takvim",
  "Aydınlık",
  "Evrensel",
  "Ekonomim",
  "Dünya Gazetesi",
  "Taka Gazetesi",
  "Taka",
  "İhlas",
  "Ensonhaber",
  "Haberler\\.com",
  "SonDakika\\.com",
  "Mynet",
  "Aksiyon\\.com\\.tr",
  "Manşet Haber",
  "Kültür\\.Limited",
  "Sanat Okur",
  "Bi'Kuble",
  "Kültür Portalı",
  "T\\.C\\.\\s*Kültür\\s*ve\\s*Turizm\\s*Bakanlığı",
  "Arkeofili",
  "Arkitera",
  "Sanat Atak",
  "Argonotlar",
  "Artful Living",
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
  "ntv-haber",
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

const KNOWN_ACRONYMS = new Set([
  "AA",
  "İHA",
  "IHA",
  "DHA",
  "ANKA",
  "TRT",
  "AKM",
  "CSO",
  "İBB",
  "ABB",
  "İZBB",
  "TBB",
  "TBMM",
  "UNESCO",
  "UNICEF",
  "NATO",
  "AB",
  "ABD",
  "KKTC",
  "TÜRSAB",
  "TÜBİTAK",
  "TÜRKSOY",
  "TİKA",
  "TDK",
  "TTK",
  "YÖK",
  "RTÜK",
  "TOKİ",
  "BİFO",
  "İKSV",
  "BKM",
  "DT",
  "DOB",
  "İDOB",
  "ADOB",
  "İZDOB",
  "ANTDOB",
  "MDOB",
  "SAMDOB",
  "MSGSÜ",
  "ODTÜ",
  "İTÜ",
  "YTÜ",
  "KTÜ",
  "COP",
  "COP31",
  "VIP",
  "STK",
  "KDV",
  "THY",
  "TCDD",
  "PTT",
]);

/**
 * Converts DHA/İHA style screaming ALL-CAPS leading word (e.g. "KÜLTÜR ve Turizm...",
 * "ANTALYA'da düzenlenen...") into normal Turkish title case ("Kültür ve Turizm...",
 * "Antalya'da düzenlenen...") while keeping genuine acronyms ("AKM'de", "UNESCO", "İBB") intact.
 */
export function normalizeScreamingLeadWord(text: string): string {
  if (!text) return "";
  return text.replace(
    /^([A-ZÇĞİÖŞÜ]{4,25})((?:['’][a-zçğıöşüA-ZÇĞİÖŞÜ]{1,6})?)(?=\s+[a-zçğıöşü])/,
    (full, root: string, suffix: string) => {
      if (KNOWN_ACRONYMS.has(root)) {
        const cleanSuffix = suffix
          ? suffix[0] + suffix.slice(1).toLocaleLowerCase("tr-TR")
          : "";
        return `${root}${cleanSuffix}`;
      }
      const lowerRoot = root.toLocaleLowerCase("tr-TR");
      const titledRoot =
        lowerRoot[0].toLocaleUpperCase("tr-TR") + lowerRoot.slice(1);
      const cleanSuffix = suffix
        ? suffix[0] + suffix.slice(1).toLocaleLowerCase("tr-TR")
        : "";
      return `${titledRoot}${cleanSuffix}`;
    }
  );
}

/**
 * Strips news agency datelines, prefixes, suffixes, and brackets from news titles or text.
 * Leaves authentic Turkish words (e.g. "Anka Kuşu", "Ankara", "saat") untouched.
 */
export function cleanPublisherText(text: string): string {
  if (!text) return "";
  let res = text.trim();

  // 1. Strip Datelines at start: e.g. "İSTANBUL (AA) -", "ANTALYA, (DHA) -", "ANKARA/ÇANKAYA (İHA) --", "İZMİR (DHA):"
  res = res.replace(
    /^[A-ZÇĞİÖŞÜa-zçğıöşü\s,./-]{2,35}?\s*[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT|DHA-İHA|REUTERS|AFP|AP)\s*[\)\]]\s*[-–—:•]*\s*/i,
    ""
  );

  // 2. Strip Bracketed agency prefixes at start: e.g. "[AA] ", "(İHA) ", "(DHA) - ", "[ÖZEL HABER] ", "[FLAŞ] "
  res = res.replace(
    /^[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT\s*HABER|REUTERS|AFP|AP|SON\s*DAKİKA|ÖZEL\s*HABER|FLAŞ|CANLI)\s*[\)\]]\s*[-–—:•]*\s*/i,
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

  // 4b. Strip trailing publisher brand even without dash if at the very end of a heading/title: e.g. "... NTV Haber", "... Aksiyon.com.TR"
  const bareSuffixRegex = new RegExp(
    `\\s+(?:NTV\\s+Haber|TRT\\s+Haber|CNN\\s+Türk|[A-Za-z0-9-]+\\.(?:com\\.tr|com|net|org\\.tr|org))\\s*$`,
    "i"
  );
  res = res.replace(bareSuffixRegex, "");

  // 5. Strip trailing parentheses or brackets with agency name: e.g. "(AA)", "[İHA]", "(DHA)"
  res = res.replace(
    /\s*[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT\s*HABER|REUTERS|AFP|AP)\s*[\)\]]\s*$/i,
    ""
  );

  res = normalizeScreamingLeadWord(res);

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
 * e.g. "ANTALYA, (DHA) - KÜLTÜR ve Turizm Bakanlığı..." -> "Kültür ve Turizm Bakanlığı..."
 */
export function stripDatelineFromParagraph(text: string): string {
  if (!text) return "";
  const stripped = text
    .replace(
      /^[A-ZÇĞİÖŞÜa-zçğıöşü\s,./-]{2,35}?\s*[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT|DHA-İHA|REUTERS|AFP|AP)\s*[\)\]]\s*[-–—:•]*\s*/i,
      ""
    )
    .replace(
      /^[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT\s*HABER|REUTERS|AFP|AP)\s*[\)\]]\s*[-–—:•]*\s*/i,
      ""
    )
    .replace(
      /^(AA|İHA|IHA|DHA|ANKA)\s*[-–—:]+\s*/i,
      ""
    )
    // Bare ALL-CAPS city/district datelines: e.g. "SİDE - Antalya'nın...", "İSTANBUL - Kültür..."
    .replace(
      /^[A-ZÇĞİÖŞÜ]{3,20}(?:\s*\/\s*[A-ZÇĞİÖŞÜ]{3,20})?\s+[-–—]+\s+(?=[A-ZÇĞİÖŞÜ])/,
      ""
    )
    .trim();

  return normalizeScreamingLeadWord(stripped);
}
