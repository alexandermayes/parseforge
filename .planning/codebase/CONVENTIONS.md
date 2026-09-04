# Coding Conventions

**Analysis Date:** 2026-09-04

## Naming Patterns

**Files:**
- Utility/library files: `camelCase.ts` (e.g., `url-parser.ts`, `api-utils.ts`, `kv-cache.ts`)
- React components: `PascalCase.tsx` (e.g., `Navbar.tsx`, `LandingHero.tsx`, `ReportUrlForm.tsx`)
- Test files: `{name}.test.ts` or `{name}.test.tsx` (colocated in same directory as source, e.g., `url-parser.test.ts`)
- Type definition files: `{domain}-types.ts` (e.g., `wcl-types.ts`, `cla-types.ts`)

**Functions:**
- camelCase for all functions: `parseWCLUrl()`, `buildWCLUrl()`, `analyzeDps()`, `cachedApiHandler()`
- async functions explicitly declared: `async function waitForCache<T>()` with return type `Promise<T>`
- Private helpers prefixed with underscore or nested within modules: `extractFightSource()` is helper for `parseWCLUrl()`

**Variables:**
- camelCase for all local and module-level variables: `playerDps`, `medianDps`, `cachedToken`, `tokenExpiresAt`
- boolean prefixes with `is`, `has`, `using`: `isValidReportCode()`, `hasValue`, `usingSharedCache`
- collection names pluralized: `dpsValues`, `features`, `GEAR_SLOTS`, `JUNK_SPELL_IDS`

**Types/Interfaces:**
- PascalCase for all types: `ParsedWCLUrl`, `WCLError`, `ConsumableStatus`, `DpsComparison`, `AnalysisResult`
- Type aliases distinguished from interfaces by purpose (see `wcl-types.ts`)
- Union types capitalized: `WCLErrorKind = "not_found" | "private" | "rate_limited" | "timeout" | "upstream"`

**Constants:**
- SCREAMING_SNAKE_CASE for constant values: `TOKEN_CACHE_KEY`, `CACHE_WAIT_MS`, `CACHE_POLL_MS`, `REPORT_CODE_RE`
- Constants grouped by domain at module level (see `constants.ts` for `CLASS_COLORS`, `GEAR_SLOTS`, `SPEC_ICONS`)
- Regex patterns named with `_RE` suffix: `REPORT_CODE_RE = /^[a-zA-Z0-9]{10,20}$/`
- Database/lookup constants named with `_DB` suffix: `ENCHANT_NAME_DB`, `CONSUMABLE_DB`, `GEM_NAME_DB`

## Code Style

**Formatting:**
- No explicit Prettier or formatting tool configured; code follows ESLint rules from Next.js config
- 2-space indentation (standard JavaScript)
- Lines respect reasonable length; no hard limit enforced but typically under 100 chars
- No trailing semicolons on module-level statements (follows ESM convention in most cases)

**Linting:**
- ESLint 9 with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Run via `npm run lint` (alias for `eslint`)
- Pre-existing lint debt in `components/ui/meteors.tsx` and `lib/analysis-engine.ts` — leave as-is, do not add to
- Next.js core web vitals rules enforce accessibility, performance, and SEO best practices

**TypeScript:**
- Strict mode enabled (`"strict": true` in tsconfig.json)
- Target ES2017 (Node 14+ compatible)
- JSX via React 19's new JSX transform (no React import required)
- Path alias `@/*` maps to repo root, used throughout for absolute imports
- Type checks run via `npx tsc --noEmit` before declaring work done

## Import Organization

**Order:**
1. Standard library imports (`node:*`)
2. External package imports (Next.js, React, UI libraries, utilities)
3. Internal lib imports with `@/lib/` alias
4. Internal component imports with `@/components/` alias
5. Relative imports (uncommon; use `@/` aliases instead)

**Example from `app/layout.tsx`:**
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import PostHogProvider from "./components/PostHogProvider";
```

**Path Aliases:**
- `@/*` resolves to repo root (configured in tsconfig.json)
- Always use absolute paths via `@/` for imports, never relative paths like `../../../`
- This keeps imports stable even when files are refactored or moved within `/app` or `/lib`

## Error Handling

**Pattern: Custom Error Classes**

Use typed error classes that map to user-friendly messages and correct HTTP status codes:

```typescript
// wcl-client.ts
export type WCLErrorKind =
  | "not_found"
  | "private"
  | "rate_limited"
  | "timeout"
  | "upstream";

const WCL_ERROR_INFO: Record<WCLErrorKind, { status: number; message: string }> = {
  not_found: {
    status: 404,
    message: "That report doesn't exist. Double-check the Warcraft Logs URL.",
  },
  // ...
};

export class WCLError extends Error {
  readonly kind: WCLErrorKind;
  readonly status: number;
  readonly userMessage: string;
  constructor(kind: WCLErrorKind, detail?: string) {
    const info = WCL_ERROR_INFO[kind];
    super(detail ?? info.message);
    this.name = "WCLError";
    this.kind = kind;
    this.status = info.status;
    this.userMessage = info.message;
  }
}
```

**Pattern: Error Response Mapping**

Never leak raw WCL/GraphQL/internal error strings to the client. Always sanitize via `errorResponse()`:

```typescript
// api-utils.ts
export function errorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof WCLError) {
    console.error(`[${context}] WCLError(${error.kind}): ${error.message}`);
    return NextResponse.json(
      { error: error.userMessage, kind: error.kind },
      { status: error.status },
    );
  }
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] Unexpected error: ${detail}`);
  return NextResponse.json(
    { error: "Something went wrong analyzing this log. Please try again." },
    { status: 500 },
  );
}
```

**Pattern: Typed Result Objects**

API handlers use discriminated unions to distinguish success from error:

```typescript
// api-utils.ts
export async function parseBody<T>(
  request: Request,
  requiredFields: (keyof T)[],
): Promise<{ body: T } | { error: NextResponse }> {
  // Success: { body: T }
  // Failure: { error: NextResponse }
}
```

**Pattern: Early Returns**

Validation happens early; invalid states cause immediate return:

```typescript
export function isValidReportCode(code: unknown): code is string {
  return typeof code === "string" && REPORT_CODE_RE.test(code);
}
```

## Logging

**Framework:** `console.log()` with structured JSON for server-side metrics

**Pattern:**
```typescript
// observability.ts
export function logEvent(event: string, props: LogProps = {}): void {
  try {
    console.log(JSON.stringify({ metric: event, ...props }));
  } catch {
    // Observability must never break a request.
  }
}
```

**Usage:**
```typescript
logEvent("api_request", { route, cache: "hit", outcome: "ok", ms: Date.now() - start });
logEvent("report_url_invalid", { url });
```

**Rules:**
- One JSON line per event, queryable in Vercel logs
- Keep keys flat and low-cardinality (e.g., `cache: "hit" | "miss"`, not arbitrary values)
- Observability must never crash a request (wrapped in try-catch)
- Server-side only; client analytics via PostHog

**Client Analytics:**
- PostHog JS SDK for event capture on client components
- Import via `posthog-js` and call `posthog.capture(event, props)`
- Example: `posthog.capture("report_submitted", { report_code, has_fight, has_source })`

## Comments

**When to Comment:**

- **Public APIs:** JSDoc blocks on exported functions
- **Non-obvious logic:** Inline comments explaining "why", not "what"
- **Section markers:** ASCII dividers for major logical sections

**JSDoc Example:**
```typescript
/**
 * Parse a Warcraft Logs URL into its components.
 * Supports:
 *   https://classic.warcraftlogs.com/reports/ABC123#fight=5&source=12
 *   https://www.warcraftlogs.com/reports/ABC123?fight=5&source=12
 *   ABC123 (just the report code)
 *   Pasted text with a report URL somewhere inside it
 */
export function parseWCLUrl(input: string): ParsedWCLUrl | null {
```

**Section Markers:**
```typescript
// ─── Typed errors ────────────────────────────────────────────────────
// wclQuery throws WCLError so routes can map failures to clean, actionable
// messages + correct HTTP status instead of leaking raw WCL/GraphQL strings
```

**Inline Comments:**
```typescript
// Reject only genuinely-missing values. A plain `!value` check wrongly
// rejects 0, which is a valid WCL fightId/sourceId (slots are 0-indexed).
const value = body[field];
if (value == null || value === "") {
```

## Function Design

**Size Guideline:**
- Aim for functions that fit on one screen (~40 lines max for complex logic)
- Longer functions OK if they are data transformation pipelines or have few branches
- Example: `cachedApiHandler()` is ~70 lines but follows a clear flow (check cache → acquire lock → run handler → release lock)

**Parameters:**
- Type all parameters explicitly (no implicit `any`)
- Use named object parameters for > 2 related arguments
- Example: `analyzeDps(playerDamage: number, fightDuration: number, rankings: WCLRanking[], totalRankingCount?: number)`

**Return Values:**
- Always specify return type explicitly
- Async functions always return `Promise<T>`
- Use discriminated unions for complex results: `{ body: T } | { error: NextResponse }`

## Module Design

**Exports:**
- Prefer named exports over default exports (easier tree-shaking and refactoring)
- Example: `export function parseWCLUrl()` and `export function buildWCLUrl()`
- Default exports used only for React components (`export default function Navbar()`)

**Barrel Files:**
- Not heavily used; most imports are direct (`import { X } from "@/lib/module"`)
- Components grouped by domain but not re-exported through a barrel (each imported directly)

**Type Co-location:**
- Types live in `wcl-types.ts`, `cla-types.ts` rather than scattered
- Database/constant types defined where used (e.g., `CachedWclToken` in `wcl-client.ts`)

## Server vs Client Components

**Server Components (default in Next.js 16 App Router):**
- Used for data fetching, metadata, direct database/cache access
- Example: `app/page.tsx` (landing), `app/analyze/[reportCode]/page.tsx` (report analysis)
- Can import server-only libs freely

**Client Components ("use client" directive):**
- Required for state management, event handlers, browser APIs
- Example: `LandingHero.tsx`, `ReportUrlForm.tsx`, `Navbar.tsx`
- Must be placed in `/app/components/` and use `"use client"` at top of file

---

*Convention analysis: 2026-09-04*
