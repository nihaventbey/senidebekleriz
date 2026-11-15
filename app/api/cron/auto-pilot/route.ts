import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/auth/cron";
import { runAutopilotFallback, getAutopilotStatus } from "@/lib/autopilot/fallback-autopilot";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const url = new URL(request.url);
  const isStatusOnly = url.searchParams.get("action") === "status";

  if (isStatusOnly) {
    const status = await getAutopilotStatus();
    return NextResponse.json(status);
  }

  try {
    const result = await runAutopilotFallback();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Oto-pilot çalıştırma hatası",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
