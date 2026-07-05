import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { DeveloperCredit } from "@/components/layout/developer-credit";
import type { BrandSettings } from "@/lib/settings/branding";

type FooterProps = {
  brand?: BrandSettings;
};

export function Footer({ brand }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo brand={brand} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Türkiye'nin müzelerini, tarihi yerlerini ve sanat mekanlarını
              keşfedin.
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
                <Link href="/blog" className="transition-colors hover:text-foreground">
                  Gezi Rehberi
                </Link>
              </li>
              <li>
                <Link href="/sayfa/hakkimizda" className="transition-colors hover:text-foreground">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/sayfa/misyon" className="transition-colors hover:text-foreground">
                  Misyonumuz
                </Link>
              </li>
              <li>
                <Link href="/sayfa/vizyon" className="transition-colors hover:text-foreground">
                  Vizyonumuz
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
              Sanat, tarih ve kültür odaklı bir keşif platformu. Amacımız,
              müzeleri ve tarihi mekanları daha görünür kılmak; insanları bu
              alanlara yönlendirmek.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            © {currentYear} Seni de Bekleriz. Tüm hakları saklıdır.
          </p>
          <DeveloperCredit />
        </div>
      </div>
    </footer>
  );
}
