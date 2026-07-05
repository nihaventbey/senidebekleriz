import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { refreshCityDescriptions } from "@/lib/ingest/apply-city-description";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await request.json().catch(() => ({}))) as {
      source?: string;
      slugs?: string[];
      force?: boolean;
    };

    const result = await refreshCityDescriptions({
      source: body.source || "valilik",
      slugs: body.slugs,
      force: Boolean(body.force),
    });

    revalidatePath("/sehirler");
    revalidatePath("/yonetim/sehirler");

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Toplu güncelleme başarısız";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
