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
        hostname: "**",
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
