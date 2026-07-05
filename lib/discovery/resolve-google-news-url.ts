const BATCH_EXECUTE_URL =
  "https://news.google.com/_/DotsSplashUi/data/batchexecute";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function isGoogleNewsArticleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.replace(/^www\./, "") === "news.google.com" &&
      /\/articles\//.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

function extractArticleId(articleUrl: string): string {
  return articleUrl.split("/").pop()?.split("?")[0] || "";
}

export function parseBatchExecuteResponse(body: string): string | null {
  let text = body;
  if (text.startsWith(")]}'")) {
    text = text.slice(4).trimStart();
  }

  const firstNewline = text.indexOf("\n");
  if (firstNewline !== -1) {
    const head = text.slice(0, firstNewline).trim();
    if (/^\d+$/.test(head)) {
      text = text.slice(firstNewline + 1).trim();
    }
  }

  const envelopes = JSON.parse(text) as unknown[];
  for (const envelope of envelopes) {
    if (
      !Array.isArray(envelope) ||
      envelope.length < 3 ||
      envelope[0] !== "wrb.fr" ||
      envelope[1] !== "Fbv4je"
    ) {
      continue;
    }

    const payload = JSON.parse(String(envelope[2])) as unknown;
    if (
      Array.isArray(payload) &&
      payload[0] === "garturlres" &&
      typeof payload[1] === "string" &&
      payload[1].startsWith("http")
    ) {
      return payload[1];
    }
  }

  return null;
}

export async function resolveGoogleNewsArticleUrl(
  articleUrl: string,
  timeoutMs = 20000
): Promise<string | null> {
  if (!isGoogleNewsArticleUrl(articleUrl)) {
    return articleUrl;
  }

  const articleId = extractArticleId(articleUrl);
  if (!articleId) return null;

  const pageResponse = await fetch(articleUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "tr-TR,tr;q=0.9",
    },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });

  if (!pageResponse.ok) {
    return null;
  }

  const pageText = await pageResponse.text();
  const signature = pageText.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const timestamp = pageText.match(/data-n-a-ts="([^"]+)"/)?.[1];

  if (!signature || !timestamp) {
    return null;
  }

  const rpcInner = JSON.stringify([
    "garturlreq",
    [
      [
        "X",
        "X",
        ["X", "X"],
        null,
        null,
        1,
        1,
        "TR:tr",
        null,
        1,
        null,
        null,
        null,
        null,
        null,
        0,
        1,
      ],
      "X",
      "X",
      1,
      [1, 1, 1],
      1,
      1,
      null,
      0,
      0,
      null,
      0,
    ],
    articleId,
    Number.parseInt(timestamp, 10),
    signature,
  ]);

  const formBody = new URLSearchParams({
    "f.req": JSON.stringify([[["Fbv4je", rpcInner, null, "generic"]]]),
  });

  const batchResponse = await fetch(BATCH_EXECUTE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Referer: "https://news.google.com/",
      "User-Agent": USER_AGENT,
    },
    body: formBody.toString(),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!batchResponse.ok) {
    return null;
  }

  const batchText = await batchResponse.text();
  return parseBatchExecuteResponse(batchText);
}

export async function resolvePublisherUrl(url: string): Promise<string> {
  if (!isGoogleNewsArticleUrl(url)) {
    return url;
  }

  try {
    const resolved = await resolveGoogleNewsArticleUrl(url);
    return resolved || url;
  } catch (error) {
    console.error(
      "resolvePublisherUrl error:",
      error instanceof Error ? error.message : error
    );
    return url;
  }
}

export function cleanGoogleNewsTitle(
  title: string,
  publisherName?: string
): string {
  if (!publisherName) return title.trim();

  const suffixes = [` - ${publisherName}`, ` – ${publisherName}`];
  for (const suffix of suffixes) {
    if (title.endsWith(suffix)) {
      return title.slice(0, -suffix.length).trim();
    }
  }

  return title.trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resolvePublisherUrls(
  urls: string[],
  delayMs = 250
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const url of urls) {
    const resolved = await resolvePublisherUrl(url);
    results.set(url, resolved);
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return results;
}
