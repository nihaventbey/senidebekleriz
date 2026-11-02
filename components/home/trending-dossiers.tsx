import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Clock, Flame, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ArticleData } from "@/lib/data/articles";
import type { PublicNewsArticle } from "@/lib/data/news";

type Props = {
  articles: ArticleData[];
  news: PublicNewsArticle[];
};

export function TrendingDossiers({ articles, news }: Props) {
  // Combine articles and news into a curated list of top 5 trending culture stories
  const items = [
    ...articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: `/blog/${a.slug}`,
      excerpt: a.excerpt,
      coverImage: a.coverImage,
      category: "Gezi & Rehber",
      readTime: "5 dk okuma",
      badge: "Özel Dosya",
    })),
    ...news.map((n) => ({
      id: n.id,
      title: n.title,
      slug: `/haber/${n.slug}`,
      excerpt: n.summary,
      coverImage: n.coverImage,
      category: n.cityName ? `${n.cityName} · Haber` : "Kültür Gündemi",
      readTime: "3 dk okuma",
      badge: "Günün Trendi",
    })),
  ].slice(0, 5);

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      {/* Section Header - Ekşi Şeyler / Onedio Style */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 items-center gap-1 rounded-md bg-rose-500/10 px-2 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <Flame className="h-3 w-3 fill-rose-500" />
              Trendler &amp; Listeler
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              · Günün Öne Çıkan Kültür Seçkisi
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Günün En Çok İlgi Çeken Kültür Dosyaları
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Türkiye&apos;nin dört bir yanından kaçırılmayacak seyahat rehberleri, arkeolojik keşifler ve sahne haberleri.
          </p>
        </div>

        <Link
          href="/blog"
          className="group inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline shrink-0"
        >
          <span>Tüm Rehberleri Keşfet</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Grid of 5 Numbered Items (Ekşi Şeyler Style 01 - 05) */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top 1 Featured Card (Spans 2 columns on large screens) */}
        {items[0] && (
          <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-primary/50 md:col-span-2 lg:col-span-2 min-h-[320px]">
            {/* Background image & gradient overlay */}
            <div className="absolute inset-0 z-0 bg-muted">
              {items[0].coverImage ? (
                <img
                  src={items[0].coverImage}
                  alt={items[0].title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/80 to-primary/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />
            </div>

            {/* Top row: Number 01 badge & tag */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-lg font-black text-white shadow-md">
                01
              </span>
              <Badge className="bg-rose-600 text-white font-bold text-xs uppercase tracking-wider border-0 shadow-sm">
                {items[0].badge}
              </Badge>
            </div>

            {/* Bottom Content */}
            <div className="relative z-10 space-y-2.5 pt-12">
              <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                <span>{items[0].category}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {items[0].readTime}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug group-hover:text-rose-200 transition-colors">
                <Link href={items[0].slug} className="hover:underline">
                  {items[0].title}
                </Link>
              </h3>

              <p className="line-clamp-2 text-xs sm:text-sm text-white/80 max-w-xl font-normal leading-relaxed">
                {items[0].excerpt}
              </p>
            </div>
          </article>
        )}

        {/* Remaining 4 Numbered Cards */}
        {items.slice(1, 5).map((item, idx) => {
          const numberStr = `0${idx + 2}`;
          return (
            <article
              key={item.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/50"
            >
              <div className="flex items-start gap-4">
                {/* Number Indicator */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {numberStr}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span className="text-primary">{item.category}</span>
                    <span>·</span>
                    <span>{item.readTime}</span>
                  </div>

                  <h3 className="line-clamp-2 text-sm sm:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                    <Link href={item.slug} className="hover:underline">
                      {item.title}
                    </Link>
                  </h3>
                </div>
              </div>

              {/* Bottom Thumbnail preview & excerpt */}
              {item.coverImage && (
                <div className="mt-4 relative h-32 w-full overflow-hidden rounded-2xl bg-muted">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <p className="absolute bottom-2.5 left-3 right-3 line-clamp-1 text-xs text-white/90 font-medium">
                    {item.excerpt}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
