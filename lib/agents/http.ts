const CACHE = "public, max-age=3600, stale-while-revalidate=86400";

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": CACHE,
      ...init?.headers,
    },
  });
}

export function linksetResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type":
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      "Cache-Control": CACHE,
    },
  });
}

export function markdownResponse(body: string): Response {
  const tokens = Math.ceil(body.length / 4);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "x-markdown-tokens": String(tokens),
    },
  });
}
