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
    <div className="relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/90 via-primary/80 to-primary/60 p-8 text-primary-foreground md:min-h-[420px] md:p-12">
      {event.coverImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${event.coverImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      <div className="relative z-10 max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white">
            {TYPE_LABELS[event.eventType] || "Kültür"}
          </Badge>
          {event.cityName && (
            <Badge variant="outline" className="border-white/30 text-white">
              <MapPin className="mr-1 h-3 w-3" />
              {event.cityName}
            </Badge>
          )}
        </div>

        <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
          {event.title}
        </h2>

        <p className="max-w-2xl text-sm text-primary-foreground/90 md:text-base">
          {event.summary}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/80">
          {dateLabel && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {dateLabel}
            </span>
          )}
          {event.venueName && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.venueName}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {ctaUrl && (
            <Button size="lg" variant="secondary" asChild>
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
            size="lg"
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            asChild
          >
            <Link href="/etkinlikler">Tüm Etkinlikler</Link>
          </Button>
        </div>

        {event.sourceName && (
          <p className="text-xs text-primary-foreground/60">
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
    <article className="flex h-full flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant="outline">
          {TYPE_LABELS[event.eventType] || "Kültür"}
        </Badge>
        {event.cityName && (
          <span className="text-xs text-muted-foreground">{event.cityName}</span>
        )}
      </div>
      <h3 className="text-lg font-semibold leading-snug">{event.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
        {event.summary}
      </p>
      {dateLabel && (
        <p className="mt-3 text-xs text-muted-foreground">{dateLabel}</p>
      )}
      {ctaUrl && (
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          Detay
          <ExternalLink className="ml-1 h-3.5 w-3.5" />
        </a>
      )}
    </article>
  );
}
