import { callGeminiJson } from "@/lib/ai/gemini-client";
import { fetchUrlContent, type FetchedUrlContent } from "@/lib/ai/fetch-url-content";
import { filterImageCandidatesBySize } from "@/lib/ai/extract-page-images";
import { slugify } from "@/lib/slugify";
import { stripHtmlTags } from "@/lib/events/sources/ktb-rss";

type GenerateNewsInput = {
  topic: string;
  sourceUrl?: string;
  fallbackText?: string;
  cityName?: string;
};

export type NewsCategory =
  | "arkeoloji"
  | "restorasyon"
  | "muze_sergi"
  | "kultur_sanat"
  | "festival_haberleri"
  | "genel";

export type GeneratedNews = {
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  city_slug?: string | null;
  cover_image?: string | null;
  uploaded_images?: string[];
};

const CATEGORY_EDITORIAL_GUIDELINES: Record<NewsCategory, string> = {
  arkeoloji:
    "Kategori: Arkeoloji. Kazı alanı, kazı başkanı veya araştırma ekibi, tarihi dönem (Antik, Roma, Bizans, Helenistik, Hitit, Selçuklu, vb.), ortaya çıkarılan eserler ve buluntuların bilimsel/kültürel önemini vurgula.",
  restorasyon:
    "Kategori: Restorasyon. Tarihi yapının geçmişi, mimari özellikleri, yıpranma durumu, uygulanan bilimsel konservasyon/restorasyon yöntemleri ve yapının gelecekteki fonksiyonunu (müze, kültür merkezi, kütüphane vb.) detaylandır.",
  muze_sergi:
    "Kategori: Müze & Sergi. Serginin teması ve kavramsal çerçevesi, sergilenen sanatçılar/eserler, küratör yaklaşımı, sergi mekanı, ziyaret gün ve saatleri ile bilet/ücretsiz giriş bilgilerini aktar.",
  festival_haberleri:
    "Kategori: Festival Haberleri. Festivalin teması ve kapsamı, sahne alacak sanatçılar, konser/gösteri programı, atölyeler, etkinlik mekanları, katılım şartları ve şehrin kültür hayatına katkısını açıkla.",
  kultur_sanat:
    "Kategori: Kültür & Sanat. Tiyatro oyunları, opera, bale, klasik müzik konserleri, edebiyat söyleşileri ve sahne sanatlarındaki gelişmeleri, prömiyer tarihlerini ve sanatçı kadrolarını aktar.",
  genel:
    "Kategori: Genel Kültür. Tarih ve kültür gezileri, belediye ve kamu kültür programları, anma etkinlikleri, kütüphane ve kültürel miras turları ile ilgili başvuru, kontenjan ve katılım takvimini net olarak belirt.",
};

function cleanPublisherSuffixes(title: string): string {
  return title
    .replace(/\s*[-–|]\s*(?:T\.C\.\s*)?[^–|-]*(?:Belediyesi|Büyükşehir Belediyesi|Bakanlığı|Hürriyet|Milliyet|Odatv|Cumhuriyet|Sabah|Sözcü|Habertürk|NTV|TRT\s*Haber|Anadolu Ajansı|AA|DHA|İHA)\s*$/i, "")
    .replace(/\s*[-–|]\s*(?:Son Dakika|Kültür Sanat|Haberler|Gündem)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectCategory(text: string): NewsCategory {
  const lower = text.toLowerCase();
  if (
    lower.includes("arkeo") ||
    lower.includes("kazı") ||
    lower.includes("lahit") ||
    lower.includes("antik kent") ||
    lower.includes("nekropol") ||
    lower.includes("höyük") ||
    lower.includes("mozaik")
  ) {
    return "arkeoloji";
  }
  if (
    lower.includes("restorasyon") ||
    lower.includes("tarihi yapı") ||
    lower.includes("onarım") ||
    lower.includes("ihya") ||
    lower.includes("rölöve") ||
    lower.includes("anıt eser")
  ) {
    return "restorasyon";
  }
  if (
    lower.includes("sergi") ||
    lower.includes("müze") ||
    lower.includes("galeri") ||
    lower.includes("küratör") ||
    lower.includes("bienal") ||
    lower.includes("tablo") ||
    lower.includes("heykel")
  ) {
    return "muze_sergi";
  }
  if (
    lower.includes("festival") ||
    lower.includes("şenlik") ||
    lower.includes("karnaval") ||
    lower.includes("kültür yolu")
  ) {
    return "festival_haberleri";
  }
  if (
    lower.includes("tiyatro") ||
    lower.includes("konser") ||
    lower.includes("opera") ||
    lower.includes("bale") ||
    lower.includes("orkestra") ||
    lower.includes("resital") ||
    lower.includes("prömiyer")
  ) {
    return "kultur_sanat";
  }
  return "genel";
}

function sanitizeText(raw: string): string {
  return stripHtmlTags(raw)
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Strip markdown links inside summaries
    .replace(/\s+/g, " ")
    .trim();
}

const NEWS_SYSTEM_PROMPT = `Sen Türkiye kültür, sanat, tarih ve kültürel miras odaklı kıdemli bir haber şefisin. Seni de Bekleriz (senidebekleriz.com) platformu için editoryal derinliği yüksek, akıcı, zengin ve özgün Türkçe kültür-sanat haberleri hazırlıyorsun.

KESİN EDİTORYAL KURALLAR:
1. Kesinlikle hiçbir ham HTML etiketi (<a href=...>, <font>, <div>, <span>, vb.) üretme veya içeriğe dahil etme. Yalnızca saf Markdown formatı kullan.
2. Başlık: Tıklama tuzağı (clickbait) olmayan, haberin özünü anlatan, kurum/kaynak sitesi sloganlarından ve " - Hürriyet", " - Belediye" gibi gazete takılarından arındırılmış saygın bir gazetecilik başlığı olsun.
3. Özet: Haberin en can alıcı noktalarını 1-2 cümlede (120-180 karakter) aktaran, ilgi çekici ve temiz bir özet olmalıdır.
4. İlk Paragraf: 5N1K (Ne, Nerede, Ne Zaman, Nasıl, Neden, Kim) özetini akıcı ve editoryal bir dille vermelidir.
5. Gövde Paragrafları: Konuyu derinlemesine ele alan, mantıklı akışa sahip en az 2 veya 3 alt başlık (## Alt Başlık) içermelidir.
6. Program/Katılım Bilgileri: Eğer haber bir gezi, sergi, atölye, festival veya gösteri içeriyorsa; tarih, mekan, ilçe, katılım şartları veya başvuru detayları için özel bir alt başlık oluştur (örneğin: "## Program ve Katılım Detayları" veya "## Tarih ve Güzergâh Bilgileri").
7. Uzunluk: En az 300-400 kelime arasında, bilgi yoğun ve doyurucu bir metin olmalıdır.
8. Kaynak Atfı: Metnin en sonunda mutlaka "## Kaynak ve Detaylar" başlığı altında temiz markdown formatında kaynak atfı bulunmalıdır.
9. Kategori: Yalnızca şu 6 kategoriden biri seçilmelidir: "arkeoloji" | "restorasyon" | "muze_sergi" | "kultur_sanat" | "festival_haberleri" | "genel".
10. Çıktı Formatı: Yanıt yalnızca ve kesinlikle aşağıdaki JSON şemasına uygun olmalıdır:
{
  "title": "Haber Başlığı",
  "summary": "1-2 cümlelik temiz editoryal özet",
  "category": "arkeoloji",
  "content": "Markdown formatında en az 300 kelimelik zengin haber metni"
}`;

export async function generateNewsDraft(
  input: GenerateNewsInput
): Promise<GeneratedNews> {
  let topic = cleanPublisherSuffixes(input.topic.trim());
  let fetched: FetchedUrlContent | null = null;
  let sourceBlock: string | null = null;
  let fetchedImages: string[] = [];

  if (input.sourceUrl?.trim()) {
    try {
      fetched = await fetchUrlContent(input.sourceUrl.trim(), {
        maxTextLength: 16000,
        fallbackText: input.fallbackText ? sanitizeText(input.fallbackText) : undefined,
        minTextLength: input.fallbackText && input.fallbackText.length >= 40 ? 40 : 80,
      });

      if (!topic) {
        topic = cleanPublisherSuffixes(
          fetched.pageTitle || new URL(fetched.url).hostname
        );
      }

      fetchedImages = await filterImageCandidatesBySize(fetched.imageUrls);

      sourceBlock = [
        `Haber Kaynak URL: ${fetched.url}`,
        fetched.pageTitle ? `Kaynak Sayfa Başlığı: ${cleanPublisherSuffixes(fetched.pageTitle)}` : null,
        `Kaynak Sayfa Metni:\n${fetched.pageText}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    } catch {
      const cleanFallback = input.fallbackText ? sanitizeText(input.fallbackText) : "";
      sourceBlock = [
        input.sourceUrl ? `Haber Kaynak URL: ${input.sourceUrl.trim()}` : null,
        input.topic ? `Başlık: ${input.topic}` : null,
        cleanFallback ? `Kaynak Metni Özeti: ${cleanFallback}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");
    }
  }

  if (!topic) {
    topic = input.fallbackText
      ? sanitizeText(input.fallbackText).slice(0, 60)
      : "Kültür & Sanat Gündemi";
  }

  const combinedContextForCategory = [
    topic,
    input.fallbackText,
    fetched?.pageText,
    input.cityName,
  ]
    .filter(Boolean)
    .join(" ");

  const inferredCategory = detectCategory(combinedContextForCategory);
  const categoryGuideline = CATEGORY_EDITORIAL_GUIDELINES[inferredCategory];
  const candidateCoverImage = fetchedImages.length > 0 ? fetchedImages[0] : null;

  const userPrompt = [
    `Haber Başlığı / Konusu: ${topic}`,
    input.cityName ? `İlgili Şehir: ${input.cityName}` : null,
    `Önerilen Editoryal Çerçeve: ${categoryGuideline}`,
    sourceBlock
      ? `${sourceBlock}\n\nYukarıdaki kaynak bilgilerini kullanarak yukarıda belirtilen editoryal kurallar ve kategori çerçevesinde özgün, zengin, temiz ve tarafsız bir kültür-sanat haberi oluştur.`
      : "Türkiye kültür, sanat, tarih ve kültürel miras platformu için özgün ve zengin bir haber oluştur.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const parsed = await callGeminiJson<Omit<GeneratedNews, "cover_image" | "uploaded_images">>({
      systemPrompt: NEWS_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.35,
    });

    if (!parsed.title || !parsed.content) {
      throw new Error("AI haber yanıtı geçersiz veya boş");
    }

    const cleanTitle = cleanPublisherSuffixes(sanitizeText(parsed.title));
    const cleanSummary = sanitizeText(parsed.summary || cleanTitle);
    // Extra safety: sanitize any unexpected raw HTML from content
    let cleanContent = parsed.content
      .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
      .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")
      .replace(/<[^>]+>/g, "");

    return {
      title: cleanTitle,
      summary: cleanSummary,
      content: cleanContent,
      category: parsed.category || inferredCategory,
      cover_image: candidateCoverImage,
      uploaded_images: fetchedImages,
    };
  } catch (error) {
    console.warn(
      "generateNewsDraft AI fallback:",
      error instanceof Error ? error.message : error
    );

    const cleanTitle = cleanPublisherSuffixes(sanitizeText(topic));
    let cleanSummary = input.fallbackText
      ? sanitizeText(input.fallbackText).slice(0, 200)
      : cleanTitle;

    // Build rich paragraphs from fetched pageText if available
    const pageParagraphs = fetched?.pageText
      ? fetched.pageText
          .split(/\n\n+/)
          .map((p) => sanitizeText(p))
          .filter((p) => p.length >= 40 && !p.toLowerCase().includes("çerez"))
      : [];

    if (pageParagraphs.length > 0 && cleanSummary.length < 50) {
      cleanSummary = pageParagraphs[0].slice(0, 200);
    }

    const contentSections: string[] = [
      `# ${cleanTitle}`,
      "",
      cleanSummary,
    ];

    if (pageParagraphs.length >= 2) {
      contentSections.push("", "## Gelişmeler ve Kültürel Detaylar");
      contentSections.push(pageParagraphs.slice(0, 2).join("\n\n"));

      if (pageParagraphs.length > 2) {
        contentSections.push("", "## Program ve Önemli Bilgiler");
        contentSections.push(pageParagraphs.slice(2, 6).join("\n\n"));
      }
    } else {
      contentSections.push(
        "",
        "## Gelişmeler ve Kültürel Detaylar",
        input.fallbackText && sanitizeText(input.fallbackText).length > 50
          ? sanitizeText(input.fallbackText)
          : `${cleanTitle} başlığıyla duyurulan kültür ve sanat gelişmesi, şehrin kültürel ajandasında yerini aldı. Detaylar ve etkinlik takvimi resmi kaynaklar doğrultusunda ziyaretçilerin bilgisine sunulmaktadır.`
      );
    }

    contentSections.push(
      "",
      "## Kaynak ve Detaylar",
      input.sourceUrl
        ? `Bu haber [orijinal kaynak (${input.sourceUrl})](${input.sourceUrl}) esas alınarak derlenmiştir.`
        : "Seni de Bekleriz Kültür ve Sanat Masası."
    );

    return {
      title: cleanTitle,
      summary: cleanSummary,
      content: contentSections.join("\n"),
      category: inferredCategory,
      cover_image: candidateCoverImage,
      uploaded_images: fetchedImages,
    };
  }
}
