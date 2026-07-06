export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-8173666333919708";

// Map logical ad slots to actual AdSense ad unit IDs.
// Set NEXT_PUBLIC_ADSENSE_SLOT_<NAME> env vars or fill in real IDs below.
export const AD_SLOT_IDS: Record<string, string> = {
  "home-hero-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_HERO_BOTTOM || "",
  "home-footer-top": process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_FOOTER_TOP || "",
  "cities-top": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CITIES_TOP || "",
  "cities-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CITIES_BOTTOM || "",
  "city-content-top": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CITY_CONTENT_TOP || "",
  "city-list-inline": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CITY_LIST_INLINE || "",
  "categories-top": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORIES_TOP || "",
  "categories-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORIES_BOTTOM || "",
  "category-content-top": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY_CONTENT_TOP || "",
  "category-list-inline": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY_LIST_INLINE || "",
  "place-top": process.env.NEXT_PUBLIC_ADSENSE_SLOT_PLACE_TOP || "",
  "place-content-inline": process.env.NEXT_PUBLIC_ADSENSE_SLOT_PLACE_CONTENT_INLINE || "",
  "place-sidebar": process.env.NEXT_PUBLIC_ADSENSE_SLOT_PLACE_SIDEBAR || "",
  "event-detail-bottom":
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_EVENT_DETAIL_BOTTOM || "",
};

export function getAdSlotId(slot: string): string | undefined {
  return AD_SLOT_IDS[slot] || undefined;
}

export function hasAdConfig(): boolean {
  return Boolean(ADSENSE_CLIENT_ID);
}
