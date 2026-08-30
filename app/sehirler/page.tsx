import { Metadata } from "next";
import { getAllCities } from "@/lib/data/cities";
import { CitiesExplorer } from "@/components/cities/cities-explorer";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";

export const metadata: Metadata = {
  title: "Şehirler",
  description:
    "Türkiye'nin 81 ilinde müzeler, tarihi yerler ve sanat mekanları.",
  alternates: {
    canonical: "/sehirler",
  },
  openGraph: {
    title: "Şehirler | Türkiye Kültür ve Sanat Rehberi",
    description: "Türkiye'nin 81 ilinde müzeler, tarihi yerler ve sanat mekanları.",
    type: "website",
  },
};

export const revalidate = 604800;

export default async function CitiesPage() {
  const cities = await getAllCities();

  const cityItems = cities.map((city) => ({
    slug: city.slug,
    name: city.name,
    region: city.region,
    description: city.description,
    coverImage: city.coverImage,
  }));

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Ana Sayfa", path: "/" },
          { name: "Şehirler", path: "/sehirler" },
        ]}
      />
      <CitiesExplorer cities={cityItems} />
    </>
  );
}
