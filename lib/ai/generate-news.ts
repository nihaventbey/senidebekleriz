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

      sourceBlock = [
        input.sourceUrl ? `Haber Kaynak URL: ${input.sourceUrl.trim()}` : null,
        input.topic ? `Başlık: ${input.topic}` : null,
        fallback ? `Özet: ${fallback}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  if (!topic) {
    topic = input.fallbackText?.slice(0, 60) || "Kültür & Sanat Gündemi";
  }

  const candidateCoverImage = fetchedImages.length > 0 ? fetchedImages[0] : null;

  const userPrompt = [
    `Haber Konusu / Başlığı: ${topic}`,
    input.cityName ? `İlgili Şehir: ${input.cityName}` : null,
    sourceBlock
      ? `${sourceBlock}\n\nYukarıdaki bilgileri esas alarak özgün, profesyonel bir kültür-sanat haberi oluştur.`
      : "Türkiye kültür, sanat ve tarih platformu için özgün bir haber oluştur.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const parsed = await callGeminiJson<Omit<GeneratedNews, "cover_image" | "uploaded_images">>({
      systemPrompt: NEWS_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.4,
    });

    if (!parsed.title || !parsed.content) {
      throw new Error("AI haber yanıtı geçersiz");
    }

    return {
      title: parsed.title,
      summary: parsed.summary || parsed.title,
      content: parsed.content,
      category: parsed.category || "genel",
      cover_image: candidateCoverImage,
      uploaded_images: fetchedImages,
    };
  } catch (error) {
    console.warn(
      "generateNewsDraft AI fallback:",
      error instanceof Error ? error.message : error
    );

    const summary = (input.fallbackText || topic).slice(0, 200).trim();
    const lower = (topic + " " + (input.fallbackText || "")).toLowerCase();

    let category: GeneratedNews["category"] = "genel";
    if (lower.includes("arkeo") || lower.includes("kazı") || lower.includes("lahit") || lower.includes("antik")) {
      category = "arkeoloji";
    } else if (lower.includes("restorasyon") || lower.includes("tarihi yapı") || lower.includes("onarım")) {
      category = "restorasyon";
    } else if (lower.includes("sergi") || lower.includes("müze") || lower.includes("galeri")) {
      category = "muze_sergi";
    } else if (lower.includes("festival") || lower.includes("şenlik")) {
      category = "festival_haberleri";
    } else if (lower.includes("tiyatro") || lower.includes("konser") || lower.includes("opera") || lower.includes("bale") || lower.includes("sanat")) {
      category = "kultur_sanat";
    }

    const content = [
      `# ${topic}`,
      "",
      summary,
      "",
      "## Gelişmeler ve Kültürel Detaylar",
      input.fallbackText && input.fallbackText.length > 50
        ? input.fallbackText
        : `${topic} başlığıyla duyurulan kültür-sanat gelişmesi Seni de Bekleriz şehir ve kültür portalında yerini aldı. Detaylar ve etkinlik takvimi resmi kaynaklar doğrultusunda güncellenmektedir.`,
      "",
      "## Kaynak ve Detaylar",
      input.sourceUrl
        ? `Bu haber [orijinal kaynak (${input.sourceUrl})](${input.sourceUrl}) esas alınarak derlenmiştir.`
        : "Kültür ve Sanat Ajandası Haber Merkezi.",
    ].join("\n");

    return {
      title: topic,
      summary,
      content,
      category,
      cover_image: candidateCoverImage,
      uploaded_images: fetchedImages,
    };
  }
}
