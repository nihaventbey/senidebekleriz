import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Clock, MapPin, Sparkles } from "lucide-react";
import type { PublicNewsArticle } from "@/lib/data/news";

const CATEGORY_LABELS: Record<string, string> = {
  arkeoloji: "Arkeoloji & Kazı",
  restorasyon: "Tarihi Miras",
  muze_sergi: "Müze & Sergi",
  kultur_sanat: "Kültür & Sanat",
  festival_haberleri: "Festival",
  genel: "Kültür Gündemi",
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
}

export function CultureNewsSection({ news }: { news: PublicNewsArticle[] }) {
  if (news.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <BookOpen className="h-4 w-4" />
            <span>Kültür ve Sanat Dünyası</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
            Gündem &amp; Kültürel Miras
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Arkeolojik buluntular, restorasyon projeleri, müze ve sanat dünyasından son gelişmeler.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild className="shrink-0 font-semibold">
          <Link href="/haberler">
            <span>Tüm Haberler</span>
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <article
            key={item.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/40"
          >
            {/* Image region with aspect ratio and object fit */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 via-muted to-muted flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary/40" />
                </div>
              )}

              {/* Category pill */}
              <div className="absolute top-3 left-3 z-10">
                <Badge className="bg-background/90 text-foreground font-semibold text-xs border border-border/60 backdrop-blur-md">
                  {CATEGORY_LABELS[item.category] || "Kültür"}
                </Badge>
              </div>
            </div>

            {/* Clickable Card Link Overlay */}
            <Link
              href={`/haber/${item.slug}`}
              className="card-link absolute inset-0 z-10"
              aria-label={item.title}
            />

            {/* Card Content */}
            <div className="flex flex-1 flex-col p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>{formatDate(item.publishedAt)}</span>
                {item.cityName && (
                  <span className="flex items-center gap-1 text-primary">
                    <MapPin className="h-3 w-3" />
                    <span>{item.cityName}</span>
                  </span>
                )}
              </div>

              <h3 className="line-clamp-2 text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>

              <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                {item.summary}
              </p>

              <div className="pt-3 mt-auto border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary">
                <span>Haberi Oku</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
