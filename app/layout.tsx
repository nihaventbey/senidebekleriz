import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdSenseScript } from "@/components/ads/adsense-script";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Seni de Bekleriz | Türkiye'nin Şehirleri ve Gezilecek Yerleri",
    template: "%s | Seni de Bekleriz",
  },
  description:
    "Türkiye'nin 81 ilini ve gezilecek yerlerini keşfedin. Şehir şehir mekanlar, tarihi yerler, müzeler, parklar ve gezi rehberleri.",
  keywords: [
    "Türkiye",
    "gezilecek yerler",
    "şehir rehberi",
    "mekanlar",
    "İstanbul",
    "İzmir",
    "Ankara",
  ],
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
    >
      <body className="min-h-full flex flex-col bg-background">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AdSenseScript />
      </body>
    </html>
  );
}
