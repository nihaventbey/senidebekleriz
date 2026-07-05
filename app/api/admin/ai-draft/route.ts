import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { generateArticleDraft } from "@/lib/ai/generate-article";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await request.json()) as {
      topic?: string;
      cityName?: string;
      type?: "guide" | "list" | "tips";
      sourceUrl?: string;
    };

    const topic = body.topic?.trim() || "";
    const sourceUrl = body.sourceUrl?.trim() || "";

    if (!topic && !sourceUrl) {
      return NextResponse.json(
        { error: "Konu veya kaynak URL gerekli" },
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

    const draft = await generateArticleDraft({
      topic,
      cityName: body.cityName?.trim(),
      type: body.type,
      sourceUrl: sourceUrl || undefined,
    });

    return NextResponse.json(draft);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI taslak oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
