import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, MapPin, Ticket } from "lucide-react";
import type { PublicEvent } from "@/lib/data/events";

const TYPE_LABELS: Record<string, string> = {
  tiyatro: "Tiyatro",
  konser: "Konser",
  sergi: "Sergi",
  festival: "Festival",
  duyuru: "Duyuru",
  diger: "Kültür",
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventSlideCard({ event }: { event: PublicEvent }) {
  const ctaUrl = event.ticketUrl || event.sourceUrl;
  const dateLabel = formatDate(event.startsAt);

  return (
    <div className="relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/90 via-primary/80 to-primary/60 p-5 text-primary-foreground sm:min-h-[300px] sm:rounded-3xl sm:p-8 md:min-h-[380px] md:p-10 lg:min-h-[420px] lg:p-12">
      {event.coverImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${event.coverImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

      <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge
            variant="secondary"
            className="bg-white/20 text-[11px] text-white sm:text-xs"
          >
            {TYPE_LABELS[event.eventType] || "Kültür"}
          </Badge>
          {event.cityName && (
            <Badge
              variant="outline"
              className="max-w-full border-white/30 text-[11px] text-white sm:text-xs"
            >
              <MapPin className="mr-1 h-3 w-3 shrink-0" />
              <span className="truncate">{event.cityName}</span>
            </Badge>
          )}
        </div>

        <h2 className="line-clamp-3 text-lg font-bold leading-snug tracking-tight sm:line-clamp-none sm:text-2xl md:text-4xl">
          {event.title}
        </h2>

        <p className="line-clamp-3 max-w-2xl text-xs leading-relaxed text-primary-foreground/90 sm:line-clamp-4 sm:text-sm md:text-base">
          {event.summary}
        </p>

        <div className="flex flex-col gap-1.5 text-xs text-primary-foreground/80 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:text-sm">
          {dateLabel && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{dateLabel}</span>
            </span>
          )}
          {event.venueName && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{event.venueName}</span>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:gap-3 sm:pt-2">
          {ctaUrl && (
            <Button
              size="default"
              variant="secondary"
              className="h-10 w-full sm:h-11 sm:w-auto"
              asChild
            >
              <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                {event.ticketUrl ? (
                  <>
                    <Ticket className="mr-2 h-4 w-4" />
                    Bilet / Detay
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Kaynağı Gör
                  </>
                )}
              </a>
            </Button>
          )}
          <Button
            size="default"
            variant="outline"
            className="hidden h-10 w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:inline-flex sm:h-11 sm:w-auto"
            asChild
          >
            <Link href="/etkinlikler">Tüm Etkinlikler</Link>
          </Button>
        </div>

        {event.sourceName && (
          <p className="truncate text-[10px] text-primary-foreground/60 sm:text-xs">
            Kaynak: {event.sourceName}
          </p>
        )}
      </div>
    </div>
  );
}

export function EventListCard({ event }: { event: PublicEvent }) {
  const ctaUrl = event.ticketUrl || event.sourceUrl;
  const dateLabel = formatDate(event.startsAt);

  return (
    <article className="flex h-full flex-col rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-xs">
          {TYPE_LABELS[event.eventType] || "Kültür"}
        </Badge>
        {event.cityName && (
          <span className="truncate text-xs text-muted-foreground">
            {event.cityName}
          </span>
        )}
      </div>
      <h3 className="line-clamp-2 text-base font-semibold leading-snug sm:text-lg">
        <Link href={`/etkinlik/${event.slug}`} className="hover:underline">
          {event.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
        {event.summary}
      </p>
      {dateLabel && (
        <p className="mt-3 text-xs text-muted-foreground">{dateLabel}</p>
      )}
      <div className="mt-4 flex items-center gap-4">
        <Link
          href={`/etkinlik/${event.slug}`}
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          Detay
        </Link>
        {ctaUrl && (
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-muted-foreground hover:underline"
          >
            Kaynak
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}
