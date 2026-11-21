import { callGeminiJson } from "@/lib/ai/gemini-client";
import { formatSeoDescription, formatSeoTitle, SEO_LIMITS } from "@/lib/seo/metadata";

const SITE_NAME = "Seni de Bekleriz";

export type MetaFields = {
  meta_title: string;
  meta_description: string;
};

export type MetaEntityType = "place" | "city" | "event" | "article" | "news";

type MetaInput = {
  type: MetaEntityType;
  name: string;
  cityName?: string;
  description?: string | null;
  categoryLabel?: string | null;
};

/** Deterministic template meta — no external calls, always safe. */
export function buildTemplateMeta(input: MetaInput): MetaFields {
  const { type, name, cityName, categoryLabel } = input;

  let title: string;
  if (type === "place") {
    const suffix = categoryLabel ? ` ${categoryLabel}` : "";
    title = `${name}${cityName ? ` – ${cityName}` : ""}${suffix}`;
  } else if (type === "city") {
    title = `${name} Kültür, Sanat ve Etkinlik Ajandası`;
  } else if (type === "event") {
    title = `${name}${cityName ? ` – ${cityName}` : ""}`;
  } else {
    title = name;
  }

  let metaDescription: string;
  const trimmed = input.description?.trim();
  if (trimmed && trimmed.length >= 60) {
    metaDescription = trimmed;
  } else if (type === "place") {
    metaDescription = `${name}, ${cityName || "Türkiye"} bölgesinde keşfedilmeyi bekleyen kültürel bir duraktır. Konum, ziyaret bilgileri ve daha fazlası ${SITE_NAME}'de.`;
  } else if (type === "city") {
    metaDescription = `${name} ilindeki müzeler, tarihi yerler, sanat mekanları, güncel etkinlikler ve gezi rehberi ${SITE_NAME}'de.`;
  } else if (type === "article") {
    metaDescription = `${name} hakkında kültürel miras, tarih, mimari ve pratik ziyaret rehberi ${SITE_NAME}'de.`;
  } else if (type === "news") {
    metaDescription = `${name} — Türkiye kültür ve sanat gündeminden güncel gelişmeler ${SITE_NAME}'de.`;
  } else {
    metaDescription = `${name} etkinliği hakkında tarih, mekân ve bilet bilgileri. Kültür ve sanat gündemi ${SITE_NAME}'de.`;
  }

  return {
    meta_title: formatSeoTitle(title, SEO_LIMITS.metaTitle.max),
    meta_description: formatSeoDescription(
      metaDescription,
      SEO_LIMITS.metaDescription.max
    ),
  };
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
          : input.type === "article"
            ? "kültür ve gezi rehberi"
            : input.type === "news"
              ? "kültür ve sanat haberi"
              : "kültür etkinliği";

    const result = await callGeminiJson<MetaFields>({
      systemPrompt: `Sen Türkiye odaklı kültür ve gezi sitesi ${SITE_NAME} için SEO editörüsün.
Verilen ${typeLabel} için özgün Türkçe meta başlık ve açıklama üret.
Kurallar:
- meta_title: 35-55 karakter arası. Sonuna marka veya site adı ("| ${SITE_NAME}", "| Etkinlik Takvimi") KESİNLİKLE EKLEME (şablon otomatik ekler) ve kelimeyi ortasından kesme.
- meta_description: 125-155 karakter arası, tam cümleyle biten davetkâr ve bilgilendirici açıklama.
- Yeme-içme reklam tonu yok; sanat, tarih, müze, kültür odağı.
- Uydurma bilgi verme.
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
      meta_title: formatSeoTitle(
        result.meta_title || template.meta_title,
        SEO_LIMITS.metaTitle.max
      ),
      meta_description: formatSeoDescription(
        result.meta_description || template.meta_description,
        SEO_LIMITS.metaDescription.max
      ),
    };
  } catch {
    return template;
  }
}
