---
phase: 04-ads-live
plan: 06
subsystem: ads
tags: [adsense, ads, preview-deploy, csp, posthog, ship-gate, vercel-sso]

# Dependency graph
requires:
  - phase: 04-ads-live (plan 04)
    provides: "R0-3 tested, unwired rankings engine code — not this plan's concern directly, but a wave-4 sibling"
  - phase: 04-ads-live (plan 05)
    provides: "Full four-slot D-02 placement map, present-tense /privacy disclosure, AdSense account wiring (unit ids, env vars, Auto ads off)"
provides:
  - "docs/OPS-01-SHIP-GATE.md Part 6: local gate output + PostHog grep evidence for the ad build (Task 1), plus four rounds of preview-deployment evidence, defect diagnosis, and fixes (Task 2/3 plus three authorized deviation rounds)"
  - "Two real production-blocking defects found on the first preview and fixed before any production deploy: reserved-box sizing (inline style outranking responsive classes) and an occluding unfilled-ad-frame cover that first painted solid white, then a flat color-mismatched patch, now numerically grain-matched to the page background"
  - "Developer's first-hand verdict, on the fourth preview, that the visual defect is fixed in both themes; developer's confirmation that /privacy reads true"
  - "A permanent, honestly-recorded gap in the automated evidence chain: the full netlog/measured-box/CSP-harvest preview procedure only ever ran once, on the FIRST preview, before either defect existed — rounds 2-4 substituted local production-build reproduction plus the developer's own eyes-on verdict, because the Vercel SSO bypass secret could not be sourced in any of the four rounds' sessions"
affects: ["04-07 (production ad launch deploy — inherits the AdSense-review-pending gate, WINDOWS #13/#14, and the bypass-secret non-rotation decision)"]

# Actuals (#2632)
actuals:
  tokens: 500
  tasks: 0
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Append-only OPS-01 Part 6 dated subsections per round, following the same convention Parts 2-5 already use — a defect fix loop is recorded round-by-round, not silently collapsed into a single clean narrative"
    - "A CDP-driven, no-new-dependency browser evidence harness (Node's built-in fetch + --experimental-websocket, a dependency-free PNG decoder over node:zlib) introduced this plan for live DOM/pixel measurement, since no browser-automation package exists in this repo"

key-files:
  created: []
  modified:
    - docs/OPS-01-SHIP-GATE.md
    - app/components/AdSlot.tsx
    - lib/ads.ts
    - lib/ads.test.ts
    - next.config.ts
    - app/globals.css

key-decisions:
  - "Round-1 checkpoint: developer authorized expanding this plan's files_modified beyond docs/OPS-01-SHIP-GATE.md to app/components/AdSlot.tsx, lib/ads.ts, lib/ads.test.ts and next.config.ts, to fix the two defects this plan's own Task 2 evidence-gathering surfaced before they reached production — recorded as an authorized deviation, not silent scope creep."
  - "Round-2 fix (visibility:hidden on the <ins>) did not hold: adsbygoogle.js injects a child div inside the <ins> with its own explicit visibility:visible, which wins over an ancestor's visibility:hidden regardless of tree depth. Round 3 replaced it with a wrapper-level occluding cover — a later DOM sibling of the <ins> that Google's script cannot reach."
  - "Round-3 fix (a flat bg-background occluding cover) itself introduced a subtler defect: it painted a textureless patch against the page's grainy .bg-noise background. Round 4 added a position:absolute grain-texture pseudo-element scoped to the cover, numerically matched to the page's own noise layer (mean delta dropped from ~1-2.8 RGB levels to ~0.1-0.2)."
  - "The preview-level netlog/measured-box/CSP-harvest procedure (this plan's own Task 2 design) was never re-run after round 1 — the Vercel SSO automation-bypass secret could not be sourced in rounds 2, 3, or 4's sessions (denied by the harness's own Bash-permission classifier as 'Credential Materialization'). Rounds 2-4 substituted local production-build reproduction (pixel-sampled screenshots, live DOM measurement) as the closing evidence instead, explicitly labelled as not preview evidence. This is a real, permanent gap in the automated evidence chain for this plan (WINDOWS #14) — the developer's own eyes-on verdict on the fourth preview is what actually closes the plan, not a repeated machine proof."
  - "During round-1 ad-hoc debugging, one intermediate diagnostic command's own tool-call transcript printed a preview URL carrying the bypass query parameter in cleartext (never written to a file, never committed, never sent anywhere else). Disclosed to the developer, who was asked whether to rotate the Vercel automation-bypass secret and explicitly declined ('No'). Recorded as a closed decision, not re-raised."
  - "One CSP host observed in the harvest (www.google.com) was deliberately NOT added to next.config.ts — the harvest's own sample did not name which directive it violated, and the plan's instruction was to add a host only when a report named its directive. ep1/ep2.adtrafficquality.google were added (connect-src / script-src+frame-src), since those directives were named."
  - "AdSense account state carried forward as-is, nothing rounded up: Auto ads confirmed OFF; four fixed-size units wired; env vars in Preview+Production but not yet in a production deploy; account approval status 'Getting ready' (not approved); ads.txt 'Not found' (expected pre-deploy); consent-message /privacy paste status uncertain, not claimed done."

requirements-completed: [MONY-02, MONY-03]

coverage:
  - id: D1
    description: "Every standing gate (tsc, lint, full vitest suite, theme-parity, token-audit, seo-invariants, protected-elements) captured verbatim into Part 6 for the ad build, plus a per-event PostHog grep table proving exactly one capture call site each for the four ad_slot events with no high-cardinality property"
    requirement: "MONY-02"
    verification:
      - kind: other
        ref: "docs/OPS-01-SHIP-GATE.md Part 6 '### Local gate output (Phase 4, 2026-09-21)' and '### PostHog instrumentation (Phase 4, pre-deploy grep evidence)'"
        status: pass
      - kind: unit
        ref: "npx tsc --noEmit (re-run this session, exit 0), npm test (re-run this session, 285/285 passing)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A preview deployment's network log proves the AdSense script is requested for an admitted visitor and never for a fail-closed one (SC3); the four reserved boxes measured at their declared pixel sizes (SC2); report-only CSP violations harvested"
    requirement: "MONY-02"
    verification:
      - kind: other
        ref: "docs/OPS-01-SHIP-GATE.md Part 6 '### The netlog proof, both directions (Phase 4, 2026-09-21)' — adHostRequestCount=3 (admitted) vs adHostRequestCount=0 (fail-closed), first preview only"
        status: pass
    human_judgment: true
    rationale: "This full preview-level proof (netlog + measured-box + CSP harvest together) was only ever run once, against the FIRST preview, before either of the two defects below existed. It was never re-run against any of the three subsequent previews that actually carried the fixes — the Vercel SSO bypass secret could not be sourced in any later session (WINDOWS #14, open). The measured-box mismatch this same first-preview run found (Defect A) is proof the procedure works, but the corrected build's preview-level network/CSP behavior is unconfirmed by machine; only local production-build reproduction plus the developer's own eyes-on review closes this round."
  - id: D3
    description: "Two real defects found while gathering this plan's own preview evidence — reserved-box sizing locked to base dimensions at every viewport, and a visible occluding-frame mismatch (white, then flat-color) when a slot is unfilled — diagnosed to root cause and fixed across three authorized rounds, with the fix verified by local reproduction and the developer's first-hand review of the resulting preview"
    requirement: "MONY-02"
    verification:
      - kind: other
        ref: "docs/OPS-01-SHIP-GATE.md Part 6 rounds 2-4 (local pixel-sampled/DOM-measured re-verification tables); npm test 285/285 and npx tsc --noEmit clean after each round's fix"
        status: pass
    human_judgment: true
    rationale: "The developer's own screenshot review is what actually confirmed each fix held (round 2's fix did not hold on inspection; round 3's did not either; round 4's did). The final verdict recorded here is the developer's verbatim confirmation on the fourth preview, not a machine re-proof — this plan's own instruction is explicit that a not-observed preview-level check is recorded honestly, never rounded up to a pass."
  - id: D4
    description: "Human passes recorded: both-theme structural check, phone reachability of all six protected elements, and an adjacency read — automated structural facts plus the developer's own verdict"
    requirement: "MONY-02"
    verification:
      - kind: other
        ref: "docs/OPS-01-SHIP-GATE.md Part 6 '### Developer review (Phase 4 preview, 2026-09-21)' — six-row phone reachability table, adjacency verdict per route, all structurally machine-verified"
        status: pass
    human_judgment: true
    rationale: "The plan's own design leaves the legibility/reachability verdict to the developer, not to a computed distance. The developer's verdict, received directly in this closing session, confirms the visual result on the fourth preview and confirms /privacy reads true — both recorded verbatim in this SUMMARY's Accomplishments."
  - id: D5
    description: "CWV baseline and D-10/D-08/D-11/D-14 rollback machinery (already written by 04-01) remain the comparison point 04-07's post-ship monitoring reads against; this plan adds nothing new to that machinery but leaves it untouched and ready"
    requirement: "MONY-03"
    verification:
      - kind: other
        ref: "docs/OPS-01-SHIP-GATE.md Part 6 '### CWV baseline — pre-ad (D-09)' through '### Observation schedule and escalation clocks (D-11, D-14)', authored by 04-01, unmodified by this plan"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-22
status: complete
---

# Phase 4 Plan 6: Preview Verification — Four-Round Defect Fix Loop, Close-Out Summary

**A single preview-verification plan that became a four-round diagnose-and-fix loop: the first preview surfaced two real defects (box sizing, an occluding unfilled-ad-frame mismatch) before any production deploy, both were root-caused and fixed, and the developer's own eyes-on review of the fourth preview — not a repeated machine proof — is what closes the plan, because the Vercel SSO bypass secret needed for full preview-level re-verification was never obtainable after round 1.**

## Performance

- **Duration:** 12 min (this close-out session; the plan's four execution rounds spanned prior sessions and are fully recorded in `docs/OPS-01-SHIP-GATE.md` Part 6)
- **Started:** 2026-09-22 (this close-out session)
- **Completed:** 2026-09-22
- **Tasks:** 3/3 completed across four rounds (Task 1, Task 2, Task 3, plus three orchestrator-authorized fix rounds)
- **Files modified this close-out session:** 1 (this SUMMARY; the plan's own file changes are the eight commits below, already on `HEAD`)

## Accomplishments

- **Round 1 (Tasks 1-2-3 first pass).** Captured the full local gate (tsc, lint, 285 tests, theme-parity, token-audit, seo-invariants, protected-elements — all green) and the PostHog `ad_slot_*` grep evidence into Part 6; deployed the first preview (`dpl_689q6eqCETYSzy1Yfe9THKNpAJdP`) and proved, via a two-direction network log, that an admitted visitor's browser requests the AdSense script (3 requests) and a fail-closed visitor's browser never does (0 requests) — closing SC3 with a real network fact, not a code reading. This same run surfaced **Defect A** (every reserved box locked to its 300×250 base size at every viewport, because an inline `style` attribute permanently outranked the responsive `md:` Tailwind classes) and **Defect B** (a solid white rectangle painting over the unfilled box in dark mode).
- **Round 2 (`249058e`, `349c2e9`).** Fixed Defect A by removing the inline style and adding `max-w-full` to every slot's box class. First attempt at Defect B: an inline `visibility: hidden` on the `<ins>`, gated by a `MutationObserver`-tracked `filled` boolean. Also added the two CSP hosts (`ep1`/`ep2.adtrafficquality.google`) the round-1 harvest named directives for. Second preview deployed (`dpl_9SxD4PEAPUHv8aghVucyjqJ3LQoV`); the developer's screenshot showed the white block reduced to a *different* visible flat rectangle — the fix did not fully hold.
- **Round 3 (`cfb6d05`, `2900e05`).** Root-caused: `adsbygoogle.js` inserts a child div inside the `<ins>` carrying its own explicit `visibility: visible`, which CSS lets override an ancestor's `visibility: hidden` regardless of tree depth. Replaced the approach with a wrapper-level occluding cover — a later DOM sibling of the `<ins>` (`absolute inset-0 z-10 bg-background`) that Google's script cannot reach, verified by pixel-sampled local screenshots (0% white-pixel deviation, exact background-color match, both themes, both viewports). Third preview deployed (`dpl_2CU68Zw3yFuxq7qqMjxNeTjT1VC1`).
- **Round 4 (`cd623c6`, `470fb46`).** The developer looked again and caught a subtler residual defect: the flat cover read as a slightly different shade than the surrounding page. Numerically confirmed via pixel-sampled CDP screenshots against a real production build (cover stddev 0 vs. control ~0.5–0.8; mean 1–2.8 RGB levels warmer than the page's own grain). Root cause: the cover painted opaque over the page's `.bg-noise` grain texture. Fix: a `position: absolute`-scoped grain pseudo-element on the cover itself, matching the page's noise tile exactly. Post-fix numeric re-verification: mean delta dropped to 0.0–0.19 RGB levels across all four theme/viewport combinations. Fourth preview deployed (`dpl_9hkgsvPz57brpYzdHdFf3x7GM56Z`).
- **Developer's final verdicts (this closing session).** On the fourth preview: the visual defect is confirmed fixed — no visible box artifact at the analyze-mid slot in either theme; that gap now reads as ordinary page space, closing both the box-sizing and the grain-mismatch findings. On `/privacy`: confirmed to read true ("privacy true"), closing both this plan's own Task 2 human-check and the carryover open item from 04-05's Task 2.
- **A permanent, honestly-recorded evidence-chain gap (WINDOWS #14, still open).** The full preview-level netlog/measured-box/CSP-harvest procedure this plan's own Task 2 was designed around ran exactly once — on the very first preview, before either defect existed. Every later round's re-verification substituted local production-build reproduction (pixel-sampled screenshots, live DOM measurement via a Chrome DevTools Protocol driver, all built without adding any new npm dependency) because the Vercel SSO automation-bypass secret could not be sourced in rounds 2, 3, or 4's sessions — the one working method (`vercel project protection ... --format json`) was denied each time by the harness's own Bash-permission auto-classifier ("Credential Materialization"). The developer's own eyes-on review of the fourth preview is what actually closes this plan, not a repeated machine proof of the network/CSP behavior on the corrected build. This gap is real and is carried forward, not papered over.
- **Bypass-secret exposure, disclosed and decided.** During round-1 ad-hoc debugging, one intermediate diagnostic command's own tool-call transcript printed a preview URL carrying the bypass query parameter in cleartext — never written to a file, never committed, never sent anywhere else, but present in that session's transcript. Disclosed to the developer at the time; the developer was asked whether to rotate the Vercel automation-bypass secret and explicitly said "No." Recorded here as a closed decision.

## Task Commits

Each round's fixes were committed atomically (task-level commits happened across prior sessions; this close-out session made no code commits):

**Round 1 — Tasks 1-2-3, first pass:**
1. Task 1 (local gate + PostHog grep evidence) — `96d46b6`
2. Task 2 (first preview, netlog proof, box measurements, CSP harvest) — `b375188`
3. Task 3, automated half (both-theme structural check, phone reachability, adjacency read) — `23dcd09`

**Round 2 — orchestrator-authorized deviation (Defect A sizing fix + first Defect B attempt):**
4. `249058e` (fix) — box sizing correction, first `visibility: hidden` attempt at the unfilled-frame cover
5. `349c2e9` (fix) — CSP report-only allowlist for the two Google traffic-quality hosts

**Round 3 — occluding-cover fix:**
6. `cfb6d05` (fix) — wrapper-level occluding cover; root cause: adsbygoogle.js's injected child div re-asserts visibility past any ancestor hidden state
7. `2900e05` (docs) — diagnosis write-up + third preview

**Round 4 — grain-match fix:**
8. `cd623c6` (fix) — matched the occluding cover's texture to the page's noise-textured background
9. `470fb46` (docs) — numeric grain-match verification + fourth preview

**Plan metadata:** this SUMMARY + STATE/ROADMAP/REQUIREMENTS commit follows.

## Files Created/Modified

- `docs/OPS-01-SHIP-GATE.md` — Part 6's full four-round record: local gate output, PostHog grep evidence, four preview-deployment subsections, the measured-box mismatch and its fix, the netlog proof, the CSP violation harvest, three rounds of defect diagnosis and fix verification, and the developer-review subsection
- `app/components/AdSlot.tsx` — reserved-box inline style removed (Defect A); occluding-cover rendering added and iterated across rounds 2-4 (visibility toggle → wrapper-level cover → grain-matched cover)
- `lib/ads.ts` — `max-w-full` added to every slot's `boxClass`
- `lib/ads.test.ts` — unit test asserting every slot's `boxClass` carries `max-w-full`
- `next.config.ts` — report-only CSP gained `ep1.adtrafficquality.google` (`connect-src`) and `ep2.adtrafficquality.google` (`script-src`, `frame-src`)
- `app/globals.css` — `.ad-cover-noise::before`, a `position: absolute`-scoped grain-texture pseudo-element matching the page's `.bg-noise` tile, opacity, and size

## Decisions Made

See `key-decisions` in frontmatter above for the full list: the round-1 checkpoint authorization to expand scope beyond `docs/OPS-01-SHIP-GATE.md`; the two-attempt Defect B fix history (visibility toggle defeated, occluding cover held, grain-mismatch found and fixed); the deliberate non-addition of `www.google.com` to the CSP; the bypass-secret exposure and the developer's explicit non-rotation decision; and the AdSense account state carried forward without rounding anything up.

## Deviations from Plan

### Auto-fixed / Authorized Issues

**1. [Rule 4 - Architectural, orchestrator-authorized] Scope expansion beyond `docs/OPS-01-SHIP-GATE.md` to fix two real defects found during evidence-gathering**
- **Found during:** Task 2 (first preview's measured-box and visual evidence)
- **Issue:** This plan's own `files_modified` frontmatter names `docs/OPS-01-SHIP-GATE.md` only, but Task 2's evidence-gathering surfaced two real, production-blocking defects in `app/components/AdSlot.tsx` — box sizing locked to base dimensions, and a visible white/mismatched occlusion when a slot is unfilled.
- **Fix:** Developer, via the orchestrator, authorized editing `app/components/AdSlot.tsx`, `lib/ads.ts`, `lib/ads.test.ts` and `next.config.ts` at the round-1 checkpoint — recorded explicitly in Part 6 as an authorized deviation, not silent scope creep.
- **Files modified:** `app/components/AdSlot.tsx`, `lib/ads.ts`, `lib/ads.test.ts`, `next.config.ts`, `app/globals.css`
- **Verification:** Full standing gate re-run clean after every round (tsc, lint, 285/285 tests, theme-parity, token-audit, protected-elements 25/25); each round's specific fix additionally verified by local pixel-sampled/DOM-measured evidence, captured in Part 6.
- **Committed in:** `249058e`, `349c2e9`, `cfb6d05`, `cd623c6`

**2. [Rule 1 - Bug, two further rounds] The Defect B fix did not hold on first, or second, attempt**
- **Found during:** Round-2 developer screenshot review (fix 1 did not hold), then round-3 developer screenshot review (fix 2 held for the white-block symptom but exposed a subtler grain-mismatch symptom)
- **Issue:** Round 2's `visibility: hidden` on the `<ins>` was defeated by a child div Google's script injects with its own explicit `visibility: visible`. Round 3's flat `bg-background` occluding cover then painted a textureless patch against the page's grainy background.
- **Fix:** Round 3 replaced the visibility toggle with a wrapper-level occluding cover (a DOM sibling Google's script cannot reach). Round 4 added a grain-texture pseudo-element to that same cover, numerically matched to the page's own noise layer.
- **Files modified:** `app/components/AdSlot.tsx`, `app/globals.css`
- **Verification:** Pixel-sampled local screenshot analysis at every round (0% white-pixel deviation round 3; mean color delta 1-2.8 RGB levels → 0.0-0.19 RGB levels round 4, all four theme/viewport combinations); developer's own eyes-on confirmation on the fourth preview.
- **Committed in:** `cfb6d05`, `cd623c6`

---

**Total deviations:** 1 authorized scope-expansion (Rule 4, orchestrator-approved), plus 2 rounds of Rule-1 bug fixes on the same underlying defect as it was progressively diagnosed. **Impact on plan:** All changes were necessary corrections to real, production-blocking defects found while gathering this plan's own evidence — exactly the class of finding this plan's own `must_haves` exists to catch before, not after, production. No unrelated scope creep.

## Issues Encountered

- **The Vercel SSO automation-bypass secret could not be sourced in rounds 2, 3, or 4.** The one working method from round 1 (`vercel project protection parseforge --scope loot-list-plus --format json`) was denied by the harness's own Bash-permission auto-classifier in every later session ("Credential Materialization"), and each round's own instructions separately prohibited retrying the denied method or touching project-protection settings. This is the direct cause of WINDOWS #14 staying open: the full preview-level netlog/measured-box/CSP procedure was never re-run against any of the three corrected previews. Resolved for this plan's purposes by substituting local production-build reproduction plus the developer's own first-hand review as the closing evidence — explicitly labelled as such throughout Part 6, never folded into a preview-level pass.
- **`Emulation.setDeviceMetricsOverride` and `Page.captureScreenshot`'s `clip` parameter both had quirks** discovered and worked around during round 4's pixel-sampling work (documented in Part 6's round-4 section) — neither affected this plan's conclusions, both were caught before being trusted.

## User Setup Required

None new. The `user_setup` item this plan's own frontmatter named (the Vercel automation-bypass secret) remains the same open sourcing gap recorded above — no new external service configuration is required beyond what 04-05 already wired (env vars, AdSense unit ids).

## Next Phase Readiness

**Ready for 04-07 (production ad launch deploy)**, with the following inherited from this plan, none of it rounded up:

- Both defects found in this plan (box sizing, occluding-cover mismatch) are fixed and verified by local reproduction plus the developer's own review of the fourth preview — not by a repeated machine proof at the preview level.
- **AdSense account state, carried forward exactly as recorded, nothing claimed done that wasn't confirmed:** Auto ads OFF (confirmed); four fixed-size units wired; `NEXT_PUBLIC_ADSENSE_PUB_ID`/`NEXT_PUBLIC_ADS_ENABLED=1` present in Vercel Preview and Production but **not yet in a production deploy**; site approval status "Getting ready" (**not yet approved** — 04-07's production deploy is still blocked on this); ads.txt reports "Not found" (expected pre-deploy); the `/privacy` paste into the consent message's site settings status remains uncertain (never separately confirmed, distinct from the `/privacy` content-accuracy verdict which the developer did confirm this session).
- **WINDOWS #13** (pre-existing, non-ad-related horizontal overflow at 384px on `/` and `/tbc-audit` from `ReportUrlForm.tsx`'s example-URL text) stays open, out of Phase 4 scope, for a future phase.
- **WINDOWS #14** (this plan's own preview-level evidence-chain gap, described above) stays open — its closing test is re-running this plan's Task 2 procedure verbatim against a preview once the bypass secret can be sourced in a session with permission, which 04-07's own production verification should account for rather than assume closed.
- **WINDOWS #12** (Defect A, box sizing) is `fixed` in the ledger — verified live twice (round-2 supplementary local evidence, round-3 re-confirmation).
- **WINDOWS #15 and #16** (Defect B's two fix attempts) remain recorded `open` in the ledger as of this SUMMARY's writing, per this plan's instruction not to modify `.planning/WINDOWS.md` in this close-out session — but their own named closing tests (the developer's first-hand review of the third and fourth previews, respectively) have now been satisfied by the developer's verdict recorded in this session. A future session updating the ledger should mark them fixed with this SUMMARY as the evidence reference.
- **Bypass-secret exposure:** disclosed to and decided by the developer (no rotation); not re-raised as a pending question.
- **The Vercel bypass secret itself** is unchanged, not rotated, per the developer's explicit decision.
- MONY-03's monitoring half is unchanged and ready: Part 6 already holds the pre-ad baseline (04-01) that 04-07's day-2/day-7 CWV reads will compare against.

## Self-Check: PASSED

- `[ -f docs/OPS-01-SHIP-GATE.md ]` → FOUND (Part 6 contains all four rounds' subsections, confirmed by direct read this session)
- `[ -f app/components/AdSlot.tsx ]` → FOUND
- `[ -f lib/ads.ts ]` → FOUND
- `[ -f lib/ads.test.ts ]` → FOUND
- `[ -f next.config.ts ]` → FOUND
- `[ -f app/globals.css ]` → FOUND
- `git log --oneline --all | grep -E '96d46b6|b375188|23dcd09|249058e|349c2e9|cfb6d05|2900e05|cd623c6|470fb46'` → all nine commit hashes FOUND on `HEAD`'s own history
- `npx tsc --noEmit` (re-run this session) → clean, exit 0
- `npm test` (re-run this session) → 21 test files, 285/285 tests passing — matches round 4's last recorded gate state exactly, confirming no drift since close-out
- No bypass secret, publisher id value, or other credential value appears anywhere in this SUMMARY

---
*Phase: 04-ads-live*
*Completed: 2026-09-22*
