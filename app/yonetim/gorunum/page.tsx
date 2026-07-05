import { getHeroSettings } from "@/lib/data/site-settings";
import { HeroSettingsForm } from "@/components/admin/hero-settings-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Görünüm",
};

export default async function AppearancePage() {
  const settings = await getHeroSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Görünüm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ana sayfa hero bölümünün arka plan görselini ve efektlerini yönetin.
        </p>
      </div>

      <HeroSettingsForm settings={settings} />
    </div>
  );
}
