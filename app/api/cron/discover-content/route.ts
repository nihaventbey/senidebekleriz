import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/auth/cron";
import { discoverContent } from "@/lib/discovery/sync";
import { runAutopilotFallback } from "@/lib/autopilot/fallback-autopilot";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const discoveryResult = await discoverContent();
    const autopilotResult = await runAutopilotFallback();
    return NextResponse.json({
      discovery: discoveryResult,
      autopilot: autopilotResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Keşif ve oto-pilot sync başarısız",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
