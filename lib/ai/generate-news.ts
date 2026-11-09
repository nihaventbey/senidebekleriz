import { callGeminiJson } from "@/lib/ai/gemini-client";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { formatHeadingsWithHeuristics } from "@/lib/ai/format-headings";
import {
  filterImageCandidatesBySize,
  pickCoverImageUrl,
  resolveFallbackCulturalImage,
} from "@/lib/ai/extract-page-images";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { formatSeoSummary } from "@/lib/utils";
import {
  cleanPublisherText,
  cleanNewsSlug,
  stripDatelineFromParagraph,
} from "@/lib/ai/clean-publisher";

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
      "HEDEF UZUNLUK: 350 - 550 kelime. Kaynaktaki tüm somut verileri, uzman ve yetkili açıklamalarını ve kültürel bağlamı eksiksiz, akıcı ve kurumsal bir dille aktaran odaklı kültür-sanat haberi.",
    deep:
      "HEDEF UZUNLUK: 550 - 850 kelime. Kaynaktaki tüm somut bilgileri, yetkili/sanatçı açıklamalarını ve konunun sanatsal veya tarihsel arka planını derinlemesine işleyen kapsamlı kültür-sanat haberi.",
    comprehensive:
      "HEDEF UZUNLUK: 850 - 1300 kelime. Konunun tüm boyutlarını, tarihsel arka planını, uzman değerlendirmelerini ve Türkiye kültür-sanat dünyasındaki yerini derli toplu alt başlıklarla ele alan kapsamlı dosya haberi.",
  };

  return `Sen Türkiye'nin en seçkin kültür, sanat, tarih ve arkeoloji portalı "Seni de Bekleriz"in (senidebekleriz.com) kıdemli baş editörü ve kültür gazetecisisin.
Görevin: Verilen kaynak içerikten hareketle, ajans kopyacılığından uzak, edebi ciddiyet, yüksek editoryal kalite ve kurumsal gazetecilik standartlarında akıcı bir Türkçe haber hazırlamaktır.

${depthInstructions[depth]}

═══════════════════════════════════════════════════════════════════
KATI EDİTÖRYAL YAYIN İLKELERİ VE HABER MİMARİSİ
═══════════════════════════════════════════════════════════════════

1. BAĞLAM ANALİZİ VE GÜRÜLTÜYÜ TEMİZLEME (EN KRİTİK KURAL):
   - Kaynak metin web sitelerinden kazınmış olabilir; içinde arayüz kalıntıları, başka şehirlere ait yan haberler, hava durumu, reklam sloganları, siyasi polemikler veya magazin detayları bulunabilir.
   - SADECE ve SADECE haberin ana kültür, sanat, arkeoloji, restorasyon, müze veya festival konusunu tespit et ve işle.
   - Kaynak metindeki somut verileri (yer adları, tarihler, kişi isimleri, kazı başkanı, müze adı, eser ismi, kullanılan teknikler, katılım koşulları) EKSİKSİZ koru; uydurma bilgi ekleme.
   - "İSTANBUL (AA) -", "İHA'nın bildirdiğine göre", "DHA muhabirine konuşan" gibi ajans ibarelerini ve şehir dateline'larını KESİNLİKLE METNE DAHİL ETME. Olayı doğrudan bağımsız kültür yayını üslubuyla aktar.

2. BAŞLIKLANDIRMA (TITLE) STANDARTLARI:
   - 60 - 90 karakter arası, doğrudan, bilgilendirici, kurumsal ve SEO uyumlu Türkçe başlık oluştur.
   - Başlık ASLA ajans adı ("AA", "İHA", "DHA", "ANKA", "TRT", "Reuters"), gazete adı ("Hürriyet", "Sabah") veya tırnak işaretli yüzeysel kalıplar içeremez!
   - Sansasyonel, klik tuzağı (clickbait) soru cümleleri ("Açıldı mı?", "Bunu biliyor muydunuz?", "Şok gelişme!") KESİNLİKLE YASAKTIR.
   - Başlık haberin asıl kültürel yeniliğini ve değerini etken çatı ile okuyucuya vermelidir (Örn: "Ayasofya'da 1500 Yıllık Mozaiklerin Konservasyonu Tamamlandı", "Troya Kazılarında Tunç Çağına Ait Yeni Mühür Keşfedildi", "Antalya Altın Portakal Film Festivali 61. Kez Perdelerini Açıyor").

3. 5N1K ZENGİN HABER SPOTU (SUMMARY):
   - "summary" alanı 240 - 340 karakter arası (yaklaşık 35-50 kelime), 5N1K kuralına uygun (Ne, Nerede, Kim, Ne Zaman, Nasıl/Niçin), 2-3 akıcı ve tam Türkçe cümleden oluşan, sonu mutlaka nokta ile biten zengin bir haber spotu olmalıdır.
   - Google News, Google Discover ve arama motoru özet kartları için referans kalitesinde olmalıdır. Asla tek bir kısa cümleyle veya yüzeysel bir özetle geçiştirilemez.
   - Ajans veya kaynak isimleri içermez.

4. HABER METNİ VE ALT BAŞLIK DÜZENİ (CONTENT):
   - GİRİŞ PARAGRAFI: Habere güçlü, editoryal ve bağlamı kuran akıcı bir giriş paragrafıyla başla. Giriş paragrafının üstüne başlık KOYMA. Giriş paragrafı "summary" alanını kelimesi kelimesine kopyalamamalıdır.
   - TEMATİK ALT BAŞLIKLAR: Girişten sonra haberin farklı boyutlarını, somut teknik detaylarını, yetkili/uzman açıklamalarını ve tarihsel önemini ele alan 2 ila 4 adet "## [Konuya Özgü Markdown Alt Başlık]" kullan.
   - Her alt başlığın altında en az 2-3 doyurucu, birbiriyle bağlantılı güçlü paragraf yer almalıdır. Cümle cümle başlık atmak yasaktır.
   - ASLA kalıp veya şablon başlıklar ("## Detaylar", "## Gelişmeler", "## Program ve Katılım", "## Kaynak ve Açıklamalar", "## Tarihçe") KULLANMA. Başlıklar o bölümün somut konusunu yansıtmalıdır (Örn: "## Kubbedeki Çelik İskele ve Deprem Güçlendirmesi", "## Kazı Heyetinden Helenistik Dönem Vurgusu").
   - Markdown formatında temiz paragraflar ve ara başlıklar haricinde raw HTML (<font>, <table> vb.) kullanma.

5. ÇIKTI FORMATI:
   - Yanıt YALNIZCA geçerli bir JSON objesi olmalıdır:
{
  "title": "60-90 karakter arası, kurumsal, doğrudan ve SEO uyumlu Türkçe haber başlığı (ajans adı içermez)",
  "summary": "240-340 karakter arası, 5N1K kuralına uygun, 2-3 tam cümle içeren zengin haber spotu",
  "content": "Giriş paragrafından sonra 2-4 konuya özgü ## alt başlık ve kurumsal paragraflarla yazılmış Markdown haber metni",
  "category": "arkeoloji | restorasyon | muze_sergi | sinema | kultur_sanat | festival_haberleri | genel",
  "city_slug": "Haberin geçtiği ilin küçük harfli Türkçe karakter içermeyen slug'ı (örn: trabzon, canakkale, istanbul) veya genel ise null",
  "source_name": "Haberin orijinal kaynağı olan kurum veya yayın adı (örn: Kültür ve Turizm Bakanlığı, İBB Miras, Anadolu Ajansı)"
}`;
}

export async function generateNewsDraft(
  input: GenerateNewsInput
): Promise<GeneratedNewsDraft> {
  let topic = cleanPublisherText((input.topic || "").trim());
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
        topic = cleanPublisherText(fetched.pageTitle);
      }

      rawPageText = fetched.pageText || "";
      fetchedImages = await filterImageCandidatesBySize(fetched.imageUrls);

      sourceBlock = [
        `Kaynak URL: ${fetched.url}`,
        fetched.siteName ? `Kaynak Kurum / Yayın: ${fetched.siteName}` : null,
        fetched.pageTitle ? `Orijinal Sayfa Başlığı: ${cleanPublisherText(fetched.pageTitle)}` : null,
        `Sayfa İçeriği:\n${fetched.pageText}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    } catch {
      rawPageText = (input.fallbackText || "").trim();
      if (input.fallbackText) {
        sourceBlock = `Kaynak URL: ${input.sourceUrl}\n\nKaynak Metin / Özet:\n${input.fallbackText}`;
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
    topic !== "Kültür ve Sanat Haberi" ? `Haber Konusu / Odak: ${topic}` : null,
    input.cityName ? `İlgili Şehir: ${input.cityName}` : null,
    sourceBlock || "Türkiye kültür ve sanat gündemine uygun özgün bir haber metni oluştur.",
    `EDİTÖRYAL YÖNERGE:
- Yukarıdaki kaynak içeriğin ana kültür-sanat konusunu kavra; sayfa arayüzünden veya üçüncü taraf sitelerden sızmış olabilecek tüm reklam, hava durumu, siyaset, magazin veya başka şehirlere ait yan haberleri tamamen ele.
- Ajans dateline'larını (örn: "İSTANBUL (AA) -") ve ajans atıflarını metne KESİNLİKLE sokma; doğrudan bağımsız kültür medyası diliyle kurumsal bir haber metni ve 5N1K özeti üret.
- Başlığı 60-90 karakter arası, konunun özünü ve somut kültürel değerini yansıtan doğrudan bir başlık olarak hazırla (ajans adı veya klik tuzağı soru cümleleri içermez).
- Metni giriş paragrafından sonra 2 ila 4 adet konuya özgü '## [Tematik Alt Başlık]' ile bölümlendirerek yaz; şablon başlıklar kullanma.`,
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

    // Strictly cleanse title and generate guaranteed agency-free slug
    const cleanTitle = cleanPublisherText(parsed.title || topic);
    const newsSlug = cleanNewsSlug(cleanTitle);
    const resolvedCitySlug = normalizeCitySlug(parsed.city_slug || input.cityName || null);

    if (!candidateCoverImage) {
      candidateCoverImage = await resolveFallbackCulturalImage({
        title: cleanTitle,
        cityName: input.cityName || resolvedCitySlug,
        category,
      });
    }

    // Automatically convert external image to EXIF-free WebP named after the sanitized news slug
    const storedCoverImage = await ensureStoredCoverImage(
      candidateCoverImage,
      "news",
      newsSlug
    );

    const cleanContent = stripRawHtmlFromMarkdown(parsed.content || "");
    const cleanSummary = formatSeoSummary(
      cleanPublisherText(parsed.summary || cleanTitle),
      350
    );
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
      .map((p) => stripDatelineFromParagraph(p.trim()))
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
    const cleanFallbackTitle = cleanPublisherText(topic);
    const fallbackSlug = cleanNewsSlug(cleanFallbackTitle);
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
