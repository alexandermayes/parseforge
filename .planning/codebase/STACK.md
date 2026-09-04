# Technology Stack

**Analysis Date:** 2026-09-04

## Languages

**Primary:**
- TypeScript 5 - All application code
- JavaScript - Configuration files (`next.config.ts`, `eslint.config.mjs`)

**Secondary:**
- CSS - Tailwind v4 (PostCSS)
- JSON - Configuration and package management

## Runtime

**Environment:**
- Node.js 20 (installed at `~/.local/node20/bin`, not on default PATH)

**Package Manager:**
- npm with `package-lock.json`
- Lockfile: present at root

## Frameworks

**Core:**
- Next.js 16.1.6 (App Router) - Full-stack framework
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**UI & Components:**
- Radix UI 1.4.3 - Headless component library
- shadcn 3.8.5 - Predefined components on top of Radix
- Lucide React 0.576.0 - Icon library
- Motion 12.35.1 - Animation library
- Tailwind CSS 4 - Utility-first CSS framework
- @tailwindcss/postcss 4 - PostCSS plugin for Tailwind
- Tailwind Merge 3.5.0 - Merge Tailwind classes
- Class Variance Authority 0.7.1 - CSS variant management

**Data Fetching:**
- SWR 2.4.1 - React data fetching hook

**Analytics:**
- PostHog JS 1.360.0 - Product analytics and session replay (client-side)
- @vercel/analytics 2.0.1 - Vercel Web Vitals collection
- @vercel/speed-insights 2.0.0 - Real User Monitoring

**Testing:**
- Vitest 4.1.10 - Unit/integration test runner

**Build/Dev:**
- ESLint 9 - JavaScript/TypeScript linting
- eslint-config-next 16.1.6 - Next.js ESLint rules
- TypeScript 5 - Type checking
- @types/node 20 - Node.js type definitions
- @types/react 19 - React type definitions
- @types/react-dom 19 - React DOM type definitions
- tw-animate-css 1.4.0 - Tailwind animation utilities

## Key Dependencies

**Critical:**
- @upstash/redis 1.38.0 - Redis client for Upstash (shared cache, rate limiting)
- @upstash/ratelimit 2.0.8 - Rate limiting middleware

**Infrastructure:**
- next 16.1.6 - Next.js framework
- posthog-js 1.360.0 - PostHog analytics SDK
- @vercel/analytics 2.0.1 - Analytics collection
- @vercel/speed-insights 2.0.0 - Web Vitals monitoring

## Configuration

**Environment:**
- Vercel (deployment platform) - stores live credentials
- Environment variables: `WCL_CLIENT_ID`, `WCL_CLIENT_SECRET`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or native Upstash equivalents)
- Configuration managed in Vercel project settings (team `loot-list-plus`)

**Build:**
- `next.config.ts` - Custom Next.js configuration (CSP headers, rewrites, redirects)
- `tsconfig.json` - TypeScript compiler options (ES2017 target, bundler module resolution)
- `eslint.config.mjs` - ESLint configuration (Next.js rules + core Web Vitals)

## Platform Requirements

**Development:**
- Node.js 20+
- npm 8+
- Prepend `~/.local/node20/bin` to PATH to access node/npm/npx/vercel
- Run `npm ci` to install dependencies (development builds; full builds on Vercel)

**Production:**
- Vercel (Next.js App Router optimized platform)
- Upstash Redis provisioned via Vercel Marketplace
- WCL API access (OAuth credentials)
- PostHog project (ingestion via `/ingest` rewrite)
- Wowhead CDN access (tooltips.js)

## Deployment

**Manual via Vercel CLI:**
```bash
export PATH="$HOME/.local/node20/bin:$PATH"
vercel deploy --prod --scope loot-list-plus --yes
```

**Not git-triggered:** Pushing to `main` does NOT auto-deploy. All deployments are manual CLI invocations.

**Env vars take effect on deploy:** Changes in Vercel settings only apply to new deployments.

---

*Stack analysis: 2026-09-04*
