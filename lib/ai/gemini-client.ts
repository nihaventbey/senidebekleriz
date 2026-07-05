type GeminiJsonRequest = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
};

export async function callGeminiJson<T>({
  systemPrompt,
  userPrompt,
  temperature = 0.5,
}: GeminiJsonRequest): Promise<T> {
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

  const url = `${baseUrl}/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature,
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

  return JSON.parse(raw) as T;
}
