"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { getCityName } from "@/lib/cities/lookup";
import { BookmarkButton } from "@/components/common/bookmark-button";

type Props = {
  id?: string;
  slug?: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  coverUrl: string | null;
  citySlug?: string | null;
  contentLength?: number;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ArticleHero({
  id,
  slug,
  title,
  excerpt,
  publishedAt,
  coverUrl,
  citySlug,
  contentLength = 2000,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const showCover = Boolean(coverUrl) && !imageFailed;
  const cityName = citySlug ? getCityName(citySlug) : null;
  const estimatedMinutes = Math.max(2, Math.ceil(contentLength / 600));

  return (
    <section className="relative overflow-hidden bg-hero-gradient py-12 sm:py-14 md:py-20">
      {showCover ? (
        <>
          <img
            src={coverUrl!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/70"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-amber-900/20"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 via-amber-500/10 to-amber-900/15"
          aria-hidden
        />
      )}
      <div
        className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-[0.08]"
        aria-hidden
      />

      <div className="container relative mx-auto px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={
              showCover
                ? "text-white hover:bg-white/10 hover:text-white"
                : ""
            }
          >
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tüm Yazılar
            </Link>
          </Button>

          {slug && (
            <BookmarkButton
              item={{
                id: id || slug,
                title,
                slug,
                type: "article",
                coverImage: coverUrl,
                cityName,
              }}
              className={showCover ? "bg-white/15 text-white border-white/20 hover:bg-white/25" : ""}
            />
          )}
        </div>

        <div className="max-w-3xl">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className={showCover ? "bg-white/15 text-white backdrop-blur-sm" : ""}
            >
              Editör Yazısı
            </Badge>
            <Badge
              variant="outline"
              className={`gap-1 ${
                showCover
                  ? "border-white/30 bg-white/10 text-white backdrop-blur-sm"
                  : ""
              }`}
            >
              ⏱️ {estimatedMinutes} dk okuma süresi
            </Badge>
            {citySlug && cityName && (
              <Link href={`/sehir/${citySlug}`}>
                <Badge
                  variant="outline"
                  className={`gap-1 ${
                    showCover
                      ? "border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                      : ""
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  {cityName} rehberi
                </Badge>
              </Link>
            )}
          </div>

          <h1
            className={`text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl ${
              showCover ? "text-white" : ""
            }`}
          >
            {title}
          </h1>

          {publishedAt && (
            <p
              className={`mt-4 flex items-center gap-2 text-sm ${
                showCover ? "text-white/85" : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-4 w-4" />
              {formatDate(publishedAt)}
            </p>
          )}

          {excerpt && (
            <p
              className={`mt-4 max-w-2xl text-base leading-relaxed md:text-lg ${
                showCover ? "text-white/90" : "text-muted-foreground"
              }`}
            >
              {excerpt}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
