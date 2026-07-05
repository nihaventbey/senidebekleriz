import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { getAdminPlacesPaginated, type PlaceGapFilter } from "@/lib/data/admin";

export const runtime = "nodejs";

const GAP_FILTERS: PlaceGapFilter[] = ["no-cover", "thin", "not-indexable"];

export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "30")));
  const q = searchParams.get("q") || undefined;
  const citySlug = searchParams.get("city") || undefined;
  const source = searchParams.get("source") || undefined;
  const gapParam = searchParams.get("gap");
  const gap = GAP_FILTERS.includes(gapParam as PlaceGapFilter)
    ? (gapParam as PlaceGapFilter)
    : undefined;

  const result = await getAdminPlacesPaginated({
    page,
    limit,
    q,
    citySlug,
    source,
    gap,
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
