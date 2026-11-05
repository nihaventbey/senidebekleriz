import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Sparkles, ArrowRight, Ticket } from "lucide-react";
import type { PublicNewsArticle } from "@/lib/data/news";
import type { PublicEvent } from "@/lib/data/events";

type Props = {
  featuredNews: PublicNewsArticle[];
  latestEvents: PublicEvent[];
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  arkeoloji: "Arkeoloji & Kazı",
  restorasyon: "Tarihi Miras",
  muze_sergi: "Müze & Sergi",
  kultur_sanat: "Kültür & Sanat",
  festival_haberleri: "Festival",
  genel: "Kültür Gündemi",
};

export function EditorialHero({ featuredNews, latestEvents }: Props) {
  const leadNews = featuredNews[0];
  const secondaryNews = featuredNews.slice(1, 4);

  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background via-muted/15 to-background py-6 sm:py-10">
      <div className="container mx-auto px-4">
        {/* Lead Stories Mosaic */}
        {featuredNews.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Primary Main Feature Card (7 Columns) */}
            {leadNews && (
              <article className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/40 lg:col-span-7 min-h-[380px] sm:min-h-[440px]">
                {/* Media region with aspect ratio and object-fit cover */}
                <div className="absolute inset-0 bg-muted">
                  {leadNews.coverImage ? (
                    <img
                      src={leadNews.coverImage}
                      alt={leadNews.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/80 via-primary/60 to-primary/40" />
                  )}
                  {/* Subtle readable dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                </div>

                {/* Stretched Link for accessible whole-card click */}
                <Link
                  href={`/haber/${leadNews.slug}`}
                  className="card-link absolute inset-0 z-10"
                  aria-label={leadNews.title}
                />

                {/* Header & Content overlaid on bottom */}
                <div className="relative z-20 p-6 sm:p-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/90 text-primary-foreground font-bold text-xs border-0 shadow-sm backdrop-blur-sm">
                      {CATEGORY_LABELS[leadNews.category] || "Kültür Haberi"}
                    </Badge>
                    {leadNews.cityName && (
                      <span className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-xs font-semibold text-white">
                        <MapPin className="h-3 w-3" />
                        {leadNews.cityName}
                      </span>
                    )}
                    <span className="text-xs text-white/80 font-medium ml-auto">
                      {formatDate(leadNews.publishedAt)}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                    {leadNews.title}
                  </h2>

                  <p className="line-clamp-2 text-sm sm:text-base text-white/90 leading-relaxed max-w-2xl font-normal">
                    {leadNews.summary}
                  </p>
                </div>
              </article>
            )}

            {/* Secondary Stories Stack (5 Columns) */}
            <div className="flex flex-col gap-3.5 lg:col-span-5">
              {secondaryNews.map((news, i) => (
                <article
                  key={news.id}
                  className="group relative flex items-center gap-4 p-3.5 rounded-3xl border border-border/60 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/40"
                >
                  {/* Thumbnail Image with Number Ribbon */}
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {news.coverImage ? (
                      <img
                        src={news.coverImage}
                        alt={news.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary/40" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-black/70 backdrop-blur-md text-[10px] font-black text-white">
                      0{i + 2}
                    </span>
                  </div>

                  {/* Text details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-primary">
                      <span>{CATEGORY_LABELS[news.category] || "Haber"}</span>
                      {news.cityName && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-muted-foreground font-medium">{news.cityName}</span>
                        </>
                      )}
                    </div>

                    <h3 className="line-clamp-2 text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                      <Link href={`/haber/${news.slug}`} className="hover:underline">
                        {news.title}
                      </Link>
                    </h3>

                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {news.summary}
                    </p>
                  </div>
                </article>
              ))}

              {/* View All Culture News Link Banner */}
              <div className="mt-auto pt-2">
                <Link
                  href="/haberler"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/50 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>📰 Tüm Kültür &amp; Sanat Haberlerini İncele</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback when no news published yet */
          <div className="p-8 text-center rounded-3xl border border-dashed text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary opacity-60" />
            <h2 className="text-lg font-bold text-foreground">Kültür ve Sanat Gündemi</h2>
            <p className="text-sm mt-1 max-w-md mx-auto">
              Türkiye genelinde sergiler, tiyatro oyunları ve güncel kültür haberleri burada listelenir.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
