import { getHeroSettings, getBrandSettings } from "@/lib/data/site-settings";
import { HeroSettingsForm } from "@/components/admin/hero-settings-form";
import { BrandingSettingsForm } from "@/components/admin/branding-settings-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Görünüm",
};

export default async function AppearancePage() {
  const [heroSettings, brandSettings] = await Promise.all([
    getHeroSettings(),
    getBrandSettings(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Görünüm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Logo, favicon, hero arka planı ve site görsellerini yönetin.
        </p>
      </div>

      <section className="space-y-4">
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
