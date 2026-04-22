import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const CSP = [
  "default-src 'self' https://*.web3auth.io https://wallet.web3auth.io",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.hcaptcha.com https://*.hcaptcha.com https://*.web3auth.io https://cdn.segment.com https://js.stripe.com https://crypto-js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https: blob:",
  [
    "connect-src 'self'",
    "https://mainnet.base.org",
    "https://api.developer.coinbase.com",
    "https://base.llamarpc.com",
    "https://base-mainnet.infura.io",
    "https://base-rpc.publicnode.com",
    "https://*.walletconnect.com",
    "https://*.walletconnect.org",
    "wss://*.walletconnect.com",
    "wss://*.walletconnect.org",
    "https://*.cloudflare-eth.com",
    "https://explorer.walletconnect.com",
    "https://pulse.walletconnect.org",
    "https://api.etherscan.io",
    "https://api.basescan.org",
    "https://auth.web3auth.io",
    "https://*.web3auth.io",
    "https://api.web3modal.org",
    "https://*.web3modal.org",
    "https://api.web3modal.com",
    "wss://relay.walletconnect.com",
    "https://gateway.pinata.cloud",
    "https://*.mypinata.cloud",
    "https://ipfs.io",
    "https://cdn.segment.com",
    "https://api.segment.io",
    "https://*.hcaptcha.com",
    "https://sentry.hcaptcha.com",
    "wss://session.web3auth.io",
    "https://session.web3auth.io",
    "wss://passwordless.web3auth.io",
    "https://passwordless.web3auth.io",
    "https://mslxqfgiglarthzikbfv.supabase.co",
    "wss://mslxqfgiglarthzikbfv.supabase.co",
    "https://api.resend.com",
    "https://api.stripe.com",
    "https://crypto-js.stripe.com",
  ].join(" "),
  "frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org https://auth.web3auth.io https://*.web3auth.io https://wallet.web3auth.io https://*.hcaptcha.com https://newassets.hcaptcha.com https://crypto-js.stripe.com https://js.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy",       value: CSP },
  { key: "X-Content-Type-Options",        value: "nosniff" },
  { key: "X-Frame-Options",               value: "DENY" },
  { key: "X-XSS-Protection",              value: "1; mode=block" },
  { key: "Referrer-Policy",               value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security",     value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control",        value: "on" },
];

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    localPatterns: [{ pathname: '/assets/**' }, { pathname: '/icons/**' }],
    unoptimized: false,
  },
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    optimizePackageImports: ["viem"],  // wagmi/rainbowkit removed — prevents SES leaking into shared chunks
  },
};

export default withNextIntl(nextConfig);
