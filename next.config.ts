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
        source: "/mekan/:slug",
        destination: "/etkinlikler",
        permanent: false,
      },
      {
        source: "/kategori/:slug",
        destination: "/haberler",
        permanent: false,
      },
      {
        source: "/kategoriler",
        destination: "/haberler",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
