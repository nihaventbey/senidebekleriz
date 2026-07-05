import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryData } from "@/lib/data/categories";
import { getCategoryVisual } from "@/lib/data/category-icons";

type Props = {
  categories: CategoryData[];
};

export function DiscoverCategoriesSection({ categories }: Props) {
  return (
    <section className="border-y border-border/40 bg-muted/15 py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-end justify-between gap-3 md:mb-6">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Compass className="h-3.5 w-3.5 text-primary" />
              </span>
              <h2 className="min-w-0 text-base font-bold leading-snug tracking-tight sm:text-xl md:text-2xl">
                Neye Göre Keşfetmek İstersin?
              </h2>
            </div>
            <p className="text-xs text-muted-foreground md:text-sm">
              İlgi alanına göre mekanları filtrele, rotanı oluştur.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/kategoriler">Tümü</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {categories.map((category) => {
            const { Icon, accent } = getCategoryVisual(category.slug);
            const glow =
              category.slug === "tarihi-yer"
                ? "group-hover:shadow-amber-500/10"
                : category.slug === "muzeler"
                  ? "group-hover:shadow-sky-500/10"
                  : category.slug === "sanat-mekanlari"
                    ? "group-hover:shadow-violet-500/10"
                    : category.slug === "parklar"
                      ? "group-hover:shadow-emerald-500/10"
                      : "group-hover:shadow-primary/10";

            return (
              <Link
                key={category.slug}
                href={`/kategori/${category.slug}`}
                className={`group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-border/60 bg-card/90 p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md ${glow} sm:gap-3 sm:p-3 md:flex-col md:items-start md:p-4 lg:items-center lg:text-center`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10 md:h-11 md:w-11 md:rounded-xl ${accent}`}
                >
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] md:h-5 md:w-5" />
                </div>

                <div className="min-w-0 flex-1 md:w-full">
                  <p className="truncate text-sm font-semibold leading-tight transition-colors group-hover:text-primary">
                    {category.name}
                  </p>
                  {category.description ? (
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px] md:mt-1 md:text-xs lg:line-clamp-2">
                      {category.description}
                    </p>
                  ) : null}
                </div>

                <ArrowUpRight className="absolute right-2 top-2 h-3 w-3 text-primary opacity-0 transition-all duration-300 group-hover:opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:right-2.5 sm:top-2.5 sm:h-3.5 sm:w-3.5" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
