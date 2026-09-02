import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, ExternalLink, ArrowRight, Newspaper } from "lucide-react";
import type { PublicNewsArticle, NewsCategory } from "@/lib/data/news";
import { CulturalCoverPlaceholder } from "@/components/ui/cultural-cover-placeholder";

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  arkeoloji: "🏛️ Arkeoloji & Kazı",
  restorasyon: "🏰 Restorasyon & Tarih",
  muze_sergi: "🖼️ Müze & Sergi",
  kultur_sanat: "🎨 Kültür & Sanat",
  festival_haberleri: "🎪 Festival Gündemi",
  genel: "📰 Genel Kültür",
};

export const NEWS_CATEGORY_COLORS: Record<NewsCategory, string> = {
  arkeoloji: "bg-amber-600 text-white",
  restorasyon: "bg-stone-700 text-white",
  muze_sergi: "bg-blue-600 text-white",
  kultur_sanat: "bg-purple-600 text-white",
  festival_haberleri: "bg-emerald-600 text-white",
  genel: "bg-slate-700 text-white",
};

function formatNewsDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function NewsCard({ news }: { news: PublicNewsArticle }) {
  const categoryLabel = NEWS_CATEGORY_LABELS[news.category] || "Kültür";
  const categoryColor = NEWS_CATEGORY_COLORS[news.category] || "bg-primary text-white";
  const dateStr = formatNewsDate(news.publishedAt);
  const readingTime = estimateReadingTime(news.content);

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      {/* Cover Image Header */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {news.coverImage ? (
          <img
            src={news.coverImage}
            alt={news.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <CulturalCoverPlaceholder
            title={news.title}
            category={categoryLabel}
            cityName={news.cityName || undefined}
            iconSize="sm"
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Category & City Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className={`text-[11px] font-semibold px-2.5 py-0.5 shadow-xs border-0 ${categoryColor}`}>
            {categoryLabel}
          </Badge>
          {news.cityName && (
            <Badge variant="outline" className="bg-black/60 text-white border-white/20 text-[10px] backdrop-blur-xs">
              <MapPin className="h-2.5 w-2.5 mr-0.5" />
              {news.cityName}
            </Badge>
          )}
        </div>

        {/* Date on Bottom Left */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[11px] font-medium text-white/90 backdrop-blur-xs bg-black/60 px-2 py-0.5 rounded-md">
          <Calendar className="h-3 w-3" />
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-2.5">
          <h2 className="text-base font-bold leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/haber/${news.slug}`} className="hover:underline">
              {news.title}
            </Link>
          </h2>

          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {news.summary}
          </p>
        </div>

        {/* Footer Meta & Read Link */}
        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readingTime} dk okuma
          </span>

          <Link
            href={`/haber/${news.slug}`}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Haberi Oku
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FeaturedNewsHero({ newsList }: { newsList: PublicNewsArticle[] }) {
  if (!newsList || newsList.length === 0) return null;
  const main = newsList[0];
  const side = newsList.slice(1, 4);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Main Big Headline */}
      <div className="relative group overflow-hidden rounded-3xl border border-border/60 bg-card lg:col-span-8 shadow-sm flex flex-col justify-end min-h-[380px] sm:min-h-[460px]">
        {main.coverImage && (
          <img
            src={main.coverImage}
            alt={main.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 space-y-3 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-semibold text-xs px-3 py-1">
              🔥 Öne Çıkan Manşet
            </Badge>
            <Badge className={`${NEWS_CATEGORY_COLORS[main.category] || "bg-black/60"} text-white text-xs`}>
              {NEWS_CATEGORY_LABELS[main.category]}
            </Badge>
            {main.cityName && (
              <Badge variant="outline" className="border-white/30 text-white text-xs">
                {main.cityName}
              </Badge>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
            <Link href={`/haber/${main.slug}`} className="hover:underline">
              {main.title}
            </Link>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/85 line-clamp-2 max-w-2xl leading-relaxed">
            {main.summary}
          </p>

          <div className="flex items-center gap-4 text-xs text-white/70 pt-2">
            <span>{formatNewsDate(main.publishedAt)}</span>
            <span>•</span>
            <span>{estimateReadingTime(main.content)} dakika okuma</span>
          </div>
        </div>
      </div>

      {/* Side Headlines */}
      <div className="flex flex-col gap-4 lg:col-span-4 justify-between">
        {side.map((item) => (
          <article
            key={item.id}
            className="group flex gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-md flex-1 items-center"
          >
            {item.coverImage && (
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col justify-between min-w-0 space-y-1">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                {NEWS_CATEGORY_LABELS[item.category] || "Haber"}
              </span>
              <h3 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                <Link href={`/haber/${item.slug}`} className="hover:underline">
                  {item.title}
                </Link>
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">
                {formatNewsDate(item.publishedAt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
