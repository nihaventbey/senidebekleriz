"use client";

import { useEffect, useState } from "react";
import { CulturalCoverPlaceholder } from "@/components/ui/cultural-cover-placeholder";
import type { PlaceImage as PlaceImageType } from "@/lib/data/wikimedia";

type PlaceImageProps = {
  wikidataId: string | null;
  placeName: string;
  cityName: string;
  coverImage?: string | null;
  className?: string;
};

export function PlaceImageComponent({
  wikidataId,
  placeName,
  cityName,
  coverImage,
  className = "",
}: PlaceImageProps) {
  const [image, setImage] = useState<PlaceImageType | null>(null);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(!coverImage);

  useEffect(() => {
    setHasError(false);
    if (coverImage) {
      setImage({ url: coverImage, alt: placeName, source: "manual" });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      placeName,
      cityName,
    });
    if (wikidataId) {
      params.set("wikidataId", wikidataId);
    }

    fetch(`/api/place-image?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.image) setImage(data.image);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [wikidataId, placeName, cityName, coverImage]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-muted ${className}`}>
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-xs text-muted-foreground/40 font-semibold">Görsel Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (image?.url && !hasError) {
    return (
      <img
        src={image.url}
        alt={image.alt || placeName}
        className={`object-cover ${className}`}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <CulturalCoverPlaceholder
      title={placeName}
      category="Kültür & Tarih Mekanı"
      cityName={cityName}
      className={className}
    />
  );
}
