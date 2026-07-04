"use client";

import dynamic from "next/dynamic";

type PlaceMapProps = {
  lat: number;
  lng: number;
  name: string;
};

const PlaceMapClient = dynamic(
  () => import("./place-map").then((mod) => mod.PlaceMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full animate-pulse rounded-lg bg-muted" />
    ),
  }
);

export function PlaceMap(props: PlaceMapProps) {
  return <PlaceMapClient {...props} />;
}
