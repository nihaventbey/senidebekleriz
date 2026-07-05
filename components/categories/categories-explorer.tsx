"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/ads/ad-banner";
import {
  ExplorerHeroSection,
  pickCategoryHeroMosaic,
} from "@/components/explorer/explorer-hero-section";
import {
  getCategoryVisual,
  getCategoryVisualFromIconName,
} from "@/lib/data/category-icons";

export type CategoryListItem = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  coverImage: string | null;
};

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function CategoryCard({ category }: { category: CategoryListItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const visual =
    getCategoryVisual(category.slug) ??
    getCategoryVisualFromIconName(category.icon);
  const { Icon, heroBg } = visual;
  const showCover = Boolean(category.coverImage) && !imageFailed;

  return (
    <Link href={`/kategori/${category.slug}`}>
      <Card className="card-hover h-full overflow-hidden border-border/60">
        <div className="relative h-40 w-full overflow-hidden">
          {showCover ? (
            <img
              src={category.coverImage!}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${heroBg}`}
            >
              <Icon className="h-16 w-16 text-foreground/75" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <Icon className="h-4 w-4 text-white" />
            </div>
            <p className="font-semibold text-white drop-shadow">{category.name}</p>
          </div>
        </div>
        <CardContent className="pt-4">
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className="rounded-full gap-1.5"
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

type Props = {
  categories: CategoryListItem[];
  heroMosaic?: string[];
};

export function CategoriesExplorer({ categories, heroMosaic }: Props) {
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

  const mosaicImages = useMemo(
    () => heroMosaic ?? pickCategoryHeroMosaic(categories),
    [heroMosaic, categories]
  );

  function clearFilters() {
    setQuery("");
    setSlugFilter("");
  }

  return (
    <div>
      <ExplorerHeroSection
        mosaicImages={mosaicImages}
        badge="Kültür · Sanat · Tarih"
        title="Kategorilere Göre Keşfet"
        description="Müzeler, tarihi yerler, sanat mekanları ve parklar — ilgi alanına göre rotanı oluştur."
      >
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
      </ExplorerHeroSection>

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
            {categories.map((category) => {
              const { Icon } = getCategoryVisual(category.slug);
              return (
                <FilterPill
                  key={category.slug}
                  active={slugFilter === category.slug}
                  label={category.name}
                  Icon={Icon}
                  onClick={() =>
                    setSlugFilter(
                      slugFilter === category.slug ? "" : category.slug
                    )
                  }
                />
              );
            })}
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
