import { NextRequest } from "next/server";
import {
  buildHomepageMarkdown,
  buildPageMarkdown,
} from "@/lib/agents/markdown";
import { markdownResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

const PAGE_TITLES: Record<string, string> = {
  "/sehirler": "Şehirler",
  "/kategoriler": "Kategoriler",
  "/etkinlikler": "Kültür Etkinlikleri",
  "/blog": "Gezi Rehberi",
};

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/";

  if (path === "/") {
    return markdownResponse(buildHomepageMarkdown());
  }

  const title = PAGE_TITLES[path] || "Seni de Bekleriz";
  return markdownResponse(buildPageMarkdown(path, title));
}
