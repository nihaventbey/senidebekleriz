import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArticleData } from "@/lib/data/articles";
import { getCityName } from "@/lib/cities/lookup";
import { ArrowRight, Calendar, MapPinned, BookOpen } from "lucide-react";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ArticleCard({ article }: { article: ArticleData }) {
  const isCityGuide = Boolean(article.citySlug);
  const cityName = article.citySlug ? getCityName(article.citySlug) || article.citySlug : null;

  return (
    <Link href={`/blog/${article.slug}`}>
      <Card className="card-hover h-full overflow-hidden border-border/60 flex flex-col justify-between">
        <div>
          {article.coverImage && (
            <div className="relative h-48 w-full bg-muted overflow-hidden">
              <img
                src={article.coverImage}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <CardHeader className="pb-2 pt-4">
            {isCityGuide ? (
              <Badge variant="secondary" className="mb-2 w-fit bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1 text-xs">
                <MapPinned className="h-3 w-3" />
                <span>{cityName} Gezi Rehberi</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="mb-2 w-fit text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 gap-1 text-xs">
                <BookOpen className="h-3 w-3" />
                <span>Kültür & Seyahat Blogu</span>
              </Badge>
            )}
            <CardTitle className="text-base font-bold leading-snug line-clamp-2">{article.title}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          </CardContent>
        </div>

        <CardContent className="pt-0 pb-4">
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            {article.publishedAt ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            ) : <div />}
            <div className="inline-flex items-center text-xs font-semibold text-primary">
              Rehberi Oku
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
