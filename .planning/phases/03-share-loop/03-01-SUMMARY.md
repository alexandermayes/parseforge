---
phase: 03-share-loop
plan: 01
subsystem: api
tags: [next-og, satori, awards-engine, share-links, vitest]

requires: []
provides:
  - "lib/awards-engine.ts — pure computeAwards(overview, fight) over RaidOverviewResult, 5-rule seed pool"
  - "AwardWinner/AwardTone/AwardRow/AwardsResult types in lib/wcl-types.ts"
  - "app/og/route.tsx view=awards branch rendering AwardsCard, falling back to ReportCard"
  - "generateMetadata forwards view into the OG URL, canonical stays param-free"
  - "lib/share-links.ts — normalized share-link builders + parseShareRef allowlist"
affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07]

actuals:
  tokens: 8179
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "One pure engine, two renderers (lib/healer-metrics.ts lineage): lib/awards-engine.ts is the single source of truth the OG image and (03-04) the in-app panel both read"
    - "Never-fail-an-unfurl: the view=awards branch degrades to the existing ReportCard on any fetch failure or fewer than MIN_AWARDS_FOR_CARD fired awards"
    - "Normalized share-link builders take an explicit origin argument — no share surface reads the browser's current URL"

key-files:
  created:
    - lib/awards-engine.ts
    - lib/awards-engine.test.ts
    - lib/share-links.ts
    - lib/share-links.test.ts
  modified:
    - lib/wcl-types.ts
    - app/og/route.tsx
    - app/analyze/[reportCode]/page.tsx

key-decisions:
  - "bossPercentage in the awards card WIPE pill divides by 100 before formatting (matching FightSelector.tsx's existing convention: WCL returns basis-points-scaled percentages), not a bare Math.round — this keeps the header consistent with the rest of the app rather than inventing a second percentage convention."
  - "Winner tie-breaking uses a per-rule numeric rank (throughput/hps/avgItemLevel, or 0 for unranked rules like flaskless) sorted descending, then localeCompare ascending on name, then truncated to MAX_WINNER_NAMES with the remainder in extraWinnerCount — enforced in the engine so Satori never receives more names than a row fits (RESEARCH Pitfall 2)."

patterns-established:
  - "Award rule pool: AWARD_POOL entries carry id/title/icon/priority/tone/evaluate; computeAwards runs every rule, keeps fired ones, sorts by priority, caps at MAX_AWARDS_SHOWN. Plan 03-02 appends priorities 6-15 to the same array without touching the first five."

requirements-completed: [SHARE-01, SHARE-02]

coverage:
  - id: D1
    description: "computeAwards evaluates a fixed 5-rule pool (first-to-die, top-dps, top-hps, flaskless, best-prepared) over RaidOverviewResult, firing only when trigger conditions hold, never throwing on malformed input"
    requirement: SHARE-01
    verification:
      - kind: unit
        ref: "lib/awards-engine.test.ts (13 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "app/og/route.tsx view=awards branch fetches /api/raid-overview + /api/report, computes awards, and renders a 1200x630 AwardsCard with a Kill/Wipe header when at least MIN_AWARDS_FOR_CARD awards fired; falls back to ReportCard otherwise (unrecognised view, failed fetch, thin award set)"
    requirement: SHARE-01
    verification:
      - kind: manual_procedural
        ref: "local next dev smoke check: both ?view=awards and ?view=zzz returned 200 image/png"
        status: pass
    human_judgment: true
    rationale: "Local dev has no WCL_CLIENT_ID/SECRET (Vercel-only per CLAUDE.md), so both smoke-check URLs actually exercised the ReportCard fallback path, not the real awards-data render path. The fallback behavior, wiring (computeAwards call site, view-param gating), and the engine itself are unit-tested and code-reviewed, but rendering AwardsCard from genuine raid-overview data has only been verified by static review, not a live fetch. The plan itself marks the real-Discord-unfurl truth as verification: backstop — a preview/prod check with real credentials is the natural place to close this."
  - id: D3
    description: "generateMetadata forwards the view param into the same ogParams URLSearchParams that already carries fight/source; alternates.canonical stays the bare param-free /analyze/{code} URL"
    requirement: SHARE-01
    verification:
      - kind: other
        ref: "grep gate: computeAwards=1 view=1 canonical=1 canonical-with-query=0 (wiring-ok)"
        status: pass
    human_judgment: false
  - id: D4
    description: "lib/share-links.ts exports pure, tab-free URL builders for the report/player/awards permalinks and the awards OG preview path, plus a parseShareRef allowlist that drops any ref value outside share|parse|awards"
    requirement: SHARE-02
    verification:
      - kind: unit
        ref: "lib/share-links.test.ts (19 tests, TDD RED→GREEN)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-16
status: complete
---

# Phase 3 Plan 1: End-to-End Awards Tracer + Share-Link Contract Summary

**One pure `lib/awards-engine.ts` module (5-rule seed pool) feeds a new `view=awards` branch on `/og` that renders a real Discord-shareable awards card or falls back safely, plus a `lib/share-links.ts` module that becomes the single source of every normalized share URL this phase copies.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-16T05:24:00Z
- **Completed:** 2026-09-16T05:36:49Z
- **Tasks:** 2 completed
- **Files modified:** 7 (4 created, 3 modified)

## Accomplishments
- `lib/awards-engine.ts` — pure `computeAwards(overview, fight)` over `RaidOverviewResult`, seeded with the exact 5-rule pool (first-to-die, top-dps, top-hps, flaskless, best-prepared) at priorities 1-5, capped at `MAX_AWARDS_SHOWN`/`MAX_WINNER_NAMES`, never throws on falsy/empty/zero-duration input
- `AwardWinner`/`AwardTone`/`AwardRow`/`AwardsResult` types added to `lib/wcl-types.ts` beside `RaidOverviewResult`
- `app/og/route.tsx` gained a `view=awards` branch: exact-literal param check before any fetch, `Promise.all` of `/api/raid-overview` + `/api/report/{code}`, a new `AwardsCard` (boss name, Kill/Wipe pill, up to 6 award rows with class-coloured winner names), and a fall-through to the existing `ReportCard` on any failure or a thin award set
- `generateMetadata` in `app/analyze/[reportCode]/page.tsx` forwards `view` into the same `ogParams` URL, canonical stays param-free
- `lib/share-links.ts` — `buildReportShareUrl`, `buildPlayerShareUrl`, `buildAwardsShareUrl`, `buildAwardsOgPath`, `parseShareRef` — every one tab-free, origin-explicit, and TDD'd (RED commit `cad9227` → GREEN commit `93ac202`)

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end awards card — one fight, one URL, one image** - `823f4d4` (feat)
2. **Task 2: The one normalized share-link contract every share surface copies** - `cad9227` (test, RED) → `93ac202` (feat, GREEN)

**Plan metadata:** (this commit, docs)

_Note: Task 2 is TDD — RED then GREEN, no REFACTOR needed (implementation was already minimal)._

## Files Created/Modified
- `lib/awards-engine.ts` - Pure award-rule engine; single source of truth for the OG image and (03-04) the in-app panel
- `lib/awards-engine.test.ts` - 13 tests covering every `<behavior>` bullet, fixture-plus-synthetic idiom matching `raid-overview-engine.test.ts`
- `lib/wcl-types.ts` - Added the awards contract types beside `RaidOverviewResult`
- `app/og/route.tsx` - New `view=awards` branch + `AwardsCard` Satori component
- `app/analyze/[reportCode]/page.tsx` - `generateMetadata` forwards `view` into the OG URL
- `lib/share-links.ts` - Normalized share-link builders + `ref` allowlist
- `lib/share-links.test.ts` - 19 tests (TDD)

## Decisions Made
- Boss percentage in the WIPE pill divides the raw WCL value by 100 before formatting (`(bossPercentage / 100).toFixed(1)`), matching the existing convention in `app/components/FightSelector.tsx` rather than inventing a second percentage format.
- Winner ranking is a per-rule numeric field on the internal candidate type (throughput/hps/avgItemLevel, or a flat 0 for the unranked `flaskless` rule), sorted descending then by name ascending, so tie-breaking is deterministic and testable independent of iteration order.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Local `next dev` has no `WCL_CLIENT_ID`/`WCL_CLIENT_SECRET` (Vercel-only per CLAUDE.md), so the plan's own local smoke-check verify step — confirming both the awards URL and an unrecognised-view URL return `200 image/png` — passed, but both requests actually exercised the `ReportCard` fallback path rather than a genuine raid-overview-backed `AwardsCard` render (the raid-overview and report-meta fetches both 500'd on missing credentials, which `fetchJson` correctly swallowed into `null`). The engine itself is fully unit-tested, the wiring (single `computeAwards(` call site, exact-literal `view` gate before any fetch, fall-through order) is grep-gated and code-reviewed, and the never-fail-an-unfurl contract worked exactly as designed. What remains unverified locally is the "renders from real data" half of Task 1's done-criterion — this is the same gap the plan's own `must_haves.truths` backstop entry ("unfurls in a real Discord channel... verification: backstop") already anticipates, and is naturally closed on the first preview/prod deploy that has WCL credentials.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`lib/awards-engine.ts` and `lib/share-links.ts` are the two shared modules every remaining Phase 3 plan builds on: 03-02 appends 10 more rules to `AWARD_POOL` (priorities 6-15) plus a human-review checkpoint on the full pool's tone; 03-03 reuses `buildPlayerShareUrl` for the player-permalink "Share my parse" button; 03-04 wires `AwardsPanel` in `RaidOverview.tsx` to `computeAwards` and `buildAwardsOgPath`. No blockers. One item to close on the first preview/prod deploy of this phase: confirm `AwardsCard` renders correctly from genuine `/api/raid-overview` + `/api/report` data (see Issues Encountered) — not a code gap, just a local-environment credential gap.

## Self-Check: PASSED

- All 8 key files/artifacts confirmed present on disk (`[ -f ]`).
- All 3 task commit hashes (`823f4d4`, `cad9227`, `93ac202`) confirmed in `git log --oneline --all`.
- `lib/awards-engine.ts` exports all 5 required symbols (`computeAwards`, `AWARD_POOL`, `MAX_AWARDS_SHOWN`, `MIN_AWARDS_FOR_CARD`, `MAX_WINNER_NAMES`); contains no `fetch(`/`posthog` reference.
- `npx vitest run lib/awards-engine.test.ts lib/share-links.test.ts` → 2 files, 32 tests passed.
- `npx vitest run` (full suite) → 18 files, 194 tests passed.
- `npx tsc --noEmit` clean.
- Plan-level `<verification>` re-run: full suite green, tsc clean, demo report awards/unknown-view OG URLs both returned `200 image/png`, `/analyze/{code}` canonical still param-free (see wiring-ok gate above).

---
*Phase: 03-share-loop*
*Completed: 2026-09-16*
