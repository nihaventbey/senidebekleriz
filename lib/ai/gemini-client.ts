type GeminiJsonRequest = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
};

const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
].filter((m, i, arr) => arr.indexOf(m) === i);

export async function callGeminiJson<T>({
  systemPrompt,
  userPrompt,
  temperature = 0.5,
  maxOutputTokens = 8192,
}: GeminiJsonRequest): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY tanımlı değil. .env.local dosyasına ekleyin."
    );
  }

  const baseUrl =
    process.env.GEMINI_API_BASE ||
    "https://generativelanguage.googleapis.com/v1beta";

  let lastError: Error | null = null;

  for (const model of FALLBACK_MODELS) {
    try {
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
            maxOutputTokens,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        // If high demand (503) or rate limit (429), try next model
        if (response.status === 503 || response.status === 429) {
          console.warn(`Gemini ${model} returned ${response.status}. Trying fallback model...`);
          lastError = new Error(`Gemini ${model} ${response.status}: ${body}`);
          continue;
        }
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

      let cleaned = raw.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();

      try {
        return JSON.parse(cleaned) as T;
      } catch (parseErr) {
        // Attempt to extract the first valid JSON object or array
        const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as T;
        }
        throw parseErr;
      }
    } catch (err: any) {
      lastError = err;
      if (err.message?.includes("503") || err.message?.includes("429")) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Gemini modelleri yanıt vermedi");
}

export async function callGeminiText({
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxOutputTokens = 8192,
}: GeminiJsonRequest): Promise<string> {
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
        maxOutputTokens,
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

  return raw.trim();
}
