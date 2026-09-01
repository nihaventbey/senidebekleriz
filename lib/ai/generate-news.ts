import { callGeminiJson } from "@/lib/ai/gemini-client";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { filterImageCandidatesBySize } from "@/lib/ai/extract-page-images";
import { slugify } from "@/lib/slugify";
import { uploadArticleImagesFromUrls } from "@/lib/storage/upload-image-from-url";

type GenerateNewsInput = {
  topic: string;
  sourceUrl?: string;
  fallbackText?: string;
  cityName?: string;
};

export type GeneratedNews = {
  title: string;
  summary: string;
  content: string;
  category: "arkeoloji" | "restorasyon" | "muze_sergi" | "kultur_sanat" | "festival_haberleri" | "genel";
  city_slug?: string | null;
  cover_image?: string | null;
  uploaded_images?: string[];
};

const NEWS_SYSTEM_PROMPT = `Sen Türkiye kültür, sanat, tarih ve arkeoloji odaklı kıdemli bir haber editörüsün. Seni de Bekleriz portalı için tarafsız, bilgilendirici, zengin ve özgün Türkçe kültür-sanat haberleri hazırlıyorsun.

Kurallar:
- Haber başlığı vurucu, editoryal ve tıklama tuzağı (clickbait) olmayan kaliteli gazetecilik üslubunda olsun
- İlk paragraf 5N1K (Ne, Nerede, Ne Zaman, Nasıl, Neden, Kim) özetini versin
- Markdown formatında yaz (## alt başlıklar, detaylı paragraflar, alıntılar)
- En az 300 kelime, doyurucu ve derinlikli metin üret
- Kategori yalnızca şu seçeneklerden biri olmalıdır: "arkeoloji" | "restorasyon" | "muze_sergi" | "kultur_sanat" | "festival_haberleri" | "genel"
- Metnin sonunda "## Kaynak ve Detaylar" başlığıyla kaynak atfını belirt
- Yanıt yalnızca geçerli JSON olmalıdır:
{"title":"...","summary":"...","category":"kultur_sanat","content":"..."}`;

export async function generateNewsDraft(
  input: GenerateNewsInput
): Promise<GeneratedNews> {
  let topic = input.topic.trim();
  let sourceBlock: string | null = null;
  let fetchedImages: string[] = [];
  let slugHint = slugify(topic || "haber");

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
        `Haber Kaynak URL: ${fetched.url}`,
        fetched.pageTitle ? `Kaynak Sayfa Başlığı: ${fetched.pageTitle}` : null,
        `Kaynak Sayfa Metni: ${fetched.pageText}`,
      ]
        .filter(Boolean)
        .join("\n");
    } catch {
      const fallback = [input.topic, input.fallbackText]
        .filter(Boolean)
        .join("\n\n")
        .trim();

      if (fallback.length < 40) {
        throw new Error("Sayfadan yeterli haber metni çıkarılamadı");
      }

      sourceBlock = [
        `Haber Kaynak URL: ${input.sourceUrl.trim()}`,
        input.topic ? `Başlık: ${input.topic}` : null,
        `Özet: ${fallback}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  if (!topic) {
    throw new Error("Haber konusu veya kaynak URL gereklidir");
  }

  const userPrompt = [
    `Haber Konusu / Başlığı: ${topic}`,
    input.cityName ? `İlgili Şehir: ${input.cityName}` : null,
    sourceBlock
      ? `${sourceBlock}\n\nYukarıdaki bilgileri esas alarak özgün, profesyonel bir kültür-sanat haberi oluştur.`
      : "Türkiye kültür, sanat ve tarih platformu için özgün bir haber oluştur.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const mediaPromise =
    fetchedImages.length > 0
      ? uploadArticleImagesFromUrls(fetchedImages, slugHint, { maxImages: 6 })
      : Promise.resolve({ coverImage: null, uploadedImages: [] as string[] });

  const [parsed, media] = await Promise.all([
    callGeminiJson<Omit<GeneratedNews, "cover_image" | "uploaded_images">>({
      systemPrompt: NEWS_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.4,
    }),
    mediaPromise,
  ]);

  if (!parsed.title || !parsed.content) {
    throw new Error("AI haber yanıtı geçersiz");
  }

  return {
    title: parsed.title,
    summary: parsed.summary || parsed.title,
    content: parsed.content,
    category: parsed.category || "genel",
    cover_image: media.coverImage,
    uploaded_images: media.uploadedImages,
  };
}
