import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { syncGlobalTicketingEvents } from "@/lib/events/sync-global-ticketing";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST() {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const result = await syncGlobalTicketingEvents({
      limit: 8,
      autoPublish: false,
      enrichArtistCards: true,
    });

    revalidatePath("/yonetim/etkinlikler");
    revalidatePath("/etkinlikler");
    revalidatePath("/");

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Biletleme sitelerinden etkinlik çekilemedi",
      },
      { status: 500 }
    );
  }
}
