import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/auth/cron";
import { syncCulturalEvents } from "@/lib/events/sync";
import { syncGlobalTicketingEvents } from "@/lib/events/sync-global-ticketing";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const [ktbResult, ticketingResult] = await Promise.all([
      syncCulturalEvents(),
      syncGlobalTicketingEvents({
        limit: 6,
        autoPublish: false,
        enrichArtistCards: true,
      }),
    ]);
    return NextResponse.json({
      ktb: ktbResult,
      ticketing: ticketingResult,
    });
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
