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

  // Never treat lines starting with punctuation, quotes, parens, or lowercase conjunctions as headings
  if (/^[,.;:!?\-–—•·()\[\]"“‘]/.test(trimmed)) return false;
  if (/^[a-zçğıöşü]/.test(trimmed)) return false;
  if (/^(ve|veya|ile|ancak|fakat|lakin|ama|çünkü|oysa|ayrıca|böylece)\b/i.test(trimmed)) {
    return false;
  }

  // Lines containing commas or semicolons are almost always sentence fragments or name lists
  if (/[,;]/.test(trimmed)) return false;

  // Never treat a line ending with sentence punctuation as a subheading
  if (/[.!?:;,…]$/.test(trimmed)) return false;

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
  if (words.length < 3 || words.length > 10) return false;

  // Avoid turning finite-verb narrative sentences into headings
  if (
    /\b(dedi|belirtti|söyledi|ifadelerini\s+kullandı|açıkladı|bildirdi|kaydetti|vurguladı|devam\s+etti|gösterdi|başladı|sona\s+erdi|katıldı|düzenlendi|açıldı|buluştu|ediyoruz|hedefliyoruz|oldu|yapıldı)\b/i.test(
      cleanedCandidate
    )
  ) {
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
    const nextBlock = rawBlocks[i + 1] || "";
    if (
      isProbableSubheadingLine(block, cleanArticleTitle) &&
      i < rawBlocks.length - 1 &&
      nextBlock.length >= 45 &&
      !/^#{1,3}\s+/.test(nextBlock)
    ) {
      const cleanedH = cleanHeadingLine(block);
      if (cleanedH.length >= 12) {
        result.push(`## ${cleanedH}`);
        continue;
      }
    }

    result.push(block);
  }

  return polishMarkdown(result.join("\n\n"), cleanArticleTitle);
}

export async function formatHeadingsWithAi(input: FormatHeadingsInput): Promise<string> {
  const content = input.content.trim();
  if (!content) return "";

  const systemPrompt = `Sen Türkiye'nin kültür-sanat yayını "Seni de Bekleriz"in kıdemli redaktörüsün.
GÖREV: Sana verilen haber/etkinlik metnini inceleyerek, metnin doğal akışına ve anlattığı temalara göre kurumsal, somut ve anlamlı 2-3 adet "## Alt Başlık" (Markdown H2) eklemek, sonundaki kaynak/yayıncı kalıntılarını temizlemek ve paragrafları düzenlemektir.

${CORPORATE_STYLE_GUIDE}

KESİN EDİTÖRYAL KURALLAR:
1. METNİ ASLA KIRPMA VEYA BİLGİ SİLME: Orijinal metindeki hiçbir doğrulanmış bilgiyi, alıntıyı, sanatçı/yetkili beyanını, tarihi veya somut veriyi silme. Metin 2.200 karakterin altında kaldıysa, uydurma tarih/saat/alıntı eklemeden yalnızca adı geçen kurum, müze veya kültürel bağlamla paragrafları dengeli ve doyurucu biçimde geliştir.
2. GİRİŞ PARAGRAFI KURALI: Metnin ilk paragrafı giriş paragrafıdır. Giriş paragrafının üstüne ASLA başlık atma.
3. BAĞLAMSAL VE ÖZGÜN ALT BAŞLIKLAR: Metni uzunluğuna göre 2 ila 3 adet anlamlı "## [Konuya Özgü Alt Başlık]" ile bölümlere ayır. Başlıklar o bölümde ne anlatılıyorsa onu tam yansıtmalıdır.
4. ŞABLON BAŞLIK VE KAYNAK KUYRUĞU YASAKTIR: "## Detaylar", "## Açıklamalar", "## Gelişmeler", "## Sonuç", "## Program Akışı ve Sanatsal Etkinlikler", "## Kültürel Bağlam ve Öne Çıkan Başlıklar", "## Kaynak ve Detaylar", "**Kaynak:**" veya haber sitesi adı/linki KESİNLİKLE yer almamalıdır.
5. SADECE METİN DÖNDÜR: Yanıt olarak YALNIZCA biçimlendirilmiş Markdown metnini döndür.`;

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
