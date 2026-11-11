import Link from "next/link";
import { ArrowRight, BookOpen, Compass, MapPin, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ArticleData } from "@/lib/data/articles";
import { parseCoverImage } from "@/lib/media/cover-position";

type Props = {
  articles: ArticleData[];
};

export function CultureGuidesSection({ articles }: Props) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="border-t border-border/50 bg-muted/15 py-10 sm:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Gezi &amp; Kültür Rehberleri
          </h2>

          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            <span>Tüm Rehberler</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3-Column Magazine Card Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((article) => {
            const cover = parseCoverImage(article.coverImage);
            const articleHref = `/blog/${article.slug}`;
            return (
            <article
              key={article.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:border-indigo-500/40"
            >
              {/* Cover Image Container */}
              <Link
                href={articleHref}
                className="relative aspect-[16/10] w-full overflow-hidden bg-muted block"
                aria-label={article.title}
              >
                {cover.src ? (
                  <img
                    src={cover.src}
                    alt={article.title}
                    style={{ objectPosition: cover.objectPosition }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                    <BookOpen className="h-10 w-10 text-indigo-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* City Tag on Image */}
                {article.citySlug && (
                  <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    <MapPin className="h-3 w-3 text-indigo-400" />
                    <span className="capitalize">{article.citySlug}</span>
                  </span>
                )}
              </Link>

              {/* Content Body */}
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Link
                      href={articleHref}
                      className="text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[11px] tracking-wider hover:underline"
                    >
                      Gezi Rehberi
                    </Link>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      4 dk okuma
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                    <Link href={articleHref} className="hover:underline block">
                      {article.title}
                    </Link>
                  </h3>

                  <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <Link href={articleHref} className="hover:text-foreground block">
                      {article.excerpt}
                    </Link>
                  </p>
                </div>

                {/* Footer attribution */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Seni de Bekleriz Editörü</span>
                  <Link
                    href={articleHref}
                    className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:underline"
                  >
                    <span>Yazıyı Oku</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
