/**
 * Editoryal katman: kurumsal Türkçe yazım rehberi, tarih bağlamı ve
 * AI çıktısı için deterministik kalite denetimi.
 *
 * Haber, etkinlik ve rehber üreticileri aynı kuralları buradan paylaşır; böylece
 * istemler arasında çelişki (ör. bir istemde yasak olan şablon başlığın diğerinde
 * zorunlu tutulması) oluşmaz.
 */

import {
  cleanPublisherText,
  normalizeAllCapsWords,
  stripTrailingSourceAttribution,
} from "@/lib/ai/clean-publisher";

const TR_TIMEZONE = "Europe/Istanbul";

const TR_MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/** Türkiye saatine göre { year, month (0-11), day, weekday } döndürür. */
export function getIstanbulDateParts(now: Date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(now).split("-").map((n) => parseInt(n, 10));
  const weekday = new Intl.DateTimeFormat("tr-TR", {
    timeZone: TR_TIMEZONE,
    weekday: "long",
  }).format(now);
  return { year: y, month: m - 1, day: d, weekday };
}

export function formatTurkishDate(date: Date): string {
  const p = getIstanbulDateParts(date);
  return `${p.day} ${TR_MONTH_NAMES[p.month]} ${p.year}`;
}

/**
 * Modele "bugün" bilgisini verir. Bu olmadan model yılı bilmez; "18 Ekim" gibi
 * yılsız tarihleri, "dün açıldı" gibi göreli ifadeleri yanlış çözer.
 */
export function buildDateContext(input?: {
  now?: Date;
  sourcePublishedAt?: string | null;
}): string {
  const now = input?.now || new Date();
  const p = getIstanbulDateParts(now);
  const iso = `${p.year}-${String(p.month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  const lines = [
    `BUGÜNÜN TARİHİ: ${p.day} ${TR_MONTH_NAMES[p.month]} ${p.year}, ${p.weekday} (Türkiye saati, ISO: ${iso}).`,
  ];

  if (input?.sourcePublishedAt) {
    const pub = new Date(input.sourcePublishedAt);
    if (!Number.isNaN(pub.getTime())) {
      lines.push(
        `KAYNAĞIN YAYIN TARİHİ: ${formatTurkishDate(pub)}. Kaynaktaki "dün", "bugün", "geçen hafta", "bu akşam" gibi göreli ifadeleri bu tarihe göre mutlak tarihe çevir.`
      );
    }
  }

  lines.push(
    `Yılı belirtilmemiş tarihlerde, tarih bugünden 60 günden daha eskiye düşüyorsa bir sonraki yılı (${p.year + 1}) kullan; aksi halde ${p.year} yılını kullan.`
  );
  return lines.join("\n");
}

/**
 * Yılsız gün-ay ifadesi için yıl tahmini: bugünden 60 günden fazla geride
 * kalıyorsa (ör. Kasım'da "5 Ocak") bir sonraki yıl kabul edilir.
 */
export function inferEventYear(month: number, day: number, now: Date = new Date()): number {
  const p = getIstanbulDateParts(now);
  const today = Date.UTC(p.year, p.month, p.day);
  const candidate = Date.UTC(p.year, month, day);
  const diffDays = (candidate - today) / 86_400_000;
  return diffDays < -60 ? p.year + 1 : p.year;
}

export const CORPORATE_STYLE_GUIDE = `KURUMSAL YAZIM REHBERİ (Seni de Bekleriz Yayın İlkeleri)
1. Dil ve ton: Nesnel, üçüncü tekil şahıs haber dili. "Biz", "siz", "sizleri bekliyor", "kaçırmayın" gibi hitaplar, ünlem işareti ve reklam dili kullanılmaz.
2. Doğruluk: Yalnızca kaynakta yer alan bilgiler kullanılır. Kaynakta olmayan kişi, tarih, sayı, unvan, alıntı, mekân özelliği veya ulaşım bilgisi UYDURULMAZ. Bilgi eksikse o konu hiç yazılmaz; "bilgi verilmedi" gibi dolgu cümleleri kurulmaz.
3. Alıntılar: Yalnızca kaynakta geçen ifadeler, tırnak içinde ve konuşanın adı-unvanıyla birlikte aktarılır. Kaynakta alıntı yoksa alıntı üretilmez.
4. Özel adlar: Kurum ve kişi adları ilk geçişte tam ve unvanıyla yazılır (ör. "Kültür ve Turizm Bakanlığı", "Kazı Başkanı Doç. Dr. ..."); sonraki geçişlerde kısaltılabilir.
5. Yazım (TDK): Tarihler "15 Kasım 2026", saatler "20.30" biçiminde; bağlaç olan "de/da" ve soru eki "mi" ayrı yazılır; özel adlara gelen ekler kesme işaretiyle ayrılır (İstanbul'da, AKM'de); oranlar metin içinde "yüzde 25" biçiminde yazılır.
6. Cümle yapısı: Cümleler ortalama 15-25 kelime, tek ana bilgi taşır. Aynı bilgi farklı cümlelerle tekrarlanmaz; paragraflar birbirinin özeti olmaz.
7. Değer yargısı: "muhteşem", "eşsiz", "büyüleyici", "benzersiz", "göz kamaştırıcı" gibi övgü sıfatları ve "adeta zaman yolculuğu", "unutulmaz bir deneyim", "nefes kesen" gibi klişeler kullanılmaz. Önem vurgusu somut veriyle (yaş, boyut, ilk olma, ziyaretçi sayısı) yapılır.
8. Kapanış: Metin "Sonuç olarak", "Özetle", "Unutmamak gerekir ki" gibi kalıplarla bitirilmez; son paragraf da bilgi taşır.
9. Kaynak atfı: Ajans dateline'ı ("İSTANBUL (AA) -") ve "muhabirine konuşan" kalıpları kullanılmaz. Gerektiğinde bilginin sahibi kurum açıkça belirtilir ("Bakanlıktan yapılan açıklamaya göre").
10. Biçim: Yalnızca Markdown paragraf ve "## " alt başlık kullanılır; H1 (#), HTML, kalın yazı ile başlık taklidi, madde imli dolgu listeleri ve emoji kullanılmaz.`;

/** Kalıp/şablon alt başlıklar — hiçbir üreticide kullanılmamalı. */
export const TEMPLATE_HEADING_PATTERNS: RegExp[] = [
  /^(detaylar|gelişmeler|sonuç|özet|tarihçe|giriş|açıklamalar|önemli bilgiler|genel bilgiler)$/i,
  /^kaynak(lar|ça)?( ve (açıklamalar|detaylar))?$/i,
  /^kaynak ve detaylar$/i,
  /^program ve katılım/i,
  /^program akışı ve sanatsal etkinlikler$/i,
  /^kültürel bağlam ve öne çıkan başlıklar$/i,
  /^sergi seçkisi ve ziyaret bilgileri$/i,
  /^arkeolojik bulgular ve bilimsel inceleme$/i,
  /^restorasyon süreci ve mimari koruma$/i,
  /^etkinlik ve sahne detayları$/i,
  /^sanatçılar ve kadro$/i,
  /^mekân? ve katılım rehberi$/i,
  /^editör notu/i,
  /^(?:[a-zçğıöşü\s]{0,30}\s+)?hakkında merak edilenler$/i,
  /^(?:adayların\s+)?merak ettiği sorular$/i,
  /^merak edilenler$/i,
  /^(?:sergi\s+|bienal\s+)?(?:ziyaretçiler|katılımcılar) için pratik bilgiler$/i,
  /detayları$/i,
  /^gelişmeler ve /i,
];

export const CLICHE_PATTERNS: RegExp[] = [
  /\badeta\b/i,
  /büyüleyici/i,
  /göz kamaştır/i,
  /unutulmaz bir (deneyim|akşam|gece|yolculuk)/i,
  /zaman yolculuğu/i,
  /nefes kesen/i,
  /\beşsiz bir\b/i,
  /kaçırılmaması gereken/i,
  /kaçırmayın/i,
  /sizleri bekliyor/i,
  /dört gözle/i,
  /hiç şüphesiz/i,
  /\bsonuç olarak\b/i,
  /\bözetle\b/i,
  /unutmamak gerekir/i,
  /muhteşem/i,
  /büyülü bir/i,
  /ruhunu (yansıt|taşı)/i,
];

const AGENCY_IN_TITLE = /\b(AA|İHA|IHA|DHA|ANKA|Anadolu Ajansı|Reuters|AFP|Hürriyet|Sabah|Milliyet|Sözcü|Habertürk)\b/;
const PLACEHOLDER_PATTERN = /(\[[^\]]{2,40}\]\(?(?!http)|lorem ipsum|XXX|\{\{|\bTODO\b|\[(şehir|tarih|isim|mekan|mekân)\])/i;

export function countWords(text: string): number {
  return (text || "").split(/\s+/).filter(Boolean).length;
}

function normalizeForShingles(text: string): string[] {
  return (text || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[#*_>`"'“”‘’«»()\[\]]/g, " ")
    .replace(/[^a-z0-9çğıöşüâîû\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * İçeriğin kaynaktan birebir kopyalanma oranı (6 kelimelik dizilerin örtüşmesi).
 * 0 = tamamen özgün, 1 = tamamen kopya.
 */
export function measureCopyRatio(content: string, source: string, n = 6): number {
  const c = normalizeForShingles(content);
  const s = normalizeForShingles(source);
  if (c.length < n || s.length < n) return 0;
  const sourceSet = new Set<string>();
  for (let i = 0; i <= s.length - n; i++) sourceSet.add(s.slice(i, i + n).join(" "));
  let total = 0;
  let shared = 0;
  for (let i = 0; i <= c.length - n; i++) {
    total += 1;
    if (sourceSet.has(c.slice(i, i + n).join(" "))) shared += 1;
  }
  return total === 0 ? 0 : shared / total;
}

/**
 * Kaynak metnin zenginliğine göre Google SEO ve Türk okuru için hedef uzunluk.
 * Kaynak kısa olsa bile taban hedef en az 360 kelime (~2.600 karakter) tutulur.
 */
export function resolveTargetLength(
  requested: { min: number; max: number },
  sourceWordCount: number
): { min: number; max: number; thinSource: boolean } {
  const safeFloorMin = requested.min < 300 ? requested.min : 360;
  if (sourceWordCount < 150) {
    return {
      min: Math.max(safeFloorMin, Math.min(380, requested.min)),
      max: Math.max(520, Math.min(560, requested.max)),
      thinSource: true,
    };
  }
  if (sourceWordCount < 300) {
    return {
      min: Math.max(safeFloorMin, Math.min(420, requested.min)),
      max: Math.max(560, Math.min(620, requested.max)),
      thinSource: true,
    };
  }
  const cap = Math.max(550, Math.round(sourceWordCount * 1.5));
  return {
    min: Math.max(safeFloorMin, Math.min(requested.min, Math.round(cap * 0.75))),
    max: Math.min(requested.max, Math.max(600, cap)),
    thinSource: false,
  };
}

const NARRATIVE_HEADING_VERB_REGEX =
  /\b(dedi|belirtti|söyledi|devam\s+etti|gösterdi|ediyoruz|hedefliyoruz|şöyle\s+konuştu|bulundu|açıkladı|katıldı|sona\s+erdi|başladı|açıldı|yapıldı|planlıyoruz)\b/i;

function normalizeTitleComparisonKey(text: string): string {
  return (text || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9çğıöşü]/g, "");
}

/** Model çıktısındaki biçim kusurlarını deterministik olarak düzeltir. */
export function polishMarkdown(
  md: string,
  title?: string,
  sourceName?: string
): string {
  if (!md) return "";
  let out = md
    .replace(/\r\n/g, "\n")
    // Strip WordPress / HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Convert block/break HTML tags into Markdown newlines before stripping remaining HTML
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|li|h[1-6]|blockquote)>/gi, "\n\n")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<\/?[a-z][a-z0-9-]*(?:\s+[^>]*)?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rdquo;/gi, "”")
    .replace(/&ldquo;/gi, "“")
    .replace(/&hellip;/gi, "…")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : "";
    });

  // Başlığın içerikte H1 / ilk satır olarak tekrarlanması
  out = out.replace(/^\s*#\s+[^\n]+\n+/, (m) => {
    if (!title) return "";
    return m.toLocaleLowerCase("tr-TR").includes(title.slice(0, 20).toLocaleLowerCase("tr-TR")) ? "" : m;
  });
  // Kalan H1 ve H4+ başlıkları H2/H3'e çek
  out = out.replace(/^#[ \t]+/gm, "## ").replace(/^#{4,6}[ \t]+/gm, "### ");
  // "**Başlık**" tek satırlık kalın başlık taklidini H2'ye çevir
  out = out.replace(/^\*\*([^*\n]{6,90})\*\*[ \t]*$/gm, "## $1");
  // Başlık içindeki kalın işaretleri ve sondaki iki noktayı temizle (satır sonu \n korunmalı!)
  out = out.replace(/^(#{2,3})[ \t]+\**([^*\n:]+?):?\**:?[ \t]*$/gm, "$1 $2");
  // Ajans dateline'ı ile başlayan paragraflar
  out = out.replace(
    /^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\s]{1,24}\s*\((AA|İHA|IHA|DHA|ANKA)\)\s*[-–—:]+\s*/gm,
    ""
  );

  // First demote narrative-sentence headings so they are not treated as orphan headings
  const normTitle = title ? normalizeTitleComparisonKey(cleanPublisherText(title)) : "";
  const blocks = out.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const b of blocks) {
    const hMatch = b.match(/^(#{2,3})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1];
      const rawH = hMatch[2].replace(/\*\*/g, "").replace(/:+\s*$/, "").trim();
      const cleanedH = normalizeAllCapsWords(cleanPublisherText(rawH));
      const normH = normalizeTitleComparisonKey(cleanedH);

      // Drop template headings, tiny stubs, or headings repeating the article title
      if (
        !cleanedH ||
        cleanedH.length < 8 ||
        TEMPLATE_HEADING_PATTERNS.some((p) => p.test(cleanedH)) ||
        (normTitle.length >= 16 && (normH === normTitle || normH.includes(normTitle)))
      ) {
        continue;
      }

      // If an HTML heading tag captured a narrative sentence or quote, demote it to a normal paragraph
      if (
        /[.…?!]$/.test(cleanedH) ||
        /^["“‘(\[]/.test(cleanedH) ||
        NARRATIVE_HEADING_VERB_REGEX.test(cleanedH) ||
        cleanedH.length > 95
      ) {
        const key = cleanedH.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").slice(0, 160);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(cleanedH);
        }
        continue;
      }

      // Never place a heading before the introductory lead paragraph
      if (unique.length === 0) {
        continue;
      }

      // Collapse consecutive headings by keeping the more specific latest heading
      if (/^#{2,3}\s/.test(unique[unique.length - 1])) {
        unique.pop();
      }

      unique.push(`${level} ${cleanedH}`);
      continue;
    }

    const key = b.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").slice(0, 160);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(b);
  }

  // Sonda başlık kalmışsa (altı boş) at
  while (unique.length > 0 && /^#{2,3}\s/.test(unique[unique.length - 1])) unique.pop();

  const joined = unique.join("\n\n").replace(/[ \t]+\n/g, "\n").trim();
  return stripTrailingSourceAttribution(joined, title, sourceName);
}

export type QualityIssue = {
  code: string;
  severity: "critical" | "minor";
  message: string;
};

export type QualityReport = {
  score: number;
  passed: boolean;
  wordCount: number;
  copyRatio: number;
  issues: QualityIssue[];
};

function headingTexts(md: string): string[] {
  return Array.from(md.matchAll(/^#{2,3}\s+(.+)$/gm)).map((m) => m[1].trim());
}

function buildReport(issues: QualityIssue[], wordCount: number, copyRatio: number): QualityReport {
  const penalty = issues.reduce((acc, i) => acc + (i.severity === "critical" ? 25 : 8), 0);
  const score = Math.max(0, 100 - penalty);
  return {
    score,
    passed: !issues.some((i) => i.severity === "critical") && score >= 60,
    wordCount,
    copyRatio: Math.round(copyRatio * 100) / 100,
    issues,
  };
}

function commonTextIssues(content: string, sourceText: string | undefined): {
  issues: QualityIssue[];
  copyRatio: number;
} {
  const issues: QualityIssue[] = [];

  const clicheHits = CLICHE_PATTERNS.filter((p) => p.test(content)).length;
  if (clicheHits >= 3) {
    issues.push({ code: "cliches", severity: "critical", message: `${clicheHits} adet klişe/övgü kalıbı kullanılmış` });
  } else if (clicheHits > 0) {
    issues.push({ code: "cliches", severity: "minor", message: `${clicheHits} adet klişe/övgü kalıbı kullanılmış` });
  }

  const templateHeadings = headingTexts(content).filter((h) =>
    TEMPLATE_HEADING_PATTERNS.some((p) => p.test(h))
  );
  if (templateHeadings.length > 0) {
    issues.push({
      code: "template_headings",
      severity: "critical",
      message: `Şablon alt başlık: ${templateHeadings.map((h) => `"${h}"`).join(", ")}`,
    });
  }

  if (/<\/?[a-z][^>]*>/i.test(content)) {
    issues.push({ code: "raw_html", severity: "minor", message: "Metinde ham HTML etiketi var" });
  }
  if (PLACEHOLDER_PATTERN.test(content)) {
    issues.push({ code: "placeholder", severity: "critical", message: "Metinde doldurulmamış yer tutucu var" });
  }
  // Alıntı dışındaki ünlemler reklam dilidir
  const withoutQuotes = content.replace(/[“"][^”"]{0,300}[”"]/g, " ");
  if (/[a-zçğıöşü0-9]!(\s|$)/i.test(withoutQuotes)) {
    issues.push({ code: "exclamation", severity: "minor", message: "Ünlem işareti kullanılmış (reklam dili)" });
  }

  const copyRatio = sourceText ? measureCopyRatio(content, sourceText) : 0;
  if (copyRatio > 0.45) {
    issues.push({
      code: "copied",
      severity: "critical",
      message: `Metnin %${Math.round(copyRatio * 100)}'i kaynaktan birebir kopya`,
    });
  } else if (copyRatio > 0.25) {
    issues.push({
      code: "copied",
      severity: "minor",
      message: `Metnin %${Math.round(copyRatio * 100)}'i kaynakla birebir örtüşüyor`,
    });
  }

  return { issues, copyRatio };
}

export function assessNewsDraft(
  draft: { title: string; summary: string; content: string },
  opts: { sourceText?: string; minWords: number }
): QualityReport {
  const title = (draft.title || "").trim();
  const summary = (draft.summary || "").trim();
  const content = draft.content || "";
  const wordCount = countWords(content);
  const { issues, copyRatio } = commonTextIssues(content, opts.sourceText);

  if (title.length < 35 || title.length > 72) {
    issues.push({ code: "title_length", severity: "minor", message: `Başlık ${title.length} karakter (hedef 40-65)` });
  }
  if (AGENCY_IN_TITLE.test(title)) {
    issues.push({ code: "title_agency", severity: "critical", message: "Başlıkta ajans/yayın adı var" });
  }
  if (/\?\s*$/.test(title) || /!\s*$/.test(title)) {
    issues.push({ code: "title_clickbait", severity: "minor", message: "Başlık soru/ünlem ile bitiyor" });
  }
  if (summary.length < 110) {
    issues.push({ code: "summary_short", severity: "minor", message: `Spot ${summary.length} karakter (hedef 130-190)` });
  } else if (summary.length > 210) {
    issues.push({ code: "summary_long", severity: "minor", message: `Spot ${summary.length} karakter (hedef 130-190)` });
  }
  if (summary && !/[.…]$/.test(summary)) {
    issues.push({ code: "summary_punct", severity: "minor", message: "Spot nokta ile bitmiyor" });
  }
  if (wordCount < Math.round(opts.minWords * 0.7)) {
    issues.push({
      code: "too_short",
      severity: "critical",
      message: `Metin ${wordCount} kelime (en az ${opts.minWords} bekleniyor)`,
    });
  } else if (wordCount < opts.minWords) {
    issues.push({ code: "short", severity: "minor", message: `Metin ${wordCount} kelime (hedef en az ${opts.minWords})` });
  }
  if (opts.minWords >= 250 && content.length < 2200) {
    issues.push({
      code: "chars_too_short",
      severity: content.length < 1600 ? "critical" : "minor",
      message: `Metin ${content.length} karakter (hedef 2.600-4.200 karakter)`,
    });
  }
  const headings = headingTexts(content);
  if (wordCount >= 320 && headings.length < 2) {
    issues.push({ code: "few_headings", severity: "minor", message: `Yalnızca ${headings.length} alt başlık var` });
  }
  if (/^#{1,3}\s/.test(content.trim())) {
    issues.push({ code: "no_lead", severity: "critical", message: "Metin giriş paragrafı yerine başlıkla başlıyor" });
  }
  if (summary && content.includes(summary.slice(0, 120)) && summary.length > 80) {
    issues.push({ code: "lead_equals_summary", severity: "minor", message: "Giriş paragrafı spotun birebir kopyası" });
  }

  return buildReport(issues, wordCount, copyRatio);
}

export function assessEventDraft(
  draft: {
    title: string;
    summary?: string | null;
    description?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    city_slug?: string | null;
  },
  opts: { sourceText?: string; now?: Date } = {}
): QualityReport {
  const description = draft.description || "";
  const wordCount = countWords(description);
  const { issues, copyRatio } = commonTextIssues(description, opts.sourceText);
  const now = (opts.now || new Date()).getTime();

  if (!draft.starts_at && !draft.ends_at) {
    issues.push({ code: "no_date", severity: "critical", message: "Etkinlik tarihi tespit edilemedi" });
  } else {
    const end = new Date(draft.ends_at || draft.starts_at || "").getTime();
    if (!Number.isNaN(end) && end < now - 12 * 3_600_000) {
      issues.push({ code: "past_event", severity: "critical", message: "Etkinlik tarihi geçmiş" });
    }
  }
  if (!draft.city_slug) {
    issues.push({ code: "no_city", severity: "minor", message: "Şehir tespit edilemedi" });
  }
  if (wordCount < 60) {
    issues.push({ code: "thin_description", severity: "minor", message: `Açıklama ${wordCount} kelime` });
  }
  if (!draft.summary || draft.summary.trim().length < 50) {
    issues.push({ code: "summary_short", severity: "minor", message: "Özet çok kısa" });
  }

  return buildReport(issues, wordCount, copyRatio);
}

export function formatIssuesForRevision(report: QualityReport): string {
  return report.issues.map((i) => `- ${i.message}`).join("\n");
}
