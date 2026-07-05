"use client";

import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EventSlideCard } from "@/components/events/event-card";
import type { PublicEvent } from "@/lib/data/events";

export function CulturalEventsSlider({ events }: { events: PublicEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Kültür ve Sanat Gündemi
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Duyurular, etkinlikler ve kültür haberleri — onaylı kaynaklardan.
          </p>
        </div>
      </div>

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
    </section>
  );
}
