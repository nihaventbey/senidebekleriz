/**
 * T.C. Kültür ve Turizm Bakanlığı MüzeKart Uyumluluk ve Bilgi Modülü
 */

// MüzeKart'ın geçerli olduğu bilinen anahtar kelimeler ve tescilli bakanlık yerleri
const MUZEKART_KEYWORDS = [
  "müze", "muze", "örenyeri", "antik kent", "harabe", "külliye", "saray", 
  "kale", "manastır", "anıt", "tümülüs", "höyük", "akropol", "nekropol"
];

const EXCLUDED_PRIVATE_PATTERNS = [
  "özel müze", "ozel muze", "koç müzesi", "sabancı müzesi", "modern sanat", "illüzyon", "balmumu"
];

export type MuzekartInfo = {
  isValid: boolean;
  badgeLabel: string;
  savingsText?: string;
  explanation: string;
};

export function checkMuzekartStatus(place: {
  name: string;
  description?: string | null;
  wikidata_id?: string | null;
  is_featured?: boolean | null;
}): MuzekartInfo {
  const lowerName = place.name.toLowerCase();
  const lowerDesc = (place.description || "").toLowerCase();

  // 1. Check exclusions (private commercial museums)
  const isExcluded = EXCLUDED_PRIVATE_PATTERNS.some(
    (p) => lowerName.includes(p) || lowerDesc.includes(p)
  );

  if (isExcluded) {
    return {
      isValid: false,
      badgeLabel: "Özel Gişe / Biletli",
      explanation: "Bu mekan özel veya bağımsız bir işletmeye aittir, standart T.C. Kültür ve Turizm Bakanlığı MüzeKart geçerli değildir.",
    };
  }

  // 2. Check if iconic heritage site or matching ministry patterns
  const matchesKeyword = MUZEKART_KEYWORDS.some(
    (kw) => lowerName.includes(kw) || lowerDesc.includes(kw)
  );

  const isValid = Boolean(place.is_featured || matchesKeyword || place.wikidata_id);

  if (isValid) {
    return {
      isValid: true,
      badgeLabel: "MüzeKart ile Ücretsiz",
      savingsText: "Standart bilet yerine MüzeKart ile 0 TL",
      explanation: "T.C. Kültür ve Turizm Bakanlığı'na bağlı bu kültürel mekanda MüzeKart geçerlidir. Kart sahipleri yıl boyunca ücretsiz ziyaret edebilir.",
    };
  }

  return {
    isValid: false,
    badgeLabel: "Serbest / Özel Giriş",
    explanation: "Bu mekan için resmi MüzeKart zorunluluğu bulunmamaktadır veya yerel koşullara tabidir.",
  };
}
