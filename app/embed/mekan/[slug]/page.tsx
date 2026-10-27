import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlaceWithCityBySlug } from "@/lib/data/places";
import { checkMuzekartStatus } from "@/lib/places/muzekart";
import { MapPin, ExternalLink, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceWithCityBySlug(slug);
  if (!place) return { title: "Mekan Bulunamadı" };

  return {
    title: `${place.name} — Seni de Bekleriz Kültür Kartı`,
    robots: { index: false, follow: true },
  };
}

export default async function EmbedPlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await getPlaceWithCityBySlug(slug);

  if (!place) {
    notFound();
  }

  const muzekart = checkMuzekartStatus(place);
  const detailUrl = `/mekan/${place.slug}`;

  return (
    <div className="flex h-full w-full items-center justify-center p-2 bg-transparent antialiased">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg transition-all">
        {/* Cover Image Area */}
        <div className="relative h-44 w-full bg-muted overflow-hidden">
          {place.cover_image ? (
            <img
              src={place.cover_image}
              alt={place.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-background to-muted">
              <Landmark className="h-12 w-12 text-primary/40" />
            </div>
          )}

          {/* City Badge Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{place.cityName}</span>
          </div>

          {/* MüzeKart Badge */}
          {muzekart.isValid && (
            <div className="absolute top-3 right-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
              🏛️ MüzeKart Geçerli
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col justify-between p-5 space-y-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight leading-snug line-clamp-1">
              {place.name}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {place.description || `${place.cityName} sınırları içinde yer alan tescilli kültürel miras durağı.`}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Seni de Bekleriz Kültür Rehberi</span>
            </div>

            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              asChild
            >
              <a
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>İncele</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
