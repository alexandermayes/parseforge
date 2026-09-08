---
phase: 02-accuracy-analysis-depth
reviewed: 2026-09-08T00:00:00Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - app/analyze/[reportCode]/AnalyzeClient.tsx
  - app/analyze/[reportCode]/hooks/usePlayerAnalysis.ts
  - app/analyze/[reportCode]/hooks/useTimeline.ts
  - app/api/analyze/route.ts
  - app/api/timeline/route.ts
  - app/components/AnalysisView.tsx
  - app/components/CastTimeline.tsx
  - app/components/ComparisonSummary.tsx
  - app/components/DpsComparison.tsx
  - app/components/RaidOverview.tsx
  - docs/GAME-DATA-AUDIT.md
  - docs/OPS-01-SHIP-GATE.md
  - lib/__fixtures__/README.md
  - lib/__fixtures__/fixtures.test.ts
  - lib/__fixtures__/demo-player-dps.json
  - lib/__fixtures__/demo-player-healer.json
  - lib/__fixtures__/demo-raid-combatant-info.json
  - lib/__fixtures__/demo-raid-death-events.json
  - lib/__fixtures__/demo-raid-overview.json
  - lib/__fixtures__/demo-timeline-casts.json
  - lib/__snapshots__/cla-engine.test.ts.snap
  - lib/__snapshots__/raid-overview-engine.test.ts.snap
  - lib/analysis-engine.test.ts
  - lib/analysis-engine.ts
  - lib/cla-constants.ts
  - lib/cla-engine.test.ts
  - lib/constants.ts
  - lib/generated/game-data-overrides.json
  - lib/generated/game-data-overrides.ts
  - lib/generated/game-data.cata.ts
  - lib/generated/game-data.classic-tbc.ts
  - lib/generated/game-data.consumables.ts
  - lib/generated/game-data.test.ts
  - lib/generated/game-data.wotlk.ts
  - lib/generated/index.ts
  - lib/healer-metrics.test.ts
  - lib/healer-metrics.ts
  - lib/raid-overview-engine.test.ts
  - lib/raid-overview-engine.ts
  - lib/timeline-engine.test.ts
  - lib/timeline-engine.ts
  - lib/utils.ts
  - lib/wcl-client.test.ts
  - lib/wcl-fetchers.ts
  - lib/wcl-queries.ts
  - lib/wcl-types.ts
  - package.json
  - scripts/record-wcl-fixtures.mjs
  - scripts/regen-game-data.mjs
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

## Summary

Reviewed the Phase 2 diff against `4d5fd2a`: the cast Timeline feature (`/api/timeline`,
`lib/timeline-engine.ts`, `CastTimeline.tsx`), healer metrics/suggestions
(`lib/healer-metrics.ts`, the D-07/D-08 additions to `lib/analysis-engine.ts` and
`lib/raid-overview-engine.ts`), the wago.tools game-data regeneration pipeline
(`scripts/regen-game-data.mjs`, `lib/generated/*`), and the fixture-driven regression
net. The engineering discipline in this phase is generally strong — the era-precedence
composition in `lib/generated/index.ts` is well-reasoned and correctly implemented
(first-resolved-era wins, overrides always win on top, verified by
`lib/generated/game-data.test.ts` Test 8), `computeHealerMetrics` is a genuine single
source of truth reused correctly by both `app/api/analyze/route.ts` and
`lib/raid-overview-engine.ts`, `record-wcl-fixtures.mjs` never writes credential
material to disk, and pagination/rate-limiting on `/api/timeline` is soundly bounded
(20-page cap, tighter per-route rate limit bucket).

One correctness defect did surface in the new healer-suggestion logic: a healer with
zero recorded healing this fight (`hasHealing: false`, deliberately treated as
"no data" everywhere else in this codebase, including this same phase's own
`DpsComparison.tsx`) still gets a numeric "Low healing uptime: 0% vs X%" recommendation
from `generateSuggestions`, because that function never checks the flag it was given.
Given this project's stated value ("a wrong recommendation is worse than no
recommendation"), this is flagged as a blocker. Three further issues (input validation
gap on the timeline route, a PostHog side-effect placed inside a React state updater,
and a stale/incorrect comment in the game-data regression test) are flagged as
warnings.

## Critical Issues

### CR-01: Healer suggestions fire on zero-healing data instead of respecting `hasHealing`

**File:** `lib/analysis-engine.ts:628-674`

**Issue:** `generateSuggestions` gates the entire healer-suggestion block on
`playerRole === "healer" && healer && healer.topSampleCount > 0` — it never checks
`healer.hasHealing`, the flag `computeHealerMetrics` returns specifically to mean "this
player recorded no healing this fight; treat every other field on this object as
meaningless, not measured" (see the doc comments on `HealerMetricsComputed`/
`HealerComparison` in `lib/wcl-types.ts`, and the raid-overview panel's own comment:
"the panel reads to render an em dash instead of a measured-looking zero"). This
phase's own `DpsComparison.tsx` honors the flag correctly (`healer.hasHealing ? ... :
"—"`), but `generateSuggestions` does not.

Concretely: a healer-spec player who did zero effective healing this fight (e.g. died
at the pull — the exact scenario `raid-overview-engine.ts` calls out by name) gets
`healer = { effectiveHps: 0, overhealPercent: 0, activityPercent: 0,
topOverhealPercent: <top>, topActivityPercent: <top>, hasHealing: false, ... }`. Inside
`generateSuggestions`:

```ts
const uptimeRatio =
  healer.topActivityPercent > 0 ? healer.activityPercent / healer.topActivityPercent : 1;
const uptimeFires = healer.topActivityPercent > 0 && uptimeRatio <= HEALER_UPTIME_RATIO;
```

`healer.activityPercent` is `0`, so as long as any top healer had nonzero activity,
`uptimeRatio` is `0`, which is `<= 0.9`, so `uptimeFires` is `true` and the UI shows:

> **Low healing uptime** — Your healing uptime is 0% vs 80% for top healers. Reduce
> idle time between casts and react to damage sooner.

This is misleading — the player didn't heal inefficiently, they recorded no healing at
all (died pre-pull, was assigned off-role, spec mismatch in the data, etc.). Because
`uptimeFires` is `true`, the third rule (`HPS gap despite efficient healing`, which
would at least be closer to accurate) is also suppressed by its own `!uptimeFires`
guard. `lib/analysis-engine.test.ts`'s new healer-suggestion test suite (Tests 1-7)
never constructs a `hasHealing: false` fixture, so this gap has no regression coverage.

**Fix:** Gate the whole healer-suggestion block on `healer.hasHealing` as well, and
skip straight to "no data, no relative advice" (mirroring the existing
`healer.topSampleCount > 0` guard's own reasoning: "advice relative to zero is worse
than no advice at all"):

```ts
if (playerRole === "healer" && healer && healer.hasHealing && healer.topSampleCount > 0) {
  // ... existing overheal/uptime/HPS-gap rules unchanged
}
```

Add a regression test asserting zero healer-category suggestions fire for a
`healerFixture({ hasHealing: false, overhealPercent: 0, activityPercent: 0 })` input.

## Warnings

### WR-01: `/api/timeline`'s "player not found in fight" check is not actually fight-scoped

**File:** `app/api/timeline/route.ts:84-88`

**Issue:**

```ts
const actors = report.masterData?.actors ?? [];
const sourceExists = actors.some((a) => a.id === sourceId);
if (!sourceExists) {
  return NextResponse.json({ error: "Player not found in fight" }, { status: 404 });
}
```

`report.masterData.actors` (per `TIMELINE_CASTS_QUERY` in `lib/wcl-queries.ts` and
confirmed by `lib/__fixtures__/README.md`'s own description — "the full actor list
with no type filter") is the **report-wide** actor roster, not scoped to `fightId`.
WCL's `masterData` field takes no `fightIDs` argument, so this check can only ever
confirm the actor exists *somewhere* in the report, never that they were in *this*
fight. Contrast with `app/api/analyze/route.ts`, whose equivalent check
(`allPlayers.find((p) => p.id === sourceId)`) is genuinely fight-scoped because
`playerDetails(fightIDs: $fightIDs)` filters server-side.

**Impact:** A request with a valid `reportCode`/`fightId` and a `sourceId` that belongs
to a *different* fight in the same report passes this check, then `castEvents`/
`castTable` for that fight+source combination come back empty from WCL, so the route
returns `200` with an empty timeline (`castCount: 0`) instead of the intended `404
"Player not found in fight"`. Not reachable through the normal UI flow (the player
selector is itself fight-scoped), but reachable via direct API calls, and the
route's own error message no longer describes what it actually validates.

**Fix:** Either drop the misleading 404 message in favor of accepting that an
empty result is the correct response for this input shape, or make the check
fight-scoped by cross-referencing `castTable`/`castEvents` non-emptiness, or by
reusing `playerDetails(fightIDs: [fightId])` (as `analyze/route.ts` does) instead of
the report-wide actor list.

### WR-02: PostHog capture invoked from inside a `setState` functional updater — will double-fire under React StrictMode

**File:** `app/components/CastTimeline.tsx:129-140`

**Issue:**

```ts
const toggleAbility = useCallback(
  (id: number) => {
    setHiddenAbilityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onFilterToggle?.(result?.abilityCounts.length ?? 0, next.size);
      return next;
    });
  },
  [onFilterToggle, result]
);
```

The `onFilterToggle` call (which fires the `timeline_filter_used` PostHog event) is a
side effect placed inside the functional updater passed to `setHiddenAbilityIds`.
React explicitly documents that updater functions must be pure and — in Strict Mode,
which Next.js enables by default in dev (`next.config.ts` does not set
`reactStrictMode: false`) — invokes them **twice** specifically to help find
impurities like this one. Every ability-chip click in dev therefore fires
`timeline_filter_used` twice. This directly contradicts the project's own
ship-gate invariant recorded in `docs/OPS-01-SHIP-GATE.md` ("exactly one
`posthog.capture` call site" — note the gate's own verification method is a
grep-based *call-site* count, which cannot catch a call site that runs more than once
per interaction).

**Fix:** Compute `next` inside the updater, but move the `onFilterToggle` call outside
of it (mirroring how `resetAbilities` already does this correctly two lines below):

```ts
const toggleAbility = useCallback(
  (id: number) => {
    setHiddenAbilityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  },
  []
);
```

and derive `next.size`/fire the capture from a `useEffect` keyed on `hiddenAbilityIds`,
or restructure to compute the new set once before calling `setHiddenAbilityIds` with
the concrete value rather than a function.

### WR-03: Stale/incorrect comment in `game-data.test.ts` misdescribes production era-precedence

**File:** `lib/generated/game-data.test.ts:16-26`

**Issue:** The test's local composition helper:

```ts
/**
 * Composes era maps in the same order lib/cla-constants.ts's sections list
 * today — Classic and TBC, then WotLK, then Cata — so a later era wins for a
 * colliding id, matching current behaviour.
 */
function composeEras<T>(maps: Map<number, T>[]): Map<number, T> {
  const result = new Map<number, T>();
  for (const map of maps) {
    for (const [id, value] of map) result.set(id, value);
  }
  return result;
}
```

builds a **later-era-wins** map (`result.set` unconditionally overwrites), and its
comment claims this is "matching current behaviour." It is not: `lib/generated/index.ts`
implements — and extensively documents — the opposite, **first-resolved-era-wins**
(`composeEraPriority`'s `if (!result.has(id)) result.set(...)`), specifically because
"a later-era-wins merge would silently replace a real TBC fact with an unrelated
later-era item that happens to reuse the same numeric id" (index.ts's own header
comment, itself citing empirically-confirmed collisions such as enchant id 3003).
Tests 7-8 in this file exercise the test's own (wrong-direction) `composedEnchantNames`
/`composedGemStats`, not the real production composition, so they don't actually
verify production merge behavior for a colliding id — they happen to still pass
because both locally-built maps are self-consistent with each other, and because
override-id resolution (Test 8's actual assertion) doesn't depend on era order.

**Impact:** No production behavior is affected (index.ts's own composition is correct
and is separately covered by `lib/cla-constants.test.ts`'s pinned-fact regression
suite, per this file's own header comment). But this comment actively misinforms a
future maintainer reading the one file whose stated job is guarding data accuracy for
this "accuracy is non-negotiable" product, and nothing in this test suite exercises the
real collision-resolution direction.

**Fix:** Correct the comment to state the true relationship ("this local helper uses
later-wins order, the OPPOSITE of production's first-resolved-era-wins in
`lib/generated/index.ts` — see that file's header for why; this helper exists only to
verify internal self-consistency of Tests 7-8, not to reproduce production
precedence"), and/or add a dedicated test that imports `composeEraPriority`-equivalent
logic (or `ENCHANT_NAME_DB` from `lib/generated/index.ts` directly) and asserts a known
collision (e.g. id 3003) resolves to the Classic+TBC value, not the WotLK one — closing
the actual coverage gap this comment currently papers over.

---

_Reviewed: 2026-09-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
