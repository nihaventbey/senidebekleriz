import { NextResponse } from "next/server";
import { runAutopilotFallback, getAutopilotStatus } from "@/lib/autopilot/fallback-autopilot";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const cronHeader = request.headers.get("x-cron-secret");
  return cronHeader === secret;
}

export async function GET(request: Request) {
  // Allow checking status if not authorized, but require authorization to execute
  const url = new URL(request.url);
  const isStatusOnly = url.searchParams.get("action") === "status";

  if (isStatusOnly) {
    const status = await getAutopilotStatus();
    return NextResponse.json(status);
  }

  if (!authorize(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
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
