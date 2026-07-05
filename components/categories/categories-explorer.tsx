"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  Camera,
  Landmark,
  Palette,
  Search,
  TreePine,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/ads/ad-banner";

export type CategoryListItem = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  coverImage: string | null;
};

const HERO_IMAGE = "/images/turkiye-kolaj.webp";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Landmark,
  Camera,
  TreePine,
  Palette,
};

const categoryAccent: Record<string, { icon: string }> = {
  "tarihi-yer": {
    icon: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  },
  muzeler: {
    icon: "bg-primary/12 text-primary",
  },
  "sanat-mekanlari": {
    icon: "bg-violet-500/12 text-violet-700 dark:text-violet-400",
  },
  parklar: {
    icon: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  },
};

const defaultAccent = {
  icon: "bg-primary/12 text-primary",
};

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function CategoryCard({ category }: { category: CategoryListItem }) {
  const Icon = iconMap[category.icon] || Landmark;
  const accent = categoryAccent[category.slug] ?? defaultAccent;

  return (
    <Link href={`/kategori/${category.slug}`}>
      <Card className="card-hover h-full overflow-hidden border-border/60">
        {category.coverImage ? (
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src={category.coverImage}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="font-semibold text-white drop-shadow">
                {category.name}
              </p>
            </div>
          </div>
        ) : (
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent.icon}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent className={category.coverImage ? "pt-4" : ""}>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

type Props = {
  categories: CategoryListItem[];
};

export function CategoriesExplorer({ categories }: Props) {
  const [query, setQuery] = useState("");
  const [slugFilter, setSlugFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const q = normalizeText(query.trim());

    return categories.filter((category) => {
      if (slugFilter && category.slug !== slugFilter) return false;
      if (!q) return true;

      const haystack = normalizeText(
        `${category.name} ${category.description} ${category.slug}`
      );
      return haystack.includes(q);
    });
  }, [categories, query, slugFilter]);

  const hasFilters = Boolean(query.trim() || slugFilter);

  function clearFilters() {
    setQuery("");
    setSlugFilter("");
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-hero-gradient py-14 sm:py-20 md:py-24">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.07]" />

        <div className="container relative mx-auto px-4 text-center">
          <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
            Kültür · Sanat · Tarih
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Kategorilere Göre Keşfet
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 md:text-lg">
            Müzeler, tarihi yerler, sanat mekanları ve parklar — ilgi alanına
            göre rotanı oluştur.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kategori ara..."
                className="h-12 rounded-xl border-white/20 bg-background/95 pl-12 pr-4 text-base shadow-lg backdrop-blur"
                aria-label="Kategori ara"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="mb-8">
          <AdBanner
            slot="categories-top"
            className="min-h-[90px] w-full"
            style={{ display: "block", minHeight: "90px", width: "100%" }}
          />
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={!slugFilter ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSlugFilter("")}
            >
              Tümü
            </Button>
            {categories.map((category) => (
              <Button
                key={category.slug}
                type="button"
                size="sm"
                variant={slugFilter === category.slug ? "default" : "outline"}
                className="rounded-full"
                onClick={() =>
                  setSlugFilter(
                    slugFilter === category.slug ? "" : category.slug
                  )
                }
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {filtered.length.toLocaleString("tr-TR")} kategori
              {hasFilters ? " bulundu" : ""}
            </span>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Temizle
              </Button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 py-16 text-center">
            <p className="text-muted-foreground">
              Aramanızla eşleşen kategori bulunamadı.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={clearFilters}
            >
              Filtreleri temizle
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 pb-12">
        <AdBanner
          slot="categories-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </div>
    </div>
  );
}
