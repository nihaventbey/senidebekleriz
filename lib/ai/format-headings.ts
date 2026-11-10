import { callGeminiText } from "@/lib/ai/gemini-client";
import { cleanPublisherText } from "@/lib/ai/clean-publisher";
import { CORPORATE_STYLE_GUIDE, polishMarkdown } from "@/lib/ai/editorial";

export type FormatHeadingsInput = {
  title?: string;
  content: string;
};

function isProbableSubheadingLine(line: string, articleTitle?: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 12 || trimmed.length > 88) return false;
  if (/^#{1,3}\s+/.test(trimmed)) return true;

  // Never treat lines starting with punctuation, numbers+punctuation, or lowercase conjunctions as headings
  if (/^[,.;:!?\-–—•·()\[\]]/.test(trimmed)) return false;
  if (/^[a-zçğıöşü]/.test(trimmed)) return false;
  if (/^(ve|veya|ile|ancak|fakat|lakin|ama|çünkü|oysa|ayrıca|böylece)\b/i.test(trimmed)) {
    return false;
  }

  // Lines containing commas or semicolons are almost always sentence fragments or name lists
  if (/[,;]/.test(trimmed)) return false;

  // Never treat a line ending with sentence punctuation as a subheading
  if (/[.!?:;,]$/.test(trimmed)) return false;

  // Exclude lines that repeat the article title or end with publisher/domain suffixes
  const cleanedCandidate = cleanPublisherText(trimmed);
  if (!cleanedCandidate || cleanedCandidate.length < 12) return false;
  if (articleTitle) {
    const normCand = cleanedCandidate.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]/g, "");
    const normTitle = cleanPublisherText(articleTitle)
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9çğıöşü]/g, "");
    if (normCand && normTitle && (normCand === normTitle || normCand.includes(normTitle))) {
      return false;
    }
  }

  const words = cleanedCandidate.split(/\s+/).filter(Boolean);
  if (words.length < 3 || words.length > 11) return false;

  // Avoid turning finite-verb narrative sentences ("... dedi", "... belirtti", "... söyledi", "... oldu") into headings
  if (/\b(dedi|belirtti|söyledi|ifadelerini kullandı|açıkladı|bildirdi|kaydetti|vurguladı)\b$/i.test(cleanedCandidate)) {
    return false;
  }

  return true;
}

function cleanHeadingLine(line: string): string {
  const raw = line
    .replace(/^#{1,4}\s+/, "")
    .replace(/^["'“«]+|["'”»]+$/g, "")
    .replace(/:+\s*$/, "")
    .trim();
  return cleanPublisherText(raw);
}

/**
 * Derives a clean, whole-word contextual subheading from a paragraph when
 * a multi-paragraph fallback article has no headings at all.
 */
function deriveContextualSubheading(paragraph: string, fallbackTitle?: string): string {
  const lower = `${paragraph} ${fallbackTitle || ""}`.toLocaleLowerCase("tr-TR");
  if (/(kazı|arkeolo|buluntu|mozaik|antik kent|höyük|lahit|sikke)/.test(lower)) {
    return "Arkeolojik Bulgular ve Bilimsel İnceleme";
  }
  if (/(restorasyon|konservasyon|onarım|ihya|mimari|rölöve)/.test(lower)) {
    return "Restorasyon Süreci ve Mimari Koruma";
  }
  if (/(sergi|küratör|koleksiyon|müze|ziyaretçi|eser)/.test(lower)) {
    return "Sergi Seçkisi ve Ziyaret Bilgileri";
  }
  if (/(festival|konser|sahne|tiyatro|orkestra|bilet|sezon)/.test(lower)) {
    return "Program Akışı ve Sanatsal Etkinlikler";
  }
  return "Kültürel Bağlam ve Öne Çıkan Başlıklar";
}

export function formatHeadingsWithHeuristics(content: string, title?: string): string {
  const rawBlocks = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (rawBlocks.length <= 2) {
    return polishMarkdown(content.trim(), title);
  }

  const cleanArticleTitle = title ? cleanPublisherText(title) : undefined;
  const normTitle = cleanArticleTitle
    ? cleanArticleTitle.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]/g, "")
    : "";

  const result: string[] = [];
  let headingCount = 0;

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];

    // Already a heading
    if (/^#{1,3}\s+/.test(block)) {
      const cleanedH = cleanHeadingLine(block);
      const normH = cleanedH.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]/g, "");
      // Drop headings that just repeat the main title or are comma-prefixed fragments
      if (
        !cleanedH ||
        cleanedH.length < 10 ||
        /^[,.;:\-–—]/.test(cleanedH) ||
        (normTitle && (normH === normTitle || normH.includes(normTitle)))
      ) {
        continue;
      }
      // Never allow a heading before the lead paragraph
      if (result.length === 0) {
        continue;
      }
      result.push(`## ${cleanedH}`);
      headingCount++;
      continue;
    }

    // First block is always the lead introductory paragraph (never a heading above it)
    if (result.length === 0) {
      result.push(block);
      continue;
    }

    // Drop trailing lines that merely repeat the article title + publisher name
    if (normTitle) {
      const cleanedBlock = cleanPublisherText(block);
      const normBlock = cleanedBlock
        .toLocaleLowerCase("tr-TR")
        .replace(/[^a-z0-9çğıöşü]/g, "");
      if (normBlock === normTitle) {
        continue;
      }
    }

    // Check if this block looks like an inline section heading from source
    if (isProbableSubheadingLine(block, cleanArticleTitle) && i < rawBlocks.length - 1) {
      const cleanedH = cleanHeadingLine(block);
      if (cleanedH.length >= 12) {
        result.push(`## ${cleanedH}`);
        headingCount++;
        continue;
      }
    }

    // If text has many paragraphs and no headings have appeared after 2 paragraphs,
    // inject a natural, whole-word contextual section heading
    if (headingCount === 0 && result.length === 2 && rawBlocks.length >= 4) {
      result.push(`## ${deriveContextualSubheading(block, cleanArticleTitle)}`);
      headingCount++;
    }

    result.push(block);
  }

  return polishMarkdown(result.join("\n\n"), cleanArticleTitle);
}

export async function formatHeadingsWithAi(input: FormatHeadingsInput): Promise<string> {
  const content = input.content.trim();
  if (!content) return "";

  const systemPrompt = `Sen Türkiye'nin kültür-sanat yayını "Seni de Bekleriz"in kıdemli redaktörüsün.
GÖREV: Sana verilen haber metnini inceleyerek, metnin doğal akışına ve anlattığı temalara göre kurumsal, somut ve anlamlı "## Alt Başlık" (Markdown H2) başlıkları eklemek ve paragrafları düzenlemektir.

${CORPORATE_STYLE_GUIDE}

KESİN EDİTÖRYAL KURALLAR:
1. METNİ ASLA KISALTMA VEYA SİLME: Orijinal metindeki hiçbir bilgiyi, alıntıyı, sanatçı/yetkili beyanını, tarihi veya somut veriyi silme, değiştirme veya özetleme. Metnin tamamını koru.
2. GİRİŞ PARAGRAFI KURALI: Metnin ilk paragrafı giriş paragrafıdır. Giriş paragrafının üstüne ASLA başlık atma.
3. DOYURUCU ALT BAŞLIKLAR: Metni uzunluğuna göre 2 ila 4 adet anlamlı "## [Konuya Özgü Alt Başlık]" ile bölümlere ayır.
4. BAĞLAMSAL VE ÖZGÜN BAŞLIKLAR: Başlıklar o bölümde ne anlatılıyorsa onu tam yansıtmalıdır (Örn: "## 500 Bini Aşkın Seyirci Hedefi", "## Cüneyt Gökçer Sahnesi Kasımda Perdelerini Açıyor").
5. ŞABLON BAŞLIK YASAKTIR: "## Detaylar", "## Açıklamalar", "## Gelişmeler", "## Sonuç", "## Önemli Bilgiler" gibi şablon başlıklar veya ana haber başlığının tekrarı KESİNLİKLE yasaktır.
6. SADECE METİN DÖNDÜR: Yanıt olarak YALNIZCA biçimlendirilmiş Markdown metnini döndür.`;

  const userPrompt = [
    input.title ? `Haber Başlığı: ${input.title}` : null,
    `Düzenlenecek Haber Metni:\n\n${content}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const formatted = await callGeminiText({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      maxOutputTokens: 8192,
      thinking: "minimal",
    });

    const cleaned = polishMarkdown(formatted, input.title);
    return cleaned || formatHeadingsWithHeuristics(content, input.title);
  } catch (err) {
    console.warn("formatHeadingsWithAi fallback triggered:", err instanceof Error ? err.message : err);
    return formatHeadingsWithHeuristics(content, input.title);
  }
}
