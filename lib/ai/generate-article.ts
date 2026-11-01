import { callGeminiJson } from "@/lib/ai/gemini-client";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import {
  filterImageCandidatesBySize,
} from "@/lib/ai/extract-page-images";
import { slugify } from "@/lib/slugify";
import { uploadArticleImagesFromUrls } from "@/lib/storage/upload-image-from-url";

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

function buildArticleSystemPrompt(depth: ArticleDepth = "deep"): string {
  const depthGuide = {
    standard: "Hedef uzunluk: 500 - 750 kelime. 3-4 alt başlık, pratik ipuçları ve SSS.",
    deep: `Hedef uzunluk: 800 - 1300 kelime.
Aşağıdaki 6 ana bölümü ayrıntılı ve doyurucu paragraflarla inşa et:
1. Giriş ve Mekânın / Konunun Şehir İçin Anlamı (2 kapsamlı paragraf)
2. ## Tarihsel Köken ve Dönem Bilgileri (2-3 paragraf)
3. ## Mimari ve Sanatsal Özellikler (2-3 paragraf)
4. ## Ziyaret Deneyimi ve Öne Çıkan Rotalar (2-3 paragraf)
5. ## Ziyaretçi Rehberi: Ulaşım ve Pratik Bilgiler (ulaşım, en iyi mevsim/saat, çevredeki duraklar)
6. ## Sıkça Sorulan Sorular (3-4 maddelik soru-cevap: '### 1. ...')
7. ## Editör Notu ve Kaynakça`,
    comprehensive: `Hedef uzunluk: 1300 - 2000+ kelime.
Kapsamlı bir kültür-gezi ansiklopedisi ve seyahat monografisi niteliğinde üret:
1. Kapsamlı Editoryal Giriş & Coğrafi/Kültürel Kimlik (3 paragraf)
2. ## Derinlemesine Tarihsel Arka Plan ve Arşiv Notları (3-4 paragraf)
3. ## Mimari Detaylar, Sanat Eserleri ve Üslup İncelemesi (3-4 paragraf)
4. ## Adım Adım Gezi Güzergâhı ve Deneyim Rotaları (3-4 paragraf)
5. ## Kapsamlı Ziyaretçi Rehberi (ulaşım, çevre köyler/ilçeler, yerel kültür)
6. ## Sıkça Sorulan Sorular (5-6 maddelik ayrıntılı SSS)
7. ## Editör Notu ve Bibliyografya`,
  };

  return `Sen Türkiye odaklı kıdemli bir kültür araştırmacısı ve gezi editörüsün. Seni de Bekleriz (senidebekleriz.com) portalı için zengin, akıcı, derinlikli Türkçe kültür ve gezi rehberleri üretiyorsun.

${depthGuide[depth]}

KURALLAR:
- Markdown formatında yaz (## alt başlıklar, ### SSS maddeleri, temiz paragraflar)
- Kesinlikle hiçbir ham HTML etiketi (<a href...>, <font>, vb.) kullanma.
- Kaynak metni kelimesi kelimesine kopyalama; editoryal derinlikle yeniden yazım yap
- Wikipedia veya kaynak sitelerden kuru bürokratik dil veya ham blok alıntı yapma
- Metni Türkiye'nin zengin tarihi, sanatı, mimarisi ve kültürel dokusu bilgisiyle zenginleştir
- Yanıt yalnızca geçerli JSON:
{"title":"...","excerpt":"...","meta_description":"...","content":"..."}`;
}

const BASE_SYSTEM_PROMPT = buildArticleSystemPrompt("deep");

const URL_SYSTEM_APPEND = `
URL kaynağı verildiğinde:
- Sayfadaki gerçek bilgileri (mekan, mimari, tarihi dönem, etkinlik, tarih, konum) doğru yansıt
- Eğer kaynak "kulturportali.gov.tr" veya valilik/bakanlık sitesi ise: Resmi kuru bürokratik dilden tamamen arındır; samimi, sürükleyici ve rehber niteliğinde zengin bir Türkçe gezi/kültür makalesine dönüştür. Tarihçe, mimari detaylar ve ziyaret ipuçlarını akıcı anlat.
- Eğer kaynak "kulturyolufestivali.com" veya festival duyurusu ise: Festivalin düzenlendiği şehrin kültürel atmosferini, etkinliğin sanat değerini ve katılımcı deneyimini öne çıkar.
- Ton: Kültür, tarih, sanat ve gezi odaklı Seni de Bekleriz editoryal stili
- Editör Notu'nda kaynak URL'yi "Kaynak: ..." şeklinde belirt
- Kaynak kültür/tarih dışıysa yine de nötr özet yap; yeme-içme reklam tonu kullanma`;

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
  let topic = input.topic.trim();
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
        topic = fetched.pageTitle || new URL(fetched.url).hostname;
      }

      slugHint = slugify(topic);
      fetchedImages = await filterImageCandidatesBySize(fetched.imageUrls);

      sourceBlock = [
        `Kaynak URL: ${fetched.url}`,
        fetched.pageTitle ? `Sayfa başlığı: ${fetched.pageTitle}` : null,
        `Sayfa metni (referans): ${fetched.pageText}`,
      ]
        .filter(Boolean)
        .join("\n");
    } catch {
      const fallback = [input.topic, input.fallbackText]
        .filter(Boolean)
        .join("\n\n")
        .trim();

      if (fallback.length < 40) {
        throw new Error("Sayfadan yeterli metin çıkarılamadı");
      }

      sourceBlock = [
        `Kaynak URL: ${input.sourceUrl.trim()}`,
        input.topic ? `Başlık: ${input.topic}` : null,
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
      ? `${sourceBlock}\n\nYukarıdaki kaynak referans alınarak özgün bir blog yazısı oluştur.`
      : "Türkiye kültür/tarih/sanat gezi rehberi sitesi için özgün bir yazı oluştur.",
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
      temperature: sourceBlock ? 0.45 : 0.65,
      maxOutputTokens: 8192,
    });
  } catch (error) {
    console.warn("generateArticleDraft AI fallback triggered:", error instanceof Error ? error.message : error);
    parsed = {
      title: topic,
      excerpt: (input.fallbackText || topic).slice(0, 160),
      meta_description: `${topic} hakkında detaylı gezi rehberi, tarihi ve kültürel bilgiler.`,
      content: [
        `# ${topic}`,
        "",
        input.fallbackText || `${topic} hakkında kültür, sanat ve tarih odaklı gezi rehberi Seni de Bekleriz'de.`,
        "",
        "## Öne Çıkan Özellikler ve Ziyaret Notları",
        "Bu mekan ve kültürel değer hakkında güncel gezi notları, mimari doku ve ziyaret saatleri resmi bilgilendirmeler doğrultusunda sunulmaktadır.",
        "",
        "## Editör Notu",
        input.sourceUrl ? `Kaynak: [Orijinal Bilgi ve Detaylar](${input.sourceUrl})` : "Kaynak: Kültür ve Sanat Portalı.",
      ].join("\n"),
    };
  }

  const media = await mediaPromise;

  const contentWithMappedUrls = replaceSourceImageUrls(
    parsed.content,
    fetchedImages,
    media.uploadedImages
  );

  const contentWithImages = injectInlineImages(
    contentWithMappedUrls,
    media.uploadedImages,
    parsed.title
  );

  const wordCount = contentWithImages.trim().split(/\s+/).filter(Boolean).length;

  return {
    ...parsed,
    content: contentWithImages,
    cover_image: media.coverImage,
    uploaded_images: media.uploadedImages,
    word_count: wordCount,
  };
}
