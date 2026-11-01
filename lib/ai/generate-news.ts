import { callGeminiJson } from "@/lib/ai/gemini-client";
import { fetchUrlContent, type FetchedUrlContent } from "@/lib/ai/fetch-url-content";
import { filterImageCandidatesBySize } from "@/lib/ai/extract-page-images";
import { slugify } from "@/lib/slugify";
import { stripHtmlTags } from "@/lib/events/sources/ktb-rss";

export type NewsDepth = "standard" | "deep" | "comprehensive";

type GenerateNewsInput = {
  topic: string;
  sourceUrl?: string;
  fallbackText?: string;
  cityName?: string;
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

function buildSystemPrompt(depth: NewsDepth = "deep"): string {
  const depthInstructions = {
    standard: `
DERİNLİK SEVİYESİ: STANDART HABER (Hedef: 500 - 750 kelime)
Yapı:
1. 5N1K Giriş Paragrafı (haberin özü, ne, ne zaman, nerede, nasıl, neden, kim)
2. ## Gelişmeler ve Kültürel Bağlam (2-3 doyurucu paragraf)
3. ## Program, Katılım ve Mekân Detayları (tarih, saat, katılım koşulları, mekan bilgisi)
4. ## Sıkça Sorulan Sorular (2 pratik soru-cevap)
5. ## Kaynak ve Detaylar (kaynak atfı)`,
    deep: `
DERİNLİK SEVİYESİ: KAPSAMLI DOSYA HABER (Hedef: 800 - 1300 kelime)
Bu yazı yüzeysel bir haber bülteni değil; derinlikli bir kültür-sanat dosyasıdır. Aşağıdaki 7 bölümün HER BİRİNİ ayrıntılı ve akıcı Türkçe ile yazmalısın:
1. 5N1K Editoryal Giriş (2 kapsamlı paragraf: Güncel gelişme, kente ve sanat dünyasına etkisi, haberin taşıdığı kültürel vizyon)
2. ## Tarihsel ve Kültürel Arka Plan (2-3 paragraf: Konunun kökeni, tarihi dönem veya akım, önceki yıllardaki gelişmeler, mekânın veya sanat dalının tarihçesi)
3. ## Program, Eserler ve Sanatçılar (2-3 paragraf: Etkinliğin omurgası, öne çıkan eserler/oyunlar/sanatçılar, küratör veya yönetmen yaklaşımı, repertuvar/koleksiyon detayları)
4. ## Mekân, Mimari ve Kültürel Atmosfer (2 paragraf: Etkinliğin gerçekleştiği yapının tarihi dokusu, mimari özellikleri, akustiği ve ziyaretçiye sunduğu his)
5. ## Ziyaretçi & Katılımcı Rehberi (2 paragraf: Ulaşım tüyoları, ideal ziyaret gün/saatleri, katılım ve başvuru koşulları, biletleme veya ücretsiz giriş prosedürleri, yaş/kontenjan sınırları)
6. ## Sıkça Sorulan Sorular (3-4 maddelik pratik SSS; her madde '### 1. Soru...' formatında ve net bir yanıtla)
7. ## Editoryal Değerlendirme & Kaynak (Kültür masası değerlendirmesi ve temiz kaynak bağlantısı)`,
    comprehensive: `
DERİNLİK SEVİYESİ: DERİNLEMESİNE KÜLTÜR VE GEZİ REHBERİ (Hedef: 1300 - 2000+ kelime)
Bu metin Türkiye'nin kültür mirası arşivine kalacak başvuru kaynağı niteliğinde dev bir rehber makaledir. Her bölümü geniş, zengin ve bilgi yoğun paragraflarla inşa et:
1. Kapsamlı Editoryal Giriş & Kültürel Mirasın Anlamı (3 derinlikli paragraf)
2. ## Derinlemesine Tarihsel Arka Plan & Arşivsel Bağlam (3-4 paragraf)
3. ## Eser, Sanatçı ve Küratöryel İnceleme (3-4 paragraf)
4. ## Mekânın Mimari Kimliği ve Şehir Dokusundaki Yeri (3 paragraf)
5. ## Kapsamlı Ziyaretçi Rehberi ve Çevre Rotaları (3-4 paragraf: Ulaşım, yakın çevredeki tarihi/kültürel duraklar, bilet/ücretsiz erişim, en iyi deneyim ipuçları)
6. ## Sıkça Sorulan Sorular (5-6 maddelik ayrıntılı SSS; '### 1. ...' formatında)
7. ## Kültür Masası Perspektifi & Kaynakça`,
  };

  return `Sen Türkiye kültür, sanat, tarih ve kültürel miras alanında uzmanlaşmış kıdemli bir kültür araştırmacısı ve haber şefisin. Seni de Bekleriz (senidebekleriz.com) platformu için yüksek editoryal derinliğe sahip, akıcı, zengin ve özgün Türkçe kültür-sanat dosyaları hazırlıyorsun.

${depthInstructions[depth]}

KESİN EDİTORYAL KURALLAR:
1. KESİNLİKLE HİÇBİR HAM HTML ETİKETİ (<a href=...>, <font>, <div>, <span>, vb.) ÜRETME. Yalnızca temiz Markdown formatı kullan.
2. BAŞLIK: Tıklama tuzağı (clickbait) olmayan, haberin özünü anlatan, kurum/kaynak sitelerinin sloganlarından ve " - Hürriyet", " - Belediye" gibi gazete takılarından tamamen arındırılmış saygın bir gazetecilik başlığı üret.
3. ÖZET: Haberin can alıcı noktalarını 1-2 cümlede (130-180 karakter) aktaran, merak uyandıran, arama motorlarında öne çıkacak temiz bir editoryal özet olsun.
4. KÜLTÜREL BAĞLAM SENTEZİ: Kaynak siteden gelen metin kısa (1-2 paragraf) olsa dahi; Türkiye'nin tarihi, sanat tarihi, mimarisi, arkeolojisi, edebiyatı ve şehir dokusuna dair engin genel kültür bilgini devreye sokarak yukarıda belirtilen tüm alt başlıkları doyurucu, derinlikli ve akıcı Türkçe paragraflarla geliştir. Asla yüzeysel veya kısa bırakma. Fikri veya tarihi bilgileri zenginleştirirken somut tarihleri, yerleri ve kişi isimlerini kaynak metne sadık tut.
5. SIKÇA SORULAN SORULAR BÖLÜMÜ: Mutlaka okuyucunun aklına gelebilecek pratik soruları (Örn: "Ücretsiz mi?", "Ulaşım nasıl sağlanır?", "Kimler katılabilir?", "Kayıt gerekiyor mu?") '### 1. ...', '### 2. ...' biçiminde ele al.
6. ÇIKTI FORMATI: Yanıt yalnızca ve kesinlikle aşağıdaki JSON şemasına uygun olmalıdır:
{
  "title": "Haber Başlığı",
  "summary": "1-2 cümlelik temiz editoryal özet",
  "category": "muze_sergi",
  "content": "Markdown formatında tüm alt başlıkları, SSS ve kaynak bölümünü içeren derinlikli metin"
}`;
}

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

  const requestedDepth: NewsDepth = input.depth || "deep";
  const systemPrompt = buildSystemPrompt(requestedDepth);

  try {
    const parsed = await callGeminiJson<Omit<GeneratedNews, "cover_image" | "uploaded_images">>({
      systemPrompt,
      userPrompt,
      temperature: 0.38,
      maxOutputTokens: 8192,
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

    const wordCount = cleanContent.trim().split(/\s+/).filter(Boolean).length;

    return {
      title: cleanTitle,
      summary: cleanSummary,
      content: cleanContent,
      category: parsed.category || inferredCategory,
      cover_image: candidateCoverImage,
      uploaded_images: fetchedImages,
      word_count: wordCount,
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

    const finalFallbackContent = contentSections.join("\n");
    const fallbackWordCount = finalFallbackContent.trim().split(/\s+/).filter(Boolean).length;

    return {
      title: cleanTitle,
      summary: cleanSummary,
      content: finalFallbackContent,
      category: inferredCategory,
      cover_image: candidateCoverImage,
      uploaded_images: fetchedImages,
      word_count: fallbackWordCount,
    };
  }
}
