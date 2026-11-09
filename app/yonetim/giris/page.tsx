import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Yönetim Girişi",
  description: "Seni de Bekleriz yönetim paneline giriş yapın.",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-muted/20">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Siteye Geri Dön</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border/80 bg-background p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Yönetim Paneli
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Devam etmek için yönetici hesabınızla giriş yapın.
            </p>
          </div>

          <AuthForm />
        </div>
      </div>
    </div>
  );
}
