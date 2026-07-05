import type { ReactNode } from "react";

type Props = {
  badge: string;
  title: string;
  description: string;
  /** Gerçek kapak URL'leri — mozaik grid (ezilme yok, her kare kendi object-cover) */
  mosaicImages: string[];
  children?: ReactNode;
};

const MAX_TILES = 8;

function mosaicGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1 grid-rows-1";
  if (count === 2) return "grid-cols-2 grid-rows-1";
  if (count === 3) return "grid-cols-3 grid-rows-1";
  if (count === 4) return "grid-cols-2 grid-rows-2 sm:grid-cols-4 sm:grid-rows-1";
  if (count <= 6) return "grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2";
  return "grid-cols-2 grid-rows-4 sm:grid-cols-4 sm:grid-rows-2";
}

function HeroMosaic({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-slate-800 via-primary/40 to-amber-900/50"
      />
    );
  }

  const tiles = images.slice(0, MAX_TILES);

  return (
    <div
      aria-hidden
      className={`absolute inset-0 grid ${mosaicGridClass(tiles.length)}`}
    >
      {tiles.map((url, index) => (
        <div key={`${url}-${index}`} className="relative min-h-0 overflow-hidden">
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}

export function ExplorerHeroSection({
  badge,
  title,
  description,
  mosaicImages,
  children,
}: Props) {
  const unique = [...new Set(mosaicImages.filter(Boolean))];

  return (
    <section className="relative overflow-hidden bg-slate-950 py-14 sm:py-20 md:py-24">
      <HeroMosaic images={unique} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/65" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.06]" />

      <div className="container relative mx-auto px-4 text-center">
        <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
          {badge}
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 md:text-lg">
          {description}
        </p>
        {children ? (
          <div className="mx-auto mt-8 max-w-xl">{children}</div>
        ) : null}
      </div>
    </section>
  );
}

/** Şehir listesinden mozaik için kapak seç (önce bilinen iller, sonra diğerleri). */
export function pickCityHeroMosaic(
  cities: { slug: string; coverImage: string | null }[],
  limit = 8
): string[] {
  const preferred = [
    "istanbul",
    "ankara",
    "izmir",
    "antalya",
    "nevsehir",
    "trabzon",
    "gaziantep",
    "bursa",
  ];

  const withCover = cities.filter((c) => c.coverImage);
  const picked: string[] = [];

  for (const slug of preferred) {
    const city = withCover.find((c) => c.slug === slug);
    if (city?.coverImage) picked.push(city.coverImage);
  }

  for (const city of withCover) {
    if (picked.length >= limit) break;
    if (city.coverImage && !picked.includes(city.coverImage)) {
      picked.push(city.coverImage);
    }
  }

  return picked.slice(0, limit);
}

/** Kategori kapakları — mevcut kapak URL'leri (genelde 4). */
export function pickCategoryHeroMosaic(
  categories: { coverImage: string | null }[]
): string[] {
  return categories
    .map((c) => c.coverImage)
    .filter((url): url is string => Boolean(url));
}
