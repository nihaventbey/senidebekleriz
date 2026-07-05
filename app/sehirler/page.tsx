import { Metadata } from "next";
import { getAllCities } from "@/lib/data/cities";
import { CitiesExplorer } from "@/components/cities/cities-explorer";

export const metadata: Metadata = {
  title: "Şehirler",
  description:
    "Türkiye'nin 81 ilinde müzeler, tarihi yerler ve sanat mekanları.",
};

export const dynamic = "force-dynamic";

export default async function CitiesPage() {
  const cities = await getAllCities();

  const cityItems = cities.map((city) => ({
    slug: city.slug,
    name: city.name,
    region: city.region,
    description: city.description,
    coverImage: city.coverImage,
  }));

  return <CitiesExplorer cities={cityItems} />;
}
