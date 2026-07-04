type GenerateArticleInput = {
  topic: string;
  cityName?: string;
  type?: "guide" | "list" | "tips";
};

type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
  meta_description: string;
};

const SYSTEM_PROMPT = `Sen Türkiye odaklı bir seyahat editörüsün. Seni de Bekleriz sitesi için özgün Türkçe gezi rehberi yazıları üretiyorsun.
Kurallar:
- Markdown formatında yaz (## başlıklar, madde işaretleri, kısa paragraflar)
- En az 400 kelime
- Wikipedia'dan kopyalama; editoryal ve pratik bir ton kull
- Uydurma açılış saatleri/ücret verme; genel ipuçları kullan
- Sonunda "Editör Notu" bölümü ekle
Yanıtı yalnızca geçerli JSON olarak ver:
{"title":"...","excerpt":"...","meta_description":"...","content":"..."}`;

export async function generateArticleDraft(
  input: GenerateArticleInput
): Promise<GeneratedArticle> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY tanımlı değil. .env.local dosyasına ekleyin."
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const baseUrl =
    process.env.GEMINI_API_BASE ||
    "https://generativelanguage.googleapis.com/v1beta";

  const userPrompt = [
    `Konu: ${input.topic}`,
    input.cityName ? `Şehir: ${input.cityName}` : null,
    `Yazı türü: ${input.type || "guide"}`,
    "Türkiye kültür/tarih/sanat gezi rehberi sitesi için özgün bir yazı oluştur.",
  ]
    .filter(Boolean)
    .join("\n");

  const url = `${baseUrl}/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini isteği başarısız: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    error?: { message?: string };
  };

  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini yanıtı boş");

  const parsed = JSON.parse(raw) as GeneratedArticle;
  if (!parsed.title || !parsed.content) {
    throw new Error("Gemini yanıtı geçersiz");
  }

  return parsed;
}
