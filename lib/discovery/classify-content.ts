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

export async function classifyDiscoveryItem(input: {
  title: string;
  snippet: string;
  sourceName: string;
}): Promise<ClassifiedDiscovery> {
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
    : "news"; // Default to news for cultural content

  return {
    content_type: contentType,
    city_slug: parsed.city_slug ?? null,
    confidence: parsed.confidence ?? 0.7,
  };
}
