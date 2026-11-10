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
        "60-90 karakter arası, ajans adı ve soru/ünlem içermeyen kurumsal Türkçe haber başlığı",
    },
    summary: {
      type: "string",
      description:
        "220-340 karakter arası, 5N1K kuralına uygun, 2-3 tam cümleden oluşan, nokta ile biten haber spotu",
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
  standard: { min: 350, max: 550 },
  deep: { min: 550, max: 850 },
  comprehensive: { min: 850, max: 1300 },
};

function buildSystemPrompt(
  depth: NewsDepth,
  targetRange: { min: number; max: number; thinSource: boolean },
  dateContext: string
): string {
  const lengthInstruction = targetRange.thinSource
    ? `HEDEF UZUNLUK: ${targetRange.min} - ${targetRange.max} kelime. Kaynak metin kısa bir bülten/özet olduğu için; kaynaktaki somut verileri eksiksiz koruyarak ve yalnızca adı geçen kurumun, müzenin veya antik kentin doğrulanmış kurumsal/tarihsel arka planını ekleyerek odaklı, yoğun ve kurumsal bir haber metni oluştur. Kaynakta bulunmayan alıntı, sayı, saat veya uydurma detay KESİNLİKLE ekleme.`
    : `HEDEF UZUNLUK: ${targetRange.min} - ${targetRange.max} kelime (${depth} derinlik). Kaynaktaki tüm somut verileri, uzman ve yetkili açıklamalarını, sayısal bilgileri ve kültürel/tarihsel bağlamı eksiksiz, akıcı ve kurumsal bir dille aktaran kapsamlı kültür-sanat haberi hazırla.`;

  return `Sen Türkiye'nin kültür, sanat, tarih ve arkeoloji yayını "Seni de Bekleriz"in (senidebekleriz.com) kıdemli baş editörü ve kültür gazetecisisin.
Görevin: Verilen kaynak içerikten hareketle, ajans kopyacılığından uzak, edebi ciddiyet, yüksek editoryal kalite ve kurumsal gazetecilik standartlarında özgün bir Türkçe haber hazırlamaktır.

${dateContext}

${lengthInstruction}

${CORPORATE_STYLE_GUIDE}

═══════════════════════════════════════════════════════════════════
HABER MİMARİSİ VE ALAN KURALLARI
═══════════════════════════════════════════════════════════════════

1. BAĞLAM ANALİZİ VE GÜRÜLTÜYÜ TEMİZLEME:
   - Kaynak metin web sitelerinden kazınmış olabilir; içindeki arayüz kalıntılarını, başka şehirlere ait yan haberleri, reklamları, siyasi polemikleri veya magazin detaylarını tamamen ayıkla.
   - SADECE haberin ana kültür, sanat, arkeoloji, restorasyon, müze, sinema veya festival konusunu işle.
   - Kaynak metindeki somut verileri (yer adları, tarihler, kişi isimleri, kazı başkanı, müze adı, eser ismi, kullanılan teknikler, katılım koşulları) EKSİKSİZ koru; kaynakta olmayan bilgi veya alıntı uydurma.
   - Kaynaktaki cümleleri kelimesi kelimesine kopyalama; tüm paragrafları bağımsız kültür yayını üslubuyla yeniden kurgula.

2. BAŞLIK (title):
   - 55 - 90 karakter arası, doğrudan, bilgilendirici, kurumsal ve SEO uyumlu Türkçe başlık.
   - ASLA ajans/gazete adı ("AA", "İHA", "DHA", "ANKA", "TRT", "NTV Haber", "Hürriyet"), ünlem işareti veya klik tuzağı soru cümlesi ("Açıldı mı?", "Şok gelişme!") içermez.
   - Haberin somut kültürel değerini etken çatıyla verir (Örn: "Stratonikeia Antik Kenti'nde 1800 Yıllık Roma Mozaiği Gün Yüzüne Çıkarıldı").

3. 5N1K HABER SPOTU (summary):
   - 220 - 340 karakter arası, 5N1K kuralına uygun (Ne, Nerede, Kim, Ne Zaman, Nasıl/Niçin), 2-3 akıcı ve tam Türkçe cümleden oluşan, sonu mutlaka nokta ile biten haber spotu.
   - Ajans dateline'ı ("ANTALYA, (DHA) -") veya kaynak adı içermez.

4. HABER METNİ VE ALT BAŞLIKLAR (content):
   - GİRİŞ PARAGRAFI: Habere bağlamı kuran güçlü bir giriş paragrafıyla başla. Giriş paragrafının üstüne başlık KOYMA ve "summary" alanını kelimesi kelimesine tekrarlama.
   - TEMATİK ALT BAŞLIKLAR: Girişten sonra haberin farklı boyutlarını, teknik detaylarını, yetkili/uzman açıklamalarını ve kültürel önemini ele alan 2 ila 4 adet "## [Konuya Özgü Alt Başlık]" kullan.
   - Her alt başlığın altında en az 2 doyurucu paragraf yer almalıdır.
   - ASLA kalıp başlıklar ("## Detaylar", "## Gelişmeler", "## Sonuç", "## Tarihçe") veya ana haber başlığının tekrarını kullanma. Başlıklar o bölümün somut konusunu yansıtmalıdır.`;
}

function sanitizeGeneratedNewsFields(
  raw: Partial<GeneratedNewsDraft>,
  fallbackTopic: string,
  rawPageText: string,
  inputCityName?: string,
  detectedSiteName?: string
) {
  const cleanTitle = cleanPublisherText(raw.title || fallbackTopic)
    .replace(/!+$/g, "")
    .trim();

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

  let cleanContent = polishMarkdown(cleanedLines.join("\n\n"), cleanTitle);
  cleanContent = formatHeadingsWithHeuristics(cleanContent, cleanTitle);

  let cleanSummary = formatSeoSummary(
    stripDatelineFromParagraph(cleanPublisherText(raw.summary || cleanTitle)),
    340
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
      cleanContent = polishMarkdown(contentBlocks.slice(1).join("\n\n"), cleanTitle);
    }
  }

  const category = VALID_CATEGORIES.has(raw.category as string)
    ? (raw.category as GeneratedNewsDraft["category"])
    : inferNewsCategory(`${cleanTitle} ${rawPageText}`);

  const resolvedCitySlug =
    normalizeCitySlug(raw.city_slug) ||
    normalizeCitySlug(inputCityName) ||
    normalizeCitySlug(detectTurkishCityInText(`${cleanTitle} ${cleanSummary} ${rawPageText}`));

  const sourceName =
    raw.source_name?.trim() || detectedSiteName || null;

  return {
    cleanTitle,
    cleanSummary,
    cleanContent,
    category,
    resolvedCitySlug,
    sourceName,
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

    // Self-healing revision pass if the draft failed quality checks
    if (!report.passed && isGeminiConfigured()) {
      try {
        const revisionPrompt = [
          userPrompt,
          `ÖNCEKİ TASLAKTA TESPİT EDİLEN EDİTÖRYAL SORUNLAR:\n${formatIssuesForRevision(report)}`,
          `Önceki Başlık: ${sanitized.cleanTitle}\nÖnceki Spot: ${sanitized.cleanSummary}\nÖnceki Metin:\n${sanitized.cleanContent}`,
          `GÖREV: Yukarıdaki sorunları gidererek haberi kurumsal yayın ilkelerine uygun, kaynaktaki somut verilere sadık, özgün cümlelerle ve en az ${targetRange.min} kelime olacak biçimde yeniden üret.`,
        ].join("\n\n");

        const revised = await callGeminiJson<GeneratedNewsDraft>({
          systemPrompt,
          userPrompt: revisionPrompt,
          temperature: 0.3,
          maxOutputTokens: 8192,
          thinking: "minimal",
          timeoutMs: 30000,
          responseSchema: NEWS_RESPONSE_SCHEMA,
        });

        const revisedSanitized = sanitizeGeneratedNewsFields(
          revised,
          topic,
          rawPageText,
          input.cityName,
          detectedSiteName
        );
        if (countWords(revisedSanitized.cleanContent) >= countWords(sanitized.cleanContent)) {
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

    const cleanFallbackTitle = cleanPublisherText(topic).replace(/!+$/g, "").trim() || "Kültür ve Sanat Haberi";
    const normTitleKey = cleanFallbackTitle
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9çğıöşü]/g, "");

    const rawLines = rawPageText
      .split(/\n+/)
      .map((p) => stripDatelineFromParagraph(cleanPublisherText(p.trim())))
      .filter((p) => {
        if (p.length < 24) return false;
        // Skip broken sentence fragments starting with punctuation or lowercase conjunctions
        if (/^[,.;:!?\-–—]/.test(p)) return false;
        const normP = p.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]/g, "");
        if (normTitleKey && normP === normTitleKey) return false;
        return true;
      });

    // Deduplicate paragraphs and convert ALL-CAPS subheadings into clean Markdown ## headings
    const seenKeys = new Set<string>();
    const formattedBlocks: string[] = [];
    let leadSummary = "";

    for (const line of rawLines) {
      if (isAllCapsHeadingLine(line)) {
        const headingText = cleanPublisherText(toTurkishTitleCase(line));
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
        leadSummary ||
          input.fallbackText ||
          `${cleanFallbackTitle} kapsamında öne çıkan kültür ve sanat gelişmeleri kamuoyuyla paylaşıldı.`
      )
    );
    const fallbackSummary = formatSeoSummary(rawFallbackSummary, 340);

    const bodyBlocks =
      formattedBlocks.length > 2 && formattedBlocks[0] === leadSummary
        ? formattedBlocks.slice(1)
        : formattedBlocks;

    const rawFallbackContent =
      bodyBlocks.length > 0 ? bodyBlocks.join("\n\n") : fallbackSummary;

    const fallbackContent = formatHeadingsWithHeuristics(
      rawFallbackContent,
      cleanFallbackTitle
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
