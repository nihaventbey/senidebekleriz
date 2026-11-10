/**
 * Gemini REST istemcisi — tüm AI içerik motorunun tek giriş noktası.
 *
 * Neden yeniden yazıldı (2026-11):
 * - Gemini 3.x flash modelleri varsayılan olarak yüksek "thinking" bütçesi kullanıyor
 *   (basit bir istemde bile ~2000 düşünme tokenı, 15+ sn). Bu hem 28 sn'lik eski
 *   zaman aşımını patlatıyor hem de düşünme tokenları maxOutputTokens'tan düştüğü
 *   için uzun haberlerde JSON yarıda kesiliyordu (finishReason=MAX_TOKENS).
 * - 503 "high demand" hataları geçicidir; eski istemci aynı modeli hiç yeniden
 *   denemeden sıradaki modele atlıyor, zincir hızla tükeniyordu.
 * - finishReason (MAX_TOKENS / RECITATION / SAFETY) hiç kontrol edilmiyordu;
 *   kesik yanıtlar "geçerli" sanılıyor ya da parse hatasına düşüyordu.
 */

export type ThinkingLevel = "minimal" | "low" | "medium" | "high";

export type GeminiTier = "quality" | "fast";

export type GeminiJsonRequest = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Gemini 3.x düşünme seviyesi. Varsayılan: quality → "low", fast → "minimal". */
  thinking?: ThinkingLevel;
  /** JSON Schema (responseJsonSchema). Yapılandırılmış çıktıyı garanti eder. */
  responseSchema?: Record<string, unknown>;
  /** Tek bir model denemesi için zaman aşımı (ms). */
  timeoutMs?: number;
  /** Tüm model zinciri için toplam süre bütçesi (ms). */
  deadlineMs?: number;
  /** "fast": sınıflandırma gibi kısa işler için lite modelleri öne alır. */
  tier?: GeminiTier;
};

export type GeminiCallMeta = {
  model: string;
  finishReason: string | null;
  durationMs: number;
  attempts: number;
};

type GeminiPart = { text?: string; thought?: boolean };

type GeminiPayload = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const QUALITY_MODELS = [
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
];

const FAST_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
];

/** Kalıcı olarak "bu yanıtla başka model denemenin anlamı yok" hataları. */
class FatalGeminiError extends Error {}

// 429 / 404 / art arda 503 alan modelleri bir süre sona at
const modelCooldownUntil = new Map<string, number>();

function markModelCooldown(model: string, durationMs: number) {
  modelCooldownUntil.set(model, Date.now() + durationMs);
}

function isLiteModel(model: string): boolean {
  return /lite/i.test(model);
}

function supportsThinkingLevel(model: string): boolean {
  if (isLiteModel(model)) return false;
  return /gemini-(3|flash-latest|pro-latest)/i.test(model);
}

function resolvePrimaryModel(envKey: string): string | null {
  const envModel = process.env[envKey]?.trim();
  if (!envModel) return null;
  // Emekliye ayrılmış 1.x / 2.x modellerini sessizce yok say
  if (/^gemini-(1\.|2\.)/i.test(envModel)) return null;
  return envModel;
}

export function getCandidateModels(tier: GeminiTier = "quality"): string[] {
  const primary =
    tier === "fast"
      ? resolvePrimaryModel("GEMINI_FAST_MODEL")
      : resolvePrimaryModel("GEMINI_MODEL");
  const base = tier === "fast" ? FAST_MODELS : QUALITY_MODELS;
  const unique = [primary, ...base].filter(
    (m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i
  );

  const now = Date.now();
  const active = unique.filter((m) => (modelCooldownUntil.get(m) || 0) <= now);
  const cooled = unique.filter((m) => (modelCooldownUntil.get(m) || 0) > now);
  return active.length > 0 ? [...active, ...cooled] : unique;
}

function buildThinkingConfig(
  model: string,
  requested: ThinkingLevel | undefined
): Record<string, unknown> | undefined {
  if (!supportsThinkingLevel(model)) return undefined;

  // Geriye dönük uyumluluk: açık bütçe verilmişse onu kullan
  const explicitBudget = process.env.GEMINI_THINKING_BUDGET
    ? parseInt(process.env.GEMINI_THINKING_BUDGET, 10)
    : undefined;
  if (explicitBudget !== undefined && !Number.isNaN(explicitBudget)) {
    return { thinkingBudget: explicitBudget };
  }

  if (process.env.GEMINI_DISABLE_THINKING === "true") {
    return { thinkingLevel: "minimal" };
  }

  const envLevel = process.env.GEMINI_THINKING_LEVEL?.trim() as
    | ThinkingLevel
    | undefined;
  const level = requested || envLevel || "low";
  return { thinkingLevel: level };
}

function stripCodeFences(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json|markdown|md)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/, "");
  return cleaned.trim();
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

/** Model yanıtını sağlam şekilde JSON'a çevirir; başaramazsa hata fırlatır. */
export function parseGeminiJson<T>(raw: string): T {
  const cleaned = stripCodeFences(raw);
  const attempts: Array<() => unknown> = [
    () => JSON.parse(cleaned),
    () => JSON.parse(escapeUnescapedControlCharsInStrings(cleaned)),
    () => {
      const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (!match) throw new Error("JSON bloğu bulunamadı");
      const candidate = escapeUnescapedControlCharsInStrings(match[0]).replace(
        /,\s*([}\]])/g,
        "$1"
      );
      return JSON.parse(candidate);
    },
  ];

  let lastErr: unknown = null;
  for (const attempt of attempts) {
    try {
      return attempt() as T;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Geçersiz JSON yanıtı");
}

function extractText(payload: GeminiPayload): string {
  const parts = payload.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("")
    .trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type CallMode = "json" | "text";

async function callGeminiRaw(
  req: GeminiJsonRequest,
  mode: CallMode
): Promise<{ text: string; meta: GeminiCallMeta }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new FatalGeminiError(
      "GEMINI_API_KEY tanımlı değil. .env.local dosyasına ekleyin."
    );
  }

  const baseUrl = process.env.GEMINI_API_BASE || DEFAULT_BASE_URL;
  const tier = req.tier || "quality";
  const startedAt = Date.now();
  const deadline = startedAt + (req.deadlineMs ?? (tier === "fast" ? 45_000 : 110_000));
  // Askıda kalan bir model (ölçümde 90 sn+) tüm bütçeyi yememeli
  const perAttemptTimeout = req.timeoutMs ?? (tier === "fast" ? 20_000 : 40_000);
  const defaultThinking: ThinkingLevel = tier === "fast" ? "minimal" : "low";

  let lastError: Error | null = null;
  let attempts = 0;
  let recitationHint = false;

  for (const model of getCandidateModels(tier)) {
    let useThinking = true;
    let useSchema = Boolean(req.responseSchema) && mode === "json";
    let transientRetries = 0;

    // Bir model içinde: geçici hata ve yapılandırma uyumsuzluğu yeniden denemeleri
    while (true) {
      const remaining = deadline - Date.now();
      if (remaining < 4_000) {
        throw lastError || new Error("Gemini süre bütçesi doldu");
      }

      attempts += 1;
      const thinkingConfig = useThinking
        ? buildThinkingConfig(model, req.thinking || defaultThinking)
        : undefined;

      const systemText = recitationHint
        ? `${req.systemPrompt}\n\nÖNEMLİ: Kaynak metinden uzun cümleleri birebir aktarma; bilgileri kendi kurumsal cümlelerinle yeniden yaz. Doğrudan alıntıları kısa tut ve tırnak içinde ver.`
        : req.systemPrompt;

      const generationConfig: Record<string, unknown> = {
        temperature: req.temperature ?? (mode === "json" ? 0.4 : 0.6),
        maxOutputTokens: req.maxOutputTokens ?? 8192,
        ...(mode === "json" ? { responseMimeType: "application/json" } : {}),
        ...(useSchema ? { responseJsonSchema: req.responseSchema } : {}),
        ...(thinkingConfig ? { thinkingConfig } : {}),
      };

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          signal: AbortSignal.timeout(Math.min(perAttemptTimeout, remaining - 1_000)),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemText }] },
            contents: [{ role: "user", parts: [{ text: req.userPrompt }] }],
            generationConfig,
          }),
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isTimeout = /timeout|aborted/i.test(lastError.message);
        if (isTimeout) markModelCooldown(model, 2 * 60 * 1000);
        console.warn(`[gemini] ${model} ağ/zaman aşımı: ${lastError.message}`);
        break; // sıradaki model
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        lastError = new Error(`Gemini ${model} ${response.status}: ${body.slice(0, 400)}`);

        if (
          (response.status === 400 || response.status === 401 || response.status === 403) &&
          /API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(body)
        ) {
          throw new FatalGeminiError(lastError.message);
        }

        // Model bu yapılandırmayı desteklemiyorsa sadeleştirip aynı modelde tekrar dene
        if (response.status === 400 && useThinking && /thinking/i.test(body)) {
          useThinking = false;
          continue;
        }
        if (response.status === 400 && useSchema && /schema|responseJsonSchema/i.test(body)) {
          useSchema = false;
          continue;
        }

        if (response.status === 503 || response.status === 500 || response.status === 504) {
          if (transientRetries < 2 && deadline - Date.now() > 15_000) {
            transientRetries += 1;
            await sleep(900 * transientRetries + Math.floor(Math.random() * 400));
            continue;
          }
          markModelCooldown(model, 60 * 1000);
        } else if (response.status === 429 || response.status === 404) {
          markModelCooldown(model, 5 * 60 * 1000);
        }

        console.warn(`[gemini] ${model} → ${response.status}, sıradaki modele geçiliyor`);
        break;
      }

      const payload = (await response.json().catch(() => ({}))) as GeminiPayload;

      if (payload.error?.message) {
        lastError = new Error(payload.error.message);
        break;
      }

      const blockReason = payload.promptFeedback?.blockReason;
      const finishReason = payload.candidates?.[0]?.finishReason || null;
      const text = extractText(payload);

      if (blockReason) {
        lastError = new Error(`Gemini ${model} istemi engelledi: ${blockReason}`);
        break;
      }

      if (finishReason === "RECITATION") {
        // Kaynak metni birebir kopyalamaya çalıştı — talimatı güçlendirip yeniden dene
        lastError = new Error(`Gemini ${model} RECITATION (kaynak kopyalama) ile durdu`);
        if (!recitationHint) {
          recitationHint = true;
          continue;
        }
        break;
      }

      if (finishReason && ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(finishReason)) {
        lastError = new Error(`Gemini ${model} güvenlik filtresiyle durdu: ${finishReason}`);
        break;
      }

      if (!text) {
        lastError = new Error(`Gemini ${model} boş yanıt döndürdü (${finishReason || "?"})`);
        break;
      }

      if (mode === "json") {
        try {
          parseGeminiJson(text);
        } catch {
          lastError = new Error(
            finishReason === "MAX_TOKENS"
              ? `Gemini ${model} yanıtı token sınırında kesildi (MAX_TOKENS)`
              : `Gemini ${model} geçersiz JSON döndürdü`
          );
          console.warn(`[gemini] ${lastError.message}`);
          break;
        }
      } else if (finishReason === "MAX_TOKENS" && text.length < 400) {
        lastError = new Error(`Gemini ${model} metni token sınırında kesildi`);
        break;
      }

      const meta: GeminiCallMeta = {
        model,
        finishReason,
        durationMs: Date.now() - startedAt,
        attempts,
      };
      if (process.env.GEMINI_DEBUG === "true") {
        console.info(`[gemini] ${model} ✓ ${meta.durationMs}ms (${attempts} deneme)`);
      }
      return { text, meta };
    }
  }

  throw lastError || new Error("Gemini modelleri yanıt vermedi");
}

/** Yapılandırılmış JSON yanıtı + hangi modelin/kaç denemede ürettiği bilgisi. */
export async function callGeminiJsonDetailed<T>(
  req: GeminiJsonRequest
): Promise<{ data: T; meta: GeminiCallMeta }> {
  const { text, meta } = await callGeminiRaw(req, "json");
  return { data: parseGeminiJson<T>(text), meta };
}

export async function callGeminiJson<T>(req: GeminiJsonRequest): Promise<T> {
  const { data } = await callGeminiJsonDetailed<T>(req);
  return data;
}

export async function callGeminiText(req: GeminiJsonRequest): Promise<string> {
  const { text } = await callGeminiRaw(
    { temperature: 0.7, ...req },
    "text"
  );
  return stripCodeFences(text);
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
