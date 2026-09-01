import { NextRequest, NextResponse } from "next/server";
import { generateNewsDraft } from "@/lib/ai/generate-news";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await req.json()) as {
      topic?: string;
      sourceUrl?: string;
      cityName?: string;
      fallbackText?: string;
    };

    const topic = body.topic?.trim() || "";
    const sourceUrl = body.sourceUrl?.trim() || "";

    if (!topic && !sourceUrl) {
      return NextResponse.json(
        { error: "Haber konusu veya kaynak URL gereklidir" },
        { status: 400 }
      );
    }

    if (sourceUrl) {
      try {
        const parsed = new URL(sourceUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return NextResponse.json({ error: "Geçersiz URL" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Geçersiz URL" }, { status: 400 });
      }
    }

    const draft = await generateNewsDraft({
      topic,
      sourceUrl: sourceUrl || undefined,
      cityName: body.cityName?.trim(),
      fallbackText: body.fallbackText,
    });

    return NextResponse.json(draft);
  } catch (err: any) {
    console.error("ai-news-draft error:", err);
    return NextResponse.json(
      { error: err.message || "Haber taslağı oluşturulamadı" },
      { status: 500 }
    );
  }
}
