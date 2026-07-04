"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import type { PlaceImage as PlaceImageType } from "@/lib/data/wikimedia";

type PlaceImageProps = {
  wikidataId: string | null;
  placeName: string;
  cityName: string;
  className?: string;
};

function PlaceholderImage({ placeName, cityName }: { placeName: string; cityName: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <p className="text-lg font-semibold">{placeName}</p>
      <p className="text-sm text-muted-foreground">{cityName}</p>
    </div>
  );
}

export function PlaceImageComponent({
  wikidataId,
  placeName,
  cityName,
  className = "",
}: PlaceImageProps) {
  const [image, setImage] = useState<PlaceImageType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wikidataId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/place-image?wikidataId=${encodeURIComponent(wikidataId)}&placeName=${encodeURIComponent(placeName)}&cityName=${encodeURIComponent(cityName)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.image) setImage(data.image);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [wikidataId, placeName, cityName]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-muted ${className}`}>
        <div className="flex h-full w-full items-center justify-center">
          <MapPin className="h-8 w-8 text-muted-foreground/40" />
        </div>
      </div>
    );
  }

  if (image?.url) {
    return (
      <img
        src={image.url}
        alt={image.alt}
        className={`object-cover ${className}`}
        loading="lazy"
      />
    );
  }

  return <PlaceholderImage placeName={placeName} cityName={cityName} />;
}
