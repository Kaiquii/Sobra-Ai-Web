import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(apiUrl
        ? [
            {
              hostname: apiUrl.hostname,
              pathname: "/uploads/**",
              port: apiUrl.port,
              protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
            },
          ]
        : []),
      {
        hostname: "objectstorage.sa-saopaulo-1.oraclecloud.com",
        pathname: "/n/grdi592jtydg/b/storage-app-financeiro/o/users/**",
        protocol: "https",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
