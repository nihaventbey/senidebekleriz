import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/sehir/:slug",
        destination: "/etkinlikler?sehir=:slug",
        permanent: true,
      },
      {
        source: "/sehirler",
        destination: "/etkinlikler",
        permanent: true,
      },
      {
        source: "/mekan/:slug",
        destination: "/etkinlikler",
        permanent: true,
      },
      {
        source: "/kategori/:slug",
        destination: "/haberler?kategori=:slug",
        permanent: true,
      },
      {
        source: "/kategoriler",
        destination: "/haberler",
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/haberler",
        permanent: true,
      },
      {
        source: "/blog/:slug",
        destination: "/haber/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
