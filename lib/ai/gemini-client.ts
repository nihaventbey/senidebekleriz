type GeminiJsonRequest = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
};

// Track models that recently hit 429 (quota) or 503/timeout so subsequent calls skip them immediately
const modelCooldownUntil = new Map<string, number>();

function markModelCooldown(model: string, durationMs: number) {
  modelCooldownUntil.set(model, Date.now() + durationMs);
}

function getCandidateModels(): string[] {
  const envModel = process.env.GEMINI_MODEL?.trim();
  const isDeprecatedEnvModel =
    !envModel || /^gemini-(1\.|2\.)/i.test(envModel);

  const rawModels = [
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    isDeprecatedEnvModel ? "gemini-3.5-flash" : envModel,
  ];

  const unique = rawModels.filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);
  const now = Date.now();
  const active = unique.filter((m) => (modelCooldownUntil.get(m) || 0) <= now);
  const cooled = unique.filter((m) => (modelCooldownUntil.get(m) || 0) > now);
  return [...active, ...cooled];
}

function buildGenerationConfig(
  model: string,
  temperature: number,
  maxOutputTokens: number,
  jsonMode: boolean
) {
  const supportsZeroThinking =
    (model.includes("3-flash") ||
      model.includes("3.5-flash") ||
      model.includes("3.6-flash")) &&
    !model.includes("lite");

  return {
    temperature,
    maxOutputTokens,
    ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    ...(supportsZeroThinking
      ? { thinkingConfig: { thinkingBudget: 0 } }
      : {}),
  };
}

function escapeUnescapedControlCharsInStrings(jsonText: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < jsonText.length; i++) {
    const ch = jsonText[i];
    if (inString) {
      if (escaped) {
        result += ch;
        escaped = false;
      } else if (ch === "\\") {
        result += ch;
        escaped = true;
      } else if (ch === '"') {
        result += ch;
        inString = false;
      } else if (ch === "\n") {
        result += "\\n";
      } else if (ch === "\r") {
        result += "\\r";
      } else if (ch === "\t") {
        result += "\\t";
      } else {
        result += ch;
      }
    } else {
      if (ch === '"') {
        inString = true;
      }
      result += ch;
    }
  }
  return result;
}

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

  const candidateModels = getCandidateModels();
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const url = `${baseUrl}/models/${model}:generateContent`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(16000),
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
          generationConfig: buildGenerationConfig(
            model,
            temperature,
            maxOutputTokens,
            true
          ),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        lastError = new Error(`Gemini ${model} ${response.status}: ${body}`);
        // If invalid API key (401/403 with API_KEY_INVALID), no need to retry other models
        if (
          (response.status === 401 || response.status === 403) &&
          body.includes("API_KEY_INVALID")
        ) {
          throw lastError;
        }
        if (response.status === 429 || response.status === 404) {
          markModelCooldown(model, 5 * 60 * 1000);
        } else if (response.status >= 500) {
          markModelCooldown(model, 60 * 1000);
        }
        console.warn(
          `Gemini ${model} returned ${response.status}. Trying next fallback model...`
        );
        continue;
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
        error?: { message?: string };
      };

      if (payload.error?.message) {
        lastError = new Error(payload.error.message);
        continue;
      }

      const parts = payload.candidates?.[0]?.content?.parts || [];
      const textPart =
        parts.find((p) => typeof p.text === "string" && p.text.trim().length > 0) ||
        parts[0];
      const raw = textPart?.text;
      if (!raw) {
        lastError = new Error("Gemini yanıtı boş");
        continue;
      }

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
        try {
          return JSON.parse(escapeUnescapedControlCharsInStrings(cleaned)) as T;
        } catch {
          // Attempt to extract the first valid JSON object or array
          const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (jsonMatch) {
            return JSON.parse(
              escapeUnescapedControlCharsInStrings(jsonMatch[0])
            ) as T;
          }
          lastError =
            parseErr instanceof Error ? parseErr : new Error(String(parseErr));
          continue;
        }
      }
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message.includes("API_KEY_INVALID")) {
        throw lastError;
      }
      if (lastError.message.includes("timeout") || lastError.message.includes("aborted")) {
        markModelCooldown(model, 2 * 60 * 1000);
      }
      console.warn(
        `Gemini ${model} call failed (${lastError.message}). Trying next fallback model...`
      );
      continue;
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

  const baseUrl =
    process.env.GEMINI_API_BASE ||
    "https://generativelanguage.googleapis.com/v1beta";

  const candidateModels = getCandidateModels();
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const url = `${baseUrl}/models/${model}:generateContent`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(16000),
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
          generationConfig: buildGenerationConfig(
            model,
            temperature,
            maxOutputTokens,
            false
          ),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        lastError = new Error(`Gemini ${model} ${response.status}: ${body}`);
        if (
          (response.status === 401 || response.status === 403) &&
          body.includes("API_KEY_INVALID")
        ) {
          throw lastError;
        }
        if (response.status === 429 || response.status === 404) {
          markModelCooldown(model, 5 * 60 * 1000);
        } else if (response.status >= 500) {
          markModelCooldown(model, 60 * 1000);
        }
        continue;
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
        error?: { message?: string };
      };

      if (payload.error?.message) {
        lastError = new Error(payload.error.message);
        continue;
      }

      const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) {
        lastError = new Error("Gemini yanıtı boş");
        continue;
      }

      return raw.trim();
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message.includes("API_KEY_INVALID")) {
        throw lastError;
      }
      continue;
    }
  }

  throw lastError || new Error("Gemini modelleri yanıt vermedi");
}
