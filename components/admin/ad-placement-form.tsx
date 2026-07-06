import { AD_SLOT_OPTIONS } from "@/lib/ads/slots";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/admin/submit-button";

type Props = {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    name?: string;
    position?: string;
    ad_unit_id?: string | null;
    ad_format?: string | null;
    ad_layout_key?: string | null;
    is_active?: boolean;
  };
  positionReadOnly?: boolean;
};

export function AdPlacementForm({
  action,
  defaultValues,
  positionReadOnly = false,
}: Props) {
  return (
    <form action={action} className="space-y-6 rounded-lg border p-6">
      <div className="space-y-2">
        <Label htmlFor="name">Birim adı</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Sayfa pozisyonu</Label>
        {positionReadOnly ? (
          <>
            <Input
              id="position"
              name="position"
              defaultValue={defaultValues?.position}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Pozisyon değiştirmek için yeni birim oluşturun.
            </p>
          </>
        ) : (
          <select
            id="position"
            name="position"
            required
            defaultValue={defaultValues?.position || ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Pozisyon seçin
            </option>
            {AD_SLOT_OPTIONS.map((option) => (
              <option key={option.position} value={option.position}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ad_unit_id">AdSense slot ID</Label>
        <Input
          id="ad_unit_id"
          name="ad_unit_id"
          inputMode="numeric"
          placeholder="2262107929"
          defaultValue={defaultValues?.ad_unit_id || ""}
        />
        <p className="text-xs text-muted-foreground">
          Google AdSense kodundaki{" "}
          <code className="rounded bg-muted px-1">data-ad-slot</code> değeri.
          Ana script zaten sitede yüklü; yalnızca bu numarayı girin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ad_format">Format</Label>
          <select
            id="ad_format"
            name="ad_format"
            defaultValue={defaultValues?.ad_format || "auto"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="auto">Otomatik (responsive)</option>
            <option value="fluid">Fluid (in-feed)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ad_layout_key">Layout key (fluid)</Label>
          <Input
            id="ad_layout_key"
            name="ad_layout_key"
            placeholder="-fb+5w+4e-db+86"
            defaultValue={defaultValues?.ad_layout_key || ""}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaultValues?.is_active ?? true}
          className="size-4 rounded border border-input"
        />
        <span className="text-sm font-medium">Aktif</span>
      </label>

      <SubmitButton>Kaydet</SubmitButton>
    </form>
  );
}
