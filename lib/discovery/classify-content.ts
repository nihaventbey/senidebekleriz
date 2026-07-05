import { turkeyCities } from "@/data/turkey-cities";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import type { ClassifiedDiscovery } from "@/lib/discovery/types";

const CITY_SLUGS = turkeyCities.map((c) => c.slug).join(", ");

const SYSTEM_PROMPT = `Sen Türkiye kültür/sanat/gezi platformu için içerik sınıflandırıcısısın.
Haber başlığı ve özetine bakarak içeriği sınıflandır.

Kurallar:
- Gelecek veya güncel tiyatro, konser, sergi, festival, etkinlik duyurusu → content_type: "event"
- Gezi rehberi, şehir/müze tanıtımı, kültür-tarih yazısı, sanat haberi → content_type: "article"
- Siyasi skandal, spor, magazin, yeme-içme reklamı, alakasız içerik → content_type: "skip"
- city_slug yalnızca şu slug'lardan biri veya null: ${CITY_SLUGS}
- confidence 0 ile 1 arası

Yanıt yalnızca geçerli JSON:
{"content_type":"event","city_slug":null,"confidence":0.85}`;

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
    temperature: 0.2,
  });

  const contentType =
    parsed.content_type === "event" ||
    parsed.content_type === "article" ||
    parsed.content_type === "skip"
      ? parsed.content_type
      : "skip";

  return {
    content_type: contentType,
    city_slug: parsed.city_slug ?? null,
    confidence: parsed.confidence ?? 0.5,
  };
}
