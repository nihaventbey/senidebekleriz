import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { researchArtistInfoCard } from "@/lib/ai/research-artist-info";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await req.json()) as {
      title?: string;
      summary?: string | null;
      description?: string | null;
      eventType?: string | null;
      entityName?: string | null;
    };

    const title = String(body.title || "").trim();
    const entityName = String(body.entityName || "").trim();

    if (!title && !entityName) {
      return NextResponse.json(
        { error: "Lütfen etkinlik başlığı veya sanatçı/topluluk adı girin." },
        { status: 400 }
      );
    }

    const card = await researchArtistInfoCard({
      title: title || entityName,
      summary: body.summary,
      description: body.description,
      eventType: body.eventType,
      entityNameHint: entityName || null,
      interactive: true,
    });

    if (!card) {
      return NextResponse.json(
        {
          error:
            "Bu başlık için doğrulanabilir sanatçı, topluluk, orkestra veya resmi web sitesi bulunamadı. Sanatçı/topluluk adını elle belirtip tekrar deneyebilir veya kartı manuel doldurabilirsiniz.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ card });
  } catch (err) {
    console.error("ai-artist-info error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Bilgi kartı araştırılırken hata oluştu.",
      },
      { status: 500 }
    );
  }
}
