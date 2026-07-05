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
    <section className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Kültür ve Sanat Gündemi
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Duyurular, etkinlikler ve kültür haberleri — onaylı kaynaklardan.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/etkinlikler">Tüm Etkinlikler</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border bg-muted/20 px-6 py-12 text-center text-muted-foreground">
          Şu an yayınlanmış etkinlik yok. Yeni duyurular eklendikçe burada
          görünecek.
        </div>
      ) : (
        <div className="relative px-12">
          <Carousel
            opts={{ loop: events.length > 1, align: "start" }}
            plugins={[
              Autoplay({
                delay: 6000,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
          >
            <CarouselContent>
              {events.map((event) => (
                <CarouselItem key={event.id}>
                  <EventSlideCard event={event} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {events.length > 1 && (
              <>
                <CarouselPrevious className="left-0 border-border bg-background/90" />
                <CarouselNext className="right-0 border-border bg-background/90" />
              </>
            )}
          </Carousel>
        </div>
      )}
    </section>
  );
}
