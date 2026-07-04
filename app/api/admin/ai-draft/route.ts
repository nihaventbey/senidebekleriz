import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { generateArticleDraft } from "@/lib/ai/generate-article";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await request.json()) as {
      topic?: string;
      cityName?: string;
      type?: "guide" | "list" | "tips";
    };

    if (!body.topic?.trim()) {
      return NextResponse.json({ error: "Konu gerekli" }, { status: 400 });
    }

    const draft = await generateArticleDraft({
      topic: body.topic.trim(),
      cityName: body.cityName?.trim(),
      type: body.type,
    });

    return NextResponse.json(draft);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI taslak oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
