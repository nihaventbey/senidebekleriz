import { NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { syncCulturalEvents } from "@/lib/events/sync";

export async function POST() {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

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
