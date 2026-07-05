import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { applyCityDescription } from "@/lib/ingest/apply-city-description";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await request.json()) as {
      slug?: string;
      apply?: boolean;
      force?: boolean;
    };

    const slug = body.slug?.trim();
    if (!slug) {
      return NextResponse.json({ error: "slug gerekli" }, { status: 400 });
    }

    const result = await applyCityDescription(slug, {
      apply: Boolean(body.apply),
      force: Boolean(body.force),
    });

    if (result.status === "error") {
      return NextResponse.json(
        { error: result.message, ...result },
        { status: result.message === "Şehir bulunamadı" ? 404 : 422 }
      );
    }

    if (result.status === "skipped") {
      return NextResponse.json(result, { status: 409 });
    }

    if (body.apply) {
      revalidatePath("/sehirler");
      revalidatePath(`/sehir/${slug}`);
      revalidatePath("/yonetim/sehirler");
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tanıtım metni üretilemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
