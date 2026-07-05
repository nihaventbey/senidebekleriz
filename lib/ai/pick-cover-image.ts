import { callGeminiJson } from "@/lib/ai/gemini-client";

export type PickCoverImageInput = {
  entityName: string;
  entityType: "city" | "place";
  pageUrl: string;
  pageText: string;
  candidateUrls: string[];
};

export type PickCoverImageResult = {
  selectedUrl: string | null;
  confidence: number;
  reason: string;
};

const MIN_CONFIDENCE = 0.6;
const MAX_CANDIDATES = 12;

type GeminiPick = {
  selected_url: string | null;
  confidence: number;
  reason: string;
};

/**
 * Uses Gemini to choose the most representative cover image (city panorama,
 * landmark, promotional collage) from a list of candidate URLs, rejecting
 * logos, icons, flags and decorative graphics. Returns null when no candidate
 * is suitable or confidence is too low.
 */
export async function pickCoverImage(
  input: PickCoverImageInput
): Promise<PickCoverImageResult> {
  const candidates = [...new Set(input.candidateUrls)]
    .filter(Boolean)
    .slice(0, MAX_CANDIDATES);

  if (candidates.length === 0) {
    return { selectedUrl: null, confidence: 0, reason: "Aday görsel yok" };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      selectedUrl: null,
      confidence: 0,
      reason: "GEMINI_API_KEY tanımlı değil",
    };
  }

  const entityLabel = input.entityType === "city" ? "il/şehir" : "mekan";

  try {
    const result = await callGeminiJson<GeminiPick>({
      systemPrompt: `Sen bir görsel editörüsün. Verilen aday görsel URL listesinden bir ${entityLabel} için en iyi TANITIM/KAPAK görselini seçeceksin.
Kurallar:
- Logo, amblem, bayrak, harita, bakanlık/valilik mührü, sosyal medya ikonu, buton, dekoratif küçük grafik → ASLA seçme
- Şehir panoraması, tarihi yapı, doğal güzellik, tanıtım kolajı, meydan, cami/kale gibi simge yapılar → TERCİH ET
- Yalnızca verilen listedeki URL'lerden birini seç
- Uygun aday yoksa selected_url = null döndür
- Emin değilsen düşük confidence ver
Yanıt yalnızca geçerli JSON: {"selected_url": string|null, "confidence": number(0-1), "reason": string}`,
      userPrompt: [
        `${entityLabel} adı: ${input.entityName}`,
        `Kaynak sayfa: ${input.pageUrl}`,
        `Sayfa metni (özet): ${input.pageText.slice(0, 1500)}`,
        "Aday görseller:",
        ...candidates.map((url, i) => `${i + 1}. ${url}`),
      ].join("\n"),
      temperature: 0.2,
    });

    const selected =
      result.selected_url && candidates.includes(result.selected_url)
        ? result.selected_url
        : null;

    const confidence = Number(result.confidence) || 0;

    if (!selected || confidence < MIN_CONFIDENCE) {
      return {
        selectedUrl: null,
        confidence,
        reason: result.reason || "Uygun görsel bulunamadı",
      };
    }

    return {
      selectedUrl: selected,
      confidence,
      reason: result.reason || "Seçildi",
    };
  } catch (error) {
    return {
      selectedUrl: null,
      confidence: 0,
      reason: error instanceof Error ? error.message : "Gemini hatası",
    };
  }
}
