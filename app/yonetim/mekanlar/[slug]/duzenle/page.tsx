import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePlace, deletePlace } from "@/lib/actions/admin";
import {
  getAdminPlaceBySlug,
  getAdminPlaceCategory,
} from "@/lib/data/admin";
import { getAllCities } from "@/lib/data/cities";
import { getAllCategories } from "@/lib/data/categories";
import { SubmitButton } from "@/components/admin/submit-button";
import { PlaceDescriptionField } from "@/components/admin/place-description-field";
import { ArrowLeft, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Mekan Düzenle",
};

export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [place, cities, categories] = await Promise.all([
    getAdminPlaceBySlug(slug),
    getAllCities(),
    getAllCategories(),
  ]);

  if (!place) notFound();

  const placeCategory = await getAdminPlaceCategory(place.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/yonetim/mekanlar">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Mekan Düzenle</h1>
        </div>
        <form action={deletePlace.bind(null, place.id)}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <form
        action={updatePlace.bind(null, slug)}
        className="space-y-6 rounded-lg border p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Mekan Adı</Label>
          <Input id="name" name="name" defaultValue={place.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={place.slug} required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city_slug">Şehir</Label>
            <Select name="city_slug" defaultValue={place.city_id} required>
              <SelectTrigger>
                <SelectValue placeholder="Şehir seçin" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_slug">Kategori</Label>
            <Select
              name="category_slug"
              defaultValue={placeCategory || categories[0]?.slug}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <PlaceDescriptionField defaultValue={place.description || ""} />

        <div className="space-y-2">
          <Label htmlFor="cover_image">Kapak Görseli URL</Label>
          <Input
            id="cover_image"
            name="cover_image"
            type="url"
            defaultValue={place.cover_image || ""}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adres</Label>
          <Input id="address" name="address" defaultValue={place.address || ""} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lat">Enlem</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              defaultValue={place.lat}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Boylam</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              defaultValue={place.lng}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Kaynak</Label>
          <Select name="source" defaultValue={place.source}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manuel</SelectItem>
              <SelectItem value="osm">OpenStreetMap</SelectItem>
              <SelectItem value="wikidata">Wikidata</SelectItem>
              <SelectItem value="google">Google Places</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              name="is_active"
              defaultChecked={place.is_active}
            />
            <Label htmlFor="is_active">Aktif</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_featured"
              name="is_featured"
              defaultChecked={place.is_featured}
            />
            <Label htmlFor="is_featured">Öne çıkan (SEO indeks)</Label>
          </div>
        </div>

        <SubmitButton>Güncelle</SubmitButton>
      </form>
    </div>
  );
}
