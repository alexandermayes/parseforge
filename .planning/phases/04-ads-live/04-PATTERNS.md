# Phase 4: Ads Live - Pattern Map

**Mapped:** 2026-09-19
**Files analyzed:** 11 (new/modified, Track A + Track B, excluding doc-only/human-action deliverables)
**Analogs found:** 10 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `app/components/AdSlot.tsx` | component | event-driven (mount → idle-tick → conditional script push) | `app/components/PostHogProvider.tsx` | role-match (client component executing a consent-gated decision) |
| `lib/ads.ts` | utility | transform (pure gate-decision function, no I/O) | `lib/consent.ts` (`deriveConsentGateOutcome`) | exact — same "pure decision function consumed by a thin client executor" shape |
| `app/layout.tsx` (modified) | config/provider | request-response (script mount) | itself, existing `GOOGLE_CMP_PUB_ID`-gated `<Script>` block | exact — same file, same pattern, additive |
| `next.config.ts` (modified) | config | config | itself, existing `CSP_REPORT_ONLY` array | exact — same file, additive entries |
| `app/ads.txt/route.ts` | route | request-response | `app/api/geo/route.ts` | role-match (small `NextResponse`-returning Route Handler, static payload instead of computed) |
| `lib/ads.test.ts` | test | transform (pure function assertions) | `lib/consent.ts` decision-table style (no existing `.test.ts` file for it — see gap below) | partial — mirror the style, not an existing test file |
| `scripts/protected-elements.mjs` (modified) | utility/test | file-I/O + transform (static doc/source parse) | itself, existing `checkAttribute`/`parseChecklistRows` functions | exact — same file, additive check function |
| `lib/wcl-types.ts` (modified — new type) | model | transform (type-only) | itself, existing `WCLRanking`/`WCLRankingsData` interfaces | role-match, but explicitly a **new, non-extending** type (Pitfall 1) |
| `lib/rankings/parse-lens.ts` | service | transform (pure, no I/O) | `lib/analysis-engine.ts` | exact — pure, typed, fixture-tested engine function, same import/style conventions |
| `lib/rankings/budget.ts` | service | CRUD (read WCL response field → write/read Redis) | `lib/kv-cache.ts` | exact — same Redis-with-Map-fallback, "never throw" pattern |
| `scripts/record-wcl-fixtures.mjs` (modified) | utility | file-I/O (fixture recorder) | itself, existing query/record functions | exact — same file, additive query + write step |

## Pattern Assignments

### `app/components/AdSlot.tsx` (component, event-driven)

**Analog:** `app/components/PostHogProvider.tsx`

**Imports pattern** (lines 1-8):
```typescript
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { startConsentListener, deriveConsentGateOutcome } from "@/lib/consent";
import type { ConsentAction } from "@/lib/consent";
```
`AdSlot.tsx` should mirror the top three lines' shape: `"use client"`, then `import { getConsentState } from "@/lib/consent"` (read-only — **do not** import `startConsentListener` or call `window.__tcfapi` a second time; consume the already-resolved state, per D-07 and the "Established Patterns" note in CONTEXT.md).

**Consuming the shared consent decision — do NOT re-derive it** (established pattern, `lib/consent.ts` lines 81-90 doc comment + `PostHogProvider.tsx` lines 132-140):
```typescript
// lib/consent.ts:81-90 — the doc comment AdSlot.tsx must honor:
/**
 * The readable consent signal other code (including Phase 4's future ad
 * loader) consults. Kept as a plain module getter rather than a React hook
 * or context...
 */
export interface ConsentState {
  action: ConsentAction;
  gdprApplies: boolean | null;
  resolvedAt: number | null;
  timedOut: boolean;
}
```
```typescript
// PostHogProvider.tsx:132-140 — "single executor" pattern to copy for AdSlot:
// Single executor (D-06): the ONLY place in this file that turns a
// ConsentGateOutcome into SDK calls. Both the geo path and the TCF path
// route through it...
function applyOutcome(outcome: ReturnType<typeof deriveConsentGateOutcome>) {
  if (!outcome) return;
```
`AdSlot` (or `lib/ads.ts`) should expose a single function that takes the already-resolved `ConsentGatePath` (read via `getConsentState()` plus the same `/api/geo` boolean PostHogProvider already fetched — do not `fetch("/api/geo")` a second time; either lift the resolved gate path into a shared module-level value PostHogProvider writes, or export a getter from `lib/consent.ts`/`lib/ads.ts` that both consumers read) and returns "load ads: yes/no", exactly the shape `deriveConsentGateOutcome` already returns for PostHog.

**Idle-tick + script-push pattern** (sketch, RESEARCH.md Pattern 1 — combine with the env-gate style below):
```tsx
useEffect(() => {
  const idleId = ("requestIdleCallback" in window ? window.requestIdleCallback : setTimeout)(
    () => setAdmitted(true),
    { timeout: 2000 } as never,
  );
  return () => {
    if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleId as number);
  };
}, []);
```

**Fixed-box container (D-04) — width/height, not min-height:**
```tsx
<div
  style={{ width: size.base.width, height: size.base.height }}
  data-ad-slot={id}
>
  {admitted && <ins ref={insRef} className="adsbygoogle" ... />}
</div>
```

**PostHog capture pattern to reuse** (project convention, snake_case events, low-cardinality props — see `.claude/CLAUDE.md` "Logging"/"PostHog"):
```typescript
posthog.capture("ad_slot_requested", { route, slot_id, consent_gate_path });
```

---

### `lib/ads.ts` (utility, transform)

**Analog:** `lib/consent.ts` — specifically `deriveConsentGateOutcome`

**Core pure-decision pattern** (`lib/consent.ts` lines 213-260, full JSDoc + switch):
```typescript
export function deriveConsentGateOutcome(
  isConsentRegion: boolean,
  tcfAction: ConsentAction | null,
): ConsentGateOutcome | null {
  if (!isConsentRegion) {
    return {
      gatePath: "geo-non-consent-region",
      optIn: true,
      startReplay: true,
      event: null,
      eventProps: {},
    };
  }

  if (tcfAction === null) return null;

  switch (tcfAction) {
    case "opt-in-full":
      return {
        gatePath: "tcf-accept",
        // ...
```
`lib/ads.ts` should export a `shouldLoadAds(gatePath: ConsentGatePath | null): boolean` (or similar) that returns `true` only for `gatePath ∈ { "geo-non-consent-region", "tcf-accept" }` per D-07 — same narrow, typed, non-throwing shape, same "fail closed on null/unknown" discipline as `deriveConsentAction`'s `if (!tcData || ...) return "pending"` guard (lines 65-66).

**Doc-comment style to match** (module header, `lib/consent.ts` lines 1-4):
```typescript
// Pure TCF v2.2 consent decision logic, in the style of lib/url-parser.ts:
// typed input, narrow return, no throwing.
```

---

### `app/layout.tsx` (modified — add gated `adsbygoogle.js` `<Script>`)

**Analog:** itself — the existing `GOOGLE_CMP_PUB_ID` block

**Env-gate + Script pattern to copy exactly** (`app/layout.tsx` lines 86, 103-110):
```tsx
const GOOGLE_CMP_PUB_ID = process.env.NEXT_PUBLIC_GOOGLE_CMP_PUB_ID ?? "";
// ...
{GOOGLE_CMP_PUB_ID && (
  <Script
    id="google-cmp"
    src={`https://fundingchoicesmessages.google.com/i/${GOOGLE_CMP_PUB_ID}?ers=1`}
    strategy="afterInteractive"
    async
  />
)}
```
Add a parallel `NEXT_PUBLIC_ADS_ENABLED`/`NEXT_PUBLIC_ADSENSE_PUB_ID`-gated block using `strategy="afterInteractive"` (never `beforeInteractive`, never in `<head>` per D-06 — note the CMP script above IS in `<head>`, the ad script must NOT follow that placement, it must go in `<body>` or rely on `next/script`'s own deferred injection, per D-06's explicit "No `<head>` ad script").

---

### `next.config.ts` (modified — CSP report-only hosts)

**Analog:** itself — existing `CSP_REPORT_ONLY` array

**Pattern to copy** (lines 13-24):
```typescript
// fundingchoicesmessages.google.com is Google Privacy & Messaging (the
// certified TCF v2.2 CMP, D-01) — it loads a script, opens network connections
// for the resolved consent state, and renders its dialog in an iframe, hence
// the script-src/connect-src/frame-src entries below.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://wow.zamimg.com https://fundingchoicesmessages.google.com",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com https://fundingchoicesmessages.google.com",
  "frame-src 'self' https://fundingchoicesmessages.google.com",
```
Add `https://pagead2.googlesyndication.com`, `https://googleads.g.doubleclick.net`, `https://tpc.googlesyndication.com` to `script-src`/`connect-src`/`frame-src` as appropriate, with a same-style comment explaining why (report-only, discovered-from-violations convention already established here — do not promote to enforcing, that's Phase 7).

---

### `app/ads.txt/route.ts` (route, request-response)

**Analog:** `app/api/geo/route.ts`

**Route Handler shape to copy** (full file, lines 1-33):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { isConsentRegionCode } from "@/lib/geo";
import { logEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  // ... compute ...
  return NextResponse.json(
    { isConsentRegion },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
```
`ads.txt/route.ts` returns a static `text/plain` body instead of JSON, and should use a cacheable header (`"public, max-age=86400"`, per RESEARCH.md Pattern 3) rather than `no-store` — the analog is for the "small typed Route Handler with explicit headers" shape, not the caching policy itself.

---

### `scripts/protected-elements.mjs` (modified — slot-dimension/no-overlap check)

**Analog:** itself — `checkAttribute` / `parseChecklistRows`

**Pattern to copy** (lines 91-110):
```javascript
function checkAttribute(row) {
  const ownerPath = path.isAbsolute(row.ownerFile)
    ? row.ownerFile
    : path.join(REPO_ROOT, row.ownerFile);
  if (!existsSync(ownerPath)) {
    return {
      id: `attr:${row.attribute}`,
      fatal: true,
      detail: `owner file ${row.ownerFile} does not exist`,
    };
  }
  const src = readFileSync(ownerPath, "utf8");
  const needle = `data-protected="${row.attribute}"`;
  const pass = src.includes(needle);
  return {
    id: `attr:${row.attribute}`,
    pass,
    detail: pass ? `found in ${row.ownerFile}` : `MISSING from ${row.ownerFile}`,
  };
}
```
Add a sibling `checkAdSlotPlacement(row)`-style function following the exact same `{ id, pass/fatal, detail }` return shape, plumbed into the same gate-mode/report-mode/exit-code contract documented in the file's own header comment (lines 19-36) — "a gate that greens when it cannot see its subject is worse than no gate" applies identically to a missing/zero-dimension `AdSlot`.

---

### `lib/wcl-types.ts` (modified — new type, NOT extending `WCLRanking`)

**Analog:** itself — existing `WCLRanking`/`WCLRankingsData` (for style only; do not extend)

**Existing shape to NOT reuse** (lines 149-169, verbatim — this is the boss-leaderboard shape, wrong for R0-3):
```typescript
export interface WCLRanking {
  name: string;
  class: string;
  spec: string;
  amount: number;
  duration: number;
  startTime: number;
  report: { code: string; fightID: number; startTime: number };
  guild?: { name: string; faction: number };
  server?: { name: string; region: string };
  bracketData?: number;
  best?: boolean;
  talents?: WCLRankingTalent[];
  gear?: WCLRankingGearItem[];
}

export interface WCLRankingsData {
  page: number;
  hasMorePages: boolean;
  count: number;
  rankings: WCLRanking[];
}
```
Copy the *naming/doc-comment convention* only ("Field names match the recorded response in `lib/__fixtures__/...`" — see the Cast Timeline Types section comment, `lib/wcl-types.ts` line ~172-173): define a genuinely new `RawReportRankingsBlob`/`ReportRankingEntry` type, with a comment pointing at the R0-2 fixture it must be verified against, not at `PARSEFORGE-RANKINGS-SPEC.md` alone (Pitfall 1). The existing inline discard-to-one-field type in `app/api/analyze/route.ts` line 40 (`rankings?: { data?: Array<{ fightID?: number; partition?: number }> }`) is the *current* under-typed version this replaces for R0-3's purposes — do not delete or change that call site's behavior, R0-3 ships types/engine only, unwired (D-13).

---

### `lib/rankings/parse-lens.ts` (service, transform)

**Analog:** `lib/analysis-engine.ts`

**Imports/style pattern** (lines 1-40):
```typescript
import {
  GEAR_SLOTS,
  ENCHANTABLE_SLOTS,
  // ...
  getPerformanceGrade,
} from "./constants";
import { ENCHANT_NAME_DB } from "./cla-constants";
import {
  AnalysisResult,
  ConsumableStatus,
  // ...
  WCLRanking,
  // ...
} from "./wcl-types";

// ─── Junk / internal spell filter ────────────────────────────────────
// Spell IDs that are internal WoW spells, deprecated abilities, or logging
// artefacts that should never appear in player-facing analysis. Also read by
// the cast timeline (plan 02-02), which reuses this exact exclusion set
// rather than declaring a second copy of the same spell ids (D-04).
```
`parse-lens.ts` should follow the same shape: import types from `./wcl-types` (the new type, not `WCLRanking`), pure functions with ASCII section-divider comments, and a doc comment citing which fixture the field names were verified against (R0-2's, once recorded) rather than the spec document, per Pitfall 1/A5.

**Function signature convention** (`.claude/CLAUDE.md` "Function Design" — named object params for >2 args, explicit return types):
```typescript
export function toParseRows(
  rankingsBlob: RawReportRankingsBlob,
): ParseRow[] {
  // pure, no throwing — same discipline as analysis-engine.ts
}
```

---

### `lib/rankings/budget.ts` (service, CRUD against Redis)

**Analog:** `lib/kv-cache.ts`

**Redis-with-fallback pattern to copy** (lines 1-60):
```typescript
const REDIS_URL =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

export const usingSharedCache = Boolean(REDIS_URL && REDIS_TOKEN);

const mem = new Map<string, { value: unknown; expiresAt: number }>();

function memGet<T>(key: string): T | null {
  const entry = mem.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    mem.delete(key);
    return null;
  }
  return entry.value as T;
}

async function redisCmd(command: (string | number)[]): Promise<{ result: unknown }> {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return res.json();
}
```
`budget.ts` should reuse `lib/kv-cache.ts`'s exported get/set helpers directly (do not re-implement `redisCmd`/`usingSharedCache` — import from `kv-cache.ts`, per "Don't Hand-Roll" table) and add its own key namespace (e.g. `wcl:budget`), plus the runtime-validation-before-trusting pattern noted in Security Domain V5 — mirror `PostHogProvider.tsx`'s `/api/geo` body validation:
```typescript
// PostHogProvider.tsx:115-122 — runtime-validate before trusting, fail closed:
const isConsentRegion =
  typeof (body as { isConsentRegion?: unknown } | null)?.isConsentRegion === "boolean"
    ? (body as { isConsentRegion: boolean }).isConsentRegion
    : true;
```

---

### `scripts/record-wcl-fixtures.mjs` (modified — add rankings/guild queries)

**Analog:** itself — existing query-body + write pattern

**Pattern to copy** (lines 62-89 + header comment lines 1-37):
```javascript
// Standalone .mjs by design — it deliberately does NOT import from lib/ (that
// is TypeScript and this recorder must run under plain node with no build
// step). Query bodies below are duplicated from lib/wcl-queries.ts rather
// than shared; keep them in sync by hand if those queries change shape.

const PLAYER_FULL_DATA_QUERY = `
  query PlayerFullData($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
        rankings(fightIDs: $fightIDs)
        ...
```
Add new duplicated (not shared/imported) query bodies for `rateLimitData`, `guild{members,attendance}`, `zoneRankings`/`encounterRankings` per R0-2, following the same "PUBLIC report/guild only, never write secrets" discipline stated in the header comment (lines 16-26) and `lib/__fixtures__/README.md`'s "must never be recorded from a report/guild that is not publicly viewable" rule (README.md lines 17-22).

## Shared Patterns

### Consent gate — single source of truth
**Source:** `lib/consent.ts` (`deriveConsentGateOutcome`, `getConsentState`, `ConsentGatePath`)
**Apply to:** `app/components/AdSlot.tsx`, `lib/ads.ts`
```typescript
export type ConsentGatePath =
  | "geo-non-consent-region"
  | "tcf-accept"
  | "tcf-reject"
  | "tcf-timeout";
```
No second `__tcfapi` listener, no second `/api/geo` fetch — read the resolved state only.

### Env-gated third-party script loading
**Source:** `app/layout.tsx` lines 86, 103-110 (`GOOGLE_CMP_PUB_ID` pattern)
**Apply to:** the new `adsbygoogle.js` `<Script>` block, `NEXT_PUBLIC_ADS_ENABLED`/`NEXT_PUBLIC_ADSENSE_PUB_ID`
```tsx
const GOOGLE_CMP_PUB_ID = process.env.NEXT_PUBLIC_GOOGLE_CMP_PUB_ID ?? "";
{GOOGLE_CMP_PUB_ID && <Script ... strategy="afterInteractive" async />}
```

### Redis-with-Map-fallback, never throw
**Source:** `lib/kv-cache.ts` (`usingSharedCache`, `redisCmd`, `memGet`/`memSet`)
**Apply to:** `lib/rankings/budget.ts`
Always try Redis first via the existing exported helpers; on any Redis error, fall back to the in-memory `Map`; never let a cache failure fail the request.

### Docs-plus-machine-check
**Source:** `docs/PROTECTED-ELEMENTS.md` + `scripts/protected-elements.mjs`
**Apply to:** the new ad-slot placement whitelist check
The doc is the source of truth; the script is the enforcement; a missing/unreadable subject is FATAL (exit 2), never a silent pass — this convention must extend to the new slot-dimension assertion, not spawn a second checker file.

### PostHog event conventions
**Source:** `.claude/CLAUDE.md` "Logging"/PostHog section + `PostHogProvider.tsx`'s `capturedGatePathRef` dedup pattern
**Apply to:** `ad_slot_requested`/`ad_slot_filled`/`ad_slot_empty`/`ad_slot_blocked_by_adblocker` events
```typescript
posthog.capture("ad_slot_requested", { route, slot_id, consent_gate_path });
```
snake_case event names, low-cardinality flat props only.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `docs/OPS-01-SHIP-GATE.md` Part 6 (CWV baseline table + rollback trigger) | doc | N/A (data capture, not code) | Not a code pattern — a dated markdown table built from `vercel metrics` CLI output (RESEARCH.md Code Examples has the exact commands); no existing "Part" section in the doc follows an identical table shape closely enough to call an analog. Use the `vercel metrics` invocations verbatim from 04-RESEARCH.md's Code Examples section. |

## Metadata

**Analog search scope:** `app/`, `lib/`, `scripts/`, `next.config.ts`, `docs/PROTECTED-ELEMENTS.md`, `.claude/CLAUDE.md` conventions.
**Files scanned:** `lib/consent.ts`, `app/components/PostHogProvider.tsx`, `app/layout.tsx`, `next.config.ts`, `app/api/geo/route.ts`, `scripts/protected-elements.mjs`, `lib/wcl-types.ts`, `lib/kv-cache.ts`, `lib/analysis-engine.ts`, `scripts/record-wcl-fixtures.mjs`, `lib/__fixtures__/README.md`, `app/api/analyze/route.ts`, `app/analyze/[reportCode]/AnalyzeClient.tsx`, `app/tbc-audit/page.tsx`.
**Pattern extraction date:** 2026-09-19
