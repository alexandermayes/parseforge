import type { NextConfig } from "next";

// Content-Security-Policy, shipped in Report-Only mode first: it logs violations
// to the browser console without blocking, so we can confirm the policy is
// complete against real traffic before promoting it to enforcing (a separate,
// manual step). 'unsafe-inline' covers Next's inline bootstrap scripts + the
// Wowhead config script in layout.tsx; 'unsafe-eval'/worker-src cover PostHog
// session replay; wow.zamimg.com serves Wowhead's tooltips.js + icons. PostHog
// ingestion is same-origin via the /ingest rewrite, so it needs no extra host.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://wow.zamimg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Benign hardening headers — safe on every route, including /og.
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Frame-blocking + CSP everywhere EXCEPT /og — link unfurlers fetch the
        // OG image and we don't want to risk interfering with that path.
        source: "/((?!og).*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async redirects() {
    return [
      // 301 redirect old domains to parseforge.gg to consolidate SEO authority
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.getlootlist.com" }],
        destination: "https://parseforge.gg/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "getlootlist.com" }],
        destination: "https://parseforge.gg/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.lootlistplus.com" }],
        destination: "https://parseforge.gg/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "lootlistplus.com" }],
        destination: "https://parseforge.gg/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.lootlistplus.dev" }],
        destination: "https://parseforge.gg/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "lootlistplus.dev" }],
        destination: "https://parseforge.gg/:path*",
        permanent: true,
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
