"use client";

import dynamic from "next/dynamic";
import type { PlaceData } from "@/lib/data/places";

type CityMapProps = {
  places: PlaceData[];
  center: [number, number];
  zoom?: number;
};

const CityMapClient = dynamic(
  () => import("./city-map").then((mod) => mod.CityMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full animate-pulse rounded-lg bg-muted" />
    ),
  }
);

export function CityMap(props: CityMapProps) {
  return <CityMapClient {...props} />;
}
