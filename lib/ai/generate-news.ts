import { callGeminiJson, isGeminiConfigured } from "@/lib/ai/gemini-client";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { formatHeadingsWithHeuristics } from "@/lib/ai/format-headings";
import {
  filterImageCandidatesBySize,
  pickCoverImageUrl,
  resolveFallbackCulturalImage,
} from "@/lib/ai/extract-page-images";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { detectTurkishCityInText } from "@/lib/discovery/classify-content";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import {
  formatSeoTitle,
  SEO_LIMITS,
  stripHtmlAndBoilerplate,
} from "@/lib/seo/metadata";
import { formatSeoSummary } from "@/lib/utils";
import {
  cleanPublisherText,
  cleanNewsSlug,
  stripDatelineFromParagraph,
} from "@/lib/ai/clean-publisher";
import {
  CORPORATE_STYLE_GUIDE,
  assessNewsDraft,
  buildDateContext,
  countWords,
  formatIssuesForRevision,
  polishMarkdown,
  resolveTargetLength,
} from "@/lib/ai/editorial";

export type NewsDepth = "standard" | "deep" | "comprehensive";

export type GenerateNewsInput = {
  topic?: string;
  sourceUrl?: string;
  cityName?: string;
  fallbackText?: string;
  coverImageHint?: string | null;
  depth?: NewsDepth;
};

export type GeneratedNewsDraft = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category:
    | "arkeoloji"
    | "restorasyon"
    | "muze_sergi"
    | "sinema"
    | "kultur_sanat"
    | "festival_haberleri"
    | "genel";
  cover_image?: string | null;
  city_slug?: string | null;
  source_name?: string | null;
  word_count?: number;
};

const VALID_CATEGORIES = new Set([
  "arkeoloji",
  "restorasyon",
  "muze_sergi",
  "sinema",
  "kultur_sanat",
  "festival_haberleri",
  "genel",
]);

const NEWS_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description:
        "40-65 karakter arası, ajans adı ve soru/ünlem içermeyen, SEO uyumlu kurumsal Türkçe haber başlığı",
    },
    summary: {
      type: "string",
      description:
        "130-190 karakter arası, 5N1K kuralına uygun, 1-2 tam cümleden oluşan, nokta ile biten kurumsal haber spotu",
    },
    content: {
      type: "string",
      description:
        "Giriş paragrafından sonra 2-4 konuya özgü ## alt başlık ve kurumsal paragraflarla yazılmış Markdown haber metni",
    },
    category: {
      type: "string",
      enum: [
        "arkeoloji",
        "restorasyon",
        "muze_sergi",
        "sinema",
        "kultur_sanat",
        "festival_haberleri",
        "genel",
      ],
    },
    city_slug: {
      type: ["string", "null"],
    },
    source_name: {
      type: ["string", "null"],
    },
  },
  required: ["title", "summary", "content", "category"],
};

function stripRawHtmlFromMarkdown(md: string): string {
  return md
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(
      /<\/?(?:div|span|p|font|center|table|tr|td|th|tbody|thead|iframe|script|style|ins|b|i|u|strong|em|br|hr)\b[^>]*>/gi,
      ""
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function inferNewsCategory(
  text: string
): GeneratedNewsDraft["category"] {
  const lower = text.toLocaleLowerCase("tr-TR");
  // Check exhibition/museum and festival BEFORE archaeology when explicit ("sergisi açıldı", "festivali")
  if (
    /\b(sergi|sergisi|bienal|küratör|retrospektif|çağdaş sanat)\b/.test(lower) &&
    !/\b(kazı|höyük|nekropol|tümülüs)\b/.test(lower)
  ) {
    return "muze_sergi";
  }
  if (
    /(arkeoloji|kazı|antik kent|höyük|lahit|mozaik|kemik flüt|idol|buluntu|tümülüs|nekropol|yazıt|sikke|ören yeri)/.test(
      lower
    )
  ) {
    return "arkeoloji";
  }
  if (
    /(restorasyon|onarı|ihya|rölöve|konservasyon|vakıflar|taş konak|medrese|külliye|han|hamam)/.test(
      lower
    )
  ) {
    return "restorasyon";
  }
  if (/(müze|galeri|koleksiyon)/.test(lower)) {
    return "muze_sergi";
  }
  if (
    /(sinema|film|yönetmen|senaryo|vizyon|altın portakal|altın koza|berlinale|cannes|oscar|kısa film|belgesel|oyuncu|başrol|gişe|sinematek|animasyon)/.test(
      lower
    )
  ) {
    return "sinema";
  }
  if (/(festival|kültür yolu|şenlik|karnaval)/.test(lower)) {
    return "festival_haberleri";
  }
  return "kultur_sanat";
}

function isAllCapsHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 12 || trimmed.length > 100) return false;
  if (/[.!?,;:]$/.test(trimmed)) return false;
  const letters = trimmed.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, "");
  if (letters.length < 8) return false;
  return letters === letters.toLocaleUpperCase("tr-TR");
}

function toTurkishTitleCase(str: string): string {
  return str
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      const first = word[0].toLocaleUpperCase("tr-TR");
      return first + word.slice(1);
    })
    .join(" ");
}

const DEPTH_WORD_RANGES: Record<NewsDepth, { min: number; max: number }> = {
  standard: { min: 380, max: 550 },
  deep: { min: 550, max: 750 },
  comprehensive: { min: 750, max: 1050 },
};

function buildSystemPrompt(
  depth: NewsDepth,
  targetRange: { min: number; max: number; thinSource: boolean },
  dateContext: string
): string {
  const targetCharNote =
    depth === "standard"
      ? "2.600 - 4.200 karakter"
      : depth === "deep"
      ? "4.000 - 5.500 karakter"
      : "5.500 - 7.500 karakter";

  const lengthInstruction = targetRange.thinSource
    ? `HEDEF UZUNLUK: ${targetRange.min} - ${targetRange.max} kelime (${targetCharNote}). Kaynak bülten kısa olduğu için; kaynaktaki tüm somut verileri (kişi, kurum, eser, şehir, tarih) eksiksiz koruyarak ve uydurma saat, bilet fiyatı veya sahte alıntı EKLEMEDEN, haberde adı geçen antik kentin, müzenin, tarihi yapının, festivalin veya kültür kurumunun doğrulanmış tarihsel/kültürel arka planını ve Türkiye kültür-sanat hayatındaki önemini işleyerek metni ${targetCharNote} bandında doyurucu biçimde kurgula.`
    : `HEDEF UZUNLUK: ${targetRange.min} - ${targetRange.max} kelime (${targetCharNote}, ${depth} derinlik). Ne yüzeysellikten sığ ne de okuru yoracak yapay soru-cevap dolgularıyla şişirilmiş; Google Discover ve Türk okuru için dengeli, bilgi yoğunluğu yüksek ve akıcı bir kültür-sanat haberi hazırla.`;

  return `Sen Türkiye'nin kültür, sanat, tarih ve arkeoloji yayını "Seni de Bekleriz"in (senidebekleriz.com) kıdemli baş editörü ve kültür gazetecisisin.
Görevin: Verilen kaynak içerikten hareketle, ajans kopyacılığından uzak, edebi ciddiyet, yüksek editoryal kalite ve kurumsal gazetecilik standartlarında özgün bir Türkçe haber hazırlamaktır.

${dateContext}

${lengthInstruction}

${CORPORATE_STYLE_GUIDE}

═══════════════════════════════════════════════════════════════════
HABER MİMARİSİ VE ALAN KURALLARI
═══════════════════════════════════════════════════════════════════

1. BAĞLAM ANALİZİ VE GÜRÜLTÜYÜ TEMİZLEME:
   - Kaynak metin web sitelerinden kazınmış olabilir; içindeki arayüz kalıntılarını, başka şehirlere ait yan haberleri, reklamları, sosyal medya/web sitesi yönlendirme cümlelerini ("detaylı bilgi için ... sitesine/Instagram hesabına...") ve metin sonundaki gazete/ajans imzalarını tamamen ayıkla.
   - SADECE haberin ana kültür, sanat, arkeoloji, restorasyon, müze, sinema veya festival konusunu işle.
   - Kaynak metindeki somut verileri (yer adları, tarihler, kişi isimleri, kazı başkanı, müze adı, eser ismi, kullanılan teknikler, katılım koşulları) EKSİKSİZ koru; kaynakta olmayan alıntı veya sayısal veri uydurma.
   - Kaynaktaki cümleleri kelimesi kelimesine kopyalama; tüm paragrafları bağımsız kültür yayını üslubuyla yeniden kurgula.

2. BAŞLIK (title):
   - 40 - 65 karakter arası (ideal 45 - 62 karakter; Google arama sonuçlarında kesilmeyecek net uzunlukta), doğrudan, bilgilendirici, kurumsal Türkçe başlık.
   - Doğru Türkçe büyük/küçük harf kuralı uygula (kısaltmalar her zaman büyük harf: BM, TDK, İKSV, AKM, UNESCO).
   - ASLA ajans/gazete adı ("AA", "İHA", "DHA", "ANKA", "TRT", "Küçük Saat", "NTV Haber", "Hürriyet"), ünlem işareti veya klik tuzağı soru cümlesi ("Açıldı mı?", "Şok gelişme!") içermez.
   - Haberin somut kültürel değerini etken çatıyla verir (Örn: "Stratonikeia'da 1800 Yıllık Roma Mozaiği Gün Yüzüne Çıktı").

3. 5N1K HABER SPOTU (summary):
   - 130 - 190 karakter arası, 5N1K kuralına uygun (Ne, Nerede, Kim, Ne Zaman, Nasıl/Niçin), 1-2 akıcı ve tam Türkçe cümleden oluşan, sonu mutlaka nokta ile biten haber spotu (HTML etiketi içermez).
   - Ajans dateline'ı ("ANTALYA, (DHA) -") veya kaynak adı içermez.

4. HABER METNİ VE ALT BAŞLIKLAR (content):
   - GİRİŞ PARAGRAFI: Habere bağlamı kuran güçlü bir giriş paragrafıyla başla. Giriş paragrafının üstüne başlık KOYMA ve "summary" alanını kelimesi kelimesine tekrarlama.
   - TEMATİK ALT BAŞLIKLAR: Girişten sonra haberin farklı boyutlarını, sanatsal/tarihsel derinliğini ve yetkili açıklamalarını ele alan 2 veya 3 adet "## [Konuya Özgü Alt Başlık]" kullan.
   - Her alt başlığın altında 2 doyurucu paragraf yer almalıdır.
   - KESİN YASAKLAR:
     * Metnin sonuna "Kaynak:", "**Kaynak:**", "## Kaynak ve Detaylar", gazete/ajans adı, site linki veya "@instagram" yönlendirmesi EKLEME (kaynak kutusu arayüzde ayrı gösterilir).
     * Yapay SSS ("## Merak Edilenler", "## ... Hakkında Merak Edilenler") veya kalıp şablon başlıklar ("## Detaylar", "## Gelişmeler", "## Sonuç", "## Program Akışı ve Sanatsal Etkinlikler", "## Kültürel Bağlam ve Öne Çıkan Başlıklar") KESİNLİKLE KULLANMA.`;
}

function sanitizeGeneratedNewsFields(
  raw: Partial<GeneratedNewsDraft>,
  fallbackTopic: string,
  rawPageText: string,
  inputCityName?: string,
  detectedSiteName?: string
) {
  let cleanTitle = cleanPublisherText(
    stripHtmlAndBoilerplate(raw.title || fallbackTopic)
  )
    .replace(/!+$/g, "")
    .trim();
  if (cleanTitle.length > SEO_LIMITS.newsTitle.hardMax) {
    cleanTitle =
      formatSeoTitle(cleanTitle, SEO_LIMITS.newsTitle.hardMax) || cleanTitle;
  }

  const resolvedSourceName = raw.source_name?.trim() || detectedSiteName || null;

  // Clean each paragraph of datelines, publisher suffixes, and raw HTML
  const cleanedLines = stripRawHtmlFromMarkdown(raw.content || "")
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (/^#{1,4}\s+/.test(trimmed)) {
        const hText = cleanPublisherText(trimmed.replace(/^#{1,4}\s+/, ""));
        return hText ? `## ${hText}` : "";
      }
      return stripDatelineFromParagraph(trimmed);
    })
    .filter(Boolean);

  let cleanContent = polishMarkdown(
    cleanedLines.join("\n\n"),
    cleanTitle,
    resolvedSourceName || undefined
  );
  if (!/^#{2,3}\s+/m.test(cleanContent)) {
    cleanContent = formatHeadingsWithHeuristics(cleanContent, cleanTitle);
    cleanContent = polishMarkdown(
      cleanContent,
      cleanTitle,
      resolvedSourceName || undefined
    );
  }

  let cleanSummary = formatSeoSummary(
    stripDatelineFromParagraph(
      cleanPublisherText(stripHtmlAndBoilerplate(raw.summary || cleanTitle))
    ),
    195
  );
  if (cleanSummary && !/[.!?]$/.test(cleanSummary)) {
    cleanSummary = cleanSummary.replace(/[…,;:\-–—]+$/, "").trim() + ".";
  }

  // If the first paragraph of content is identical to summary, drop the duplicate first paragraph
  // when there are enough remaining paragraphs
  const contentBlocks = cleanContent.split(/\n{2,}/).filter(Boolean);
  if (contentBlocks.length >= 3) {
    const firstNorm = contentBlocks[0]
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9çğıöşü]/g, "");
    const sumNorm = cleanSummary
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9çğıöşü]/g, "");
    if (firstNorm && sumNorm && firstNorm === sumNorm) {
      cleanContent = polishMarkdown(
        contentBlocks.slice(1).join("\n\n"),
        cleanTitle,
        resolvedSourceName || undefined
      );
    }
  }

  const category = VALID_CATEGORIES.has(raw.category as string)
    ? (raw.category as GeneratedNewsDraft["category"])
    : inferNewsCategory(`${cleanTitle} ${rawPageText}`);

  const resolvedCitySlug =
    normalizeCitySlug(raw.city_slug) ||
    normalizeCitySlug(inputCityName) ||
    normalizeCitySlug(detectTurkishCityInText(`${cleanTitle} ${cleanSummary} ${rawPageText}`));

  return {
    cleanTitle,
    cleanSummary,
    cleanContent,
    category,
    resolvedCitySlug,
    sourceName: resolvedSourceName,
  };
}

export async function generateNewsDraft(
  input: GenerateNewsInput
): Promise<GeneratedNewsDraft> {
  let topic = cleanPublisherText((input.topic || "").trim());
  let sourceBlock = "";
  let fetchedImages: string[] = [];
  let rawPageText = "";
  let detectedSiteName: string | undefined;
  let publishedAt: string | undefined;

  if (input.sourceUrl?.trim()) {
    try {
      const fetched = await fetchUrlContent(input.sourceUrl.trim(), {
        maxTextLength: 16000,
        fallbackText: input.fallbackText,
        minTextLength: 40,
      });

      detectedSiteName = fetched.siteName;
      publishedAt = fetched.publishedAt;

      if (!topic && fetched.pageTitle) {
        topic = cleanPublisherText(fetched.pageTitle);
      }

      rawPageText = fetched.pageText || "";
      fetchedImages = await filterImageCandidatesBySize(fetched.imageUrls);

      sourceBlock = [
        `Kaynak URL: ${fetched.url}`,
        fetched.siteName ? `Kaynak Kurum / Yayın: ${fetched.siteName}` : null,
        fetched.pageTitle
          ? `Orijinal Sayfa Başlığı: ${cleanPublisherText(fetched.pageTitle)}`
          : null,
        `Sayfa İçeriği:\n${fetched.pageText}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    } catch {
      rawPageText = stripDatelineFromParagraph((input.fallbackText || "").trim());
      if (rawPageText) {
        sourceBlock = `Kaynak URL: ${input.sourceUrl}\n\nKaynak Metin / Özet:\n${rawPageText}`;
      }
    }
  } else if (input.fallbackText) {
    rawPageText = stripDatelineFromParagraph(input.fallbackText.trim());
    sourceBlock = `Kaynak Metin:\n${rawPageText}`;
  }

  if (!topic) {
    topic = "Kültür ve Sanat Haberi";
  }

  const requestedDepth: NewsDepth = input.depth || "standard";
  const sourceWordCount = countWords(rawPageText || topic);
  const targetRange = resolveTargetLength(
    DEPTH_WORD_RANGES[requestedDepth],
    sourceWordCount
  );
  const dateContext = buildDateContext({ sourcePublishedAt: publishedAt });
  const systemPrompt = buildSystemPrompt(requestedDepth, targetRange, dateContext);

  const userPrompt = [
    topic !== "Kültür ve Sanat Haberi" ? `Haber Konusu / Odak: ${topic}` : null,
    input.cityName ? `İlgili Şehir: ${input.cityName}` : null,
    sourceBlock ||
      "Türkiye kültür ve sanat gündemine uygun, somut bilgilere dayalı kurumsal bir haber metni oluştur.",
    `EDİTÖRYAL YÖNERGE:
- Kaynak içeriğin ana kültür-sanat konusunu kavra; sayfa arayüzünden sızmış reklam, siyaset, magazin veya başka şehirlere ait yan haberleri tamamen ele.
- Ajans dateline'larını ("İSTANBUL (AA) -", "ANTALYA, (DHA) -") ve ajans atıflarını metne KESİNLİKLE sokma; doğrudan bağımsız kültür medyası diliyle kurumsal bir haber metni ve 5N1K özeti üret.
- Kaynaktaki cümleleri birebir kopyalama; tüm cümleleri özgün ve kurumsal Türkçe ile yeniden yaz.
- Metni giriş paragrafından sonra 2 ila 4 adet konuya özgü '## [Tematik Alt Başlık]' ile bölümlendirerek yaz; şablon başlıklar kullanma.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let candidateCoverImage: string | null =
    pickCoverImageUrl(fetchedImages) || input.coverImageHint || null;

  try {
    let parsed = await callGeminiJson<GeneratedNewsDraft>({
      systemPrompt,
      userPrompt,
      temperature: 0.35,
      maxOutputTokens: 8192,
      thinking: "low",
      responseSchema: NEWS_RESPONSE_SCHEMA,
    });

    let sanitized = sanitizeGeneratedNewsFields(
      parsed,
      topic,
      rawPageText,
      input.cityName,
      detectedSiteName
    );

    const report = assessNewsDraft(
      {
        title: sanitized.cleanTitle,
        summary: sanitized.cleanSummary,
        content: sanitized.cleanContent,
      },
      {
        sourceText: rawPageText,
        minWords: targetRange.min,
      }
    );

    // Self-healing revision pass on editorial defects, missing lead, template headings, or short length (< 280 words / < 2200 chars)
    const needsRevision =
      !report.passed ||
      report.wordCount < 280 ||
      sanitized.cleanContent.length < 2200;

    if (needsRevision && isGeminiConfigured()) {
      try {
        const revisionPrompt = [
          userPrompt,
          `ÖNCEKİ TASLAKTA TESPİT EDİLEN EDİTÖRYAL SORUNLAR:\n${
            report.issues.length > 0
              ? formatIssuesForRevision(report)
              : `- Metin şu an ${sanitized.cleanContent.length} karakter (${report.wordCount} kelime); hedef 2.600 - 4.200 karakter (${targetRange.min} - ${targetRange.max} kelime) bandına dengeli biçimde ulaştırılmalıdır.`
          }`,
          `Önceki Başlık: ${sanitized.cleanTitle}\nÖnceki Spot: ${sanitized.cleanSummary}\nÖnceki Metin:\n${sanitized.cleanContent}`,
          `GÖREV: Yukarıdaki sorunları gidererek haberi 2.600 - 4.200 karakter bandında, giriş paragrafıyla başlayan, 2-3 konuya özgü "## Alt Başlık" içeren, sonunda kaynak/yayıncı adı bulunmayan özgün bir kültür haberi olarak yeniden yaz.`,
        ].join("\n\n");

        const revised = await callGeminiJson<GeneratedNewsDraft>({
          systemPrompt,
          userPrompt: revisionPrompt,
          temperature: 0.3,
          maxOutputTokens: 8192,
          thinking: "low",
          timeoutMs: 18000,
          responseSchema: NEWS_RESPONSE_SCHEMA,
        });

        const revisedSanitized = sanitizeGeneratedNewsFields(
          revised,
          topic,
          rawPageText,
          input.cityName,
          detectedSiteName
        );
        const revisedReport = assessNewsDraft(
          {
            title: revisedSanitized.cleanTitle,
            summary: revisedSanitized.cleanSummary,
            content: revisedSanitized.cleanContent,
          },
          { sourceText: rawPageText, minWords: targetRange.min }
        );
        if (
          revisedReport.score > report.score ||
          countWords(revisedSanitized.cleanContent) >= countWords(sanitized.cleanContent)
        ) {
          sanitized = revisedSanitized;
        }
      } catch (revErr) {
        console.warn(
          "[generateNewsDraft] revision pass skipped:",
          revErr instanceof Error ? revErr.message : revErr
        );
      }
    }

    const newsSlug = cleanNewsSlug(sanitized.cleanTitle);

    if (!candidateCoverImage) {
      candidateCoverImage = await resolveFallbackCulturalImage({
        title: sanitized.cleanTitle,
        cityName: input.cityName || sanitized.resolvedCitySlug,
        category: sanitized.category,
      });
    }

    const storedCoverImage = await ensureStoredCoverImage(
      candidateCoverImage,
      "news",
      newsSlug
    );

    const wordCount = countWords(sanitized.cleanContent);

    return {
      title: sanitized.cleanTitle,
      slug: newsSlug,
      summary: sanitized.cleanSummary,
      content: sanitized.cleanContent,
      category: sanitized.category,
      cover_image: storedCoverImage,
      city_slug: sanitized.resolvedCitySlug,
      source_name: sanitized.sourceName,
      word_count: wordCount,
    };
  } catch (error) {
    console.warn(
      "generateNewsDraft AI fallback triggered:",
      error instanceof Error ? error.message : error
    );

    let cleanFallbackTitle =
      cleanPublisherText(stripHtmlAndBoilerplate(topic))
        .replace(/!+$/g, "")
        .trim() || "Kültür ve Sanat Haberi";
    if (cleanFallbackTitle.length > SEO_LIMITS.newsTitle.hardMax) {
      cleanFallbackTitle =
        formatSeoTitle(cleanFallbackTitle, SEO_LIMITS.newsTitle.hardMax) ||
        cleanFallbackTitle;
    }
    const normTitleKey = cleanFallbackTitle
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9çğıöşü]/g, "");

    const rawLines = rawPageText
      .split(/\n+/)
      .map((p) => {
        const trimmed = p.trim();
        if (/^#{2,3}\s+/.test(trimmed)) {
          return `## ${cleanPublisherText(trimmed.replace(/^#{2,3}\s+/, "").replace(/:+$/, ""))}`;
        }
        return stripDatelineFromParagraph(cleanPublisherText(trimmed));
      })
      .filter((p) => {
        if (p.startsWith("## ")) return p.length >= 12;
        if (p.length < 24) return false;
        // Skip broken sentence fragments starting with punctuation or lowercase conjunctions
        if (/^[,.;:!?\-–—]/.test(p)) return false;
        const normP = p.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]/g, "");
        if (normTitleKey && normP === normTitleKey) return false;
        return true;
      });

    // Deduplicate paragraphs and convert ALL-CAPS or colon-suffixed subheadings into clean Markdown ## headings
    const seenKeys = new Set<string>();
    const formattedBlocks: string[] = [];
    let leadSummary = "";

    for (const line of rawLines) {
      if (line.startsWith("## ")) {
        if (formattedBlocks.length > 0 && !formattedBlocks[formattedBlocks.length - 1].startsWith("## ")) {
          formattedBlocks.push(line);
        }
        continue;
      }
      if (isAllCapsHeadingLine(line) || (line.length <= 75 && /:$/.test(line))) {
        const headingText = cleanPublisherText(toTurkishTitleCase(line.replace(/:+$/, "")));
        if (headingText.length >= 12 && formattedBlocks.length > 0) {
          formattedBlocks.push(`## ${headingText}`);
        }
        continue;
      }
      const normKey = line
        .toLocaleLowerCase("tr-TR")
        .replace(/[^a-z0-9çğıöşü]/g, "")
        .slice(0, 120);
      if (normKey.length < 15 || seenKeys.has(normKey)) continue;
      seenKeys.add(normKey);

      if (!leadSummary && line.length >= 45 && !line.startsWith("#")) {
        leadSummary = line;
      }
      formattedBlocks.push(line);
    }

    const fallbackCategory = inferNewsCategory(`${cleanFallbackTitle} ${rawPageText}`);
    const fallbackSlug = cleanNewsSlug(cleanFallbackTitle);
    const resolvedCitySlug =
      normalizeCitySlug(input.cityName) ||
      normalizeCitySlug(detectTurkishCityInText(`${cleanFallbackTitle} ${leadSummary} ${rawPageText}`));

    if (!candidateCoverImage) {
      candidateCoverImage = await resolveFallbackCulturalImage({
        title: cleanFallbackTitle,
        cityName: input.cityName || resolvedCitySlug,
        category: fallbackCategory,
      });
    }

    const storedCoverImage = await ensureStoredCoverImage(
      candidateCoverImage,
      "news",
      fallbackSlug
    );

    const rawFallbackSummary = stripDatelineFromParagraph(
      cleanPublisherText(
        stripHtmlAndBoilerplate(
          leadSummary ||
            input.fallbackText ||
            `${cleanFallbackTitle} kapsamında öne çıkan kültür ve sanat gelişmeleri kamuoyuyla paylaşıldı.`
        )
      )
    );
    const fallbackSummary = formatSeoSummary(rawFallbackSummary, 195);

    let bodyBlocks =
      formattedBlocks.length > 2 && formattedBlocks[0] === leadSummary
        ? formattedBlocks.slice(1)
        : formattedBlocks;

    // Never start the article body with a ## heading before the first paragraph
    while (bodyBlocks.length > 0 && bodyBlocks[0].startsWith("## ")) {
      bodyBlocks = bodyBlocks.slice(1);
    }

    const rawFallbackContent =
      bodyBlocks.length > 0 ? bodyBlocks.join("\n\n") : fallbackSummary;

    const fallbackContent = polishMarkdown(
      formatHeadingsWithHeuristics(rawFallbackContent, cleanFallbackTitle),
      cleanFallbackTitle,
      detectedSiteName
    );

    return {
      title: cleanFallbackTitle,
      slug: fallbackSlug,
      summary: fallbackSummary,
      content: fallbackContent,
      category: fallbackCategory,
      cover_image: storedCoverImage,
      city_slug: resolvedCitySlug,
      source_name: detectedSiteName || null,
      word_count: countWords(fallbackContent),
    };
  }
}
