import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
