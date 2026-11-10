import { callGeminiJson } from "@/lib/ai/gemini-client";
import { cleanPublisherText, stripDatelineFromParagraph } from "@/lib/ai/clean-publisher";
import {
  CORPORATE_STYLE_GUIDE,
  buildDateContext,
  countWords,
  polishMarkdown,
} from "@/lib/ai/editorial";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { filterImageCandidatesBySize } from "@/lib/ai/extract-page-images";
import { slugify } from "@/lib/slugify";
import { uploadArticleImagesFromUrls } from "@/lib/storage/upload-image-from-url";
import { formatSeoSummary } from "@/lib/utils";

export type ArticleDepth = "standard" | "deep" | "comprehensive";

type GenerateArticleInput = {
  topic: string;
  cityName?: string;
  type?: "guide" | "list" | "tips";
  sourceUrl?: string;
  fallbackText?: string;
  depth?: ArticleDepth;
};

export type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
  meta_description: string;
  cover_image?: string | null;
  uploaded_images?: string[];
  word_count?: number;
};

const ARTICLE_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    title: { type: "string" },
    excerpt: { type: "string" },
    meta_description: { type: "string" },
    content: { type: "string" },
  },
  required: ["title", "excerpt", "meta_description", "content"],
};

function buildArticleSystemPrompt(depth: ArticleDepth = "deep"): string {
  const depthGuide = {
    standard:
      "Hedef uzunluk: 500 - 750 kelime. Konuya özgü 3-4 özgün alt başlık ve somut ziyaret/kültür bilgileri.",
    deep: `Hedef uzunluk: 800 - 1300 kelime.
İçerikte şu unsurları konuya ve şehre özgü, doğal ve somut alt başlıklar (## ...) altında işle:
- Giriş ve mekânın/konunun şehir için kültürel ve tarihsel önemi (2 kapsamlı paragraf)
- Tarihsel arka plan, dönemler ve arkeolojik/tarihî bağlam (2-3 paragraf)
- Mimari doku, sanatsal özellikler ve öne çıkan bölümler/eserler (2-3 paragraf)
- Ziyaret deneyimi, çevre kültür durakları ve pratik ziyaretçi bilgileri (2-3 paragraf)`,
    comprehensive: `Hedef uzunluk: 1300 - 2000 kelime.
Kapsamlı bir kültür-gezi dosyası niteliğinde; konuya ve mekâna özgü özgün alt başlıklar (## ...) altında tarihsel arka planı, mimari ve sanatsal incelemeyi, adım adım keşif güzergâhını ve ziyaretçi bilgilerini ayrıntılı paragraflarla inşa et.`,
  };

  return `Sen Türkiye odaklı kıdemli bir kültür araştırmacısı ve gezi editörüsün. "Seni de Bekleriz" (senidebekleriz.com) portalı için kurumsal, somut bilgiye dayalı, derinlikli Türkçe kültür ve gezi rehberleri üretiyorsun.

${buildDateContext()}

${depthGuide[depth]}

${CORPORATE_STYLE_GUIDE}

EK REHBER KURALLARI:
- Markdown formatında yaz (giriş paragrafından sonra ## konuya özgü alt başlıklar ve doyurucu paragraflar).
- ŞABLON BAŞLIK YASAĞI: Asla "Tarihsel Köken ve Dönem Bilgileri", "Mimari ve Sanatsal Özellikler", "Detaylı Şehir Kültürü ve Gezi Tavsiyeleri", "Editör Notu", "Kaynakça", "Sonuç" gibi basmakalıp şablon alt başlıklar kullanma; her alt başlık anlatılan antik kente, müzeye veya şehre özel olsun.
- Kaynak metni kelimesi kelimesine kopyalama; somut verileri koruyarak editoryal derinlikle yeniden yaz.`;
}

const URL_SYSTEM_APPEND = `
URL kaynağı verildiğinde:
- Sayfadaki doğrulanmış bilgileri (mekan, mimari, tarihi dönem, eserler, konum) eksiksiz koru; kaynakta olmayan uydurma saat/fiyat bilgisi ekleme.
- Eğer kaynak "kulturportali.gov.tr" veya valilik/bakanlık sitesi ise: Resmi bürokratik dili akıcı, kurumsal ve rehber niteliğinde bir kültür dosyasına dönüştür.`;

function injectInlineImages(
  content: string,
  imageUrls: string[],
  title: string
): string {
  if (imageUrls.length === 0) return content;
  if (/!\[[^\]]*\]\([^)]+\)/.test(content.split("\n").slice(0, 12).join("\n"))) {
    return content;
  }

  const inlineBlocks = imageUrls
    .slice(1, 5)
    .map((url) => `![${title}](${url})`)
    .join("\n\n");

  if (!inlineBlocks) return content;

  const lines = content.split("\n");
  const firstHeadingIndex = lines.findIndex((line) => /^##\s+/.test(line));
  if (firstHeadingIndex === -1) {
    return `${content}\n\n${inlineBlocks}`;
  }

  lines.splice(firstHeadingIndex + 1, 0, "", inlineBlocks, "");
  return lines.join("\n");
}

function replaceSourceImageUrls(
  content: string,
  sourceUrls: string[],
  uploadedUrls: string[]
): string {
  let result = content;

  for (let i = 0; i < sourceUrls.length && i < uploadedUrls.length; i++) {
    const from = sourceUrls[i];
    const to = uploadedUrls[i];
    if (!from || !to || from === to) continue;
    result = result.split(from).join(to);
  }

  return result;
}

export async function generateArticleDraft(
  input: GenerateArticleInput
): Promise<GeneratedArticle> {
  let topic = cleanPublisherText(input.topic.trim());
  let sourceBlock: string | null = null;
  let fetchedImages: string[] = [];
  let slugHint = slugify(topic || "draft");

  if (input.sourceUrl?.trim()) {
    try {
      const fetched = await fetchUrlContent(input.sourceUrl.trim(), {
        maxTextLength: 14000,
        fallbackText: input.fallbackText,
        minTextLength: input.fallbackText && input.fallbackText.length >= 40 ? 40 : 80,
      });

      if (!topic) {
        topic = cleanPublisherText(fetched.pageTitle || new URL(fetched.url).hostname);
      }

      slugHint = slugify(topic);
      fetchedImages = await filterImageCandidatesBySize(fetched.imageUrls);

      sourceBlock = [
        `Kaynak URL: ${fetched.url}`,
        fetched.pageTitle ? `Sayfa başlığı: ${cleanPublisherText(fetched.pageTitle)}` : null,
        `Sayfa metni (referans): ${fetched.pageText}`,
      ]
        .filter(Boolean)
        .join("\n");
    } catch {
      const fallback = [topic, stripDatelineFromParagraph(input.fallbackText || "")]
        .filter(Boolean)
        .join("\n\n")
        .trim();

      if (fallback.length < 40) {
        throw new Error("Sayfadan yeterli metin çıkarılamadı");
      }

      sourceBlock = [
        `Kaynak URL: ${input.sourceUrl.trim()}`,
        topic ? `Başlık: ${topic}` : null,
        `Kaynak özeti: ${fallback}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  if (!topic) {
    throw new Error("Konu veya kaynak URL gerekli");
  }

  const userPrompt = [
    `Konu: ${topic}`,
    input.cityName ? `Şehir: ${input.cityName}` : null,
    `Yazı türü: ${input.type || "guide"}`,
    sourceBlock
      ? `${sourceBlock}\n\nYukarıdaki kaynak referans alınarak kurumsal ve özgün bir kültür/gezi rehberi oluştur.`
      : "Türkiye kültür, tarih ve sanat portalı için özgün ve kurumsal bir kültür rehberi oluştur.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const mediaPromise =
    fetchedImages.length > 0
      ? uploadArticleImagesFromUrls(fetchedImages, slugHint, { maxImages: 8 })
      : Promise.resolve({ coverImage: null, uploadedImages: [] as string[] });

  const requestedDepth: ArticleDepth = input.depth || "deep";
  const systemPrompt = buildArticleSystemPrompt(requestedDepth);

  let parsed: Omit<GeneratedArticle, "cover_image" | "uploaded_images">;
  try {
    parsed = await callGeminiJson<Omit<GeneratedArticle, "cover_image" | "uploaded_images">>({
      systemPrompt: sourceBlock
        ? `${systemPrompt}\n${URL_SYSTEM_APPEND}`
        : systemPrompt,
      userPrompt,
      temperature: sourceBlock ? 0.4 : 0.55,
      maxOutputTokens: 8192,
      thinking: "low",
      responseSchema: ARTICLE_RESPONSE_SCHEMA,
    });
  } catch (error) {
    console.warn(
      "generateArticleDraft AI fallback triggered:",
      error instanceof Error ? error.message : error
    );
    const cleanFallbackBody = stripDatelineFromParagraph(
      input.fallbackText || `${topic}, Türkiye'nin öne çıkan kültür ve miras durakları arasında yer almaktadır.`
    );
    parsed = {
      title: topic,
      excerpt: formatSeoSummary(cleanFallbackBody, 160),
      meta_description: formatSeoSummary(
        `${topic} hakkında kültür, tarih ve ziyaret bilgileri.`,
        155
      ),
      content: [
        cleanFallbackBody,
        "",
        `## ${topic} ve Kültürel Miras Değeri`,
        "Mekânın tarihsel gelişimi, mimari dokusu ve güncel ziyaret koşulları resmi kültür envanteri verileri doğrultusunda değerlendirilmektedir.",
      ].join("\n"),
    };
  }

  const media = await mediaPromise;
  const cleanTitle = cleanPublisherText(parsed.title || topic);
  const polishedContent = polishMarkdown(parsed.content, cleanTitle);

  const contentWithMappedUrls = replaceSourceImageUrls(
    polishedContent,
    fetchedImages,
    media.uploadedImages
  );

  const contentWithImages = injectInlineImages(
    contentWithMappedUrls,
    media.uploadedImages,
    cleanTitle
  );

  const wordCount = countWords(contentWithImages);

  return {
    title: cleanTitle,
    excerpt: formatSeoSummary(
      stripDatelineFromParagraph(cleanPublisherText(parsed.excerpt || cleanTitle)),
      180
    ),
    meta_description: formatSeoSummary(
      stripDatelineFromParagraph(
        cleanPublisherText(parsed.meta_description || parsed.excerpt || cleanTitle)
      ),
      155
    ),
    content: contentWithImages,
    cover_image: media.coverImage,
    uploaded_images: media.uploadedImages,
    word_count: wordCount,
  };
}
