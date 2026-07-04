import { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Yönetim Girişi",
  description: "Seni de Bekleriz yönetim paneline giriş yapın.",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Yönetim Paneli
          </h1>
          <p className="mt-2 text-muted-foreground">
            Devam etmek için yönetici hesabınızla giriş yapın.
          </p>
        </div>

        <AuthForm />
      </div>
    </div>
  );
}
