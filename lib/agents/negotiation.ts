import type { NextRequest } from "next/server";

const MARKDOWN_PATH_PREFIXES = [
  "/api/",
  "/yonetim",
  "/.well-known",
  "/_next",
];

export function acceptsMarkdown(request: NextRequest): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/markdown");
}

export function isMarkdownNegotiablePath(pathname: string): boolean {
  if (pathname === "/api/agents/markdown") return false;
  if (MARKDOWN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }
  if (pathname.includes(".") && !pathname.endsWith("/")) return false;
  return true;
}
