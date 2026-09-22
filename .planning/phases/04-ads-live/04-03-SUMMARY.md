---
phase: 04-ads-live
plan: 03
subsystem: ads
tags: [adsense, consent, tracer, protected-elements, csp, next-config, posthog]

# Dependency graph
requires:
  - phase: 04-01
    provides: pre-ad CWV baseline + rollback trigger in docs/OPS-01-SHIP-GATE.md Part 6 (D-09), recorded before this plan's first ad commit
provides:
  - "lib/consent.ts: publishConsentGatePath/getConsentGatePath/subscribeConsentGatePath — the single published consent decision every future consumer subscribes to instead of deriving its own"
  - "lib/ads.ts: AD_SLOTS table, shouldLoadAds, adsEnabled/adsConfigured, normalizeRoute, loadAdSenseScript — the ad gate and slot registry 04-05's remaining three slots extend"
  - "app/components/AdSlot.tsx: the reusable client component every future ad placement mounts"
  - "app/ads.txt/route.ts and next.config.ts CSP report-only entries for the three Google ad hosts"
  - "scripts/protected-elements.mjs + docs/PROTECTED-ELEMENTS.md: the machine-checked ad-slot placement whitelist 04-05's additional slots must also satisfy"
affects: [04-05, 04-06, 04-07]

# Actuals (#2632)
actuals:
  tokens: 11972
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Consent decision promoted to a published singleton (lib/consent.ts publishConsentGatePath/subscribeConsentGatePath) — PostHogProvider is one subscriber, the ad gate is a second, neither re-derives the decision"
    - "Env-gated client-only script injection outside next/script (lib/ads.ts loadAdSenseScript appends directly to document.body, idempotent via a module-level promise)"
    - "Docs-plus-machine-check extended to a second table in the same doc/script (scripts/protected-elements.mjs's ## Ad slot placements half, mirroring the ## DOM attributes half)"

key-files:
  created:
    - lib/ads.ts
    - lib/ads.test.ts
    - app/components/AdSlot.tsx
    - app/ads.txt/route.ts
  modified:
    - lib/consent.ts
    - app/components/PostHogProvider.tsx
    - app/tbc-audit/page.tsx
    - next.config.ts
    - scripts/protected-elements.mjs
    - docs/PROTECTED-ELEMENTS.md

key-decisions:
  - "Promoted the resolved ConsentGatePath to a published singleton in lib/consent.ts rather than letting lib/ads.ts derive its own — the assumption-delta decision recorded in 04-01-PLAN.md, enforced by an invariant test that goes red on any future divergence"
  - "Split adsEnabled() (env flag + publisher id) from adsConfigured() (adds the per-slot unit-wired check) so AdSlot reserves its exact box the moment ads are switched on, even before a slot has a real AdSense unit id"
  - "Scoped protected-elements.mjs's two doc-table parsers to their own heading section via an anchored regex, rather than a document-wide backtick-pair search, once a second such table existed"

patterns-established:
  - "Ad slot registry (lib/ads.ts AD_SLOTS) as the single numeric source of truth for box dimensions, cross-checked by both a unit test and the protected-elements doc gate"
  - "AdSlot.tsx's three-effect split (consent subscription -> SDK load -> push+observe) so the AdSense push only ever fires after the <ins> element is actually mounted in the DOM"

requirements-completed: []
# MONY-02 is also declared by 04-05, 04-06 and 04-07 (none of which have a
# SUMMARY yet) — the shared-ID gate in workflows/execute-plan.md withholds
# marking it complete until every declaring plan finishes. This plan's own
# slice of MONY-02 (SC1 partial, SC2 partial, SC3 full) is verified below.

coverage:
  - id: D1
    description: "One reserved, exact-pixel ad box at the end of /tbc-audit that never shifts after first paint"
    requirement: MONY-02
    verification:
      - kind: other
        ref: "Task 1 <verify> block 4 (ssr-reserved-no-script-ok): SSR HTML contains data-ad-slot=\"tbc-audit-end\" exactly once, 0 googlesyndication references"
        status: pass
      - kind: unit
        ref: "lib/ads.test.ts#AD_SLOTS every slot's boxClass encodes exactly its own base/md pixel dimensions"
        status: pass
    human_judgment: false
  - id: D2
    description: "The ad script is requested only for the two D-07 admitted consent gate paths; tcf-reject, tcf-timeout, and an unresolved decision never fetch it"
    requirement: MONY-02
    verification:
      - kind: unit
        ref: "lib/ads.test.ts#shouldLoadAds (3 tests, incl. the assumption-delta invariant against deriveConsentGateOutcome)"
        status: pass
      - kind: other
        ref: "Task 1 <verify> block 3 (wiring-ok): lib/ads.ts and AdSlot.tsx contain zero __tcfapi/api-geo references; exactly one publish call, one geo fetch, one CMP listener repo-wide"
        status: pass
    human_judgment: false
  - id: D3
    description: "The consent decision has exactly one derivation and one publisher (PostHogProvider), with a test that fails on divergence"
    requirement: MONY-02
    verification:
      - kind: unit
        ref: "lib/ads.test.ts#shouldLoadAds \"never diverges from deriveConsentGateOutcome's optIn field\""
        status: pass
    human_judgment: false
  - id: D4
    description: "npm run protected-elements fails on a mismatched ad-slot box dimension, a missing declaration, or a stray slot mount outside the whitelist"
    requirement: MONY-02
    verification:
      - kind: other
        ref: "Task 3 <verify> block 3 (tamper-check-ok): a deliberately wrong box dimension in docs/PROTECTED-ELEMENTS.md fails the gate (exit 1); restoring it passes again"
        status: pass
    human_judgment: false
  - id: D5
    description: "/ads.txt serves a cacheable, fail-closed AdSense publisher declaration"
    requirement: MONY-02
    verification:
      - kind: other
        ref: "Task 2 <verify> blocks 2-3 (csp-adstxt-ok, ads-txt-live-ok): 200 text/plain with DIRECT line when publisher id set, 404 when unset"
        status: pass
    human_judgment: false
  - id: D6
    description: "A real AdSense unit actually fills the reserved box on a production page view"
    verification: []
    human_judgment: true
    rationale: "Explicitly flagged in this plan's frontmatter as verification: backstop — tbc-audit-end's unit is still the PENDING placeholder (04-05 wires the real AdSense unit id); this cannot be proven until a real unit exists and a production page view occurs."

duration: 45min
completed: 2026-09-21
status: complete
---

# Phase 4 Plan 3: Phase tracer — one reserved, consent-gated ad slot Summary

**End-to-end AdSense architecture proven on one route (`/tbc-audit`): a promoted, single-published consent decision (`lib/consent.ts`), a pure ad gate and slot registry (`lib/ads.ts`), a reusable reserved-box client component (`AdSlot.tsx`), report-only CSP entries, a fail-closed `/ads.txt`, and a machine-checked placement whitelist — with the real AdSense unit id deliberately still a placeholder pending 04-05.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-09-21
- **Completed:** 2026-09-21
- **Tasks:** 3/3 (Task 1 tracer+TDD, Tasks 2-3 auto)
- **Files modified:** 10 (4 created, 6 modified)

## Accomplishments

- Proved the whole ad architecture end-to-end on `/tbc-audit` before three more slots (04-05) ride on it: consent decision → gate → reserved box → idle-scheduled SDK load → push → fill observation, all consent-gated and SSR-safe (no ad script reference in delivered HTML, even with ads switched on)
- Promoted the resolved `ConsentGatePath` to a single published singleton in `lib/consent.ts` — `PostHogProvider` and the new ad gate both subscribe to it; neither derives its own decision, and an invariant test in `lib/ads.test.ts` fails the instant that ever stops being true
- Extended `docs/PROTECTED-ELEMENTS.md` and `scripts/protected-elements.mjs` with a second machine-checked table (ad slot placements) in the same document and script, proven with a real tamper test: a wrong box dimension fails the gate, restoring it passes again
- Shipped `/ads.txt` and three Google ad hosts in the report-only CSP without disturbing the `/og` exclusion or the report-only posture

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): failing test for the ad gate, slot table and consent publisher** — `10b9ff1` (test)
2. **Task 1 (GREEN): wire one reserved, consent-gated AdSense slot end-to-end** — `3792944` (feat)
3. **Task 2: report-only CSP ad hosts and /ads.txt** — `4442711` (feat)
4. **Task 3: teach protected-elements about ad slots** — `15e1c8f` (feat)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS)

## TDD Gate Compliance

Task 1 (`type="tracer" tdd="true"`): RED gate commit `10b9ff1` (`test(04-03): ...`) precedes GREEN gate commit `3792944` (`feat(04-03): ...`) — sequence satisfied. No REFACTOR commit was needed; the GREEN implementation passed lint/typecheck cleanly as written.

## Files Created/Modified

- `lib/ads.ts` — `AdSlotId`, `AdSlotSpec`, `AD_SLOTS` (tbc-audit-end: 300×250 base / 336×280 md), `shouldLoadAds`, `adsEnabled`, `adsConfigured`, `normalizeRoute`, `loadAdSenseScript`
- `lib/ads.test.ts` — 17 tests covering the gate, the consent publisher, route normalization, slot-table invariants, and `adsConfigured` edge cases
- `app/components/AdSlot.tsx` — the reserved-box client component: consent subscription → idle-scheduled admission → SDK load → push + fill observation, three low-cardinality PostHog events
- `app/ads.txt/route.ts` — fail-closed (404 on empty publisher id), cacheable (`max-age=86400`) publisher declaration
- `lib/consent.ts` — new exports `publishConsentGatePath`, `getConsentGatePath`, `subscribeConsentGatePath`
- `app/components/PostHogProvider.tsx` — moved the PostHog-key guard from an early effect return to per-call guards inside `applyOutcome`; publishes the gate path unconditionally right after the existing `register` call
- `app/tbc-audit/page.tsx` — one `<AdSlot id="tbc-audit-end" />` as the last child of `<main>`
- `next.config.ts` — three Google ad hosts added to the report-only CSP's `script-src`/`connect-src`/`frame-src`
- `scripts/protected-elements.mjs` — `parseAdSlotRows`, `readDeclaredSlots`, `checkAdSlotDeclared`, `checkAdSlotOwner`, `checkAdSlotContainment`, `checkNoStraySlots`, a live-route half, and a `findSection()` helper both doc-table parsers now share
- `docs/PROTECTED-ELEMENTS.md` — new `## Ad slot placements` table and its three enforcement rules; extended `## How this is enforced` / `## Change procedure`

## Decisions Made

- **Consent decision promoted, not forked.** `lib/consent.ts` now owns the single published `ConsentGatePath`; `lib/ads.ts`'s `shouldLoadAds` reads it, never derives it — matching the 04-01-PLAN.md assumption-delta decision and closing the exact "two independent consent derivations" bug Phase 2.1 spent a phase removing.
- **`adsEnabled()` split from `adsConfigured()`.** See Deviations below — this was necessary to reconcile the plan's own SSR verify block with the "unit still a placeholder" edge case it also requires tested.
- **`findSection()` helper for doc-table scoping.** protected-elements.mjs's two markdown-table parsers now find their own heading anchored to a real heading line, not a bare substring search — see Deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `adsConfigured()`'s box-render gate would have made `/tbc-audit`'s reserved box never render this plan**
- **Found during:** Task 1, while implementing `AdSlot.tsx`'s "if `adsConfigured(id)` is false, return null" instruction and then running the plan's own SSR `<verify>` block.
- **Issue:** The plan specifies `adsConfigured(slotId)` as gating whether `AdSlot` renders *anything*, and separately requires (as a unit test) that `adsConfigured()` is false whenever a slot's `unit` is still the `PENDING` placeholder. `tbc-audit-end`'s `unit` is deliberately `PENDING` in this plan (04-05 wires the real AdSense unit id). Under a literal single-function reading, `adsConfigured("tbc-audit-end")` is therefore *always* false this plan, so `AdSlot` would always return `null` — directly contradicting the plan's own mechanically-checked SSR verify block, which sets only `NEXT_PUBLIC_ADS_ENABLED`/`NEXT_PUBLIC_ADSENSE_PUB_ID` (never touching the unit) and requires the reserved box (`BOX=1`) to be present in the server-rendered HTML — and contradicting `must_haves.truths` #1 ("a visitor... sees one reserved ad box").
- **Fix:** Added `adsEnabled()` (env flag + publisher id only) as the box-render gate `AdSlot` actually uses. `adsConfigured(slotId)` still exists exactly as specified (`adsEnabled() && unit wired`) and still gates whether the SDK is ever loaded / an ad is ever requested — so an unwired slot reserves its exact box but never fires a real ad request, which is the sensible interim state pending 04-05's real unit id.
- **Files modified:** `lib/ads.ts`, `app/components/AdSlot.tsx`
- **Verification:** Task 1's SSR `<verify>` block passes (`ssr-reserved-no-script-ok`: reserved box present exactly once, zero script references); the `adsConfigured` unit-placeholder edge case test in `lib/ads.test.ts` still passes.
- **Committed in:** `3792944`

**2. [Rule 1 - Bug] `parseChecklistRows` scanned the whole document, not its own section**
- **Found during:** Task 3, immediately after adding the second `## Ad slot placements` table and running `npm run protected-elements`.
- **Issue:** Two related failures surfaced. (a) `parseChecklistRows`'s row regex (`^\|...\`([^\`]+)\`...\`([^\`]+)\`...`) ran against the whole file with no section scoping, so it also matched the new ad-slot table's row and produced a spurious `attr:tbc-audit-end` check (looking for `data-protected="tbc-audit-end"` in a file that has no such attribute) — an existing latent bug the second table exposed. (b) My first fix attempt used `indexOf(heading)` to scope each table, but this doc's own prose on line 15 references `` `## DOM attributes` `` inline in backticks *before* the real heading on line 18 — `indexOf` matched that prose mention, sliced an empty "section," and made the parser FATAL with zero rows.
- **Fix:** Added a shared `findSection(src, heading)` helper anchored to an actual heading line (`^## Heading$`, multiline flag) rather than a bare substring search, used by both `parseChecklistRows` and the new `parseAdSlotRows`.
- **Files modified:** `scripts/protected-elements.mjs`
- **Verification:** `npm run protected-elements` now reports the correct 6 `attr:` + 4 `route:` + 6 `adslot:` = 16 passing checks, 0 failed; the six pre-existing `data-protected` rows are unaffected.
- **Committed in:** `15e1c8f`

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs exposed by this plan's own new checks/tests, fixed inline, no scope creep).
**Impact on plan:** Both fixes were necessary for correctness — the first keeps this plan's own mechanically-verified truths internally consistent, the second keeps the extended protected-elements gate from producing a false failure and a false FATAL. No behavior outside `lib/ads.ts`, `app/components/AdSlot.tsx`, and `scripts/protected-elements.mjs` was touched.

## Issues Encountered

None beyond the deviations above.

## User Setup Required

None this plan. `NEXT_PUBLIC_ADS_ENABLED` and `NEXT_PUBLIC_ADSENSE_PUB_ID` are not yet set in any Vercel environment — that, plus the real AdSense unit id for `tbc-audit-end`, is 04-05's `user_setup` (the AdSense account checkpoint), not this plan's.

## Next Phase Readiness

- **Ready:** The consent publisher, the ad gate, the slot registry, `AdSlot.tsx`, the CSP hosts, `/ads.txt`, and the extended protected-elements gate are all in place and green. 04-05 can add its three remaining slots (`tbc-audit-mid`, `analyze-mid`, `analyze-end`) to `AD_SLOTS` and mount them, extend the placement table with three more rows, and supply the real AdSense unit id — all riding on this plan's proven architecture rather than re-deriving it.
- **Blocker for none of 04-05/04-06.** 04-07 (production ad deploy) remains gated on the RPGLogs approval reply per 04-01-SUMMARY.md — untouched by this plan.
- **MONY-02 not marked complete here.** 04-05, 04-06 and 04-07 also declare `MONY-02` and have no `SUMMARY.md` yet; per the shared-ID gate this plan's own coverage (D1-D5 above) is recorded, but the requirement itself stays open until every declaring plan finishes.

## Self-Check: PASSED

- `[ -f lib/ads.ts ]` → FOUND
- `[ -f lib/ads.test.ts ]` → FOUND
- `[ -f app/components/AdSlot.tsx ]` → FOUND
- `[ -f app/ads.txt/route.ts ]` → FOUND
- `git log --oneline --all --grep="04-03"` → FOUND: `10b9ff1`, `3792944`, `4442711`, `15e1c8f`
- `npx vitest run lib/ads.test.ts` → 17 passed
- `npm test` → 284 passed (full suite)
- `npx tsc --noEmit` → clean
- `npm run lint` → exit 0 (1 pre-existing warning in `app/components/CastTimeline.tsx`, untouched by this plan, from commit `34488eb`)
- `npm run token-audit` / `npm run theme-parity` → unaffected, both green
- `npm run protected-elements` → 16 passed, 0 failed; tamper test confirmed the gate is real (fails on a wrong dimension, passes on restore)
- `npm run seo-invariants -- --base http://localhost:3999` (dev server) → byte-identical to the pre-change baseline (confirmed via `git stash`/`git stash pop` A/B)
- SSR check with ads enabled: `data-ad-slot="tbc-audit-end"` present exactly once on `/tbc-audit`; `googlesyndication` absent from `/`, `/tbc-audit`, `/analyze/{demo}`, `/guides`, `/privacy`, `/terms`
- No stray `next dev` processes left running after any verification step

---
*Phase: 04-ads-live*
*Completed: 2026-09-21*
