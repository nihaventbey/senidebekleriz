import Link from "next/link";
import { BookOpen, Compass, PenLine, Quote } from "lucide-react";
import type { ArticleData } from "@/lib/data/articles";

type Props = {
  articles: ArticleData[];
  totalCount?: number;
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogHero({ articles, totalCount }: Props) {
  const featured = articles[0];
  const stack = articles.slice(1, 3);

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-amber-50/80 via-background to-primary/5 py-12 dark:from-amber-950/20 dark:via-background dark:to-primary/10 sm:py-16 md:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 31px, hsl(var(--border) / 0.35) 31px, hsl(var(--border) / 0.35) 32px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 top-8 text-primary/10"
      >
        <Quote className="h-40 w-40 rotate-12" strokeWidth={1} />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              <PenLine className="h-3.5 w-3.5" />
              Editör yazıları
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Gezi Rehberi
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Rota önerileri, şehir hikâyeleri ve Türkiye&apos;yi anlatan özgün
              yazılar — fotoğraf kolajından farklı, okumaya davet eden bir alan.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                {(totalCount ?? articles.length).toLocaleString("tr-TR")} yazı
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-primary" />
                Şehir rotaları &amp; kültür notları
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            {featured ? (
              <Link
                href={`/blog/${featured.slug}`}
                className="group relative block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg transition-transform hover:-translate-y-0.5"
              >
                {featured.coverImage ? (
                  <div className="relative h-44 overflow-hidden sm:h-52">
                    <img
                      src={featured.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary/15 to-amber-500/10 sm:h-52">
                    <BookOpen className="h-12 w-12 text-primary/50" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Öne çıkan yazı
                  </p>
                  <h2 className="mt-2 text-lg font-bold leading-snug transition-colors group-hover:text-primary">
                    {featured.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {featured.excerpt}
                  </p>
                  {featured.publishedAt && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDate(featured.publishedAt)}
                    </p>
                  )}
                </div>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed bg-card/80 p-8 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  İlk gezi yazıları yakında burada öne çıkacak.
                </p>
              </div>
            )}

            {stack.length > 0 && (
              <div className="absolute -bottom-4 -left-4 hidden w-[72%] rotate-[-3deg] rounded-xl border bg-card/95 p-3 shadow-md backdrop-blur-sm sm:block">
                {stack.map((article) => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="block py-1.5 text-sm font-medium leading-snug hover:text-primary"
                  >
                    {article.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
