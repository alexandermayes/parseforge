# Phase 3: Share Loop - Pattern Map

**Mapped:** 2026-09-15
**Files analyzed:** 10
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `lib/awards-engine.ts` | service (pure engine) | transform | `lib/healer-metrics.ts` | exact (same "shared engine, two consumers" contract) |
| `lib/awards-engine.test.ts` | test | transform | `lib/raid-overview-engine.test.ts` | exact |
| `app/og/route.tsx` (new `view=awards` branch + `PlayerCard` receipts) | route (image response) | request-response | itself, existing `PlayerCard`/`ReportCard` branches | exact |
| `app/analyze/[reportCode]/page.tsx` (`generateMetadata` forwards `view`) | route/SSR | request-response | itself, existing `fight`/`source` forwarding | exact |
| `app/analyze/[reportCode]/AnalyzeClient.tsx` (D-12 landing rules, D-16 ref capture/strip, D-13 bar removal, D-09 normalized share link) | component (client) | event-driven | itself, existing `handleShareLink`/tab-state logic | exact |
| `app/components/RaidOverview.tsx` (awards panel + preview + "Copy awards link") | component | event-driven | itself, existing `HealerPanel`/`DeathTimeline` sub-panels | exact |
| `app/components/ComparisonSummary.tsx` ("Share my parse" primary, "Copy for Discord" secondary) | component | event-driven | itself, existing `handleCopyDiscord` button | exact |
| `docs/PROTECTED-ELEMENTS.md` | config/doc | — | (none — new doc; follows `docs/OPS-01-SHIP-GATE.md` shape) | role-match |
| `scripts/protected-elements.mjs` | utility (CI gate script) | batch | `scripts/seo-invariants.mjs` / `scripts/token-audit.mjs` | exact |
| `lib/wcl-types.ts` (add `AwardsResult`/`AwardRow` types) | model/types | — | itself, existing `RaidOverviewResult` block | exact |

## Pattern Assignments

### `lib/awards-engine.ts` (service, transform)

**Analog:** `lib/healer-metrics.ts` (read in full)

**Imports pattern** (lines 1):
```typescript
import type { HealerTableRow, HealerMetricsComputed } from "./wcl-types";
```
Follow the same shape: `import type { RaidOverviewResult, RaidPlayerMetrics, ... } from "./wcl-types";` — no other imports; this must stay a pure module with zero side effects (no fetch, no `posthog`, no React).

**Doc-comment / single-source-of-truth pattern** (lines 2-19):
```typescript
/**
 * Computes a healer's effective HPS, overheal percent and healing uptime from
 * the un-scoped per-player Healing row (`healingByPlayer` in
 * lib/wcl-queries.ts). Single source of truth for both call sites —
 * `lib/raid-overview-engine.ts` (buildRaidOverview, feeding the raid-wide
 * Healer Breakdown panel) and `app/api/analyze/route.ts` (the healer branch
 * of the player-analysis route) — so the raid table and the player page can
 * never show a different number for the same healer and fight (D-08).
 * ...
 */
export function computeHealerMetrics(
  row: HealerTableRow | undefined,
  fightDurationMs: number
): HealerMetricsComputed { ... }
```
`computeAwards` must carry an identical doc block naming its two call sites verbatim: `app/og/route.tsx`'s `view=awards` branch and `app/components/RaidOverview.tsx`'s awards panel — "so the OG image and the in-app preview can never show a different award set for the same fight (D-06/D-08)."

**Never-NaN / never-throw guard pattern** (lines 22-24):
```typescript
if (!row || fightDurationMs <= 0 || row.total <= 0) {
  return { effectiveHps: 0, overhealPercent: 0, activityPercent: 0, hasHealing: false };
}
```
`computeAwards` should mirror this: an empty/malformed `RaidOverviewResult` returns `{ awards: [] }`, never throws — the OG route's "never fail an unfurl" contract depends on this function being safe to call on a null-shaped input.

**Signature convention:** explicit typed params, explicit return type, no implicit `any` — `computeAwards(overview: RaidOverviewResult, fight: { kill: boolean; bossPercentage: number; name: string }): AwardsResult`.

---

### `lib/awards-engine.test.ts` (test, transform)

**Analog:** `lib/raid-overview-engine.test.ts` (read relevant sections)

**Fixture-driven + synthetic-fixture pattern** (lines 1-9, 20-38):
```typescript
import { describe, it, expect } from "vitest";
import { buildRaidOverview } from "./raid-overview-engine";
...
import demoRaidOverview from "./__fixtures__/demo-raid-overview.json";
// Driven by the recorded fixtures from plan 02-01 ... Fight 23 genuinely has
// zero deaths (README.md), so the death-timeline behaviours below layer small
// synthetic DeathEvent/death-table inputs on top of the fixture's own real
// player source ids — see each describe block's comment.
```
`awards-engine.test.ts` should: import `computeAwards` from `./awards-engine`; build one realistic case from `demoRaidOverview`-derived shape (documenting that the demo fixture has zero deaths and cannot exercise death-dependent awards, exactly as this file documents for its own use of the same fixture); and hand-build synthetic `RaidOverviewResult` object literals per trigger condition (a death, missing flask, missing enchant, iron-man/zero-death, tie needing "+N" truncation) — same "small synthetic input layered on real fixture" idiom, comment style included.

---

### `app/og/route.tsx` — new `view=awards` branch (route, request-response)

**Analog:** itself — existing `PlayerCard`/`ReportCard` branches (read in full)

**Imports pattern** (lines 1-5):
```typescript
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { CLASS_COLORS_HEX } from "@/lib/constants";
import { isValidReportCode } from "@/lib/api-utils";
import type { AnalysisResult, ReportMeta } from "@/lib/wcl-types";
```
Add `import { computeAwards } from "@/lib/awards-engine";` and `import type { RaidOverviewResult } from "@/lib/wcl-types";` alongside these.

**Origin-pinned fetch + "never fail an unfurl" pattern** (lines 33-39, 183-228):
```typescript
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
// ...
const origin =
  process.env.NODE_ENV === "production"
    ? "https://parseforge.gg"
    : new URL(request.url).origin;
// ...
export async function GET(request: NextRequest) {
  const size = { width: 1200, height: 630 };
  const headers = { "cache-control": "public, max-age=600, s-maxage=600, stale-while-revalidate=86400" };
  try {
    // branch on report/fight/source/view
  } catch {
    return new ImageResponse(<ReportCard meta={null} reportCode="" />, { ...size, headers });
  }
}
```
New `view=awards` branch: validate `searchParams.get("view") === "awards"` and `fight` is a non-negative integer (mirror the existing `Number.isInteger(fightId) && fightId >= 0` check at lines 206-211) *before* the player-scorecard branch; POST `{ reportCode, fightId }` to `${origin}/api/raid-overview` via the same `fetchJson` helper (identical shape to `useRaidOverview.ts`'s client POST body); on `null` or zero fired awards, fall through to the existing `ReportCard` branch — do not add a new "still cooking" component unless discretion favors it.

**Shell/card composition pattern** (lines 100-186, `PlayerCard`/`ReportCard`):
```typescript
function PlayerCard({ data }: { data: AnalysisResult }) {
  const classColor = CLASS_COLORS_HEX[data.playerClass] ?? "#FFFFFF";
  ...
  return (
    <Shell>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", gap: "40px" }}>
        ...
      </div>
    </Shell>
  );
}
```
A new `AwardsCard({ awards, fight }: { awards: AwardsResult; fight: {...} })` function follows the identical shape: wraps children in the existing `Shell`, uses `CLASS_COLORS_HEX`/`GRADE_HEX`-style hex constants for any new colors (the documented Satori exception to the token rule — do not introduce CSS custom properties here), and caps text length explicitly (`maxWidth` + `textOverflow: "ellipsis"`/`whiteSpace: "nowrap"`, as `ReportCard`'s headline span already does at line ~157) for the 2-3-name-plus-"+N" award rows.

**Param-validation pattern** (lines 194-211):
```typescript
if (!isValidReportCode(reportCode)) {
  return new ImageResponse(<ReportCard meta={null} reportCode="" />, { ...size, headers });
}
const fightId = fightRaw != null ? Number.parseInt(fightRaw, 10) : NaN;
const sourceId = sourceRaw != null ? Number.parseInt(sourceRaw, 10) : NaN;
if (Number.isInteger(fightId) && fightId >= 0 && Number.isInteger(sourceId) && sourceId >= 0) { ... }
```
`view` must be checked against an exact allowlist (`view === "awards"`) the same way, before any fetch — per RESEARCH.md's V5 Input Validation note.

---

### `app/analyze/[reportCode]/page.tsx` — `generateMetadata` forwards `view` (route/SSR, request-response)

**Analog:** itself (read lines 1-80)

**OG URL construction pattern** (lines 33-39):
```typescript
const ogParams = new URLSearchParams({ report: reportCode });
if (fight) ogParams.set("fight", fight);
if (source) ogParams.set("source", source);
const ogUrl = `/og?${ogParams.toString()}`;
```
Add one line in the same style: `if (view) ogParams.set("view", view);` (read `view` via the existing `first(sp.view)` helper). Do not build a second parallel URL path. Canonical stays untouched: `const canonical = `https://parseforge.gg/analyze/${reportCode}`;` (line 42) — `view` is never added there.

**Discriminated-union error path** (lines 44-64): `result.status !== "ok"` returns generic noindex metadata with the same `ogUrl` — no special-casing needed for `view` there either, since `getReportMeta` doesn't know about `view`.

---

### `app/analyze/[reportCode]/AnalyzeClient.tsx` (component, event-driven)

**Analog:** itself (read in full)

**Imports pattern** (lines 1-16):
```typescript
"use client";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Link2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
...
import posthog from "posthog-js";
```

**URL-param state + `updateUrlParam` pattern** (lines 33-58):
```typescript
const [activeTab, setActiveTab] = useState<TabMode>(
  (searchParams.get("tab") as TabMode) || "raid"
);
...
const updateUrlParam = useCallback(
  (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (value !== null) params.set(key, value); else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  },
  [router]
);
```
D-12's landing rule is a one-line change to the initial-state computation: `tab` absent AND `source` present → default `activeTab` to `"player"`; `view=awards` present → keep default `"raid"` plus a derived boolean (`searchParams.get("view") === "awards"`) threaded down as a prop to open/scroll the awards panel. D-16's `ref` strip reuses `router.replace` the same way, in a `useEffect` that runs once on mount, captures `share_landing` with an **allowlisted** `ref` value (`"share" | "parse" | "awards"` only — drop/no-capture on anything else per RESEARCH Pitfall 5), then calls `updateUrlParam("ref", null)`.

**Existing share-link pattern to replace (anti-pattern per D-09)** (lines 99-106):
```typescript
const handleShareLink = useCallback(() => {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    setCopied(true);
    posthog.capture("share_link_copied", { report_code: reportCode, url });
    setTimeout(() => setCopied(false), 2000);
  });
}, [reportCode]);
```
Replace `window.location.href` with an explicit normalized-URL builder: `/analyze/{reportCode}?fight={selectedFight}&ref=share` (report-level; no `source`, no `tab`). Keep the `copied` state / `setTimeout` idiom. Dual-emit: keep `posthog.capture("share_link_copied", {...})` AND add `posthog.capture("share_action", { kind: "report_link", report_code, fight_id, tab: activeTab })` (D-14).

**Bottom share bar to remove (D-13)** — search shows it at "Share CTA — surface sharing on every tab..." / "Found this useful? Share it with your guild." / a second `handleShareLink`-bound `Button` — delete this block entirely; do not replace it with anything (contextual buttons live in `ComparisonSummary.tsx` / `RaidOverview.tsx` instead).

---

### `app/components/RaidOverview.tsx` — awards panel (component, event-driven)

**Analog:** itself, existing `HealerPanel`/`DeathTimeline` sub-panel functions (lines 226-377)

**Imports pattern** (lines 3-9):
```typescript
import { useState, useMemo } from "react";
import type { RaidOverviewResult, RaidPlayerMetrics, RaidRole, DeathDetail, RaidBuffCoverage, HealerMetrics } from "@/lib/wcl-types";
import { roleColor, roleColorAlpha, classColor, overhealColor, activityColor } from "@/lib/constants";
import { formatFightTime } from "@/lib/utils";
import { Check, X } from "lucide-react";
import SortableTableHead from "./SortableTableHead";
import RoleBadge from "./RoleBadge";
```
Add `import { computeAwards } from "@/lib/awards-engine";` and `import { Link2, Copy, Check as CheckIcon } from "lucide-react"` (or reuse the existing `Check` import) for the new "Copy awards link" button.

**Sub-panel function pattern** (lines 226-273, `HealerPanel`):
```typescript
function HealerPanel({ healers }: { healers: HealerMetrics[] }) {
  ...
}
```
A new `AwardsPanel({ overview, fight, reportCode }: {...})` function follows this exact shape — a standalone function below the default export's usage site, called from inside `RaidOverview`'s main render (mirrors line 187: `<HealerPanel healers={data.healerMetrics} />` → add `<AwardsPanel overview={data} fight={fight} reportCode={reportCode} />`). Compute awards client-side via `computeAwards(data, fight)` (no network round trip — the panel already has `RaidOverviewResult` in memory per RESEARCH Pattern 1/Standard Stack "Alternatives Considered"). Render the fired-award rows plus `<img src={`/og?report=${reportCode}&fight=${fight.id}&view=awards`} alt="Awards card preview" />` for the inline preview (no client-side canvas, per discretion item).

**"Copy X" button + `copied` state idiom to reuse:** see `ComparisonSummary.tsx`'s `handleCopyDiscord` below — same `useState(false)` + `setTimeout(..., 2000)` + `Check`/`Copy` icon swap pattern applies to "Copy awards link".

---

### `app/components/ComparisonSummary.tsx` — "Share my parse" primary button (component, event-driven)

**Analog:** itself, existing `handleCopyDiscord` (read in full)

**Imports pattern** (lines 1-13):
```typescript
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
...
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import posthog from "posthog-js";
```
Add `Link2` to the lucide import for the new primary button's icon.

**Copy-button + `copied` state + PostHog capture pattern** (lines 188-224, `handleCopyDiscord` + its `<Button>` at ~line 228):
```typescript
const handleCopyDiscord = async () => {
  const shareUrl = typeof window !== "undefined" ? window.location.href : undefined;
  const text = formatForDiscord(data, shareUrl);
  await navigator.clipboard.writeText(text);
  setCopied(true);
  posthog.capture("discord_copied", { player_name: data.playerName, ... });
  setTimeout(() => setCopied(false), 2000);
};
// ...
<Button variant="default" size="sm" onClick={handleCopyDiscord} className="gap-1.5">
  {copied ? (<><Check className="w-4 h-4" /> Copied!</>) : (<><Copy className="w-4 h-4" /> Copy for Discord</>)}
</Button>
```
New "Share my parse" button follows this exact idiom but becomes the **primary** action (D-11 demotes "Copy for Discord" to secondary — swap which button gets `variant="default"` vs. an outline/secondary variant). Its `onClick` builds the normalized permalink explicitly (`/analyze/{reportCode}?fight={fightId}&source={sourceId}&ref=parse`, stripping `tab`) rather than reading `window.location.href` — same anti-pattern note as D-09 above. Dual-emit: keep `discord_copied` on the existing button; add `posthog.capture("share_action", { kind: "player_link", report_code, fight_id, tab: "player" })` on the new one, and `kind: "discord_text"` alongside the existing `discord_copied` capture.

---

### `scripts/protected-elements.mjs` (utility, batch)

**Analog:** `scripts/seo-invariants.mjs` (read header + structural comment block)

**File header / doc-comment pattern** (lines 1-38):
```javascript
#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// seo-invariants: a repeatable local-versus-production head-tag and
// structured-data diff for every shipped route (OPS-01 ship gate).
// ...
// Modes:
//   node scripts/seo-invariants.mjs               -> gate mode: exit 1 on ...
//   node scripts/seo-invariants.mjs --report      -> inspection mode ...
//   --base <url>                                  -> local base URL ...
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PROD_BASE = "https://parseforge.gg";
```
`protected-elements.mjs` should carry the identical header shape (ASCII-divider comment block, mode list, `--base`/`--report`/`--markdown` flag conventions) and the same `REPO_ROOT`/`PROD_BASE` constant setup.

**Exit-code convention** (from `seo-invariants.mjs:335-342`, `token-audit.mjs:360-362`):
```javascript
// gate mode: exit 1 on any diff for a route with production data, 0 otherwise
// --report mode: always exits 0 (fatal config errors still exit non-zero)
process.exit(hasFailingDiff ? 1 : 0);   // seo-invariants
process.exit(violationCount > 0 ? 1 : 0); // token-audit
```
`protected-elements.mjs` should follow this exact convention: render the live analyze page (demo report, same as `seo-invariants.mjs`'s `readDemoReportCode()` helper at line ~48), assert every `data-protected="…"` attribute from `docs/PROTECTED-ELEMENTS.md` is present in the rendered HTML, `process.exit(1)` on any missing attribute, `process.exit(0)` otherwise, `process.exit(2)` on fatal config errors (unreachable local server, etc. — same as `seo-invariants.mjs:63`).

**package.json wiring:** add `"protected-elements": "node scripts/protected-elements.mjs"` alongside the existing `"seo-invariants"` and `"token-audit"` script entries (confirm exact key names via `package.json` before writing the plan task).

---

## Shared Patterns

### "One engine, two consumers" (never disagree)
**Source:** `lib/healer-metrics.ts` (full file, lines 1-40) — doc comment explicitly names both call sites and states the guarantee.
**Apply to:** `lib/awards-engine.ts` consumed by `app/og/route.tsx` (server) and `app/components/RaidOverview.tsx` (client, same `RaidOverviewResult` already in memory via `useRaidOverview`). Do not compute awards independently in the panel.

### Never-fail-an-unfurl / errors-as-data
**Source:** `app/og/route.tsx:33-39, 183-228` — `fetchJson` returns `null` on any failure; every branch degrades to `ReportCard`, never throws past the top-level `try/catch`.
**Apply to:** the new `view=awards` branch — a failed/slow `/api/raid-overview` POST or zero fired awards must fall through to `ReportCard`, not surface an error image.

### Copy-button + `copied` state + PostHog dual-emit
**Source:** `app/analyze/[reportCode]/AnalyzeClient.tsx:97-106` (`handleShareLink`) and `app/components/ComparisonSummary.tsx:188-201` (`handleCopyDiscord`) — both use `useState(false)` for `copied`, `navigator.clipboard.writeText(...).then(...)`, `setTimeout(() => setCopied(false), 2000)`, and a `posthog.capture("snake_case_event", {...})` call at the point of copy.
**Apply to:** every new share button ("Share my parse", "Copy awards link", header Share) — reuse this idiom verbatim; add the new `share_action` capture alongside (not instead of) the legacy event per D-14's dual-emit requirement.

### URL-param state via `useSearchParams` + `updateUrlParam` + `router.replace`
**Source:** `app/analyze/[reportCode]/AnalyzeClient.tsx:33-58`.
**Apply to:** D-12 landing-tab defaults, D-16 `ref` capture-then-strip. No new state library.

### `@theme` tokens for UI, hex mirrors only inside Satori/OG
**Source:** `lib/constants.ts` `CLASS_COLORS_HEX`/`app/og/route.tsx` `GRADE_HEX` (documented exception) vs. every in-app component using `classColor()`/`roleColor()`/Tailwind `@theme` classes (`app/components/RaidOverview.tsx:5`).
**Apply to:** new awards panel/buttons in `RaidOverview.tsx`/`ComparisonSummary.tsx` must use `@theme` tokens and `classColor()`/`roleColor()` (token-audit/theme-parity gates); only the new `AwardsCard` inside `app/og/route.tsx` may introduce new hex constants, and only because it's Satori-rendered.

### Node-script CI gate shape
**Source:** `scripts/seo-invariants.mjs`, `scripts/token-audit.mjs` (headers, `process.exit` conventions, `--report`/`--base` flags, `REPO_ROOT` constant).
**Apply to:** `scripts/protected-elements.mjs`.

## No Analog Found

None — every file in scope has a direct or near-direct analog already in the codebase (this phase is explicitly an extension phase per RESEARCH.md; `docs/PROTECTED-ELEMENTS.md` has no prior doc analog but follows the `docs/OPS-01-SHIP-GATE.md` structural convention closely enough to be role-matched rather than analog-less).

## Metadata

**Analog search scope:** `app/og/`, `app/analyze/[reportCode]/`, `app/components/`, `lib/`, `scripts/`, `docs/`
**Files scanned:** `app/og/route.tsx`, `app/analyze/[reportCode]/page.tsx`, `app/analyze/[reportCode]/AnalyzeClient.tsx`, `app/components/ComparisonSummary.tsx`, `app/components/RaidOverview.tsx`, `lib/healer-metrics.ts`, `lib/raid-overview-engine.ts`, `lib/raid-overview-engine.test.ts`, `lib/wcl-types.ts`, `scripts/seo-invariants.mjs`, `scripts/token-audit.mjs`
**Pattern extraction date:** 2026-09-15
