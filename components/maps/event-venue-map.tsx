"use client";

import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  venueName: string | null;
  cityName: string | null;
  eventTitle: string;
};

/**
 * Checks whether a venue name/address is specific enough for Google Maps or Yandex Maps
 * to locate an actual place (instead of falling back to the province center).
 */
export function isSearchableVenueAddress(
  venueName?: string | null,
  cityName?: string | null
): boolean {
  if (!venueName) return false;
  const cleaned = venueName
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 4) return false;

  const lower = cleaned.toLocaleLowerCase("tr-TR");
  const cityLower = (cityName || "").trim().toLocaleLowerCase("tr-TR");

  // If the venue name is just the city name (or "Ankara Merkez" / "İzmir Geneli"), it's not a specific address
  if (
    cityLower &&
    (lower === cityLower ||
      lower === `${cityLower} merkez` ||
      lower === `${cityLower} il merkezi` ||
      lower === `${cityLower} şehir merkezi`)
  ) {
    return false;
  }

  // Reject vague or multi-venue placeholders
  const VAGUE_VENUE_PATTERNS = [
    /çeşitli\s*mekan/i,
    /farklı\s*mekan/i,
    /şehir\s*geneli/i,
    /il\s*geneli/i,
    /tüm\s*şehir/i,
    /tüm\s*türkiye/i,
    /belirtilmedi/i,
    /açıklanacak/i,
    /duyurulacak/i,
    /\bonline\b/i,
    /çevrimiçi/i,
    /dijital\s*platform/i,
    /gösterim\s*salonları/i,
    /festival\s*alanları/i,
    /etkinlik\s*alanları/i,
  ];

  if (VAGUE_VENUE_PATTERNS.some((pattern) => pattern.test(venueName))) {
    return false;
  }

  return true;
}

export function EventVenueMap({ venueName, cityName }: Props) {
  if (!isSearchableVenueAddress(venueName, cityName)) {
    return null;
  }

  const cleanVenue = venueName!.trim();
  const searchQuery = [cleanVenue, cityName, "Türkiye"]
    .filter(Boolean)
    .join(", ");

  const googleEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    searchQuery
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    searchQuery
  )}`;

  const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    searchQuery
  )}`;

  const yandexMapsUrl = `https://yandex.com.tr/harita/?text=${encodeURIComponent(
    searchQuery
  )}`;

  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{cleanVenue}</h3>
            {cityName && (
              <p className="text-xs text-muted-foreground">{cityName}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            asChild
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <a
              href={googleDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="h-3.5 w-3.5" />
              Yol Tarifi Al
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 gap-1 text-xs"
          >
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Haritalar
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 gap-1 text-xs"
          >
            <a href={yandexMapsUrl} target="_blank" rel="noopener noreferrer">
              Yandex Harita
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      <div className="relative h-[280px] w-full bg-muted sm:h-[320px]">
        <iframe
          title={`${cleanVenue} Harita Konumu`}
          src={googleEmbedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  );
}
