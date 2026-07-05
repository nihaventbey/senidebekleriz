"use client";

import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { EventSlideCard } from "@/components/events/event-card";
import type { PublicEvent } from "@/lib/data/events";

export function CulturalEventsSlider({ events }: { events: PublicEvent[] }) {
  return (
    <section className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            Kültür ve Sanat Gündemi
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm md:text-base">
            Duyurular, etkinlikler ve kültür haberleri — onaylı kaynaklardan.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="w-full shrink-0 sm:w-auto"
        >
          <Link href="/etkinlikler">Tüm Etkinlikler</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground sm:px-6 sm:py-12 sm:text-base">
          Şu an yayınlanmış etkinlik yok. Yeni duyurular eklendikçe burada
          görünecek.
        </div>
      ) : (
        <div className="relative md:px-10 lg:px-12">
          <Carousel
            opts={{ loop: events.length > 1, align: "start", dragFree: false }}
            plugins={[
              Autoplay({
                delay: 6000,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
          >
            <CarouselContent className="-ml-3 sm:-ml-4">
              {events.map((event) => (
                <CarouselItem
                  key={event.id}
                  className="basis-[92%] pl-3 sm:basis-full sm:pl-4"
                >
                  <EventSlideCard event={event} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {events.length > 1 && (
              <>
                <CarouselPrevious className="hidden border-border bg-background/95 shadow-md md:flex md:left-0 lg:-left-12" />
                <CarouselNext className="hidden border-border bg-background/95 shadow-md md:flex md:right-0 lg:-right-12" />
              </>
            )}
          </Carousel>
          {events.length > 1 && (
            <p className="mt-3 text-center text-xs text-muted-foreground md:hidden">
              Sonraki duyurular için kaydırın →
            </p>
          )}
        </div>
      )}
    </section>
  );
}
