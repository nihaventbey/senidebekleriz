import { NextRequest, NextResponse } from "next/server";
import { formatHeadingsWithAi } from "@/lib/ai/format-headings";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await req.json()) as {
      title?: string;
      content?: string;
    };

    const content = body.content?.trim() || "";
    if (!content) {
      return NextResponse.json(
        { error: "Biçimlendirilecek haber metni bulunamadı." },
        { status: 400 }
      );
    }

    const formatted = await formatHeadingsWithAi({
      title: body.title?.trim(),
      content,
    });

    return NextResponse.json({
      success: true,
      content: formatted,
    });
  } catch (err: any) {
    console.error("format-news-headings route error:", err);
    return NextResponse.json(
      { error: err.message || "Başlıklandırma işlemi başarısız oldu." },
      { status: 500 }
    );
  }
}
