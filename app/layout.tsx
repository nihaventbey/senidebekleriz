import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdSenseScript } from "@/components/ads/adsense-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Seni de Bekleriz | Türkiye'nin Şehirleri ve Gezilecek Yerleri",
    template: "%s | Seni de Bekleriz",
  },
  description:
    "Türkiye'nin şehirlerini ve gezilecek yerlerini keşfedin. Şehir şehir mekanlar, fotoğraflar ve gezi rehberleri.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AdSenseScript />
      </body>
    </html>
  );
}
