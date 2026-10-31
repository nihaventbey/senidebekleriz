import { turkeyCities } from "@/data/turkey-cities";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import type { ClassifiedDiscovery } from "@/lib/discovery/types";

const CITY_SLUGS = turkeyCities.map((c) => c.slug).join(", ");

const SYSTEM_PROMPT = `Sen Türkiye kültür, sanat ve turizm platformu için uzman bir içerik sınıflandırıcısısın.
Haber başlığı, kaynak ve özetine bakarak içeriği en uygun türe sınıflandır.

Kurallar:
1. 📰 KÜLTÜR HABERİ (content_type: "news"):
   - Arkeolojik kazı keşifleri ve buluntuları ("bulundu", "gün yüzüne çıkarıldı", "kazı çalışmaları")
   - Restorasyon başlama/tamamlanma haberleri ("restore edildi", "açılışı yapıldı")
   - Kültür ve Turizm Bakanlığı açıklamaları, tescil kararları, ödüller, tarihi eser kaçakçılığı/iadesi haberleri
   - Müze açılışları, kültür merkezi açılışları, anma ve kültür dünyasından güncel gelişmeler

2. 🎭 KÜLTÜR ETKİNLİĞİ (content_type: "event"):
   - Belirli bir gelecek/güncel tarih aralığında sahnelenen tiyatro, konser, opera, bale
   - Tarihli festival, sergi açılışı, film festivali, atölye, söyleşi takvimi
   - Bilet, mekan, seans veya program içeren canlı performans duyuruları

3. 🗺️ GEZİ REHBERİ & DERLEME (content_type: "article"):
   - Zamansız (evergreen) gezi rehberleri ("... Gezilecek Yerler", "... Gezi Rehberi")
   - Şehir, rota, antik kent veya müze tanıtım makaleleri

4. 🚫 ATLA / İLGİSİZ (content_type: "skip"):
   - Siyasi tartışmalar, parti haberleri, adliye/asayiş, spor maçları, magazin dedikoduları, ticari ürün reklamları

- city_slug: Türkiye'nin 81 ilinden biri (örn: 'istanbul', 'adiyaman', 'sanliurfa') veya tespit edilemezse null: ${CITY_SLUGS}
- confidence: 0.0 ile 1.0 arası güven puanı

Yanıt yalnızca geçerli JSON formatında olmalıdır:
{"content_type":"news","city_slug":"adiyaman","confidence":0.95}`;

export function heuristicClassify(input: {
  title: string;
  snippet?: string;
}): ClassifiedDiscovery {
  const text = `${input.title} ${input.snippet || ""}`.toLocaleLowerCase("tr");

  // Non-cultural skip patterns: crime, police, sports, accidents, stock market
  const isSkip =
    /\b(cinayet|gözaltına alındı|tutuklandı|uyuşturucu|asayiş|trafik kazası|yaralandı|öldürüldü|silahlı kavga|hırsızlık|dolandırıcılık|sarı kart|kırmızı kart|süper lig|penaltı|gol krallığı|borsa istanbul|dolar kuru|faiz kararı)\b/i.test(
      text
    );

  if (isSkip) {
    return {
      content_type: "skip",
      city_slug: null,
      confidence: 0.9,
    };
  }

  // Detect city from 81 Turkish cities
  let detectedCity: string | null = null;
  for (const c of turkeyCities) {
    const cityNameLower = c.name.toLocaleLowerCase("tr");
    if (text.includes(cityNameLower) || text.includes(c.slug)) {
      detectedCity = c.slug;
      break;
    }
  }

  const isEvent =
    /\b(sergi|sergisi|konser|konseri|festival|festivali|tiyatro|tiyatrosu|sahne|bale|opera|gösteri|gösterisi|prömiyer|bilet|etkinlik|etkinliği|turne|şenlik|söyleşi|atölye)\b/i.test(
      text
    );

  const isArticle =
    /\b(gezilecek yerler|gezi rehberi|gezi rotası|tarihçesi|tanıtımı|müzesi rehberi|nasıl gidilir)\b/i.test(
      text
    );

  const isNews =
    /\b(kazı|arkeoloji|arkeolojik|antik kent|restorasyon|restore|tarihi|müze|müzesi|bulundu|gün yüzüne|tescil|bakanlık|ödül|ödülleri|kültür merkezi|açılış|miras|edebiyat|kitap|yazar|anma|vefat)\b/i.test(
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
}): Promise<ClassifiedDiscovery> {
  try {
    const userPrompt = [
      `Kaynak: ${input.sourceName}`,
      `Başlık: ${input.title}`,
      `Özet: ${input.snippet.slice(0, 1500)}`,
    ].join("\n");

    const parsed = await callGeminiJson<ClassifiedDiscovery>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.1,
    });

    const validTypes = ["news", "event", "article", "skip"] as const;
    const contentType = validTypes.includes(parsed.content_type as any)
      ? parsed.content_type
      : "news";

    return {
      content_type: contentType,
      city_slug: parsed.city_slug ?? null,
      confidence: parsed.confidence ?? 0.7,
    };
  } catch (error) {
    // Graceful fallback to heuristic rules on AI quota or network error
    return heuristicClassify(input);
  }
}

export type BatchClassifyInput = {
  id: string | number;
  title: string;
  snippet: string;
  sourceName: string;
};

const BATCH_SYSTEM_PROMPT = `Sen Türkiye kültür, sanat, tarih ve turizm platformu için uzman bir içerik sınıflandırıcısısın.
Sana verilen içerik listesini incele ve her bir öğeyi JSON dizisi olarak sınıflandır.

Kategori Kuralları:
1. 📰 KÜLTÜR HABERİ (content_type: "news"):
   - Arkeolojik kazı keşifleri ve buluntuları ("bulundu", "gün yüzüne çıkarıldı", "kazı çalışmaları")
   - Restorasyon başlama/tamamlanma haberleri ("restore edildi", "açılışı yapıldı")
   - Kültür ve Turizm Bakanlığı açıklamaları, tescil kararları, ödüller, tarihi eser kaçakçılığı/iadesi haberleri
   - Müze açılışları, kültür merkezi açılışları, anma ve kültür dünyasından güncel gelişmeler
2. 🎭 KÜLTÜR ETKİNLİĞİ (content_type: "event"):
   - Belirli bir gelecek/güncel tarih aralığında sahnelenen tiyatro, konser, opera, bale, festival, sergi açılışı
   - Bilet, mekan, seans veya program içeren canlı performans duyuruları
3. 🗺️ GEZİ REHBERİ & DERLEME (content_type: "article"):
   - Zamansız gezi rehberleri ("... Gezilecek Yerler", "... Gezi Rehberi")
   - Şehir, rota, antik kent veya müze tanıtım makaleleri
4. 🚫 ATLA / İLGİSİZ (content_type: "skip"):
   - Siyasi tartışmalar, parti haberleri, adliye/asayiş, spor maçları, magazin dedikoduları, ticari ürün reklamları, yemek/restoran reklamı

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

  const userPrompt = JSON.stringify(
    items.map((item) => ({
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
        const validTypes = ["news", "event", "article", "skip"] as const;
        const contentType = validTypes.includes(entry.content_type as any)
          ? (entry.content_type as ClassifiedDiscovery["content_type"])
          : "news";
        result.set(entry.id, {
          content_type: contentType,
          city_slug: entry.city_slug ?? null,
          confidence: typeof entry.confidence === "number" ? entry.confidence : 0.75,
        });
      }
    }
  } catch (error) {
    // If Gemini quota (429) or call fails, gracefully fallback to heuristic rules
    for (const item of items) {
      result.set(item.id, heuristicClassify({ title: item.title, snippet: item.snippet }));
    }
    return result;
  }

  // Fill in any missed items with heuristics
  for (const item of items) {
    if (!result.has(item.id)) {
      result.set(item.id, heuristicClassify({ title: item.title, snippet: item.snippet }));
    }
  }

  return result;
}
