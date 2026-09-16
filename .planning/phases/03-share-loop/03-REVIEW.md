---
phase: 03-share-loop
reviewed: 2026-09-16T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - app/analyze/[reportCode]/AnalyzeClient.tsx
  - app/analyze/[reportCode]/page.tsx
  - app/components/AnalysisView.tsx
  - app/components/ComparisonSummary.tsx
  - app/components/RaidOverview.tsx
  - app/og/route.tsx
  - docs/OPS-01-SHIP-GATE.md
  - docs/PROTECTED-ELEMENTS.md
  - eslint.config.mjs
  - lib/awards-engine.test.ts
  - lib/awards-engine.ts
  - lib/share-links.test.ts
  - lib/share-links.ts
  - lib/wcl-types.ts
  - package.json
  - scripts/protected-elements.mjs
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-09-16
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the Phase 3 share-loop diff (`c4e25b5b5646e1288ffcb1a506d7a308eb3c11bd^..HEAD`) against
the file list above, cross-checked against `.planning/phases/03-share-loop/03-CONTEXT.md`'s D-01
through D-16 decisions. Confirmed each decision's stated invariant against the actual code
(`ref` allowlist gating, param-free canonical, no `tab` in any share URL, single-engine
panel/OG parity, `share_action` event shape, protected-elements attribute wiring) — all hold.
`npx tsc --noEmit` is clean. No hardcoded secrets, no `eval`/`innerHTML`/XSS-shaped sinks, no
SQL/command injection, no open-redirect via `ref` (it is validated against a fixed allowlist
and only ever used as a PostHog property, never as a navigation target).

Four issues found, none rising to Critical: two robustness/consistency gaps in the new
`awards-engine.ts` and the shared Kill/Wipe formatting across the three surfaces this phase
touches, one gap in the new `protected-elements.mjs` gate script that has already produced a
documented false pass in this project's own preview run, and one dead field. Full details below.

## Warnings

### WR-01: `computeAwards()` doesn't fully honor its own "never throws on a null-shaped input" contract

**File:** `lib/awards-engine.ts:345-356` (guard), with unguarded reads at `lib/awards-engine.ts:79` (`first-to-die`), `lib/awards-engine.ts:111` (`top-hps`), `lib/awards-engine.ts:279` (`iron-man`), `lib/awards-engine.ts:296` (`watering-the-garden`), `lib/awards-engine.ts:312` (`kept-them-breathing`)

**Issue:** The module docstring and the function's own guard clause claim `computeAwards` is safe
to call on a "null-shaped input" — "the OG route's never-fail-an-unfurl contract depends on this
function being safe to call on a null-shaped input." The guard only checks that `overview` is
truthy, `overview.players` is a non-empty array, and `fightDuration > 0`:

```ts
if (
  !overview ||
  !Array.isArray(overview.players) ||
  overview.players.length === 0 ||
  !(overview.fightDuration > 0)
) {
  return { encounterName: fight.name, outcome: fight.outcome, awards: [] };
}
```

It never validates `overview.deathTimeline` or `overview.healerMetrics` are arrays before rules
index them directly, e.g. `first-to-die`: `const first = overview.deathTimeline[0];` and
`top-hps`: `const candidates = overview.healerMetrics.filter(...)`. If either field is ever
`undefined` on an otherwise-valid `players`/`fightDuration` payload (a partially-shaped cached
value, or a future schema change to `RaidOverviewResult` that isn't caught by TypeScript because
the data crossed a JSON `fetch`/Redis boundary), these throw a `TypeError`.

In `app/og/route.tsx` this is caught by the route's outer `try/catch` and degrades to the
`ReportCard` fallback — fine, matches "never fail an unfurl." But the other consumer,
`AwardsPanel` in `app/components/RaidOverview.tsx:255-264`, calls `computeAwards` inside a
`useMemo` with no try/catch and no error boundary visible in this file set — an uncaught throw
there crashes the Raid tab's render, not just the awards feature, directly contradicting the
"safe to call on a null-shaped input" guarantee both call sites were built to rely on.

**Fix:** Extend the guard (or normalize the fields) so every array the rule pool reads is
defensively treated as `[]` when absent:
```ts
const deathTimeline = Array.isArray(overview.deathTimeline) ? overview.deathTimeline : [];
const healerMetrics = Array.isArray(overview.healerMetrics) ? overview.healerMetrics : [];
// pass a normalized `overview` (or these two derived values) into rule.evaluate(...)
```
or add `!Array.isArray(overview.deathTimeline) || !Array.isArray(overview.healerMetrics)` to the
early-return guard so a malformed payload degrades to an empty award list exactly like every
other guarded case, instead of throwing.

### WR-02: Kill/Wipe boss-percentage formatting disagrees across the three surfaces this phase added

**File:** `app/components/RaidOverview.tsx:303`, `app/og/route.tsx:163` (PlayerCard), `app/og/route.tsx:282` (AwardsCard)

**Issue:** All three are new-in-this-phase renderings of the same `bossPercentage` field, but use
two different formats:
- `app/components/RaidOverview.tsx:303`: `` `Wipe (${Math.round(fight.bossPercentage / 100)}%)` `` — rounds to a whole percent
- `app/og/route.tsx:163` (PlayerCard): `` `WIPE ${Math.round(outcome.bossPercentage / 100)}%` `` — rounds to a whole percent
- `app/og/route.tsx:282` (AwardsCard): `` `WIPE ${(outcome.bossPercentage / 100).toFixed(1)}%` `` — one decimal place

The Raid-tab awards panel (`RaidOverview.tsx:303`) renders its own "Wipe (X%)" text directly above
the inline `<img>` of the *actual* `/og?view=awards` image it links to (`AwardsCard`) — so for the
same fight the panel's own header text and the image sitting right below it can show a different
number of digits for the same wipe percentage (e.g. panel: "Wipe (45%)", image: "WIPE 45.2%").
This contradicts this phase's own stated principle for that exact pairing — "the panel and the
image can never disagree" (D-06/D-08) — and diverges from the pre-existing one-decimal convention
already used in `app/components/FightSelector.tsx:47` (`(f.bossPercentage / 100).toFixed(1)`).

**Fix:** Extract one shared helper (e.g. `formatWipePercent(bossPercentage: number): string` in
`lib/utils.ts`, next to `formatFightTime`) and use it at all three call sites (and
`FightSelector.tsx`) so a given fight's wipe percentage is always rendered identically everywhere
it appears.

### WR-03: `scripts/protected-elements.mjs`'s canonical check can pass while looking at the wrong page entirely

**File:** `scripts/protected-elements.mjs:114-121` (`fetchRoute`), `scripts/protected-elements.mjs:144-156` (`checkCanonicalRoute`)

**Issue:** `checkCanonicalRoute` fetches with `redirect: "follow"` and, as long as the final
response is a 2xx, extracts `<link rel="canonical">` and passes if it exists and contains no `?`.
It never checks that the final response actually came from the requested origin/page. This is not
hypothetical — it already happened in this project's own recorded run
(`docs/OPS-01-SHIP-GATE.md` Part 5, "Preview deployment" section): running the script against an
SSO-protected preview URL followed Vercel's redirect all the way to `https://vercel.com/login`,
whose page happens to have its own canonical `<link>` with no `?`, producing:
```
PASS  route:analyze-canonical  canonical=https://vercel.com/login
```
That is a script bug, not (only) an environment limitation: the script's own header comment states
"A gate that greens when it cannot see its subject is worse than no gate" and that an unreachable
base URL must be `fatal`, never silently scored — but here the base *was* reachable, just not the
page the check believes it inspected, and the check reported a coincidental PASS instead of
catching the mismatch. The three `route:og-*` image checks in the same run happened to fail
correctly only because the SSO login page's content-type isn't `image/*` — a redirect target that
returned any `image/*` response would pass those the same way.

**Fix:** Verify the final response is actually still on the expected host before trusting anything
extracted from its body, e.g.:
```js
const finalUrl = res.res.url; // fetch() exposes the post-redirect URL
if (new URL(finalUrl).origin !== new URL(url).origin) {
  return { id, pass: false, detail: `redirected off-origin to ${finalUrl}` };
}
```
applied in both `checkCanonicalRoute` and `checkImageRoute` before evaluating their respective
`pass` conditions.

## Info

### IN-01: `AwardRow.tone` is computed and shipped but never read

**File:** `lib/awards-engine.ts:383` (assignment), `lib/wcl-types.ts:521` (type)

**Issue:** Every fired award carries a `tone: "praise" | "jab"` (D-01's praise-vs-roast
distinction), serialized into every `AwardsResult` returned to both consumers. Neither renderer —
`AwardsPanel` in `app/components/RaidOverview.tsx:325-346` nor `AwardsCard` in
`app/og/route.tsx:291-336` — reads `award.tone` anywhere; the only per-award differentiation
rendered is the icon. The field is dead weight in every response payload and every OG image
render.

**Fix:** Either use `tone` for a visual cue (e.g. a subtle colour/border difference between praise
and jab rows, consistent with `@theme` tokens) or drop it from `AwardRow`/`AWARD_POOL` until a
surface actually consumes it.

---

_Reviewed: 2026-09-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
