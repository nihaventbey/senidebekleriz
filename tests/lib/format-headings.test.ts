import { describe, it, expect } from "vitest";
import { formatHeadingsWithHeuristics } from "@/lib/ai/format-headings";

describe("formatHeadingsWithHeuristics", () => {
  it("preserves content with <= 2 paragraphs without breaking", () => {
    const text = "İlk paragraf.\n\nİkinci paragraf.";
    expect(formatHeadingsWithHeuristics(text)).toBe(text);
  });

  it("converts probable subheading lines without punctuation into ## headings", () => {
    const content = [
      "Ankara Devlet Tiyatrosu yeni sezonda 15 yeni oyunun prömiyerini gerçekleştirecek.",
      "Müdür Sezai Yılmaz kurumun 500 bin seyirci hedefini açıkladı.",
      "Cüneyt Gökçer Sahnesi kasımda açılacak",
      "Tadilatı biten sahne perdelerini Edmond oyunuyla açmaya hazırlanıyor.",
      "Atatürk'ün gençliği Koza ile sahnede",
      "İrfan Kılınç yönetmenliğindeki oyun şubat ayında izleyicilerle buluşacak.",
    ].join("\n\n");

    const result = formatHeadingsWithHeuristics(content, "Ankara Devlet Tiyatrosu");
    expect(result).toContain("## Cüneyt Gökçer Sahnesi kasımda açılacak");
    expect(result).toContain("## Atatürk'ün gençliği Koza ile sahnede");
    // Introductory paragraph should not have a heading above it
    expect(result.startsWith("##")).toBe(false);
  });

  it("preserves already existing markdown headings", () => {
    const content = [
      "Giriş paragrafı burada yer alıyor.",
      "## Mevcut Bir Başlık",
      "Detay paragrafı burada yer alıyor.",
    ].join("\n\n");

    const result = formatHeadingsWithHeuristics(content);
    expect(result).toContain("## Mevcut Bir Başlık");
  });

  it("never turns comma-prefixed fragments, lowercase conjunctions, or duplicate titles into ## headings", () => {
    const title = "Dülük antik kenti uluslararası akademik gündeme taşındı";
    const content = [
      "Şehitkamil Belediyesi paydaşlığında düzenlenen kazı sonuçları toplantısı tamamlandı.",
      "## Dülük antik kenti uluslararası akademik gündeme taşındı",
      ", Gaziantep Vali Yardımcısı Bülent Uygur",
      "ile Türk Akademisi Başkanı Prof. Dr. Şahin Mustafayev",
      "Dülük antik kenti uluslararası akademik gündeme taşındı Aksiyon.com.TR",
      "Toplantıda antik kentin korunması ve arkeolojik bulguların uluslararası bilim dünyasına tanıtılması ele alındı.",
    ].join("\n\n");

    const result = formatHeadingsWithHeuristics(content, title);
    expect(result).not.toContain("## , Gaziantep");
    expect(result).not.toContain("## ile Türk Akademisi");
    expect(result).not.toContain("Aksiyon.com.TR");
    expect(result).not.toContain("günde Detayları");
  });
});
