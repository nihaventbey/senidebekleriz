import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchProvider } from "@/components/layout/search-provider";
import { AppToaster } from "@/components/ui/sonner";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { CookieConsent } from "@/components/layout/cookie-consent";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Seni de Bekleriz | Sanat, Tarih ve Kültür Rehberi",
    template: "%s | Seni de Bekleriz",
  },
  description:
    "Türkiye'nin müzeleri, tarihi yerleri, sanat mekanları ve kültürel durakları. Sanat ve tarihe yönelen keşif platformu.",
  keywords: [
    "Türkiye",
    "müzeler",
    "tarihi yerler",
    "sanat mekanları",
    "kültür rehberi",
    "gezi rehberi",
    "İstanbul",
    "İzmir",
    "Ankara",
  ],
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <SearchProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </SearchProvider>
        <div id="search-portal" />
        <AppToaster />
        <AdSenseScript />
      </body>
    </html>
  );
}
