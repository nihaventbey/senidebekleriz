export type City = {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  description: string | null;
  cover_image: string | null;
  lat: number | null;
  lng: number | null;
  population: number | null;
  osm_id: string | null;
  wikidata_id: string | null;
  google_place_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
};

export type PlaceSource = "osm" | "wikidata" | "google" | "manual" | "belediye";

export type Place = {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  opening_hours: Record<string, unknown> | null;
  rating: number | null;
  review_count: number;
  photos: string[];
  cover_image: string | null;
  source: PlaceSource | null;
  osm_id: string | null;
  wikidata_id: string | null;
  google_place_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  city?: City;
  categories?: Category[];
};

export type Page = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  cover_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type AdPlacement = {
  id: string;
  name: string;
  position: string;
  ad_unit_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SyncLog = {
  id: string;
  source: string;
  entity_type: string;
  entity_id: string | null;
  status: "pending" | "success" | "error";
  message: string | null;
  created_at: string;
};
