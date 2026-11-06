import { callGeminiJson } from "@/lib/ai/gemini-client";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { formatHeadingsWithHeuristics } from "@/lib/ai/format-headings";
import {
  filterImageCandidatesBySize,
  pickCoverImageUrl,
  resolveFallbackCulturalImage,
} from "@/lib/ai/extract-page-images";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { slugify } from "@/lib/slugify";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { formatSeoSummary } from "@/lib/utils";

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

function cleanPublisherSuffixes(text: string): string {
  return text
    .replace(
      /\s*[-|–—]\s*(Anadolu Ajansı|AA|TRT Haber|Hürriyet|Milliyet Sanat|Milliyet|Sabah|Sözcü|Cumhuriyet|NTV|Habertürk|CNN Türk|Euronews|BBC News Türkçe|Bianet|Diken|Gazete Duvar|T24|BirGün|Kültür Portalı|T\.C\. Kültür ve Turizm Bakanlığı|Arkeofili|Arkitera|Sanat Atak|Argonotlar).*$/i,
      ""
    )
    .trim();
}

function stripRawHtmlFromMarkdown(md: string): string {
  return md
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<\/?(?:div|span|p|font|center|table|tr|td|th|tbody|thead|iframe|script|style|ins|b|i|u|strong|em|br|hr)\b[^>]*>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inferNewsCategory(
  text: string
): GeneratedNewsDraft["category"] {
  const lower = text.toLocaleLowerCase("tr-TR");
  if (/(arkeoloji|kazı|antik kent|höyük|lahit|mozaik|kemik flüt|idol|buluntu|tümülüs|nekropol|yazıt|sikke|ören yeri)/.test(lower)) {
    return "arkeoloji";
  }
  if (/(restorasyon|onarı|ihya|rölöve|konservasyon|vakıflar|miras|taş konak|medrese|külliye|han|hamam)/.test(lower)) {
    return "restorasyon";
  }
  if (/(müze|sergi|bienal|küratör|galeri|koleksiyon|retrospektif|çağdaş sanat)/.test(lower)) {
    return "muze_sergi";
  }
  if (/(sinema|film|yönetmen|senaryo|vizyon|altın portakal|altın koza|berlinale|cannes|oscar|kısa film|belgesel|oyuncu|başrol|gişe|sinematek|animasyon)/.test(lower)) {
    return "sinema";
  }
  if (/(festival|kültür yolu|şenlik|karnaval)/.test(lower)) {
    return "festival_haberleri";
  }
  return "kultur_sanat";
}

function isAllCapsHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 12 || trimmed.length > 110) return false;
  if (/[.!?]$/.test(trimmed)) return false;
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

function buildSystemPrompt(depth: NewsDepth = "standard"): string {
  const depthInstructions: Record<NewsDepth, string> = {
    standard:
      "Hedef uzunluk: 350 - 550 kelime. Kaynaktaki tüm somut verileri, açıklamaları ve kültürel bağlamı eksiksiz, akıcı ve kurumsal bir dille aktaran odaklı haber metni.",
    deep:
      "Hedef uzunluk: 500 - 800 kelime. Kaynaktaki tüm somut bilgileri, yetkili/sanatçı açıklamalarını ve konunun sanatsal veya tarihsel arka planını derinlemesine işleyen kapsamlı kültür-sanat haberi.",
    comprehensive:
      "Hedef uzunluk: 800 - 1200 kelime. Konunun tüm boyutlarını, arka planını, uzman değerlendirmelerini ve Türkiye kültür-sanat dünyasındaki yerini derli toplu alt başlıklarla ele alan kapsamlı dosya haberi.",
  };

  return `Sen Türkiye'nin saygın kültür ve sanat yayını "Seni de Bekleriz"in (senidebekleriz.com) kıdemli kültür-sanat editörüsün.
Verilen kaynak sayfa içeriğini dikkatle inceleyip, kurumsal bir üslup, edebi ciddiyet ve gazetecilik standartlarında akıcı bir Türkçe haber metni hazırlayacaksın.

${depthInstructions[depth]}

KURUMSAL YAYINCILIK, EDİTÖRYAL DÜZEN VE AIO KURALLARI:
1. DERLİ TOPLU VE BAĞLAMSAL BAŞLIK MİMARİSİ (ZORUNLU):
   - Metin ASLA alt başlıksız düz paragraf yığını olamaz! Giriş paragrafından sonra haberin farklı boyutlarını, sanatçı/yetkili açıklamalarını ve tarihsel/sanatsal detaylarını ele alan 2 ila 4 adet anlamlı "## Alt Başlık" (Markdown H2) kullan.
   - Her "## Alt Başlık" altında en az 2-3 doyurucu, birbiriyle mantıksal bağı olan güçlü paragraf yer almalıdır. Cümle cümle başlık atmak kesinlikle yasaktır.
   - Giriş paragrafının hemen üstüne başlık ATMA; ilk paragraf daima başlıksız editoryal giriş olmalıdır.
   - Başlıklar o bölümde anlatılan konuyu kurumsal ve edebi bir dille yansıtmalıdır (Örn: "## Yaşam Boyu Onur Ödülü Türkan Şoray'a Takdim Edilecek", "## Cüneyt Gökçer Sahnesi Kasımda Perdelerini Açıyor", "## Türk Dünyasını Buluşturan Uluslararası Proje: Geçit").
   - ASLA kalıp veya şablon başlıklar ("## Gelişmeler ve Kültürel Detaylar", "## Program, Mekân ve Katılım Bilgileri", "## Kaynak ve Detaylar", "## Merak Edilenler") kullanma.

2. KURUMSAL VE SAYGIN DİL:
   - Dil; saygın, duru, tarafsız ve kurumsal kültür gazeteciliği standardında olmalıdır.
   - Basit ajans kopyalamasından veya magazin üslubundan kaçın; cümleleri birbirine mantıksal bağlaçlarla akıcı şekilde bağla.

3. GÜRÜLTÜ VE YAN HABERLERİ TEMİZLEME (KESİN YASAK):
   - Kaynak sayfa içinde yerel sitelerden veya arayüzden sızmış olabilecek alakasız yan haberleri (örneğin başka şehirlerin haberleri, gezi notları, hava durumu, fuar duyuruları veya yazar köşe yazısı anonsları) KESİNLİKLE metne dahil etme! Sadece ve sadece ana haber konusunu işle.

4. 5N1K ZENGİN HABER SPOTU (summary) VE GİRİŞ:
   - "summary" alanı 240-340 karakter arası (yaklaşık 35-50 kelime), 5N1K kuralına uygun, 2-3 akıcı ve tam cümleden oluşan, sonu mutlaka nokta ile biten zengin ve doyurucu bir editoryal haber spotu olmalıdır (Ne, Nerede, Kim, Ne Zaman, Nasıl/Niçin). Haberin özünü, kültürel ve tarihsel önemini eksiksiz aktarmalı; asla tek bir kısa cümleyle veya yüzeysel bir özetle geçiştirilmemelidir. Google News, Google Discover ve arama motoru snippet'ları için tam referans niteliğinde olmalıdır.
   - Haber metninin ("content") ilk paragrafı güçlü bir editoryal giriş olmalı, "summary" alanını kelimesi kelimesine kopyalamamalıdır.

5. ÇIKTI FORMATI:
   - Yanıt YALNIZCA geçerli bir JSON objesi olmalıdır:
{
  "title": "60-90 karakter arası, kurumsal, çarpıcı ve SEO uyumlu Türkçe haber başlığı",
  "summary": "240-340 karakter arası, 5N1K kuralına uygun, 2-3 tam cümle içeren doyurucu ve zengin SEO uyumlu haber spotu",
  "content": "Haberin bağlamına uygun 2-4 derli toplu ## alt başlık ve kurumsal paragraflarla yazılmış Markdown haber metni",
  "category": "arkeoloji | restorasyon | muze_sergi | sinema | kultur_sanat | festival_haberleri | genel",
  "city_slug": "Haberin geçtiği ilin küçük harfli Türkçe karakter içermeyen slug'ı (örn: trabzon, canakkale, istanbul) veya genel ise null",
  "source_name": "Haberin kaynağı olan kurum veya yayın adı (örn: Taka Gazete, Cumhuriyet, Anadolu Ajansı)"
}`;
}

export async function generateNewsDraft(
  input: GenerateNewsInput
): Promise<GeneratedNewsDraft> {
  let topic = cleanPublisherSuffixes((input.topic || "").trim());
  let sourceBlock = "";
  let fetchedImages: string[] = [];
  let rawPageText = "";
  let detectedSiteName: string | undefined;

  if (input.sourceUrl?.trim()) {
    try {
      const fetched = await fetchUrlContent(input.sourceUrl.trim(), {
        maxTextLength: 16000,
        fallbackText: input.fallbackText,
        minTextLength: 40,
      });

      detectedSiteName = fetched.siteName;

      if (!topic && fetched.pageTitle) {
        topic = cleanPublisherSuffixes(fetched.pageTitle);
      }

      rawPageText = fetched.pageText || "";
      fetchedImages = await filterImageCandidatesBySize(fetched.imageUrls);

      sourceBlock = [
        `Kaynak URL: ${fetched.url}`,
        fetched.siteName ? `Kaynak Kurum / Yayın: ${fetched.siteName}` : null,
        fetched.pageTitle ? `Orijinal Sayfa Başlığı: ${cleanPublisherSuffixes(fetched.pageTitle)}` : null,
        `Sayfa İçeriği:\n${fetched.pageText}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    } catch {
      rawPageText = (input.fallbackText || "").trim();
      if (input.fallbackText) {
        sourceBlock = `Kaynak URL: ${input.sourceUrl}\n\nKaynak Özeti:\n${input.fallbackText}`;
      }
    }
  } else if (input.fallbackText) {
    rawPageText = input.fallbackText.trim();
    sourceBlock = `Kaynak Metin:\n${input.fallbackText}`;
  }

  if (!topic) {
    topic = "Kültür ve Sanat Haberi";
  }

  const userPrompt = [
    topic !== "Kültür ve Sanat Haberi" ? `Haber Başlığı / Konusu: ${topic}` : null,
    input.cityName ? `İlgili Şehir: ${input.cityName}` : null,
    sourceBlock || "Türkiye kültür ve sanat gündemine uygun özgün bir haber metni oluştur.",
    "Yukarıdaki kaynak içeriği bağlamına göre analiz et; şablon başlıklar kullanmadan, haberin kendi akışına ve gerçek verilerine sadık kalarak gazetecilik dilinde özgün bir haber metni ve 5N1K özeti üret. Metni giriş paragrafından sonra haberin akışına ve bağlamına göre 2 ila 4 adet '## [Konuya Özgü Markdown Alt Başlık]' ile tematik bölümlere ayırarak oluştur.",
  ]
    .filter(Boolean)
    .join("\n\n");

  let candidateCoverImage: string | null =
    pickCoverImageUrl(fetchedImages) || input.coverImageHint || null;

  const requestedDepth: NewsDepth = input.depth || "standard";
  const systemPrompt = buildSystemPrompt(requestedDepth);

  try {
    const parsed = await callGeminiJson<GeneratedNewsDraft>({
      systemPrompt,
      userPrompt,
      temperature: 0.35,
      maxOutputTokens: 8192,
    });

    const category = VALID_CATEGORIES.has(parsed.category)
      ? parsed.category
      : inferNewsCategory(`${parsed.title || topic} ${rawPageText}`);

    const cleanTitle = cleanPublisherSuffixes(parsed.title || topic);
    const newsSlug = slugify(cleanTitle) || "kultur-haberi";
    const resolvedCitySlug = normalizeCitySlug(parsed.city_slug || input.cityName || null);

    if (!candidateCoverImage) {
      candidateCoverImage = await resolveFallbackCulturalImage({
        title: cleanTitle,
        cityName: input.cityName || resolvedCitySlug,
        category,
      });
    }

    // Automatically convert external image to EXIF-free WebP named after the news slug
    const storedCoverImage = await ensureStoredCoverImage(
      candidateCoverImage,
      "news",
      newsSlug
    );

    const cleanContent = stripRawHtmlFromMarkdown(parsed.content || "");
    const cleanSummary = formatSeoSummary(cleanPublisherSuffixes(parsed.summary || cleanTitle), 350);
    const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;

    return {
      title: cleanTitle,
      slug: newsSlug,
      summary: cleanSummary,
      content: cleanContent,
      category,
      cover_image: storedCoverImage,
      city_slug: resolvedCitySlug,
      source_name: parsed.source_name?.trim() || detectedSiteName || null,
      word_count: wordCount,
    };
  } catch (error) {
    console.warn(
      "generateNewsDraft AI fallback triggered:",
      error instanceof Error ? error.message : error
    );

    const rawLines = rawPageText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 20);

    // Deduplicate paragraphs and convert ALL-CAPS subheadings into clean Markdown ## headings
    const seenKeys = new Set<string>();
    const formattedBlocks: string[] = [];
    let leadSummary = "";

    for (const line of rawLines) {
      if (isAllCapsHeadingLine(line)) {
        formattedBlocks.push(`## ${toTurkishTitleCase(line)}`);
        continue;
      }
      const normKey = line
        .toLocaleLowerCase("tr-TR")
        .replace(/[^a-z0-9çğıöşü]/g, "")
        .slice(0, 120);
      if (normKey.length < 15 || seenKeys.has(normKey)) continue;
      seenKeys.add(normKey);

      if (!leadSummary && line.length >= 50) {
        leadSummary = line;
      }
      formattedBlocks.push(line);
    }

    const fallbackCategory = inferNewsCategory(`${topic} ${rawPageText}`);
    const cleanFallbackTitle = cleanPublisherSuffixes(topic);
    const fallbackSlug = slugify(cleanFallbackTitle) || "kultur-haberi";
    const resolvedCitySlug = normalizeCitySlug(input.cityName || `${cleanFallbackTitle} ${leadSummary}`);

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

    const fallbackSummary = formatSeoSummary(
      leadSummary ||
        input.fallbackText ||
        `${cleanFallbackTitle} hakkında kültür ve sanat gelişmeleri.`,
      350
    );

    const bodyBlocks =
      formattedBlocks.length > 2 && formattedBlocks[0] === leadSummary
        ? formattedBlocks.slice(1)
        : formattedBlocks;

    const rawFallbackContent =
      bodyBlocks.length > 0
        ? bodyBlocks.join("\n\n")
        : fallbackSummary;

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
      word_count: fallbackContent.split(/\s+/).filter(Boolean).length,
    };
  }
}
