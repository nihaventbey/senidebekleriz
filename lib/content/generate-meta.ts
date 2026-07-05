import { callGeminiJson } from "@/lib/ai/gemini-client";

const SITE_NAME = "Seni de Bekleriz";
const MAX_DESCRIPTION = 160;

export type MetaFields = {
  meta_title: string;
  meta_description: string;
};

export type MetaEntityType = "place" | "city" | "event";

type MetaInput = {
  type: MetaEntityType;
  name: string;
  cityName?: string;
  description?: string | null;
  categoryLabel?: string | null;
};

function truncate(text: string, max = MAX_DESCRIPTION): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Deterministic template meta — no external calls, always safe. */
export function buildTemplateMeta(input: MetaInput): MetaFields {
  const { type, name, cityName, categoryLabel } = input;

  let title: string;
  if (type === "place") {
    const suffix = categoryLabel ? ` ${categoryLabel}` : "";
    title = `${name}${cityName ? ` – ${cityName}` : ""}${suffix} | ${SITE_NAME}`;
  } else if (type === "city") {
    title = `${name} Gezilecek Yerler ve Kültür Rehberi | ${SITE_NAME}`;
  } else {
    title = `${name}${cityName ? ` – ${cityName}` : ""} | ${SITE_NAME}`;
  }

  let metaDescription: string;
  const trimmed = input.description?.trim();
  if (trimmed && trimmed.length >= 60) {
    metaDescription = truncate(trimmed);
  } else if (type === "place") {
    metaDescription = truncate(
      `${name}, ${cityName || "Türkiye"} bölgesinde keşfedilmeyi bekleyen kültürel bir duraktır. Konum, ziyaret bilgileri ve daha fazlası ${SITE_NAME}'de.`
    );
  } else if (type === "city") {
    metaDescription = truncate(
      `${name} ilindeki müzeler, tarihi yerler, sanat mekanları ve kültürel duraklar. ${name} gezi rehberi ${SITE_NAME}'de.`
    );
  } else {
    metaDescription = truncate(
      `${name} etkinliği hakkında tarih, mekan ve bilet bilgileri. Kültür ve sanat gündemi ${SITE_NAME}'de.`
    );
  }

  return { meta_title: truncate(title, 70), meta_description: metaDescription };
}

/**
 * AI-enhanced meta with a deterministic fallback. Returns the template meta if
 * Gemini is unavailable or fails, so callers never need to handle errors.
 */
export async function generateMeta(input: MetaInput): Promise<MetaFields> {
  const template = buildTemplateMeta(input);

  if (!process.env.GEMINI_API_KEY) return template;

  try {
    const typeLabel =
      input.type === "place"
        ? "kültürel mekan"
        : input.type === "city"
          ? "şehir/il"
          : "kültür etkinliği";

    const result = await callGeminiJson<MetaFields>({
      systemPrompt: `Sen Türkiye odaklı kültür ve gezi sitesi ${SITE_NAME} için SEO editörüsün.
Verilen ${typeLabel} için özgün Türkçe meta başlık ve açıklama üret.
Kurallar:
- meta_title en fazla 65 karakter, sonunda " | ${SITE_NAME}"
- meta_description 150-160 karakter, davetkar ve bilgilendirici
- Yeme-içme reklam tonu yok; sanat, tarih, müze, kültür odağı
- Uydurma bilgi verme
Yanıt yalnızca geçerli JSON: {"meta_title":"...","meta_description":"..."}`,
      userPrompt: [
        `Tür: ${typeLabel}`,
        `Ad: ${input.name}`,
        input.cityName ? `Şehir: ${input.cityName}` : null,
        input.categoryLabel ? `Kategori: ${input.categoryLabel}` : null,
        input.description ? `Mevcut açıklama: ${input.description.slice(0, 800)}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      temperature: 0.4,
    });

    return {
      meta_title: truncate(result.meta_title || template.meta_title, 70),
      meta_description: truncate(
        result.meta_description || template.meta_description
      ),
    };
  } catch {
    return template;
  }
}
