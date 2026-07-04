import { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Seni de Bekleriz hesabınıza giriş yapın.",
};

export default function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Giriş Yap</h1>
          <p className="mt-2 text-muted-foreground">
            Hesabınıza giriş yaparak favori mekanlarınızı kaydedin.
          </p>
        </div>

        <AuthForm mode="login" />

        <p className="text-center text-sm text-muted-foreground">
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="font-medium text-primary hover:underline">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}
