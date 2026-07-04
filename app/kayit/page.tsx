import { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Seni de Bekleriz'e üye olun.",
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Kayıt Ol</h1>
          <p className="mt-2 text-muted-foreground">
            Ücretsiz hesap oluşturarak mekanları kaydetmeye başlayın.
          </p>
        </div>

        <AuthForm mode="register" />

        <p className="text-center text-sm text-muted-foreground">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="font-medium text-primary hover:underline">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
