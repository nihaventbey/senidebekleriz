import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { generateMeta, type MetaEntityType } from "@/lib/content/generate-meta";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_TYPES: MetaEntityType[] = ["place", "city", "event"];

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await request.json()) as {
      type?: string;
      name?: string;
      cityName?: string;
      description?: string;
      categoryLabel?: string;
    };

    const type = VALID_TYPES.includes(body.type as MetaEntityType)
      ? (body.type as MetaEntityType)
      : "place";
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Ad gerekli" }, { status: 400 });
    }

    const meta = await generateMeta({
      type,
      name,
      cityName: body.cityName?.trim(),
      description: body.description?.trim(),
      categoryLabel: body.categoryLabel?.trim(),
    });

    return NextResponse.json(meta);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meta üretilemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
