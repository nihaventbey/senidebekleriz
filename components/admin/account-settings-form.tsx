"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateAdminEmail, updateAdminPassword } from "@/lib/actions/account";
import { toast } from "@/lib/toast";

export function AccountSettingsForm({ email }: { email: string }) {
  const [emailPending, startEmailTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startEmailTransition(async () => {
      const result = await updateAdminEmail(formData);
      if (result.error) {
        toast.error("E-posta güncellenemedi", result.error);
        return;
      }
      toast.success("E-posta güncelleme isteği gönderildi", result.success);
      form.reset();
    });
  }

  function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startPasswordTransition(async () => {
      const result = await updateAdminPassword(formData);
      if (result.error) {
        toast.error("Şifre güncellenemedi", result.error);
        return;
      }
      toast.success("Şifre güncellendi", result.success);
      form.reset();
    });
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleEmailSubmit}
        className="space-y-4 rounded-lg border p-6"
      >
        <div>
          <h2 className="text-lg font-semibold">E-posta Adresi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mevcut: {email}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Yeni E-posta</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-current-password">Mevcut Şifre</Label>
          <Input
            id="email-current-password"
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" disabled={emailPending}>
          {emailPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          E-postayı Güncelle
        </Button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="space-y-4 rounded-lg border p-6"
      >
        <div>
          <h2 className="text-lg font-semibold">Şifre</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Güvenlik için mevcut şifrenizi doğrulamanız gerekir.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_password">Mevcut Şifre</Label>
          <Input
            id="current_password"
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new_password">Yeni Şifre</Label>
          <Input
            id="new_password"
            name="new_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Yeni Şifre (Tekrar)</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" disabled={passwordPending}>
          {passwordPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Şifreyi Güncelle
        </Button>
      </form>
    </div>
  );
}
