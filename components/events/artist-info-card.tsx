import { useId } from "react";
import { ExternalLink, Globe2, Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ArtistInfoCard as ArtistInfoCardData } from "@/lib/events/artist-info-card";

function getDomainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Resmi Web Sitesi";
  }
}

export function ArtistInfoCard({ card }: { card: ArtistInfoCardData }) {
  const headingId = useId();
  const domain = card.officialWebsite ? getDomainLabel(card.officialWebsite) : null;

  return (
    <article
      aria-labelledby={headingId}
      className="artist-info-card mt-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card to-card p-5 shadow-xs sm:p-6"
    >
      <header className="artist-info-card-header border-b border-border/50 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1 bg-primary/10 text-primary border-0 text-[11px] font-semibold"
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Sanatçı &amp; Topluluk Bilgi Kartı
            </Badge>
            <Badge variant="outline" className="text-[11px] font-medium">
              {card.entityType}
            </Badge>
            {card.origin && (
              <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
                {card.origin}
              </Badge>
            )}
          </div>
          <h2
            id={headingId}
            className="text-xl font-bold tracking-tight text-foreground pt-1"
          >
            {card.entityName}
          </h2>
        </div>
      </header>

      <div className="mt-4 space-y-4">
        {card.summary && (
          <p className="text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
            {card.summary}
          </p>
        )}

        {card.websiteNote && (
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs sm:text-sm leading-relaxed text-foreground/85">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              Resmi İnternet Sitesinden Not
            </p>
            <p>{card.websiteNote}</p>
          </div>
        )}

        {card.highlights.length > 0 && (
          <ul className="grid gap-2 text-xs sm:grid-cols-2 sm:text-sm text-muted-foreground">
            {card.highlights.map((item, idx) => (
              <li
                key={`${idx}-${item.slice(0, 20)}`}
                className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/60 px-3 py-2"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(card.officialWebsite || card.sourceLabel) && (
        <footer className="artist-info-card-footer mt-5 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary/80" aria-hidden="true" />
            {card.sourceLabel || "Doğrulanmış açık kaynaklardan derlendi"}
          </span>

          {card.officialWebsite && (
            <a
              href={card.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Resmi Web Sitesini Ziyaret Et</span>
              {domain && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  ({domain})
                </span>
              )}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </footer>
      )}
    </article>
  );
}
