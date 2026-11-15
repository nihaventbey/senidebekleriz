import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/auth/cron";
import { syncCulturalEvents } from "@/lib/events/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const result = await syncCulturalEvents();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Sync başarısız",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
