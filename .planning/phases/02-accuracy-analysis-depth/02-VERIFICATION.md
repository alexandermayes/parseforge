---
phase: 02-accuracy-analysis-depth
verified: 2026-09-08T18:45:00Z
status: human_needed
score: 4/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Confirm the six PostHog events this phase and Phase 1 carried forward (timeline_viewed, timeline_error, timeline_filter_used, analysis_complete, theme_changed, consent_resolved) are registered as event definitions in the PostHog project, and re-run Search Console inspection for /analyze/{code} and / against the Phase 2 production build."
    expected: "Each event appears in PostHog's event-definitions list with the props this phase's grep evidence confirms (report_code, fight_id, cast_count, truncated, ability_count, hidden_count, player_role, overheal_percent, activity_percent, top_overheal_percent, suggestion_count); GSC shows /analyze/{code} and / indexable with no new coverage or manual-action issues."
    why_human: "No PostHog or gscServer MCP tool is available in this verifier's tool set either — the identical limitation the 02-09 executor recorded. This is an external-service confirmation step, not something a grep or local test run can prove. The code-side mechanism (single capture call site per event, unchanged canonical/robots/structured-data for /analyze) is independently verified in this report and is low-risk, but the roadmap success criterion explicitly requires the events to be confirmed and the GSC pass to be run, not merely coded."
---

# Phase 2: Accuracy & Analysis Depth Verification Report

**Phase Goal:** Raiders get verifiably correct analysis plus the per-fight depth competitors already offer.
**Verified:** 2026-09-08
**Status:** human_needed
**Re-verification:** No — initial verification

**Note on ROADMAP mode:** `02: Accuracy & Analysis Depth` carries `Mode: mvp` in ROADMAP.md, but its
goal text ("Raiders get verifiably correct analysis plus the per-fight depth competitors already
offer") is not phrased as a User Story (`As a ..., I want ..., so that ...`) —
`gsd_run query user-story.validate` confirms `valid: false`. This matches Phase 1's own precedent
(01-VERIFICATION.md: "the MVP-mode User Flow Coverage narrowing was not applied") and the phase's own
02-01-PLAN.md frontmatter, which states: *"MVP_MODE is enabled, but the ROADMAP Goal line for Phase 2
is not in As a / I want to / so that form. Per the MVP planning rules no user story is invented here —
the ROADMAP goal is carried verbatim."* Standard goal-backward verification against the five ROADMAP
success criteria was applied instead of MVP user-flow narrowing.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can open a per-fight cast timeline for a player in an analyzed report and read what that player actually cast, in order | ✓ VERIFIED | Live production proof: `POST https://parseforge.gg/api/timeline {reportCode:"ZjKgNYxVcAqR8pGJ",fightId:23,sourceId:12}` → 200, `castCount:159`, `idleThresholdMs:2762`, `truncated:false` — reproduces the exact 02-05 calibration numbers. Code: `lib/timeline-engine.ts` (`buildCastTimeline`), `app/api/timeline/route.ts` (validated, rate-limited via `RATE_LIMITS.timeline`, `MAX_TIMELINE_PAGES=20` cap, `cachedApiHandler`), `app/components/CastTimeline.tsx` (chronological rows, idle/death bands, filter chips), Timeline tab wired into `AnalysisView.tsx`'s `ptab` allow-list (7 values, param-free canonical preserved). `npx vitest run lib/timeline-engine.test.ts` = 17/17. |
| 2 | Healers are judged on healer-relevant metrics rather than raw HPS alone — a healer viewing their own row sees analysis that reflects healing decisions, not a DPS-shaped ranking | ✓ VERIFIED | Live production proof: `POST /api/analyze {reportCode, fightId:23, sourceId:32}` → `healer:{effectiveHps:667, overhealPercent:35.6, activityPercent:68.2, topOverhealPercent:12.4, topActivityPercent:95}`, `dps.percentile:19` (percentile retained per D-06), suggestions include two `"healing"`-category cards with copy naming both the player's and top-healers' values ("Your overheal is 35.6% vs 12.4% for top healers..."), and **no** DPS-shaped "casts per minute"/"GCD" suggestion appears. Cross-surface parity (D-08) confirmed live: `POST /api/raid-overview` for the same fight returns the identical `hps:667, overhealPercent:35.6, activityPercent:68.2` for source 32 in `healerMetrics`. Code: `lib/healer-metrics.ts` (`computeHealerMetrics`, single source of truth, called from both `app/api/analyze/route.ts` and `lib/raid-overview-engine.ts`), `lib/analysis-engine.ts` line ~611 gates the DPS active-time rule off with `playerRole !== "healer"`. `npx vitest run lib/healer-metrics.test.ts` = 21/21 incl. cross-surface equality assertion. |
| 3 | Every enchant/gem/consumable ID the analysis surfaces traces to a wago.tools-regenerated data file (no hand-typed maps), with the regeneration re-run and the diff reviewed this phase | ✓ VERIFIED | `grep -c "new Map(\[" lib/cla-constants.ts` = 0 — zero inline id-map literals remain; file imports `ENCHANT_NAME_DB`/`GEM_NAME_DB`/`GEM_STAT_DB`/`CONSUMABLE_DB` from `./generated` (`lib/generated/index.ts`, composed from three wago-generated era modules + `game-data-overrides.json`). Re-ran `node scripts/regen-game-data.mjs --report` live this session: exit 0, three distinct era-appropriate builds (2.5.6.69546 / 3.4.5.63697 / 4.4.2.60895), all row-count floors met, matching the committed `docs/GAME-DATA-AUDIT.md` (184KB, real content: builds, row counts vs floors, 133 source-noted unverified overrides, cross-era collision lists). `lib/cla-constants.test.ts` (10/10) passes unmodified against the composed data. Diff-review evidence: `docs/OPS-01-SHIP-GATE.md` Task 1 section records the reviewed counts (133 unverified overrides, 0 changed values since previous run); two ids (96264, 96294) are flagged in `.planning/WINDOWS.md` as open follow-ups — real, previously-verified override values, not placeholders, judged an acceptable deferral (see Anti-Patterns/Gaps below). |
| 4 | `cla-engine`, `raid-overview-engine`, and `wcl-client` have automated tests that fail when analysis output changes — a regression safety net in place before the redesign touches anything | ✓ VERIFIED | `lib/cla-engine.test.ts` (167 lines, 9 tests/18 assertions + committed snapshot), `lib/raid-overview-engine.test.ts` (155 lines, 6 tests/18 assertions incl. D-08 cross-surface parity + committed snapshot), `lib/wcl-client.test.ts` (230 lines, 10 tests covering token mint/401-refresh, 429/500 retry-ceiling, AbortError timeout, all three GraphQL-error classifications, userMessage boundary, missing-credential branches — via `vi.stubGlobal(fetch)`, no network/Redis/credential). Full suite re-run this session: `npm test` → **14 files / 135 tests, all passing**. `git diff --quiet HEAD -- lib/wcl-client.ts` confirms the client itself is untouched (tests only). `docs/OPS-01-SHIP-GATE.md` states a red `npm test` blocks a production deploy; `.github/workflows/ci.yml` runs `npm test`. |
| 5 | New timeline and healer surfaces ship with PostHog events and pass the GSC verification pass (OPS-01 gate) | ⚠️ UNCERTAIN | **Mechanism verified, external confirmation pending.** Grep confirms exactly one `posthog.capture` call site per event: `timeline_viewed`, `timeline_error`, `timeline_filter_used` (all in `useTimeline.ts`), `analysis_complete` (in `usePlayerAnalysis.ts`) — matching `docs/OPS-01-SHIP-GATE.md`'s own pre-deploy grep evidence. `app/analyze/[reportCode]/page.tsx` (the canonical/`noindex`/404 logic) is confirmed untouched by this phase (`git log` shows its last commit predates Phase 1); the Timeline tab lives behind the existing param-free `ptab` search key, adding no indexable surface. **However**, the roadmap criterion requires the events to be *confirmed* and a GSC pass to be *run*, and `docs/OPS-01-SHIP-GATE.md` itself records both as `no-data` ("PostHog MCP tool [is not] available... Search Console... `gscServer` MCP tool [is not] available"), carried forward to the Phase 3 gate. This verifier's own tool set also has no PostHog or GSC MCP access, so this cannot be closed from this session either — routed to human verification below rather than assumed passing. |

**Score:** 4/5 truths verified (1 routed to human verification — external service confirmation, not a code gap)

### Required Artifacts (via `gsd-tools query verify.artifacts`, all 9 plans)

| Plan | Artifacts | Result |
|------|-----------|--------|
| 02-01 | 6 (fixtures recorder, README, fixtures.test.ts, wcl-queries.ts, wcl-types.ts, constants.ts) | 6/6 passed |
| 02-02 | 5 (timeline-engine.ts, timeline-engine.test.ts, timeline route, useTimeline hook, CastTimeline.tsx) | 5/5 passed |
| 02-03 | 7 (regen script, overrides json+ts, 3 era modules, game-data.test.ts) | 7/7 passed |
| 02-04 | 3 (healer-metrics.ts, healer-metrics.test.ts, constants.ts) | 3/3 passed |
| 02-05 | 3 (timeline-engine.ts, timeline-engine.test.ts, CastTimeline.tsx) | 3/3 passed |
| 02-06 | 4 (game-data.consumables.ts, generated/index.ts, GAME-DATA-AUDIT.md, cla-constants.ts) | 4/4 passed |
| 02-07 | 3 (analysis-engine.ts, analysis-engine.test.ts, ComparisonSummary.tsx) | 3/3 passed |
| 02-08 | 4 (cla-engine.test.ts, raid-overview-engine.test.ts, wcl-client.test.ts, OPS-01-SHIP-GATE.md) | 4/4 passed |
| 02-09 | 1 (OPS-01-SHIP-GATE.md) | 1/1 passed |

All 36 declared artifacts exist, are substantive (well above `min_lines` where declared), and contain their required patterns.

### Key Link Verification (via `gsd-tools query verify.key-links`)

25/26 links verified by the automated pattern-match tool. The one reported failure is a **false
positive**, resolved by manual code reading: `scripts/regen-game-data.mjs -> lib/generated/game-data.classic-tbc.ts`
was flagged because the literal string `game-data.classic-tbc` never appears in the generator source —
the script builds the filename programmatically (`` `game-data.${era.id}.ts` `` with `era.id = "classic-tbc"`,
confirmed at `scripts/regen-game-data.mjs:663`). The file genuinely exists (121KB, generated header,
real content) and is genuinely written by this script — verified directly rather than by pattern match.

### Data-Flow Trace (Level 4)

Every rendered healer/timeline value traced to a live production API response, not a static fallback:
- Timeline rows (`CastTimeline.tsx`) ← `useTimeline` hook ← `POST /api/timeline` ← `buildCastTimeline` ← `TIMELINE_CASTS_QUERY`/`TIMELINE_CASTS_PAGE_QUERY` against WCL — confirmed live (200, real cast/idle/death rows, `castCount:159`).
- Healer comparison rows (`DpsComparison.tsx`) ← `AnalysisResult.healer` ← `app/api/analyze/route.ts`'s healer branch ← `computeHealerMetrics` over the un-scoped `healingByPlayer` row — confirmed live (`effectiveHps:667`, matches raid-overview's independently-computed value for the same source/fight).
- Game-data names (`ENCHANT_NAME_DB` etc.) ← `lib/generated/index.ts` composition ← three wago-generated era modules + overrides — confirmed via direct import chain (zero `new Map([...])` literals left in `cla-constants.ts`) and a fresh live `--report` regeneration run this session.

No STATIC or HOLLOW_PROP findings.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Timeline route returns real, ordered casts | `POST https://parseforge.gg/api/timeline` (real report/fight/source) | 200, `castCount:159`, `idleThresholdMs:2762`, `truncated:false` | ✓ PASS |
| Healer analyze payload carries healer-relevant metrics + top-healer comparison | `POST https://parseforge.gg/api/analyze` (healer source) | 200, `healer.effectiveHps:667`, `overhealPercent:35.6` vs `topOverhealPercent:12.4` | ✓ PASS |
| Raid overview and player page agree on the same healer's numbers (D-08) | `POST https://parseforge.gg/api/raid-overview` for the same fight | `healerMetrics` entry for source 32: `hps:667, overhealPercent:35.6, activityPercent:68.2` — identical to the analyze payload | ✓ PASS |
| DPS-shaped suggestion never reaches a healer | grep + live payload inspection | `playerRole !== "healer"` gate on the active-time rule (`lib/analysis-engine.ts`); live healer payload contains zero "GCD"/"casts per minute" suggestions | ✓ PASS |
| No hand-typed ID maps remain | `grep -c "new Map(\[" lib/cla-constants.ts` | `0` | ✓ PASS |
| Regeneration script is genuinely re-runnable | `node scripts/regen-game-data.mjs --report` (live network) | exit 0, three distinct builds, all floors met | ✓ PASS |
| Full test suite green | `npm test` | 14 files / 135 tests passing | ✓ PASS |
| Typecheck clean | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Token audit / theme parity clean | `npm run token-audit` / `npm run theme-parity` | 0 non-allowlisted findings / PASS | ✓ PASS |
| Each new PostHog event has exactly one capture site | grep over `app/`, `lib/` | 1 hit each for `timeline_viewed`, `timeline_error`, `timeline_filter_used`, `analysis_complete` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ACC-01 | 02-01, 02-03, 02-06, 02-09 | Game-data accuracy re-audit via wago.tools regen | ✓ SATISFIED | `REQUIREMENTS.md` marks `[x]` Complete; zero hand-typed maps in `cla-constants.ts`; live regen re-run this session; `docs/GAME-DATA-AUDIT.md` committed and substantive |
| ACC-02 | 02-01, 02-08 | Test coverage for `cla-engine`/`raid-overview-engine`/`wcl-client` | ✓ SATISFIED | Three new test files (167/155/230 lines), 14/14 suite files green, `wcl-client.ts` itself untouched, CI runs `npm test`, ship gate states red suite blocks deploy |
| ACC-03 | 02-01, 02-02, 02-05, 02-09 | Per-fight cast timeline | ✓ SATISFIED | Live production proof (200, real casts/idle/death rows); param-free canonical preserved; lazy-loaded (no fetch until tab opened) |
| ACC-04 | 02-01, 02-04, 02-07, 02-09 | Healer-specific analysis beyond raw HPS | ✓ SATISFIED | Live production proof (effective HPS/overheal%/uptime% + top-healer comparison + healer-specific suggestions); DPS-shaped rule suppressed for healers; cross-surface parity confirmed live |

No orphaned requirements found — `REQUIREMENTS.md`'s traceability table maps exactly ACC-01..04 to Phase 2, all four already marked `Complete`, consistent with what this verification independently found in the codebase.

### Anti-Patterns Found

None (blocker or warning level). Scanned every file across all 9 plans' `key-files` (created + modified,
~35 files) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` and placeholder-copy phrases — zero matches.
Scoped `npx eslint` over the same file set: 0 errors, 1 pre-existing, previously-documented `<img>` LCP
warning in `CastTimeline.tsx` (a deliberate choice — Wowhead icon CDN via a canvas-independent `<img>`,
not a stub).

**ℹ️ Info — honest, already-disclosed deferrals (not anti-patterns):**
- Two Cata weapon-enhancement consumable ids (96264, 96294) resolve to a SpellName value the pipeline
  could not corroborate against another era; preserved via a source-noted override at the
  *pre-existing, previously-verified* value (not a regression, not a placeholder), flagged in
  `docs/GAME-DATA-AUDIT.md` and tracked open in `.planning/WINDOWS.md` for a future ItemSparse-based
  verification pass. Judged an acceptable deferral: it changes no resolved value from what was already
  shipping, and is transparently disclosed rather than hidden.
- 130/178 consumable names required an explicit `consumableNames` override rather than direct
  per-era wago derivation (buff-aura names diverge from item flavor names more often than the plan
  anticipated). Every override is source-noted and behaviour-preserving (full 178-row parity check
  found zero mismatches against the pre-cutover map) — this is the honest transparency mechanism
  D-11/D-12 exist to produce, not a gap in it.

### Prohibitions (judgment-tier, LLM-judge verdict — non-authoritative, human review recommended)

Every plan declared at least one `verification: judgment` prohibition. Reviewed against the codebase;
all resolve to **no violation found**, but per the honest-verifier protocol these are advisory, not a
substitute for the human sign-off already partially captured in `docs/OPS-01-SHIP-GATE.md`'s developer
preview-sweep approval:

| Prohibition (paraphrased) | Plan | Verdict |
|---|---|---|
| MUST NOT record a fixture from a non-public report | 02-01 | No violation — human already confirmed publicly-viewable report before commit (02-01-SUMMARY.md: "user replied approved") |
| MUST NOT overwrite generated data with fewer/zero rows on a degraded fetch | 02-03 | No violation — `scripts/regen-game-data.mjs:1079-1080` exits 1 with "no files written" before any write when a floor finding exists (code-verified this session) |
| MUST NOT let the raid table and player page derive healer numbers independently | 02-04 | No violation — live cross-surface check this session: identical `hps`/`overhealPercent`/`activityPercent` from both `/api/analyze` and `/api/raid-overview` for source 32 |
| MUST NOT present healer overheal/uptime as a fault without the top-healer value beside it | 02-04 | No violation — live payload confirms both values always render together ("35.6% vs 12.4%") |
| MUST NOT present a truncated/filtered log as complete | 02-05 | No violation — `truncated` flag drives a dedicated notice row; live check returned `truncated:false` with a `truncated` field present in the response shape |
| MUST NOT hide non-junk casts by default | 02-05 | No violation — 02-05-SUMMARY.md and code confirm all filter chips start selected |
| MUST NOT present a hand-sourced override id as wago-verified | 02-06 | No violation — `UNVERIFIED_IDS` registry separates overrides from generated data; `docs/GAME-DATA-AUDIT.md` lists them under a distinct "Unverified overrides" heading |
| MUST NOT render a DPS-shaped suggestion to a healer | 02-07 | No violation — code gate + live payload both confirm |
| MUST NOT ship tests that pass without exercising logic | 02-08 | No violation — read test bodies directly; assertions are fixture-grounded, named to real player source ids and real branches (missing-enchant slots, gem-role mismatch, etc.), not vacuous |
| MUST NOT deploy to production without explicit developer approval in-session | 02-09 | No violation per the gate doc's documented two-round approval sequence — not independently re-verifiable by this agent (a past human action) |

### Human Verification Required

1. **PostHog event definitions + Search Console re-inspection (routed from Truth 5)**
   **Test:** Confirm `timeline_viewed`, `timeline_error`, `timeline_filter_used`, `analysis_complete`
   (plus the Phase-1-carried-forward `theme_changed`/`consent_resolved`) appear as registered event
   definitions in the PostHog project with the props this report's grep evidence names; re-run GSC
   inspection for `/analyze/{code}` and `/` against the live Phase 2 build.
   **Expected:** All six events present with expected props; GSC shows both routes indexable, no new
   coverage/manual-action issues.
   **Why human:** Requires PostHog and `gscServer` MCP tool access unavailable to both the 02-09
   executor and this verifier. The code-side mechanism is fully verified in this report (single
   capture call site per event; canonical/robots/structured-data for `/analyze` confirmed unchanged);
   only the external-service confirmation step is outstanding, and it is already tracked as the
   first item to re-check at the Phase 3 gate in `docs/OPS-01-SHIP-GATE.md`.

### Gaps Summary

No code-level gaps found. Every ROADMAP success criterion is backed by live production evidence
(not just unit tests or SUMMARY narrative) except criterion 5's external-service confirmation half,
which is an honestly-disclosed, already-tracked follow-up rather than a silently-dropped requirement —
routed to human verification rather than either passed or failed outright. The two flagged game-data
ids (96264, 96294) and the 130/178 consumable-override ratio are transparency artifacts of the D-11/D-12
mechanism working as designed, not defects in it.

---

_Verified: 2026-09-08_
_Verifier: Claude (gsd-verifier)_
