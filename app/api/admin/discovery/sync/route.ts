import { NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { discoverContent } from "@/lib/discovery/sync";

export const maxDuration = 300;

export async function POST() {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const result = await discoverContent();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Keşif sync başarısız",
      },
      { status: 500 }
    );
  }
}
