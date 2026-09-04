# Codebase Structure

**Analysis Date:** 2026-09-04

## Directory Layout

```
parseforge/
├── app/                          # Next.js 16 App Router
│   ├── page.tsx                  # Landing page (ISR every 1h)
│   ├── layout.tsx                # Root layout; PostHog + Wowhead config
│   ├── robots.ts                 # /robots.txt generator
│   ├── sitemap.ts                # Dynamic sitemap with recent reports
│   ├── manifest.ts               # PWA manifest
│   ├── opengraph-image.tsx        # OG image generator (fallback)
│   ├── og/route.tsx              # OG image generation endpoint
│   ├── analyze/
│   │   └── [reportCode]/
│   │       ├── page.tsx          # SSR report page; generateMetadata + rendering
│   │       ├── AnalyzeClient.tsx # Hydration boundary; state management
│   │       ├── ReportSummary.tsx # Server component; renders report meta summary
│   │       └── hooks/
│   │           ├── useReportMeta.ts       # Fetch report meta + auto-select fight
│   │           ├── useRaidOverview.ts     # Lazy-load raid-wide metrics
│   │           ├── usePlayerAnalysis.ts   # Lazy-load player DPS/HPS analysis
│   │           └── useCLA.ts              # Lazy-load class loadout audit
│   ├── api/
│   │   ├── report/[code]/
│   │   │   ├── route.ts          # GET /api/report/{code} → ReportMeta
│   │   │   └── players/route.ts  # GET /api/report/{code}/players?fightId=X
│   │   ├── analyze/route.ts      # POST /api/analyze → AnalysisResult
│   │   ├── raid-overview/route.ts # POST /api/raid-overview → RaidOverviewResult
│   │   └── cla/route.ts          # POST /api/cla → CLAResult
│   ├── components/               # Page-scoped React components
│   │   ├── AnalysisView.tsx      # Player DPS/HPS tab; shows percentiles + audit
│   │   ├── RaidOverview.tsx      # Raid tab; shows deaths, consumables, buff coverage
│   │   ├── CLAView.tsx           # CLA tab; class loadout audit per player
│   │   ├── FightSelector.tsx     # Dropdown to select encounter
│   │   ├── PlayerSelector.tsx    # Dropdown to select player for analysis
│   │   ├── PlayerQuickGrid.tsx   # Grid of players in fight (raid tab)
│   │   ├── PlayerAccordionRow.tsx # Expandable row for player details (CLA tab)
│   │   ├── DpsComparison.tsx     # Percentile chart + table
│   │   ├── GearComparison.tsx    # Gear audit vs top players
│   │   ├── TalentComparison.tsx  # Talent diff vs consensus
│   │   ├── AbilityBreakdown.tsx  # Damage/healing ability pie chart
│   │   ├── CastEfficiency.tsx    # Spell cast counts + efficiency
│   │   ├── BuffUptimeComparison.tsx # Buff uptime % vs top players
│   │   ├── CLABuffComparison.tsx # Buff uptime audit (CLA tab)
│   │   ├── CLABuffTable.tsx      # Buff status table (CLA tab)
│   │   ├── CLAGearIssues.tsx     # Gear/enchant/gem audit (CLA tab)
│   │   ├── CLAClassBuffs.tsx     # Class-specific buff audit (CLA tab)
│   │   ├── AbilityPriorityHeatmap.tsx # Ability priority heatmap (advanced)
│   │   ├── LandingHero.tsx       # Hero section + URL form
│   │   ├── ReportUrlForm.tsx     # Form to paste WCL URL
│   │   ├── FeaturedReports.tsx   # Recent public reports (homepage)
│   │   ├── RecentReports.tsx     # Client-side recent reports from localStorage
│   │   ├── Navbar.tsx            # Navigation header
│   │   ├── RoleBadge.tsx         # Small role indicator (tank/heal/dps)
│   │   ├── SpellLink.tsx         # Link to Wowhead spell/item
│   │   ├── SortableTableHead.tsx # Table header with sort indicators
│   │   ├── ComparisonSummary.tsx # Summary stats box
│   │   └── PostHogProvider.tsx   # PostHog analytics context
│   ├── guides/
│   │   ├── page.tsx              # /guides hub page
│   │   ├── how-to-analyze-wow-classic-logs/page.tsx
│   │   ├── improve-dps-wow-classic/page.tsx
│   │   ├── raid-preparation-checklist/page.tsx
│   │   ├── wow-classic-loot-council-tools/page.tsx
│   │   └── warcraft-logs-vs-parseforge/page.tsx
│   └── tbc-audit/page.tsx        # TBC raid-wide audit page
│
├── lib/                          # Business logic, utilities, external integration
│   ├── analysis-engine.ts        # Player DPS/HPS percentiles, gear/talent/buff analysis, suggestions
│   ├── raid-overview-engine.ts   # Raid-wide metrics, role assignment, consumables, buff coverage
│   ├── cla-engine.ts             # Class loadout audit: gear, enchants, gems, consumables, buffs
│   ├── wcl-client.ts             # GraphQL client, OAuth token cache, retry/timeout, error classification
│   ├── wcl-queries.ts            # GraphQL query strings + types
│   ├── wcl-fetchers.ts           # Top players fetcher (parallelized)
│   ├── wcl-helpers.ts            # Spec detection, talent parsing, etc.
│   ├── wcl-types.ts              # TypeScript types for WCL API responses
│   ├── kv-cache.ts               # Shared cache (Redis with fallback), locks, recent reports
│   ├── api-utils.ts              # Cached API handler, error mapping, body parsing, validation
│   ├── report-meta.ts            # SSR report metadata fetch wrapped in React cache()
│   ├── rate-limit.ts             # Per-IP, per-route rate limiting via Upstash
│   ├── constants.ts              # Gear slots, class colors, spec icons, buff/item IDs, WoW game constants
│   ├── cla-constants.ts          # Large gem/enchant/consumable/talent ID databases (generated from wago.tools)
│   ├── observability.ts          # Event logging for metrics
│   ├── url-parser.ts             # Parse WCL URLs to extract report code
│   ├── url-parser.test.ts        # Tests for URL parser
│   ├── analysis-engine.test.ts   # Unit tests for analysis logic
│   ├── api-utils.test.ts         # Tests for error handling + validation
│   ├── async-pool.ts             # Worker pool for parallelized fetching
│   ├── async-pool.test.ts        # Tests for pool
│   ├── utils.ts                  # General-purpose utilities
│   ├── use-url-tab-state.ts      # Hook for managing tab state in URL
│   ├── use-wowhead.ts            # Hook to inject Wowhead tooltip script
│   ├── recent-reports.ts         # Client-side localStorage for recently viewed reports
│   ├── demo-report.ts            # Demo report code for examples
│   ├── analysis-history.ts       # Client-side analysis history (unused but kept)
│   ├── cla-constants.test.ts     # Validation tests for CLA constants (ID database integrity)
│   └── wcl-queries.test.ts       # Query string validation tests (if needed)
│
├── components/                   # Shared UI component library (shadcn/ui primitives)
│   └── ui/
│       ├── button.tsx            # Base button component
│       ├── card.tsx              # Card container
│       ├── alert.tsx             # Alert box
│       ├── skeleton.tsx          # Skeleton loader
│       ├── badge.tsx             # Badge/pill
│       ├── select.tsx            # Dropdown select
│       ├── input.tsx             # Text input
│       ├── tabs.tsx              # Tab navigation
│       ├── tooltip.tsx           # Tooltip
│       ├── sheet.tsx             # Drawer/modal
│       ├── accordion.tsx         # Accordion
│       ├── scroll-area.tsx       # Scrollable container
│       ├── use-toast.ts          # Toast notifications
│       ├── toast.tsx             # Toast component
│       ├── table.tsx             # Table primitives
│       ├── progress.tsx          # Progress bar
│       ├── separator.tsx         # Divider
│       ├── shine-border.tsx      # Animated border effect
│       ├── meteors.tsx           # Animated background (with pre-existing lint debt)
│       └── ...other shadcn/ui primitives...
│
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── ...images...
│
├── .planning/
│   └── codebase/                 # This codebase analysis (generated by GSD mapper)
│
├── .claude/                      # Claude Code configuration
│   ├── settings.local.json       # Local settings (hooks, etc.)
│   └── gsd-*                     # GSD tool state files
│
├── .github/                      # GitHub config (workflows, etc.)
│
├── .vercel/                      # Vercel project config
│
├── .next/                        # Next.js build output (ignored in git)
│
├── bot/                          # Standalone Discord bot (separate project)
│
├── node_modules/                 # Dependencies (ignored in git)
│
├── package.json                  # Project metadata, scripts, dependencies
├── package-lock.json             # Locked dependency versions
├── tsconfig.json                 # TypeScript config (paths: @/* → ./*)
├── next.config.ts                # Next.js config (CSP headers, rewrites, redirects)
├── vitest.config.ts              # Vitest test runner config
├── eslint.config.mjs             # ESLint rules (Next.js preset)
├── postcss.config.mjs            # PostCSS config (Tailwind)
├── components.json               # shadcn/ui config
├── CLAUDE.md                     # Project operational guide (gitignored; local-only)
├── PRODUCTION_HARDENING.md       # Hardening work history (reference docs)
├── .gitignore                    # Git ignore rules
├── README.md                     # Project README
└── skills-lock.json              # GSD skills lockfile
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router; all pages, API routes, layouts, and metadata
- Contains: Page components (TSX), server components, client components, hooks, API route handlers
- Key files: `page.tsx` (landing), `analyze/[reportCode]/page.tsx` (SSR analysis), `api/**/route.ts` (backends)

**`lib/`:**
- Purpose: Business logic, utilities, external integration, data access
- Contains: Analysis engines, WCL client, caching, API utilities, constants, helpers
- Key files: `analysis-engine.ts`, `wcl-client.ts`, `kv-cache.ts`, `constants.ts`, `cla-constants.ts`

**`components/ui/`:**
- Purpose: Reusable shadcn/ui component library (button, card, table, etc.)
- Contains: Primitive UI components, not app-specific
- Sourced from: `shadcn` CLI; customizable via component.json

**`public/`:**
- Purpose: Static assets (favicons, images, static files)
- Served at: `/` in production

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated by: GSD mapper agent
- Used by: GSD planner and executor agents to understand patterns and conventions

**`.claude/`:**
- Purpose: Claude Code configuration and state
- Contains: `settings.local.json` (local settings, hooks), GSD state files
- Not committed: Local-only per user

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Landing page (public root)
- `app/analyze/[reportCode]/page.tsx`: Report analysis page (SSR)
- `app/layout.tsx`: Root layout (sets up providers, headers, metadata defaults)

**Configuration:**
- `tsconfig.json`: TypeScript compiler options; path alias `@/*` → `./`
- `next.config.ts`: Next.js configuration (CSP headers, rewrites, redirects)
- `package.json`: Dependencies, scripts, project metadata
- `vitest.config.ts`: Test runner configuration
- `.env.example`: Template for environment variables (WCL_CLIENT_ID, WCL_CLIENT_SECRET, Redis URLs, PostHog keys)

**Core Logic:**
- `lib/analysis-engine.ts`: Player performance analysis (percentiles, gear, talent, improvements)
- `lib/raid-overview-engine.ts`: Raid-wide metrics (deaths, consumables, buff coverage)
- `lib/cla-engine.ts`: Class loadout audit (gear audit, enchants, gems, buffs)
- `lib/wcl-client.ts`: GraphQL client, token management, caching
- `lib/wcl-queries.ts`: GraphQL query definitions
- `lib/constants.ts`: Game constants (gear slots, class/spec data, buff IDs)
- `lib/cla-constants.ts`: Large reference database (gem, enchant, consumable, talent IDs)

**Testing:**
- `lib/**/*.test.ts`: Unit tests for utilities and engines
- `vitest.config.ts`: Vitest configuration

**API Routes:**
- `app/api/report/[code]/route.ts`: Fetch report metadata
- `app/api/report/[code]/players/route.ts`: Get players in fight
- `app/api/analyze/route.ts`: Player analysis (DPS/HPS percentiles, gear, talents)
- `app/api/raid-overview/route.ts`: Raid-wide metrics
- `app/api/cla/route.ts`: Class loadout audit

**Client Components (Pages):**
- `app/analyze/[reportCode]/AnalyzeClient.tsx`: Interactive client component
- `app/analyze/[reportCode]/hooks/*`: Custom hooks for data fetching

**UI Components:**
- `app/components/AnalysisView.tsx`: Player DPS/HPS tab
- `app/components/RaidOverview.tsx`: Raid metrics tab
- `app/components/CLAView.tsx`: Class audit tab

## Naming Conventions

**Files:**
- Page components: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Server components: Default; use `"use client"` directive for client components
- Test files: `*.test.ts` or `*.spec.ts` (suffix before extension)
- Hooks: `use*.ts` or `use*.tsx` (React convention)
- Engine files: `*-engine.ts` (analysis-engine.ts, raid-overview-engine.ts, etc.)
- Database/constant files: `*-constants.ts` (cla-constants.ts) or `constants.ts`

**Directories:**
- Feature directories: Plural lowercase (components/, api/, guides/)
- Scoped directories: `[param]/` for dynamic segments (Next.js convention)
- Nested routes: Use directories with `route.ts` inside

**TypeScript / Code:**
- Type files: `*-types.ts` (wcl-types.ts)
- Helper files: `*-helpers.ts` (wcl-helpers.ts)
- Utility files: `*-utils.ts` or `utils.ts` (api-utils.ts)
- Constants: UPPERCASE with underscores (CLASS_COLORS, GEAR_SLOTS, MAX_RETRIES)
- Functions: camelCase (analyzeDps, buildAnalysisResult, getAccessToken)
- Interfaces: PascalCase (AnalysisResult, RaidOverviewResult, WCLError)

## Where to Add New Code

**New Feature (e.g., "Add player comparison timeline"):**
- Primary code: `lib/analysis-engine.ts` (add analysis logic) + `app/api/analyze/route.ts` (expose via API)
- UI component: `app/components/TimelineComparison.tsx`
- Tests: `lib/analysis-engine.test.ts` (add test case)
- Types: Add to `lib/wcl-types.ts` if API response shape changes

**New Analysis Type (e.g., "Add consumable optimizer"):**
- Engine: `lib/consumable-optimizer-engine.ts`
- API route: `app/api/consumable-optimizer/route.ts`
- Hook: `app/analyze/[reportCode]/hooks/useConsumableOptimizer.ts`
- Component: `app/components/ConsumableOptimizer.tsx`
- Add tab to `AnalyzeClient.tsx` (type TabMode, switch statement)

**New Component/Module:**
- Reusable UI primitives: `components/ui/` (shadcn/ui style)
- Page-scoped components: `app/components/`
- Business logic: `lib/`

**Utilities:**
- Shared helpers: `lib/utils.ts` or specific `lib/*-utils.ts` file
- WCL-related: `lib/wcl-*.ts` (queries, types, fetchers, helpers, client)
- Constants: `lib/constants.ts` (game data) or `lib/cla-constants.ts` (large tables)

## Special Directories

**`.next/`:**
- Purpose: Next.js build output (static assets, server functions, etc.)
- Generated: Yes (by `npm run build`)
- Committed: No (gitignored)

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm ci`)
- Committed: No (gitignored)

**`.planning/codebase/`:**
- Purpose: Codebase mapping documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes (by GSD mapper agent)
- Committed: Yes (checked in so all agents see current state)

**`bot/`:**
- Purpose: Discord bot for raid notifications (separate from main app)
- Scope: Standalone; uses some shared types from `lib/` but independent CI
- Note: Excluded from main tsconfig.json

---

*Structure analysis: 2026-09-04*
