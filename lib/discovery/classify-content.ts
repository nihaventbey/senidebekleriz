import { turkeyCities } from "@/data/turkey-cities";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import type { ClassifiedDiscovery } from "@/lib/discovery/types";

const CITY_SLUGS = turkeyCities.map((c) => c.slug).join(", ");

const FALSE_POSITIVE_CITY_WORDS: Record<string, RegExp> = {
  adana: /\b(adana[nm]\w*|adanmış\w*)\b/gi,
  van: /\b(divan\w*|hayvan\w*|unvan\w*|ünvan\w*|kervan\w*|elvan\w*|revan\w*|tavan\w*|yavan\w*|havan\w*|civan\w*|ivan\w*|karavan\w*|paravan\w*)\b/gi,
  kars: /\b(karşı\w*|karsı\w*|akarsu\w*)\b/gi,
  usak: /\b(kuşak\w*|yumuşak\w*|kavuşak\w*|uşakları)\b/gi,
  ordu: /\b(sordu\w*|kordu\w*|yordu\w*|gördü\w*|bordo\w*|kordon\w*|ordusu|ordumuz|ordunun)\b/gi,
  agri: /\b(çağrı\w*|ağrısı\w*|ağrılar\w*|baş\s+ağrı\w*)\b/gi,
  mus: /\b(konuş\w*|duruş\w*|vuruş\w*|kuruluş\w*|kurtuluş\w*|doğmuş\w*|olmuş\w*|bulmuş\w*|kalmış\w*|gelmiş\w*|geçmiş\w*|almış\w*|vermiş\w*|yapmış\w*|çıkmış\w*|açılmış\w*|başlamış\w*|gümüş\w*)\b/gi,
  aydin: /\b(aydınlat\w*|aydınlık\w*|günaydın\w*)\b/gi,
};

/**
 * Safely detects one of Turkey's 81 provinces using word boundaries and Turkish suffix rules,
 * preventing false positives like "adanan" -> "adana" or "divan" -> "van".
 */
export function detectTurkishCityInText(rawText: string): string | null {
  if (!rawText) return null;
  let text = rawText.toLocaleLowerCase("tr");

  for (const c of turkeyCities) {
    let candidateText = text;
    const fpRegex = FALSE_POSITIVE_CITY_WORDS[c.slug];
    if (fpRegex) {
      candidateText = candidateText.replace(fpRegex, " ");
    }

    const cityNameLower = c.name.toLocaleLowerCase("tr");
    const escapedName = cityNameLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Match exact city name or city name with apostrophe/locative/ablative suffixes ('da, 'de, 'ta, 'te, 'dan, 'den, 'a, 'e, 'ya, 'ye, 'nın, 'nin, 'lı, 'li, ilinde, ili)
    const boundaryRegex = new RegExp(
      `(?:^|[^a-zçğıöşü0-9])${escapedName}(?:['’][a-zçğıöşü]{1,5}|\\s+ili\\b|\\s+ilinde\\b|\\s+büyükşehir\\b|\\s+belediyesi\\b|\\s+valiliği\\b|\\s+müzesi\\b|\\s+kalesi\\b|\\s+antik\\b|(?:da|de|ta|te|dan|den|ya|ye|nda|nde))?(?=$|[^a-zçğıöşü0-9])`,
      "i"
    );

    if (boundaryRegex.test(candidateText)) {
      return c.slug;
    }
  }

  // Also check iconic districts/landmarks that unambiguously map to a city
  if (/\b(haydarpaşa|beyoğlu|kadıköy|beşiktaş|üsküdar|zeytinburnu|fatih|harbiye|galataport|sakıp sabancı müzesi|pera müzesi|rahmi koç müzesi|topkapı|ayasofya|sultanahmet)\b/i.test(text)) {
    return "istanbul";
  }
  if (/\b(cso ada|çankaya|ulus|anadolu medeniyetleri|etnografya müzesi|cerModern)\b/i.test(text)) {
    return "ankara";
  }
  if (/\b(efes antik|bergama|çeşme|urla|konak|alsancak|karşıyaka|basmane|bornova|dikili)\b/i.test(text)) {
    return "izmir";
  }
  if (/\b(aspendos|perge|side antik|alanya|kaş|kemer|kaleiçi|patara|lyrbe)\b/i.test(text)) {
    return "antalya";
  }
  if (/\b(troya|assos|gelibolu|bozcaada|gökçeada)\b/i.test(text)) {
    return "canakkale";
  }
  if (/\b(göbeklitepe|karahantepe|harran|balıklıgöl)\b/i.test(text)) {
    return "sanliurfa";
  }
  if (/\b(zeugma|rumkale)\b/i.test(text)) {
    return "gaziantep";
  }
  if (/\b(kapadokya|ürgüp|göreme|avanos|derinkuyu)\b/i.test(text)) {
    return "nevsehir";
  }
  if (/\b(bodrum|marmaris|fethiye|datça|stratonikeia|knidos)\b/i.test(text)) {
    return "mugla";
  }
  if (/\b(sümela)\b/i.test(text)) {
    return "trabzon";
  }
  if (/\b(nemrut)\b/i.test(text)) {
    return "adiyaman";
  }
  if (/\b(sagalassos|kibyra)\b/i.test(text)) {
    return "burdur";
  }
  if (/\b(hierapolis|pamukkale|laodikeia)\b/i.test(text)) {
    return "denizli";
  }
  if (/\b(ani ören|ani harabeleri|sarıkamış)\b/i.test(text)) {
    return "kars";
  }
  if (/\b(ahlat|nemrut krater)\b/i.test(text)) {
    return "bitlis";
  }
  if (/\b(akdamar)\b/i.test(text)) {
    return "van";
  }
  if (/\b(midyat|dara antik|deyru'z-zafaran)\b/i.test(text)) {
    return "mardin";
  }
  if (/\b(hasankeyf)\b/i.test(text)) {
    return "batman";
  }
  if (/\b(hattuşa|alacahöyük)\b/i.test(text)) {
    return "corum";
  }
  if (/\b(gordion|pazaryeri)\b/i.test(text)) {
    return "ankara";
  }

  return null;
}

/**
 * Checks whether an item is commercial artwork marketplace spam, non-Turkey foreign news,
 * or non-cultural noise.
 */
export function isRejectedNonTurkishOrCommercialContent(input: {
  title: string;
  snippet?: string;
  sourceUrl?: string;
  sourceName?: string;
}): boolean {
  const title = input.title || "";
  const snippet = input.snippet || "";
  const url = (input.sourceUrl || "").toLowerCase();
  const source = (input.sourceName || "").toLowerCase();
  const combined = `${title} ${snippet}`.toLocaleLowerCase("tr");

  // 1. Commercial art marketplaces, painting sales pages, e-commerce catalogs
  if (
    url.includes("artmajeur.com") ||
    url.includes("saatchiart.com") ||
    url.includes("artsy.net/artwork") ||
    url.includes("etsy.com") ||
    url.includes("trendyol.com") ||
    url.includes("hepsiburada.com") ||
    source.includes("artmajeur") ||
    /,\s*(tablo|resim|heykel|çizim|fotoğraf|baskı|dijital sanat)\s+[^,]+\s+tarafından/i.test(
      title
    )
  ) {
    return true;
  }

  // 2. Generic category index pages without a specific article
  if (
    /^kültür[- ]sanat haberleri/i.test(title.trim()) ||
    /\/(kultur-sanat|sanat|etkinlikler)\/?$/i.test(url)
  ) {
    return true;
  }

  // 3. Crime, politics, sports, finance, accidents, war/conflict
  if (
    /\b(cinayet|gözaltına alındı|tutuklandı|uyuşturucu|asayiş|trafik kazası|yaralandı|öldürüldü|silahlı kavga|hırsızlık|dolandırıcılık|sarı kart|kırmızı kart|süper lig|penaltı|gol krallığı|borsa istanbul|dolar kuru|faiz kararı|ara seçimler|kongre'nin kontrolü|oy verme başladı|soykırım|bomba|saldırı|terör)\b/i.test(
      combined
    )
  ) {
    return true;
  }

  // 4. Foreign-only news check:
  // If it mentions foreign countries/cities (Baku, Azerbaijan, Germany, USA, Ukraine, Syria, Finland, UK/London, Kazakhstan, etc.)
  // AND has NO Turkish city and NO mention of Türkiye / Türk / Anadolu, reject it!
  const detectedCity = detectTurkishCityInText(combined);
  const mentionsTurkey =
    Boolean(detectedCity) ||
    /\b(türkiye|türkiye'de|türkiye'nin|türkiye'ye|türkiye'den|anadolu|osmanlı|selçuklu|hitit|urartu|frig|likya|kültür ve turizm bakanlığı|devlet tiyatroları|devlet opera)\b/i.test(
      combined
    );

  const mentionsForeignLocation =
    /\b(bakü|baku|azerbaycan|almanya|almanya'da|ukrayna|suriye|suriye'de|finlandiya|isveç|norveç|fransa|fransa'da|paris'te|londra'da|frieze london|ingiltere'de|abd'de|amerika'da|new york'ta|rusya'da|moskova'da|iran'da|tahran'da|mısır'da|kahire'de|yunanistan'da|atina'da|italya'da|roma'da|ispanya'da|madrid'de|hollanda'da|amsterdam'da|belçika'da|avusturya'da|viyana'da|체kya|polonya|macaristan|kazakistan|kaljır|özbekistan|kırgızistan|türkmenistan|gürcistan|tiflis|erivan|bağdat|şam|beyrut|gazze|filistin|israil|japonya|tokyo|çin'de|pekin|hindistan|brezilya|arjantin'de|kanada'da|avustralya'da)\b/i.test(
      combined
    );

  if (mentionsForeignLocation && !mentionsTurkey) {
    return true;
  }

  return false;
}

const SYSTEM_PROMPT = `Sen Türkiye kültür, sanat ve turizm platformu (Seni de Bekleriz) için uzman bir içerik sınıflandırıcısısın.
Haber başlığı, kaynak ve özetine bakarak içeriği en uygun türe sınıflandır.

ÇOK ÖNEMLİ COĞRAFİ VE İÇERİK FİLTRESİ:
- Platformumuz YALNIZCA TÜRKİYE sınırları içindeki veya doğrudan Türkiye ile bağlantılı kültür, sanat, arkeoloji, müze, sergi, konser, tiyatro, festival ve gezi içeriklerini yayınlar.
- Bakü, Azerbaycan, ABD, Almanya, İngiltere, Fransa, Finlandiya, Ukrayna, Suriye, Kazakistan vb. yabancı ülkelerdeki yerel etkinlikleri/haberleri (Türkiye ile doğrudan bir bağı yoksa) KESİNLİKLE content_type: "skip" olarak işaretle!
- Sanat galerilerinin veya ArtMajeur gibi sitelerin tekil tablo/heykel/ürün satış sayfalarını ("... Tablo ... tarafından") KESİNLİKLE content_type: "skip" olarak işaretle!
- Siyaset, seçimler, savaş/çatışma, asayiş, spor ve magazin haberlerini KESİNLİKLE content_type: "skip" olarak işaretle!

Kategori Kuralları:
1. 📰 KÜLTÜR HABERİ (content_type: "news"):
   - Türkiye'deki arkeolojik kazı keşifleri ve buluntuları ("bulundu", "gün yüzüne çıkarıldı", "kazı çalışmaları")
   - Türkiye'deki restorasyon başlama/tamamlanma haberleri ("restore edildi", "açılışı yapıldı")
   - Kültür ve Turizm Bakanlığı açıklamaları, tescil kararları, ödüller, Türkiye'ye tarihi eser iadesi haberleri
   - Türkiye'deki müze açılışları, kültür merkezi açılışları, edebiyat ve kültür dünyasından gelişmeler

2. 🎭 KÜLTÜR ETKİNLİĞİ (content_type: "event"):
   - Türkiye'de belirli bir gelecek/güncel tarih aralığında sahnelenen tiyatro, konser, opera, bale
   - Türkiye'deki tarihli festival, sergi açılışı, film festivali, atölye, söyleşi takvimi
   - Bilet, mekan, seans veya program içeren canlı performans duyuruları ve aylık/haftalık şehir etkinlik bültenleri

3. 🗺️ GEZİ REHBERİ & DERLEME (content_type: "article"):
   - Türkiye'deki zamansız (evergreen) gezi rehberleri ("... Gezilecek Yerler", "... Gezi Rehberi")
   - Türkiye'deki şehir, rota, antik kent veya müze tanıtım makaleleri

4. 🚫 ATLA / İLGİSİZ (content_type: "skip"):
   - Türkiye dışı haberler (Bakü, Avrupa, ABD vb.), tablo/eser satış sayfaları, siyasi/seçim haberleri, asayiş, spor, magazin

- city_slug: Türkiye'nin 81 ilinden biri (örn: 'istanbul', 'adiyaman', 'sanliurfa') veya tespit edilemezse null: ${CITY_SLUGS}
- confidence: 0.0 ile 1.0 arası güven puanı

Yanıt yalnızca geçerli JSON formatında olmalıdır:
{"content_type":"news","city_slug":"adiyaman","confidence":0.95}`;

export function heuristicClassify(input: {
  title: string;
  snippet?: string;
  sourceUrl?: string;
  sourceName?: string;
}): ClassifiedDiscovery {
  if (isRejectedNonTurkishOrCommercialContent(input)) {
    return {
      content_type: "skip",
      city_slug: null,
      confidence: 0.98,
    };
  }

  const text = `${input.title} ${input.snippet || ""}`.toLocaleLowerCase("tr");
  const detectedCity = detectTurkishCityInText(text);

  const isEvent =
    /\b(sergi|sergisi|sergileri|konser|konseri|konserleri|festival|festivali|tiyatro|tiyatrosu|sahne|bale|opera|gösteri|gösterisi|prömiyer|bilet|etkinlik|etkinliği|etkinlikleri|takvimi|ajandası|turne|şenlik|söyleşi|atölye)\b/i.test(
      text
    );

  const isArticle =
    /\b(gezilecek yerler|gezi rehberi|gezi rotası|keşif rotası|tarihçesi|tanıtımı|müzesi rehberi|nasıl gidilir)\b/i.test(
      text
    );

  const isNews =
    /\b(kazı|arkeoloji|arkeolojik|antik kent|restorasyon|restore|tarihi|müze|müzesi|bulundu|keşfedildi|gün yüzüne|iade edildi|tescil|bakanlık|ödül|ödülleri|kültür merkezi|açılış|miras|edebiyat|kitap|yazar|anma|sempozyum)\b/i.test(
      text
    );

  let contentType: ClassifiedDiscovery["content_type"] = "news";
  if (isArticle) contentType = "article";
  else if (isEvent) contentType = "event";
  else if (isNews) contentType = "news";
  else contentType = "news";

  return {
    content_type: contentType,
    city_slug: detectedCity,
    confidence: 0.85,
  };
}

export async function classifyDiscoveryItem(input: {
  title: string;
  snippet: string;
  sourceName: string;
  sourceUrl?: string;
}): Promise<ClassifiedDiscovery> {
  if (isRejectedNonTurkishOrCommercialContent(input)) {
    return {
      content_type: "skip",
      city_slug: null,
      confidence: 0.99,
    };
  }

  try {
    const userPrompt = [
      `Kaynak: ${input.sourceName}`,
      input.sourceUrl ? `URL: ${input.sourceUrl}` : null,
      `Başlık: ${input.title}`,
      `Özet: ${input.snippet.slice(0, 1500)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const parsed = await callGeminiJson<ClassifiedDiscovery>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.1,
    });

    const validTypes = ["news", "event", "article", "skip"] as const;
    const contentType = validTypes.includes(parsed.content_type as any)
      ? parsed.content_type
      : "news";

    const verifiedCity =
      detectTurkishCityInText(`${input.title} ${input.snippet}`) ||
      parsed.city_slug ||
      null;

    return {
      content_type: contentType,
      city_slug: contentType === "skip" ? null : verifiedCity,
      confidence: parsed.confidence ?? 0.7,
    };
  } catch {
    return heuristicClassify(input);
  }
}

export type BatchClassifyInput = {
  id: string | number;
  title: string;
  snippet: string;
  sourceName: string;
  sourceUrl?: string;
};

const BATCH_SYSTEM_PROMPT = `Sen Türkiye kültür, sanat, tarih ve turizm platformu (Seni de Bekleriz) için uzman bir içerik sınıflandırıcısısın.
Sana verilen içerik listesini incele ve her bir öğeyi JSON dizisi olarak sınıflandır.

ÇOK ÖNEMLİ FİLTRE KURALLARI:
- YALNIZCA TÜRKİYE İLE İLGİLİ içerikleri kabul et! Bakü, Azerbaycan, ABD, Almanya, İngiltere, Fransa, Finlandiya, Ukrayna, Suriye, Kazakistan vb. yabancı ülkelerdeki yerel haber/etkinlikleri (Türkiye ile doğrudan bağı yoksa) KESİNLİKLE content_type: "skip" yap!
- Sanat galerilerinin veya ArtMajeur gibi sitelerin tablo/heykel/ürün satış sayfalarını ("... Tablo ... tarafından") KESİNLİKLE content_type: "skip" yap!
- Siyasi seçimler, parti tartışmaları, savaş/çatışma, asayiş, spor ve magazin haberlerini KESİNLİKLE content_type: "skip" yap!

Kategori Kuralları:
1. 📰 KÜLTÜR HABERİ (content_type: "news"):
   - Türkiye'deki arkeolojik kazı keşifleri ve buluntuları
   - Türkiye'deki restorasyon haberleri, Kültür Bakanlığı kararları, Türkiye'ye tarihi eser iadesi, müze açılışları
2. 🎭 KÜLTÜR ETKİNLİĞİ (content_type: "event"):
   - Türkiye'de sahnelenen tiyatro, konser, opera, bale, festival, sergi açılışı, etkinlik takvimi/bülteni
3. 🗺️ GEZİ REHBERİ & DERLEME (content_type: "article"):
   - Türkiye'deki zamansız gezi rehberleri ("... Gezilecek Yerler", "... Gezi Rehberi"), antik kent/müze tanıtımları
4. 🚫 ATLA / İLGİSİZ (content_type: "skip"):
   - Türkiye dışı haberler, tablo satış sayfaları, siyaset, asayiş, spor, magazin, yemek reklamı

Kurallar:
- city_slug: Türkiye'nin 81 ilinden biri (örn: 'istanbul', 'adiyaman', 'sanliurfa') veya tespit edilemezse null: ${CITY_SLUGS}
- confidence: 0.0 ile 1.0 arası güven puanı

Yanıt SADECE JSON dizisi formatında olmalıdır:
[
  {"id": 0, "content_type": "news", "city_slug": "istanbul", "confidence": 0.95}
]`;

export async function classifyDiscoveryBatch(
  items: BatchClassifyInput[]
): Promise<Map<string | number, ClassifiedDiscovery>> {
  const result = new Map<string | number, ClassifiedDiscovery>();
  if (items.length === 0) return result;

  // Pre-filter obvious non-Turkish or commercial items before calling AI
  const remainingItems: BatchClassifyInput[] = [];
  for (const item of items) {
    if (isRejectedNonTurkishOrCommercialContent(item)) {
      result.set(item.id, {
        content_type: "skip",
        city_slug: null,
        confidence: 0.99,
      });
    } else {
      remainingItems.push(item);
    }
  }

  if (remainingItems.length === 0) return result;

  const userPrompt = JSON.stringify(
    remainingItems.map((item) => ({
      id: item.id,
      source: item.sourceName,
      title: item.title,
      snippet: (item.snippet || "").slice(0, 300),
    })),
    null,
    2
  );

  try {
    const parsed = await callGeminiJson<
      Array<{
        id: string | number;
        content_type: string;
        city_slug?: string | null;
        confidence?: number;
      }>
    >({
      systemPrompt: BATCH_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.1,
    });

    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        const orig = remainingItems.find((r) => r.id === entry.id);
        const validTypes = ["news", "event", "article", "skip"] as const;
        const contentType = validTypes.includes(entry.content_type as any)
          ? (entry.content_type as ClassifiedDiscovery["content_type"])
          : "news";

        const verifiedCity = orig
          ? detectTurkishCityInText(`${orig.title} ${orig.snippet}`)
          : entry.city_slug ?? null;

        result.set(entry.id, {
          content_type: contentType,
          city_slug: contentType === "skip" ? null : verifiedCity,
          confidence:
            typeof entry.confidence === "number" ? entry.confidence : 0.75,
        });
      }
    }
  } catch {
    for (const item of remainingItems) {
      result.set(item.id, heuristicClassify(item));
    }
    return result;
  }

  // Fill in any missed items with heuristics
  for (const item of remainingItems) {
    if (!result.has(item.id)) {
      result.set(item.id, heuristicClassify(item));
    }
  }

  return result;
}
