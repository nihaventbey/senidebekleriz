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
  "Küçük Saat(?:\\s*\\|\\s*Adana Haberleri)?",
  "Adana Haberleri",
  "İstanbul Ticaret Gazetesi",
  "Eskişehir Durum",
  "Türkiye Turizm",
  "Artcolumn(?:\\s*Sanat Portalı)?",
  "Artkolik(?:\\s*Sanat Platformu)?",
  "SanatMat",
  "Gezelim",
  "RayHaber",
  "Esgazete",
  "Saray Medya",
  "Bandırma Manşet",
  "Gazete Oksijen",
  "theMagger",
  "İzmir['’]de Son Dakika",
  "61SAAT",
  "Tokat Haber",
  "Mahalli Gündem",
  "GZT",
  "hibya\\.com",
  "haberlerankara\\.com",
  "ensondakika\\.com\\.tr",
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

export const KNOWN_ACRONYMS = new Set([
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
  "BM",
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
  "TGA",
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
  "THM",
  "TSM",
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
  "EU",
  "UN",
  "UK",
  "US",
  "TV",
  "DJ",
  "LP",
  "CD",
]);

const ROMAN_NUMERAL_REGEX = /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XX)$/;
const LOWERCASE_CONNECTORS = new Set(["ve", "ile", "için", "de", "da", "ki", "mi", "mı", "mu", "mü"]);

/** Decodes HTML entities (including double-encoded) and strips any HTML tags. */
export function stripHtmlAndDecode(input: string): string {
  if (!input) return "";
  const decodeOnce = (s: string) =>
    s
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&nbsp;/gi, " ")
      .replace(/&ndash;/gi, "–")
      .replace(/&mdash;/gi, "—")
      .replace(/&rsquo;/gi, "’")
      .replace(/&lsquo;/gi, "‘")
      .replace(/&rdquo;/gi, "”")
      .replace(/&ldquo;/gi, "“")
      .replace(/&hellip;/gi, "…")
      .replace(/&ccedil;/g, "ç")
      .replace(/&Ccedil;/g, "Ç")
      .replace(/&ouml;/g, "ö")
      .replace(/&Ouml;/g, "Ö")
      .replace(/&uuml;/g, "ü")
      .replace(/&Uuml;/g, "Ü")
      .replace(/&#(\d+);/g, (_, code) => {
        const n = parseInt(code, 10);
        return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : "";
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
        const n = parseInt(code, 16);
        return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : "";
      });

  const stripTagsPreservingInline = (s: string) =>
    s
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/?(?:p|div|section|article|header|footer|aside|li|ul|ol|h[1-6]|blockquote|tr|td|th|br)\b[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, "");

  let text = stripTagsPreservingInline(decodeOnce(input));

  if (/&(?:amp|lt|gt|quot|nbsp|rsquo|lsquo|rdquo|ldquo|#\d+|#x[0-9a-f]+);/i.test(text)) {
    text = stripTagsPreservingInline(decodeOnce(text));
  }

  return text.replace(/\s+/g, " ").trim();
}

/**
 * Converts DHA/İHA style screaming ALL-CAPS leading word (e.g. "KÜLTÜR ve Turizm...",
 * "ANTALYA'da düzenlenen...") into normal Turkish title case ("Kültür ve Turizm...",
 * "Antalya'da düzenlenen...") while keeping genuine acronyms ("AKM'de", "UNESCO", "İBB") intact.
 */
/**
 * Converts ALL-CAPS words anywhere in a title/sentence (e.g. "İSTANBUL'DA MÜZE HAFTASI",
 * "ANTALYA'da düzenlenen...") into normal Turkish title case ("İstanbul'da Müze Haftası",
 * "Antalya'da düzenlenen...") while keeping genuine acronyms ("AKM'de", "UNESCO", "İBB")
 * and Roman numerals ("II.", "IV") intact.
 */
export function normalizeAllCapsWords(text: string): string {
  if (!text) return "";
  return text.replace(
    /(^|[\s"“‘(\[-])([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ0-9]{1,24})((?:['’][a-zçğıöşüA-ZÇĞİÖŞÜ]{1,6})?)(?=$|[\s.,;:!?)"”’\]/-])/g,
    (full, prefix: string, root: string, suffix: string, offset: number) => {
      const cleanSuffix = suffix
        ? suffix[0] + suffix.slice(1).toLocaleLowerCase("tr-TR")
        : "";
      if (KNOWN_ACRONYMS.has(root) || ROMAN_NUMERAL_REGEX.test(root)) {
        return `${prefix}${root}${cleanSuffix}`;
      }
      // Keep mixed-digit codes like B2B or M1 unless followed by uppercase Turkish suffix
      if (/\d/.test(root)) {
        return `${prefix}${root}${cleanSuffix}`;
      }
      const lowerRoot = root.toLocaleLowerCase("tr-TR");
      const isStart = offset === 0 && prefix === "";
      if (!isStart && !suffix && LOWERCASE_CONNECTORS.has(lowerRoot)) {
        return `${prefix}${lowerRoot}`;
      }
      const titledRoot =
        lowerRoot[0].toLocaleUpperCase("tr-TR") + lowerRoot.slice(1);
      return `${prefix}${titledRoot}${cleanSuffix}`;
    }
  );
}

export function normalizeScreamingLeadWord(text: string): string {
  return normalizeAllCapsWords(text);
}

const BARE_PUBLISHER_SUFFIX_PATTERN = [
  "Anadolu\\s+Ajansı",
  "İhlas\\s+Haber\\s+Ajansı",
  "Demirören\\s+Haber\\s+Ajansı",
  "ANKA\\s+Haber\\s+Ajansı",
  "Küçük\\s+Saat(?:\\s*\\|\\s*Adana\\s+Haberleri)?",
  "Adana\\s+Haberleri",
  "İstanbul\\s+Ticaret\\s+Gazetesi",
  "Eskişehir\\s+Durum",
  "Bandırma\\s+Manşet",
  "Gazete\\s+Oksijen",
  "Milliyet\\s+Sanat",
  "Taka\\s+Gazetesi",
  "Taka\\s+Gazete",
  "Mahalli\\s+Gündem",
  "Artkolik\\s+Sanat\\s+Platformu",
  "Artcolumn\\s+Sanat\\s+Portalı",
  "NTV\\s+Haber",
  "TRT\\s+Haber",
  "CNN\\s+Türk",
  "[A-Za-z0-9-]+\\.(?:com\\.tr|com|net|org\\.tr|org)",
].join("|");

/**
 * Strips news agency datelines, prefixes, suffixes, and brackets from news titles or text.
 * Leaves authentic Turkish words (e.g. "Anka Kuşu", "Ankara", "saat") untouched.
 */
export function cleanPublisherText(text: string): string {
  if (!text) return "";
  let res = stripHtmlAndDecode(text);

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

  // 4. Strip Agency Suffixes at end with punctuation delimiter first: e.g. "- Anadolu Ajansı", "| İHA", "- DHA", "/ TRT Haber"
  const suffixAgenciesPattern = KNOWN_PUBLISHER_AGENCIES.join("|");
  const suffixRegex = new RegExp(
    `\\s*[-–—|/\\\\:]+\\s*(${suffixAgenciesPattern})(?:\\s*\\([^)]*\\)|\\s*\\[[^\\]]*\\]|\\s*[-–—|/\\\\:]\\s*(?:güncelleme|tarih|haber|son\\s*dakika|özel).*|\\s*)*$`,
    "i"
  );
  res = res.replace(suffixRegex, "");

  // 4b. Strip trailing publisher brand even without dash if at the very end: e.g. "... Küçük Saat | Adana Haberleri", "... İhlas Haber Ajansı"
  const bareSuffixRegex = new RegExp(`\\s+(?:${BARE_PUBLISHER_SUFFIX_PATTERN})\\s*$`, "i");
  res = res.replace(bareSuffixRegex, "");

  // 4c. Repeat delimiter pass in case bareSuffix exposed a delimiter like "| ..." or trailing "-"
  res = res.replace(suffixRegex, "");

  // 5. Strip trailing parentheses or brackets with agency name: e.g. "(AA)", "[İHA]", "(DHA)"
  res = res.replace(
    /\s*[\(\[]\s*(AA|İHA|IHA|DHA|ANKA|TRT\s*HABER|REUTERS|AFP|AP)\s*[\)\]]\s*$/i,
    ""
  );

  res = normalizeAllCapsWords(res);

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

function toAlphaNumKey(s: string): string {
  return (s || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9çğıöşü]/g, "");
}

const SOURCE_ATTRIBUTION_BLOCK_REGEX =
  /^(?:#{1,4}\s+)?[*_]{0,2}(?:kaynak(?:ça)?(?:\s+ve\s+detaylar)?|kaynak\s+metin(?:\s+bilgisi)?|haber\s+kaynağı|editör\s+notu)\b[*_]{0,2}\s*[:\-–—]?/i;

const TRAILING_BOILERPLATE_BLOCK_REGEX =
  /^(?:detaylı\s+bilgi(?:\s+ve\s+(?:haber\s+)?kaynağ[ıi])?\s+için|etkinlik\s+takvimi\s+ve\s+detaylı\s+bilgi\s+için|bu\s+(?:dosya\s+)?haber(?:i|imiz)?\s*,?\s*[^.\n]{2,80}\s+(?:verileri|bülteni|haber\s+arşivi|ajanda)|thematic\s+content\s+selection\s+derived\s+from)\b/i;

const OFFICIAL_SITE_SOCIAL_FOOTER_REGEX =
  /(^|[.!?]\s+|\n)[^\n]{0,120}?(?:detaylı\s+bilgilere|resmi\s+internet\s+sitesi|instagram\s+hesabı)[^\n]{0,260}?üzerinden\s+ulaşabilirsiniz\.?/gi;

/**
 * Removes trailing source attribution sections ("## Kaynak ve Detaylar", "**Kaynak:** ...",
 * "*Kaynak: ...*"), website/Instagram redirect footers, and Google News RSS title+publisher
 * echoes appended to the end of generated or scraped Markdown content.
 */
export function stripTrailingSourceAttribution(
  content: string,
  title?: string,
  sourceName?: string
): string {
  if (!content) return "";

  let cleaned = content
    .replace(/\r\n/g, "\n")
    .replace(OFFICIAL_SITE_SOCIAL_FOOTER_REGEX, (_, prefix: string) =>
      prefix && /^[.!?]/.test(prefix) ? prefix[0] : prefix || ""
    )
    .trim();

  const blocks = cleaned
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return "";

  const normTitle = title ? toAlphaNumKey(cleanPublisherText(title)) : "";
  const normSource = sourceName ? toAlphaNumKey(sourceName) : "";
  const seenParagraphKeys = new Set<string>();
  const kept: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Drop explicit source sections/blocks and any trailing blocks directly beneath a "## Kaynak..." heading
    if (SOURCE_ATTRIBUTION_BLOCK_REGEX.test(block)) {
      if (/^#{1,4}\s+/.test(block)) {
        break;
      }
      continue;
    }

    if (TRAILING_BOILERPLATE_BLOCK_REGEX.test(block)) {
      continue;
    }

    const normBlock = toAlphaNumKey(block);
    const isNearTail = i >= Math.max(1, blocks.length - 2);

    if (isNearTail && normTitle.length >= 20) {
      const titlePrefix = normTitle.slice(0, Math.min(normTitle.length, 32));
      if (normBlock === normTitle || normBlock.startsWith(titlePrefix)) {
        continue;
      }
    }

    if (
      isNearTail &&
      block.length < 280 &&
      ((normSource.length >= 4 && normBlock.endsWith(normSource)) ||
        /\|\s*[A-ZÇĞİÖŞÜa-zçğıöşü0-9\s]{3,40}\s*$/.test(block) ||
        (!/[.!?…)"”]$/.test(block) && cleanPublisherText(block) !== block))
    ) {
      const strippedCheck = cleanPublisherText(block);
      const normStripped = toAlphaNumKey(strippedCheck);
      if (
        !strippedCheck ||
        !/[.!?…)"”]$/.test(block) ||
        (normTitle.length >= 16 &&
          (normStripped === normTitle || normTitle.includes(normStripped)))
      ) {
        continue;
      }
    }

    if (!block.startsWith("#") && normBlock.length >= 25) {
      const dupKey = normBlock.slice(0, 140);
      if (seenParagraphKeys.has(dupKey)) {
        continue;
      }
      seenParagraphKeys.add(dupKey);
    }

    kept.push(block);
  }

  // Drop orphan headings at the end if their body blocks were stripped
  while (kept.length > 0 && /^#{1,4}\s+/.test(kept[kept.length - 1])) {
    kept.pop();
  }

  return kept.join("\n\n").trim();
}
