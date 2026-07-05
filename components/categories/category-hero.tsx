"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getCategoryVisual } from "@/lib/data/category-icons";

type Props = {
  slug: string;
  name: string;
  description: string;
  coverUrl: string | null;
};

export function CategoryHero({ slug, name, description, coverUrl }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const { Icon, heroBg } = getCategoryVisual(slug);
  const showCover = Boolean(coverUrl) && !imageFailed;

  return (
    <section className="relative overflow-hidden bg-hero-gradient py-10 sm:py-12 md:py-16">
      {showCover ? (
        <>
          <img
            src={coverUrl!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${heroBg}`}
          aria-hidden
        />
      )}
      <div className="container relative mx-auto px-4">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            Kategori
          </Badge>
          <div className="flex items-start gap-4">
            {!showCover && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-background/80 shadow-sm backdrop-blur-sm">
                <Icon className="h-8 w-8 text-foreground/80" strokeWidth={1.5} />
              </div>
            )}
            <div>
              <h1
                className={`text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl ${showCover ? "text-white" : ""}`}
              >
                {name}
              </h1>
              <p
                className={`mt-4 max-w-3xl text-base md:text-lg ${showCover ? "text-white/90" : "text-muted-foreground"}`}
              >
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
