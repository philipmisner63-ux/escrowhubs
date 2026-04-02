import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Note: No CSP — WalletConnect/RainbowKit requires external resources
];

const nextConfig: NextConfig = {
  // Security headers on all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Bundle optimization
  experimental: {
    optimizePackageImports: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
  },
};

export default nextConfig;
