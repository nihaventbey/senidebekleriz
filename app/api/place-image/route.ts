import { NextRequest, NextResponse } from "next/server";
import { getWikimediaImage, getUnsplashFallback } from "@/lib/data/wikimedia";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wikidataId = searchParams.get("wikidataId");
  const placeName = searchParams.get("placeName") || "";
  const cityName = searchParams.get("cityName") || "";

  if (!placeName) {
    return NextResponse.json({ image: null }, { status: 400 });
  }

  let image = null;

  if (wikidataId) {
    image = await getWikimediaImage(wikidataId);
  }

  if (!image) {
    image = getUnsplashFallback(placeName, cityName);
  }

  return NextResponse.json({ image }, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
