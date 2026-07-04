import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettingsForm } from "@/components/admin/account-settings-form";
import { getAdminAccountEmail } from "@/lib/actions/account";

export const metadata: Metadata = {
  title: "Hesap Ayarları",
};

export default async function AdminAccountPage() {
  const email = await getAdminAccountEmail();

  if (!email) {
    redirect("/yonetim/giris");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hesap Ayarları</h1>
        <p className="mt-2 text-muted-foreground">
          Yönetici e-posta adresinizi ve şifrenizi güncelleyin.
        </p>
      </div>

      <AccountSettingsForm email={email} />
    </div>
  );
}
