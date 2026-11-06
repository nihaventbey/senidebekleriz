import { callGeminiText } from "@/lib/ai/gemini-client";

export type FormatHeadingsInput = {
  title?: string;
  content: string;
};

function isProbableSubheadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 10 || trimmed.length > 100) return false;
  if (/^#{1,3}\s+/.test(trimmed)) return true;
  if (/^["'“«][^"'”»]+["'”»]$/.test(trimmed)) return true;
  if (!/[.!?:;,]$/.test(trimmed)) {
    const words = trimmed.split(/\s+/).length;
    if (words >= 3 && words <= 14) return true;
  }
  return false;
}

function cleanHeadingLine(line: string): string {
  return line
    .replace(/^#{1,4}\s+/, "")
    .replace(/^["'“«]+|["'”»]+$/g, "")
    .trim();
}

export function formatHeadingsWithHeuristics(content: string, title?: string): string {
  const rawBlocks = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (rawBlocks.length <= 2) {
    return content.trim();
  }

  const result: string[] = [];
  let headingCount = 0;

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];

    // Already a heading
    if (/^#{1,3}\s+/.test(block)) {
      result.push(block);
      headingCount++;
      continue;
    }

    // First block is always the lead introductory paragraph (never a heading above it)
    if (i === 0) {
      result.push(block);
      continue;
    }

    // Check if this block looks like an inline section heading from source
    if (isProbableSubheadingLine(block)) {
      result.push(`## ${cleanHeadingLine(block)}`);
      headingCount++;
      continue;
    }

    // If text has many paragraphs and no headings have appeared after 3 paragraphs,
    // inject a thematic section divider if sensible
    if (headingCount === 0 && i === 2 && rawBlocks.length >= 4) {
      const topicWord = title ? `${title.slice(0, 45)} Detayları` : "Gelişmeler ve Program";
      result.push(`## ${topicWord}`);
      headingCount++;
    }

    result.push(block);
  }

  return result.join("\n\n").trim();
}

export async function formatHeadingsWithAi(input: FormatHeadingsInput): Promise<string> {
  const content = input.content.trim();
  if (!content) return "";

  const systemPrompt = `Sen Türkiye'nin saygın kültür-sanat gazetesi "Seni de Bekleriz"in kıdemli redaktörüsün.
GÖREV: Sana verilen haber metnini inceleyerek, metnin doğal akışına ve anlattığı temalara göre kurumsal, ilgi çekici ve anlamlı "## Alt Başlık" (Markdown H2) başlıkları eklemek ve paragrafları düzenlemektir.

KESİN EDİTÖRYAL KURALLAR:
1. METNİ ASLA KISALTMA VEYA SİLME: Orijinal metindeki hiçbir bilgiyi, alıntıyı, sanatçı/yetkili beyanını, tarihi veya somut veriyi silme, değiştirme veya özetleme! Metnin tamamını aynen koru.
2. GİRİŞ PARAGRAFI KURALI: Metnin ilk paragrafı giriş paragrafıdır. Giriş paragrafının üstüne ASLA başlık atma!
3. DOYURUCU ALT BAŞLIKLAR: Metni uzunluğuna göre 2 ila 4 adet anlamlı "## [Konuya Özgü Alt Başlık]" ile bölümlere ayır.
4. BAĞLAMSAL VE ÖZGÜN BAŞLIKLAR: Başlıklar o bölümde ne anlatılıyorsa onu tam yansıtmalıdır (Örn: "## 500 Bini Aşkın Seyirci Hedefi", "## Cüneyt Gökçer Sahnesi Kasımda Perdelerini Açıyor", "## Türkistan’dan Balkanlar’a Kültür Köprüsü: Geçit").
5. ŞABLON BAŞLIK YASAKTIR: "## Detaylar", "## Açıklamalar", "## Gelişmeler", "## Sonuç", "## Önemli Bilgiler" gibi generic/şablon başlıklar KESİNLİKLE yasaktır.
6. SADECE METİN DÖNDÜR: Yanıt olarak YALNIZCA biçimlendirilmiş Markdown metnini döndür. Açıklama, selamlama veya markdown kod bloğu (\`\`\`markdown) KULLANMA.`;

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
    });

    // Clean any accidental markdown code fences
    const cleaned = formatted
      .replace(/^```(?:markdown)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return cleaned || formatHeadingsWithHeuristics(content, input.title);
  } catch (err) {
    console.warn("formatHeadingsWithAi fallback triggered:", err instanceof Error ? err.message : err);
    return formatHeadingsWithHeuristics(content, input.title);
  }
}
