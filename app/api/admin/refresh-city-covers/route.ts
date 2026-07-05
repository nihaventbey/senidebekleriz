import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { refreshCityCovers } from "@/lib/ingest/apply-city-cover";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await request.json().catch(() => ({}))) as {
      source?: string;
      slugs?: string[];
    };

    const result = await refreshCityCovers({
      source: body.source || "valilik",
      slugs: body.slugs,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Toplu güncelleme başarısız";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
