import {
  BookOpen,
  Film,
  Music,
  History,
  Users,
  Quote,
  Sparkles,
  Calendar,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CityCultureData } from "@/lib/data/city-culture";

type CityCultureSectionProps = {
  data: CityCultureData;
  cityName: string;
};

export function CityCultureSection({
  data,
  cityName,
}: CityCultureSectionProps) {
  const { books, movies, music, history, figures } = data;

  return (
    <div className="space-y-16 py-6">
      {/* 1. Edebiyat & Kitaplar */}
      {books && books.length > 0 && (
        <section id="edebiyat" className="scroll-mt-24">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                {cityName} Edebiyatı & Kitaplar
              </h2>
              <p className="text-sm text-muted-foreground">
                Bu kadim şehri anlatan başyapıtlar, romanlar ve unutulmaz dizeler.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book, idx) => (
              <Card
                key={idx}
                className="card-hover flex h-full flex-col justify-between border-border/60 bg-card/60 shadow-xs backdrop-blur-xs"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[11px] font-medium">
                      {book.genre}
                    </Badge>
                    {book.year && (
                      <span className="text-xs text-muted-foreground">
                        {book.year}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold leading-snug">
                    {book.title}
                  </CardTitle>
                  <p className="text-xs font-semibold text-primary">
                    {book.author}
                  </p>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {book.description}
                  </p>
                  {book.quote && (
                    <div className="relative rounded-lg border-l-2 border-amber-500/80 bg-amber-500/5 p-2.5 text-xs italic text-foreground/90">
                      <Quote className="absolute -top-1 right-1 h-3 w-3 text-amber-500/30" />
                      &ldquo;{book.quote}&rdquo;
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 2. Sinema & Filmler */}
      {movies && movies.length > 0 && (
        <section id="sinema" className="scroll-mt-24">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                Beyaz Perdede {cityName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {cityName} sokaklarında çekilen ve kentin ruhunu yansıtan sinema eserleri.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {movies.map((movie, idx) => (
              <Card
                key={idx}
                className="card-hover flex h-full flex-col justify-between border-border/60 bg-card/60 shadow-xs"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {movie.genre}
                    </Badge>
                    {movie.year && (
                      <span className="text-xs text-muted-foreground">
                        {movie.year}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold">
                    {movie.title}
                  </CardTitle>
                  <p className="text-xs font-medium text-muted-foreground">
                    Yönetmen: <span className="text-foreground font-semibold">{movie.director}</span>
                  </p>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {movie.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 3. Müzik & Ezgiler */}
      {music && music.length > 0 && (
        <section id="muzik" className="scroll-mt-24">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Music className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                Müzik, Türküler & Ezgiler
              </h2>
              <p className="text-sm text-muted-foreground">
                {cityName} ile özdeşleşen, dilden dile aktarılan türküler ve melodiler.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {music.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-4 shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {item.genre}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs font-medium text-primary/80 mb-2">
                    {item.artist}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Tarihi Dönüm Noktaları */}
      {history && history.length > 0 && (
        <section id="tarih" className="scroll-mt-24">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                Tarihi Dönüm Noktaları
              </h2>
              <p className="text-sm text-muted-foreground">
                {cityName} tarihinin akışını değiştiren kilit dönemler ve olaylar.
              </p>
            </div>
          </div>

          <div className="relative border-l-2 border-primary/20 pl-6 ml-4 space-y-8">
            {history.map((event, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Pin */}
                <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary shadow-xs transition-transform group-hover:scale-125" />
                <div className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-xs">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
                      <Calendar className="mr-1 h-3 w-3" />
                      {event.period}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-2">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Sanat İnsanları & Şahsiyetler */}
      {figures && figures.length > 0 && (
        <section id="sanatcilar" className="scroll-mt-24">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                Önemli Şahsiyetler & Sanatçılar
              </h2>
              <p className="text-sm text-muted-foreground">
                {cityName} kökenli veya bu topraklarda eser vermiş unutulmaz isimler.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {figures.map((figure, idx) => (
              <Card
                key={idx}
                className="card-hover flex h-full flex-col justify-between border-border/60 bg-card/60 shadow-xs"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px]">
                      {figure.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {figure.era}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold">
                    {figure.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {figure.description}
                  </p>
                  {figure.famousWorks && figure.famousWorks.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Öne Çıkan Eserleri:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {figure.famousWorks.map((work, wIdx) => (
                          <Badge
                            key={wIdx}
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            <Award className="mr-1 h-2.5 w-2.5 text-primary/70" />
                            {work}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
