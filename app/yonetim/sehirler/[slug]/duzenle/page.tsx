import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updateCity, deleteCity } from "@/lib/actions/admin";
import { getAdminCityBySlug } from "@/lib/data/admin";
import { SubmitButton } from "@/components/admin/submit-button";
import { CityDescriptionField } from "@/components/admin/city-description-field";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { MetaFields } from "@/components/admin/meta-fields";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Şehir Düzenle",
};

export default async function EditCityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = await getAdminCityBySlug(slug);

  if (!city) notFound();

  const valilikCover = city.cover_image_source === "valilik";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/yonetim/sehirler">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Şehir Düzenle</h1>
        </div>
        <form action={deleteCity.bind(null, city.id)}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <form
        action={updateCity.bind(null, slug)}
        className="space-y-6 rounded-lg border p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Şehir Adı</Label>
          <Input id="name" name="name" defaultValue={city.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={city.slug} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Bölge</Label>
          <Input
            id="region"
            name="region"
            defaultValue={city.region}
          />
        </div>

        <CityDescriptionField
          slug={city.slug}
          defaultValue={city.description}
          descriptionSource={city.description_source}
        />

        {valilikCover && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Kapak görseli valilik kaynağından geliyor ve yanlış olabilir.
              &quot;Wikimedia öner&quot; ile düzeltin veya manuel yükleyin.
            </p>
          </div>
        )}

        <CoverImageField
          defaultValue={city.cover_image}
          source={city.cover_image_source}
          folder="cities"
          slug={city.slug}
          wikimediaSuggest
        />

        <MetaFields
          type="city"
          entityName={city.name}
          description={city.description || undefined}
          defaultMetaTitle={city.meta_title}
          defaultMetaDescription={city.meta_description}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="lat">Enlem</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              defaultValue={city.lat}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Boylam</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              defaultValue={city.lng}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="population">Nüfus</Label>
            <Input
              id="population"
              name="population"
              type="number"
              defaultValue={city.population}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="is_active"
            name="is_active"
            defaultChecked={city.is_active}
          />
          <Label htmlFor="is_active">Aktif</Label>
        </div>

        <SubmitButton>Güncelle</SubmitButton>
      </form>
    </div>
  );
}
