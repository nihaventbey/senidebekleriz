import {
  getHeroSettings,
  getBrandSettings,
  getArtistCardSettings,
} from "@/lib/data/site-settings";
import { HeroSettingsForm } from "@/components/admin/hero-settings-form";
import { BrandingSettingsForm } from "@/components/admin/branding-settings-form";
import { ArtistCardSettingsForm } from "@/components/admin/artist-card-settings-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Görünüm",
};

export default async function AppearancePage() {
  const [heroSettings, brandSettings, artistCardSettings] = await Promise.all([
    getHeroSettings(),
    getBrandSettings(),
    getArtistCardSettings(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Görünüm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Logo, favicon, hero arka planı, bilgi kartları ve site görsellerini yönetin.
        </p>
      </div>

      <section id="bilgi-kartlari" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Sanatçı &amp; Topluluk Bilgi Kartları</h2>
          <p className="text-sm text-muted-foreground">
            Etkinlik sayfalarında yer alan resmi web sitesi bağlantısı ve AI destekli sanatçı/orkestra bilgi kartlarının görünürlüğünü kontrol edin.
          </p>
        </div>
        <ArtistCardSettingsForm settings={artistCardSettings} />
      </section>

      <section className="space-y-4 border-t pt-10">
        <div>
          <h2 className="text-lg font-semibold">Marka görselleri</h2>
          <p className="text-sm text-muted-foreground">
            Logo, favicon, Apple touch icon ve sosyal paylaşım görseli.
          </p>
        </div>
        <BrandingSettingsForm settings={brandSettings} />
      </section>

      <section className="space-y-4 border-t pt-10">
        <div>
          <h2 className="text-lg font-semibold">Ana sayfa hero</h2>
          <p className="text-sm text-muted-foreground">
            Hero arka plan görseli ve efektleri.
          </p>
        </div>
        <HeroSettingsForm settings={heroSettings} />
      </section>
    </div>
  );
}
