const MIN_WORDS = 200;

export type EditorialCheck = {
  id: string;
  label: string;
  passed: boolean;
  hint?: string;
};

export type EditorialEvaluation = {
  wordCount: number;
  charCount: number;
  checks: EditorialCheck[];
  isReady: boolean;
};

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function evaluateEditorialContent(
  content: string,
  options?: { requirePracticalHint?: boolean }
): EditorialEvaluation {
  const trimmed = content.trim();
  const wordCount = countWords(trimmed);
  const charCount = trimmed.length;

  const hasPracticalHint =
    /(ücret|bilet|saat|ulaşım|otopark|giriş|ziyaret|ipucu|öneri|metro|otobüs|tramvay|yürüyüş|rehber)/i.test(
      trimmed
    );

  const checks: EditorialCheck[] = [
    {
      id: "length",
      label: `En az ${MIN_WORDS} kelime`,
      passed: wordCount >= MIN_WORDS,
      hint:
        wordCount >= MIN_WORDS
          ? undefined
          : `${MIN_WORDS - wordCount} kelime daha ekleyin`,
    },
    {
      id: "structure",
      label: "Başlık veya madde işaretli yapı",
      passed: /^#{1,3}\s/m.test(trimmed) || /^[-*]\s/m.test(trimmed),
      hint: "Markdown başlık (##) veya madde (-) kullanın",
    },
    {
      id: "practical",
      label: "En az bir pratik bilgi",
      passed: options?.requirePracticalHint === false ? true : hasPracticalHint,
      hint: "Ulaşım, ziyaret saati, bilet veya ipucu ekleyin",
    },
    {
      id: "unique",
      label: "Şablon cümle yok",
      passed: !/görülmeye değer bir mekandır\.?\s*$/i.test(trimmed),
      hint: "Varsayılan şablon metnini değiştirin",
    },
  ];

  return {
    wordCount,
    charCount,
    checks,
    isReady: checks.every((c) => c.passed),
  };
}

export function evaluatePlaceDescription(description: string): EditorialEvaluation {
  return evaluateEditorialContent(description, { requirePracticalHint: true });
}

export function evaluateArticleContent(content: string): EditorialEvaluation {
  return evaluateEditorialContent(content, { requirePracticalHint: true });
}
