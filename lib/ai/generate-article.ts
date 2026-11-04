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
    standard: "Hedef uzunluk: 500 - 750 kelime. Konuya özgü 3-4 özgün alt başlık ve pratik gezi/ziyaret ipuçları.",
    deep: `Hedef uzunluk: 800 - 1300 kelime.
İçerikte şu unsurları konuya ve şehre özgü, doğal ve özgün alt başlıklar (## ...) altında işle:
- Giriş ve mekânın/konunun şehir için kültürel anlamı (2 kapsamlı paragraf)
- Tarihsel köken ve dönem bilgileri (2-3 paragraf)
- Mimari doku, sanatsal özellikler ve öne çıkan eserler (2-3 paragraf)
- Ziyaret deneyimi, yürüyüş/keşif rotaları ve çevre duraklar (2-3 paragraf)
- Ulaşım, ziyaret saatleri, Müzekart/giriş bilgileri ve pratik tavsiyeler`,
    comprehensive: `Hedef uzunluk: 1300 - 2000+ kelime.
Kapsamlı bir kültür-gezi rehberi niteliğinde; konuya ve mekâna özgü özgün alt başlıklar (## ...) altında tarihsel arka planı, mimari ve sanatsal incelemeyi, adım adım gezi güzergâhını ve pratik ziyaretçi bilgilerini ayrıntılı paragraflarla inşa et.`,
  };

  return `Sen Türkiye odaklı kıdemli bir kültür araştırmacısı ve gezi editörüsün. Seni de Bekleriz (senidebekleriz.com) portalı için zengin, akıcı, derinlikli Türkçe kültür ve gezi rehberleri üretiyorsun.

${depthGuide[depth]}

KURALLAR:
- Markdown formatında yaz (## konuya özgü alt başlıklar, temiz paragraflar)
- ŞABLON BAŞLIK YASAĞI: Asla "Tarihsel Köken ve Dönem Bilgileri", "Mimari ve Sanatsal Özellikler", "Detaylı Şehir Kültürü ve Gezi Tavsiyeleri", "Editör Notu ve Kaynakça", "1. Soru:" gibi yapay zeka şablonu kokan basmakalıp alt başlıklar kullanma; her alt başlık anlatılan antik kente, müzeye veya şehre özel olsun.
- Yapay zeka klişelerinden ("adeta bir zaman yolculuğu", "büyüleyici atmosfer", "unutulmaz bir deneyim") kaçın; somut ve bilgi dolu bir editoryal dil kullan.
- Kesinlikle hiçbir ham HTML etiketi (<a href...>, <font>, vb.) kullanma.
- Kaynak metni kelimesi kelimesine kopyalama; editoryal derinlikle yeniden yazım yap
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
