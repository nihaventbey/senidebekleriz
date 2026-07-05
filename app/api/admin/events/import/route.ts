import { NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { importEventFromUrlAction } from "@/lib/actions/events";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  const body = await request.json();
  const url = body.url as string;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL gerekli" }, { status: 400 });
  }

  const result = await importEventFromUrlAction(url);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
