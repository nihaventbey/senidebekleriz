import { NextRequest, NextResponse } from "next/server";
import { getPlaceImageServerSide } from "@/lib/data/place-images";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wikidataId = searchParams.get("wikidataId");
  const placeName = searchParams.get("placeName") || "";
  const cityName = searchParams.get("cityName") || "";

  if (!placeName) {
    return NextResponse.json({ image: null }, { status: 400 });
  }

  const image = await getPlaceImageServerSide(wikidataId, placeName, cityName);

  return NextResponse.json(
    { image },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
