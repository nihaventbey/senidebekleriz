import { callGeminiJson } from "@/lib/ai/gemini-client";

const SITE_NAME = "Seni de Bekleriz";
const MIN_WORDS = 80;
const MAX_WORDS = 180;

const FORBIDDEN_PATTERNS = [
  /\bvali\b/i,
  /\bvaliliği\b/i,
  /\bbakanlık\b/i,
  /\bpartimiz\b/i,
  /\bsayın\s+vatandaş/i,
  /\bhoş\s+geldiniz\s+sayın/i,
  /\biktidar\b/i,
  /\bmuhalefet\b/i,
];

export type CityDescriptionInput = {
  name: string;
  region?: string | null;
  wikidataId?: string | null;
  existingDescription?: string | null;
};

export type CityDescriptionResult = {
  description: string;
  source: "ai" | "template";
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sanitizeParagraph(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function containsForbiddenContent(text: string): boolean {
  return FORBIDDEN_PATTERNS.some((pattern) => pattern.test(text));
}

/** Deterministic fallback — neutral culture/tourism intro. */
export function buildTemplateCityDescription(
  input: CityDescriptionInput
): string {
  const region = input.region?.trim();
  const regionPhrase = region ? `${region} bölgesinde yer alan ` : "";

  return sanitizeParagraph(
    `${input.name}, ${regionPhrase}Türkiye'nin kültür ve tarih rotasında keşfedilmeye değer bir duraktır. Şehirde müzeler, tarihi yapılar, sanat mekanları ve doğal peyzajlar bir arada sunulur; ziyaretçiler hem kent merkezinde hem çevresinde farklı dönemlere ait izleri yakından görebilir. ${SITE_NAME} ile ${input.name}'daki öne çıkan mekanları inceleyerek gezi planınızı oluşturabilirsiniz.`
  );
}

function validateDescription(text: string): boolean {
  const clean = sanitizeParagraph(text);
  const words = wordCount(clean);
  if (words < MIN_WORDS - 20 || words > MAX_WORDS + 40) return false;
  if (containsForbiddenContent(clean)) return false;
  return clean.length >= 200;
}

/**
 * AI-enhanced city intro with a deterministic fallback.
 */
export async function generateCityDescription(
  input: CityDescriptionInput
): Promise<CityDescriptionResult> {
  const template = buildTemplateCityDescription(input);

  if (!process.env.GEMINI_API_KEY) {
    return { description: template, source: "template" };
  }

  try {
    const result = await callGeminiJson<{ description: string }>({
      systemPrompt: `Sen Türkiye odaklı kültür ve gezi sitesi ${SITE_NAME} için editörsün.
Verilen il için tek paragraflık tanıtıcı metin yaz.

Kurallar:
- Yaklaşık ${MIN_WORDS}-${MAX_WORDS} kelime, tek paragraf, düz metin (HTML yok)
- Odak: müzeler, tarih, sanat, mimari, doğal/kültürel miras, gezilecek yerler
- Sıcak ve davetkâr ton; kültür turizmi rehberi gibi yaz
- Siyasi parti, güncel siyaset, vali/kurum övgüsü, propaganda dili YASAK
- Din, etnik kimlik veya tartışmalı tarih yorumu YASAK
- Abartılı iddia, uydurma istatistik veya ödül iddiası YASAK
- Yeme-içme veya gece hayatı vurgusu yapma

Yanıt yalnızca geçerli JSON: {"description":"..."}`,
      userPrompt: [
        `İl: ${input.name}`,
        input.region ? `Bölge: ${input.region}` : null,
        input.existingDescription
          ? `Mevcut not (yalnızca bağlam, kopyalama): ${input.existingDescription.slice(0, 400)}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      temperature: 0.4,
    });

    const candidate = sanitizeParagraph(result.description || "");
    if (validateDescription(candidate)) {
      return { description: candidate, source: "ai" };
    }
  } catch {
    // fall through to template
  }

  return { description: template, source: "template" };
}
