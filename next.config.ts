import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@img/**/*",
      "./node_modules/sharp/**/*",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "e-cdns-images.dzcdn.net",
      },
      {
        protocol: "https",
        hostname: "*.biletix.com",
      },
      {
        protocol: "https",
        hostname: "*.passo.com.tr",
      },
      {
        protocol: "https",
        hostname: "*.biletinial.com",
      },
      {
        protocol: "https",
        hostname: "*.kultur.gov.tr",
      },
      {
        protocol: "http",
        hostname: "*.kultur.gov.tr",
      },
      {
        protocol: "https",
        hostname: "*.ibb.gov.tr",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/mekan/:slug",
        destination: "/etkinlikler",
        permanent: true,
      },
      {
        source: "/kategori/:slug",
        destination: "/haberler",
        permanent: true,
      },
      {
        source: "/kategoriler",
        destination: "/haberler",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
