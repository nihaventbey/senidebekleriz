"use client";

import { MapPin, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaceMap } from "@/components/maps/place-map-wrapper";

type EventVenueMapProps = {
  venueName?: string | null;
  cityName?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  className?: string;
};

export function EventVenueMap({
  venueName,
  cityName,
  coordinates,
  className = "",
}: EventVenueMapProps) {
  const destinationQuery = encodeURIComponent(
    [venueName, cityName, "Türkiye"].filter(Boolean).join(", ")
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${destinationQuery}`;
  const yandexMapsUrl = `https://yandex.com/maps/?text=${destinationQuery}`;

  const displayName = venueName || `${cityName || "Kültür"} Etkinlik Mekanı`;

  return (
    <section className={`rounded-2xl border bg-card overflow-hidden shadow-xs ${className}`}>
      <div className="p-4 sm:p-5 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Etkinlik Mekanı &amp; Yol Tarifi
            </h3>
            <p className="text-xs text-muted-foreground">
              {venueName ? `${venueName}${cityName ? ` • ${cityName}` : ""}` : (cityName || "Türkiye")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="default" className="h-8 text-xs font-semibold gap-1.5 shadow-xs">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-3.5 w-3.5" />
              <span>Google Haritalar</span>
            </a>
          </Button>

          <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1.5">
            <a href={yandexMapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Yandex</span>
            </a>
          </Button>
        </div>
      </div>

      {coordinates ? (
        <div className="h-[280px] sm:h-[340px] w-full relative">
          <PlaceMap lat={coordinates.lat} lng={coordinates.lng} name={displayName} />
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground bg-muted/20">
          <MapPin className="h-8 w-8 mx-auto text-primary/40 mb-2" />
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <p className="text-xs mt-1">
            Harita koordinatları doğrudan Google Haritalar üzerinden açılabilir.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-4 text-xs font-semibold">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              Haritayı Yeni Sekmede Aç →
            </a>
          </Button>
        </div>
      )}
    </section>
  );
}
