import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArticleData } from "@/lib/data/articles";
import { ArrowRight, Calendar } from "lucide-react";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ArticleCard({ article }: { article: ArticleData }) {
  return (
    <Link href={`/blog/${article.slug}`}>
      <Card className="card-hover h-full overflow-hidden border-border/60">
        {article.coverImage && (
          <div className="relative h-44 w-full bg-muted">
            <img
              src={article.coverImage}
              alt={article.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <CardHeader className="pb-3">
          {article.citySlug && (
            <Badge variant="secondary" className="mb-2 w-fit">
              Şehir rehberi
            </Badge>
          )}
          <CardTitle className="text-lg leading-snug">{article.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
          {article.publishedAt && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(article.publishedAt)}
            </div>
          )}
          <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
            Oku
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
