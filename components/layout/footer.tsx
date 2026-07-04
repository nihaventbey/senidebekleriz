import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Türkiye'nin 81 ilini ve gezilecek yerlerini keşfedin.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Keşfet</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/sehirler" className="transition-colors hover:text-foreground">
                  Şehirler
                </Link>
              </li>
              <li>
                <Link href="/kategoriler" className="transition-colors hover:text-foreground">
                  Kategoriler
                </Link>
              </li>
              <li>
                <Link href="/sayfa/hakkimizda" className="transition-colors hover:text-foreground">
                  Hakkımızda
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Yasal</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/sayfa/kullanim-kosullari" className="transition-colors hover:text-foreground">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link href="/sayfa/gizlilik-politikasi" className="transition-colors hover:text-foreground">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/sayfa/iletisim" className="transition-colors hover:text-foreground">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Hakkında</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Seni de Bekleriz, Türkiye'nin şehirlerini ve gezilecek yerlerini
              tanıtan bir keşif platformudur.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Seni de Bekleriz. Tüm hakları saklıdır.
          </p>
          <Link
            href="/yonetim/giris"
            className="text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground"
          >
            Yönetim
          </Link>
        </div>
      </div>
    </footer>
  );
}
