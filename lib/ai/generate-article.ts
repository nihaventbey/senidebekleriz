import { callGeminiJson } from "@/lib/ai/gemini-client";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { slugify } from "@/lib/slugify";
import { uploadArticleImagesFromUrls } from "@/lib/storage/upload-image-from-url";

type GenerateArticleInput = {
  topic: string;
  cityName?: string;
  type?: "guide" | "list" | "tips";
  sourceUrl?: string;
};

export type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
  meta_description: string;
  cover_image?: string | null;
  uploaded_images?: string[];
};

const BASE_SYSTEM_PROMPT = `Sen Türkiye odaklı bir kültür ve gezi editörüsün. Seni de Bekleriz sitesi için özgün Türkçe gezi rehberi yazıları üretiyorsun.
Kurallar:
- Markdown formatında yaz (## başlıklar, madde işaretleri, kısa paragraflar)
- En az 400 kelime, zengin ve okunabilir yapı
- Kaynak metni kelimesi kelimesine kopyalama; editoryal yeniden yazım yap
- Wikipedia veya kaynak sitesinden blok alıntı yapma
- Uydurma açılış saatleri/ücret/bilet stoku iddiası verme; genel ipuçları kullan
- 1-2 cümlelik giriş, 3-5 alt başlık, pratik ipuçları ve sonunda "## Editör Notu" bölümü ekle
Yanıt yalnızca geçerli JSON:
{"title":"...","excerpt":"...","meta_description":"...","content":"..."}`;

const URL_SYSTEM_APPEND = `
URL kaynağı verildiğinde:
- Sayfadaki gerçek bilgileri (mekan, etkinlik, tarih, konum) doğru yansıt
- Ton: kültür, tarih, sanat ve müze odaklı Seni de Bekleriz editoryal stili
- Editör Notu'nda kaynak URL'yi "Kaynak: ..." şeklinde belirt
- Kaynak kültür/tarih dışıysa yine de nötr özet yap; yeme-içme reklam tonu kullanma`;

function injectInlineImages(
  content: string,
  imageUrls: string[],
  title: string
): string {
  if (imageUrls.length === 0) return content;
  if (/!\[[^\]]*\]\([^)]+\)/.test(content.split("\n").slice(0, 8).join("\n"))) {
    return content;
  }

  const inlineBlocks = imageUrls
    .slice(1, 3)
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

export async function generateArticleDraft(
  input: GenerateArticleInput
): Promise<GeneratedArticle> {
  let topic = input.topic.trim();
  let sourceBlock: string | null = null;
  let fetchedImages: string[] = [];
  let slugHint = slugify(topic || "draft");

  if (input.sourceUrl?.trim()) {
    const fetched = await fetchUrlContent(input.sourceUrl.trim(), {
      maxTextLength: 14000,
    });

    if (!topic) {
      topic = fetched.pageTitle || new URL(fetched.url).hostname;
    }

    slugHint = slugify(topic);
    fetchedImages = fetched.imageUrls;

    sourceBlock = [
      `Kaynak URL: ${fetched.url}`,
      fetched.pageTitle ? `Sayfa başlığı: ${fetched.pageTitle}` : null,
      `Sayfa metni (referans): ${fetched.pageText}`,
    ]
      .filter(Boolean)
      .join("\n");
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
      ? uploadArticleImagesFromUrls(fetchedImages, slugHint)
      : Promise.resolve({ coverImage: null, uploadedImages: [] as string[] });

  const [parsed, media] = await Promise.all([
    callGeminiJson<Omit<GeneratedArticle, "cover_image" | "uploaded_images">>({
      systemPrompt: sourceBlock
        ? `${BASE_SYSTEM_PROMPT}\n${URL_SYSTEM_APPEND}`
        : BASE_SYSTEM_PROMPT,
      userPrompt,
      temperature: sourceBlock ? 0.55 : 0.7,
    }),
    mediaPromise,
  ]);

  if (!parsed.title || !parsed.content) {
    throw new Error("Gemini yanıtı geçersiz");
  }

  const contentWithImages = injectInlineImages(
    parsed.content,
    media.uploadedImages,
    parsed.title
  );

  return {
    ...parsed,
    content: contentWithImages,
    cover_image: media.coverImage,
    uploaded_images: media.uploadedImages,
  };
}
