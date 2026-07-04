"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { PlaceData } from "@/lib/data/places";

import "leaflet/dist/leaflet.css";

// Fix default marker icon issue in Next.js
const markerIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type CityMapProps = {
  places: PlaceData[];
  center: [number, number];
  zoom?: number;
};

export function CityMapClient({ places, center, zoom = 11 }: CityMapProps) {
  const validPlaces = useMemo(
    () => places.filter((p) => p.lat != null && p.lng != null),
    [places]
  );

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-lg border">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validPlaces.map((place) => (
          <Marker
            key={place.slug}
            position={[place.lat, place.lng]}
            icon={markerIcon}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{place.name}</p>
                <p className="text-xs text-muted-foreground">
                  {place.category}
                </p>
                <Link
                  href={`/mekan/${place.slug}`}
                  className="text-xs text-primary underline"
                >
                  Detayları Gör
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
