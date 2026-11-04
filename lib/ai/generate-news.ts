import { callGeminiJson } from "@/lib/ai/gemini-client";
import {
  fetchUrlContent,
  type FetchedUrlContent,
} from "@/lib/ai/fetch-url-content";
import {
  filterImageCandidatesBySize,
  resolveFallbackCulturalImage,
} from "@/lib/ai/extract-page-images";
import { stripHtmlTags } from "@/lib/events/sources/ktb-rss";
import { detectTurkishCityInText } from "@/lib/discovery/classify-content";

export type NewsDepth = "standard" | "deep" | "comprehensive";

type GenerateNewsInput = {
  topic: string;
  sourceUrl?: string;
  fallbackText?: string;
  cityName?: string;
  coverImageHint?: string | null;
  depth?: NewsDepth;
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
  word_count?: number;
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
    .replace(
      /\s*[-–|]\s*(?:T\.C\.\s*)?[^–|-]*(?:Belediyesi|Büyükşehir Belediyesi|Bakanlığı|Hürriyet|Milliyet|Milliyet Sanat|Odatv|Cumhuriyet|Sabah|Sözcü|Habertürk|NTV|TRT\s*Haber|Anadolu Ajansı|AA|DHA|İHA|Euronews(?:\.com)?|Gazete Oksijen|T24|Yeni Şafak|CNN Türk|theMagger|Oggusto)\s*$/i,
      ""
    )
    .replace(
      /\s+(?:www\.[a-z0-9.-]+\.[a-z]{2,}|https?:\/\/[^\s]+|Euronews\.com|Milliyet Sanat|Gazete Oksijen|theMagger|Oggusto|Nefes Gazetesi|Yeni Şafak|Cumhuriyet|Hürriyet|Habertürk|Sabah|CNN Türk|TRT Haber|NTV Haber|İhlas Haber Ajansı|Demirören Haber Ajansı|Anadolu Ajansı)\s*$/i,
      ""
    )
    .replace(/\s*[-–|]\s*(?:Son Dakika|Kültür Sanat|Haberler|Gündem)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectCategory(text: string): NewsCategory {
  const lower = text.toLocaleLowerCase("tr");
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
  if (!raw) return "";
  const text = stripHtmlTags(raw);
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/news\.google\.com\S*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSystemPrompt(depth: NewsDepth = "deep"): string {
  const depthInstructions = {
    standard: `
DERİNLİK SEVİYESİ: STANDART HABER (Hedef: 500 - 750 kelime)
İçerik Akışı:
- Güçlü bir gazetecilik girişi (haberin özü, ne, ne zaman, nerede, kim, neden)
- Konuya özgü 3-4 özgün alt başlık (## ...) altında gelişmenin arka planı, kültürel önemi, program/mekân detayları ve ziyaretçi bilgileri`,
    deep: `
DERİNLİK SEVİYESİ: KAPSAMLI DOSYA HABER (Hedef: 800 - 1200 kelime)
Bu yazı yüzeysel bir bülten değil; derinlikli bir kültür-sanat haberi ve inceleme dosyasıdır. İçerik akışında şu unsurları konuya özgü, doğal ve gazetecilik diline uygun alt başlıklar (## ...) altında işle:
- Kapsamlı editoryal giriş (2 paragraf: Güncel gelişme, özetteki ve kaynak metindeki tüm somut detaylar, kente ve sanat dünyasına etkisi)
- Konunun tarihsel/kültürel bağlamı, sanat dalının veya eserin/mekânın geçmişi (2-3 paragraf)
- Etkinliğin/haberin ana omurgası, öne çıkan eserler, sanatçılar, kazı buluntuları veya küratöryel detaylar (2-3 paragraf)
- Mekânın mimari/tarihi kimliği, ulaşım, bilet/katılım koşulları ve ziyaretçi ipuçları (2 paragraf)
- Okurun merak edeceği 3-4 pratik soruya doğal alt başlıklarla yanıtlar`,
    comprehensive: `
DERİNLİK SEVİYESİ: DERİNLEMESİNE KÜLTÜR VE SANAT DOSYASI (Hedef: 1200 - 1800 kelime)
Kapsamlı bir kültür-sanat dosyası olarak; konuya özgü, özgün alt başlıklar (## ...) altında tarihsel arka planı, eser ve sanatçı incelemesini, mekânın mimari kimliğini ve ziyaretçi rehberini ayrıntılı paragraflarla inşa et.`,
  };

  return `Sen Türkiye kültür, sanat, tarih ve kültürel miras alanında uzmanlaşmış kıdemli bir kültür gazetecisi ve yayın yönetmenisin. Seni de Bekleriz (senidebekleriz.com) için yüksek editoryal derinliğe sahip, akıcı, doğal ve özgün Türkçe kültür-sanat haberleri hazırlıyorsun.

${depthInstructions[depth]}

KESİN EDİTORYAL KURALLAR:
1. KESİNLİKLE HİÇBİR HAM HTML ETİKETİ (<a href=...>, <font>, <div>, <span>, vb.) ÜRETME. Yalnızca temiz Markdown formatı kullan.
2. ŞABLON ALT BAŞLIK YASAĞI (ÇOK ÖNEMLİ): Asla "Tarihsel ve Kültürel Arka Plan", "Program, Eserler ve Sanatçılar", "Mekân, Mimari ve Kültürel Atmosfer", "Ziyaretçi & Katılımcı Rehberi", "Editoryal Değerlendirme & Kaynak", "Sıkça Sorulan Sorular", "1. Soru:" gibi yapay zeka şablonu kokan basmakalıp alt başlıklar kullanma! Her alt başlık (## ...) doğrudan o haberin konusuna, mekanına veya sanatçısına özel, gerçek bir kültür editörünün yazdığı özgün bir başlık olmalıdır (Örn: "## Haydarpaşa Peronlarında Gün Yüzüne Çıkan Binlerce Yıllık Miras", "## Seçmelerde Adayları Hangi Repertuvar Bekliyor?").
3. BAŞLIK: Tıklama tuzağı (clickbait) olmayan, haberin özünü anlatan, kurum/kaynak sitelerinin sloganlarından ve " - Hürriyet", " - Belediye" gibi gazete takılarından tamamen arındırılmış saygın bir gazetecilik başlığı üret.
4. ÖZET: Haberin can alıcı noktalarını 1-2 cümlede (130-190 karakter) aktaran, kaynak özetteki somut bilgiyi doğrudan yansıtan temiz bir editoryal özet olsun. Asla başlığı olduğu gibi özete kopyalama!
5. KAYNAK ÖZETE VE METNE SADAKAT: Sana verilen "Kaynak Özeti" ve "Kaynak Sayfa Metni" içindeki tüm somut bilgileri (kişi isimleri, tarihler, sayılar, mekanlar, eser adları, başvuru koşulları) haberin ilk paragraflarında eksiksiz işle. Yapay zeka klişelerinden ("adeta bir zaman yolculuğu", "büyüleyici atmosfer", "unutulmaz bir deneyim") kaçın; somut, bilgi dolu ve doğal bir gazetecilik dili kullan.
6. ÇIKTI FORMATI: Yanıt yalnızca ve kesinlikle aşağıdaki JSON şemasına uygun olmalıdır:
{
  "title": "Haber Başlığı",
  "summary": "1-2 cümlelik somut ve özgün editoryal özet",
  "category": "muze_sergi",
  "content": "Markdown formatında konuya özgü alt başlıkları içeren derinlikli haber metni"
}`;
}

export async function generateNewsDraft(
  input: GenerateNewsInput
): Promise<GeneratedNews> {
  let topic = cleanPublisherSuffixes(input.topic.trim());
  const cleanFallbackSnippet = input.fallbackText
    ? cleanPublisherSuffixes(sanitizeText(input.fallbackText))
    : "";

  let fetched: FetchedUrlContent | null = null;
  let sourceBlock: string | null = null;
  let fetchedImages: string[] = [];

  if (input.sourceUrl?.trim()) {
    try {
      fetched = await fetchUrlContent(input.sourceUrl.trim(), {
        maxTextLength: 16000,
        fallbackText: cleanFallbackSnippet || undefined,
        minTextLength:
          cleanFallbackSnippet && cleanFallbackSnippet.length >= 30 ? 30 : 60,
      });

      if (!topic) {
        topic = cleanPublisherSuffixes(
          fetched.pageTitle || new URL(fetched.url).hostname
        );
      }

      fetchedImages = await filterImageCandidatesBySize(fetched.imageUrls);

      sourceBlock = [
        `Haber Kaynak URL: ${fetched.url}`,
        fetched.pageTitle
          ? `Kaynak Sayfa Başlığı: ${cleanPublisherSuffixes(fetched.pageTitle)}`
          : null,
        cleanFallbackSnippet && cleanFallbackSnippet !== topic
          ? `Keşif Özeti (Mutlaka Değinilecek): ${cleanFallbackSnippet}`
          : null,
        `Kaynak Sayfa Metni:\n${fetched.pageText}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    } catch {
      sourceBlock = [
        input.sourceUrl ? `Haber Kaynak URL: ${input.sourceUrl.trim()}` : null,
        topic ? `Başlık: ${topic}` : null,
        cleanFallbackSnippet ? `Keşif Özeti (Mutlaka Değinilecek): ${cleanFallbackSnippet}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");
    }
  } else if (cleanFallbackSnippet) {
    sourceBlock = [
      topic ? `Başlık: ${topic}` : null,
      `Keşif Özeti (Mutlaka Değinilecek): ${cleanFallbackSnippet}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (!topic) {
    topic = cleanFallbackSnippet
      ? cleanFallbackSnippet.slice(0, 70)
      : "Kültür & Sanat Gündemi";
  }

  const combinedContext = [
    topic,
    cleanFallbackSnippet,
    fetched?.pageText,
    input.cityName,
  ]
    .filter(Boolean)
    .join(" ");

  const inferredCategory = detectCategory(combinedContext);
  const inferredCitySlug = detectTurkishCityInText(combinedContext);
  const categoryGuideline = CATEGORY_EDITORIAL_GUIDELINES[inferredCategory];

  let candidateCoverImage: string | null =
    fetchedImages[0] || input.coverImageHint || null;

  if (!candidateCoverImage) {
    candidateCoverImage = await resolveFallbackCulturalImage({
      title: topic,
      cityName: input.cityName || inferredCitySlug,
      category: inferredCategory,
    });
  }

  const userPrompt = [
    `Haber Başlığı / Konusu: ${topic}`,
    input.cityName ? `İlgili Şehir: ${input.cityName}` : null,
    `Önerilen Editoryal Çerçeve: ${categoryGuideline}`,
    sourceBlock
      ? `${sourceBlock}\n\nYukarıdaki kaynak bilgilerini ve özeti eksiksiz kullanarak belirtilen editoryal kurallar çerçevesinde özgün, zengin, temiz ve kapsamlı bir kültür-sanat haberi oluştur.`
      : "Türkiye kültür, sanat, tarih ve kültürel miras platformu için özgün ve zengin bir haber oluştur.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const requestedDepth: NewsDepth = input.depth || "deep";
  const systemPrompt = buildSystemPrompt(requestedDepth);

  try {
    const parsed = await callGeminiJson<
      Omit<GeneratedNews, "cover_image" | "uploaded_images">
    >({
      systemPrompt,
      userPrompt,
      temperature: 0.38,
      maxOutputTokens: 8192,
    });

    if (!parsed.title || !parsed.content) {
      throw new Error("AI haber yanıtı geçersiz veya boş");
    }

    const cleanTitle = cleanPublisherSuffixes(sanitizeText(parsed.title));
    const cleanSummary = cleanPublisherSuffixes(
      sanitizeText(parsed.summary || cleanFallbackSnippet || cleanTitle)
    );
    const cleanContent = parsed.content
      .replace(/^#\s+[^\n]+\n+/, "")
      .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
      .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")
      .replace(/<[^>]+>/g, "");

    const wordCount = cleanContent.trim().split(/\s+/).filter(Boolean).length;

    return {
      title: cleanTitle,
      summary: cleanSummary,
      content: cleanContent,
      category: parsed.category || inferredCategory,
      city_slug: inferredCitySlug,
      cover_image: candidateCoverImage,
      uploaded_images:
        fetchedImages.length > 0
          ? fetchedImages
          : candidateCoverImage
          ? [candidateCoverImage]
          : [],
      word_count: wordCount,
    };
  } catch (error) {
    console.warn(
      "generateNewsDraft AI fallback:",
      error instanceof Error ? error.message : error
    );

    const cleanTitle = cleanPublisherSuffixes(sanitizeText(topic));
    const pageParagraphs = fetched?.pageText
      ? fetched.pageText
          .split(/\n\n+/)
          .map((p) => sanitizeText(p))
          .filter(
            (p) =>
              p.length >= 40 &&
              !/çerez politikası|tüm hakları saklıdır|kvkk aydınlatma/i.test(p)
          )
      : [];

    let cleanSummary =
      cleanFallbackSnippet &&
      cleanFallbackSnippet.toLowerCase() !== cleanTitle.toLowerCase()
        ? cleanFallbackSnippet.slice(0, 220)
        : pageParagraphs[0]
        ? pageParagraphs[0].slice(0, 220)
        : `${cleanTitle} hakkında kültür ve sanat gündemindeki son gelişmeler, etkinlik detayları ve ziyaretçi bilgileri.`;

    const contentSections: string[] = [];

    if (pageParagraphs.length >= 2) {
      contentSections.push(pageParagraphs[0]);
      if (
        cleanFallbackSnippet &&
        cleanFallbackSnippet.length > 40 &&
        !pageParagraphs[0].includes(cleanFallbackSnippet.slice(0, 30))
      ) {
        contentSections.push("", cleanFallbackSnippet);
      }
      contentSections.push("", "## Gelişmeler ve Kültürel Detaylar");
      contentSections.push(pageParagraphs.slice(1, 5).join("\n\n"));

      if (pageParagraphs.length > 5) {
        contentSections.push("", "## Program, Mekân ve Katılım Bilgileri");
        contentSections.push(pageParagraphs.slice(5, 10).join("\n\n"));
      }
    } else {
      const leadParagraph =
        cleanFallbackSnippet &&
        cleanFallbackSnippet.toLowerCase() !== cleanTitle.toLowerCase() &&
        cleanFallbackSnippet.length >= 35
          ? cleanFallbackSnippet
          : `${cleanTitle} başlığıyla duyurulan gelişme, ${
              input.cityName || "Türkiye"
            } kültür ve sanat ajandasında önemli bir yer tutuyor.`;

      contentSections.push(
        leadParagraph,
        "",
        "## Gelişmeler ve Kültürel Detaylar",
        pageParagraphs[0] && pageParagraphs[0] !== leadParagraph
          ? pageParagraphs[0]
          : `${cleanTitle} kapsamında yürütülen çalışmalar ve düzenlenen etkinlikler, bölgenin tarihi mirasını ve çağdaş sanat üretimini geniş kitlelerle buluşturmayı hedefliyor. Kültür ve sanat kurumlarının iş birliğiyle hayata geçirilen program, hem yerel katılımcılara hem de şehri ziyaret eden kültür meraklılarına zengin bir içerik sunuyor.`,
        "",
        "## Ziyaretçi ve Katılım Rehberi",
        `Etkinlik ve sergi programlarına ilişkin güncel takvim, seans saatleri ve katılım koşulları ilgili kültür kurumlarının resmi duyuru kanalları üzerinden takip edilebilmektedir.`
      );
    }

    contentSections.push(
      "",
      "## Kaynak ve Detaylar",
      input.sourceUrl
        ? `Bu haber [orijinal kaynak (${input.sourceUrl})](${input.sourceUrl}) verileri esas alınarak derlenmiştir.`
        : "Seni de Bekleriz Kültür ve Sanat Masası."
    );

    const finalFallbackContent = contentSections.join("\n");
    const fallbackWordCount = finalFallbackContent
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return {
      title: cleanTitle,
      summary: cleanSummary,
      content: finalFallbackContent,
      category: inferredCategory,
      city_slug: inferredCitySlug,
      cover_image: candidateCoverImage,
      uploaded_images:
        fetchedImages.length > 0
          ? fetchedImages
          : candidateCoverImage
          ? [candidateCoverImage]
          : [],
      word_count: fallbackWordCount,
    };
  }
}
