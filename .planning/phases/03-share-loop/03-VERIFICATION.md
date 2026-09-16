---
phase: 03-share-loop
verified: 2026-09-16T17:30:00Z
status: gaps_found
score: 6/9 must-haves verified
behavior_unverified: 3
overrides_applied: 0
gaps:
  - truth: "PostHog reports share rate per analysis against the ~2.8% baseline, and GSC verification confirms the new share routes/OG changes did not disturb indexing or canonicals (ROADMAP SC4 / OPS-01 gate)."
    status: failed
    reason: >
      The share-rate half of this criterion has real evidence (the D-14 HogQL was run against
      PostHog project 337485 and produced a counted, if inconclusive, 0.0% first reading — 0/19
      sessions, ~7.5h of live exposure). But the GSC-verification half was never executed at all:
      docs/OPS-01-SHIP-GATE.md Part 5 records all three Search Console rows as PENDING, with the
      explicit note "No gscServer MCP tool ... was available." No indexability/metadata check ran
      for `/` or `/analyze/{code}` under this deployment, and no confirmation exists that no
      `?view=awards`/`?ref=` permutation is separately indexed. This is not an uncertain result —
      it is a confirmed non-execution of a required check, admitted in the project's own gate
      document and in REQUIREMENTS.md's own OPS-01 Addendum 3 ("OPS-01's Phase 3 re-run is
      therefore not met"). The item-7 live-traffic check also failed threshold 1 (7 pageviews
      counted against a ≥20 bar) on this deployment's own window, independently confirmed against
      docs/OPS-01-SHIP-GATE.md Part 5.
    artifacts:
      - path: "docs/OPS-01-SHIP-GATE.md"
        issue: "Part 5 ends 'Sign-off: LEFT OPEN — not signed'; Search Console rows 3-5 are PENDING with zero evidence; item-7 threshold 1 is FAIL and threshold 3 is NOT EVALUABLE"
      - path: ".planning/REQUIREMENTS.md"
        issue: "OPS-01 Addendum 3 (2026-09-16) already states the Phase 3 gate re-run is not met"
    missing:
      - "Run the Search Console URL-inspection pass for `/` and `/analyze/ZjKgNYxVcAqR8pGJ` (sc-domain:parseforge.gg), record coverage/crawl-date/metadata, and confirm no awards/ref permutation is separately indexed"
      - "Re-measure item 7's 60-minute window on a busier UTC hour (candidate ~22:00Z) against dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx or a successor deployment, plus a Vercel Web Analytics dashboard read for threshold 3"
      - "Re-run the D-14 share-rate HogQL on or after 2026-09-23T09:15Z once a full 7 days of live share_action exposure exists"
      - "Sign docs/OPS-01-SHIP-GATE.md Part 5 with a date once every row above has counted evidence"
deferred: []
behavior_unverified_items:
  - truth: "A pasted /analyze/{code}?fight={id}&view=awards link, and a per-player permalink, each unfurl in a real Discord channel as an image with the awards/receipts legible (SHARE-01, SHARE-02 backstop truths in 03-01/03-03/03-06 PLAN frontmatter)."
    test: "Paste https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&view=awards&ref=awards and https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12&ref=parse into a real Discord channel, changing the v= cache-busting param on every retry, and confirm both unfurl as images with the award rows / receipts legible, specifically checking that the longest raider names clip with an ellipsis rather than overflow."
    expected: "Discord renders the linked og:image inline; award rows and player receipts are legible; long names clip cleanly."
    why_human: "No headless-browser or Discord-bot harness exists in this repo; this is an explicit `verification: backstop` truth in the plans, and docs/OPS-01-SHIP-GATE.md Part 5 records it as still NOT PERFORMED as of the final 03-07 continuation. This verifier independently confirmed the underlying contract is correct (og:image meta tags point at the right per-branch URL, and the served images render real, correct, player/award-specific content — see Evidence below) — what remains unverified is Discord's own crawler/unfurl behavior specifically, which no automated tool here can exercise."
  - truth: "The full fifteen-rule award pool clears the D-01 tone bar — every jab is about a measurable fact, nothing is insulting about a named real raider, no rule designates a single worst player (D-04 human review)."
    test: "Read the fifteen-row table in docs/OPS-01-SHIP-GATE.md Part 5 § Award pool for review (D-04) and confirm each title against the D-01 bar, or name the row that fails it."
    expected: "Developer states a verdict in the gate doc or a SUMMARY."
    why_human: "Explicit `verification: backstop` / judgment-tier prohibition in 03-02-PLAN.md; recorded NOT PERFORMED in docs/OPS-01-SHIP-GATE.md Part 5 as of 2026-09-16."
  - truth: "On a phone-width viewport, both the awards 'Copy link' button and the player 'Share my parse' button are reachable without scrolling past the analysis tables (D-13)."
    test: "On a real phone-width viewport, open https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12, switch to the Raid tab, and confirm both buttons are reachable without scrolling past the raid table."
    expected: "Both buttons visible/reachable above the analysis tables."
    why_human: "No viewport-emulation harness exists in this repo (node-env Vitest only); explicit `verification: backstop` truth in 03-04/03-06 PLAN frontmatter; recorded NOT PERFORMED in docs/OPS-01-SHIP-GATE.md Part 5."
coincidental_reliance_items: []
human_verification:
  - test: "Paste the two production links above into a real Discord channel (cache-busted) and confirm the awards card and the per-player card both unfurl as images with rows/receipts legible and long names clipped cleanly."
    expected: "Both unfurl correctly in a real Discord embed."
    why_human: "External service (Discord's crawler/embed renderer) behavior; no harness in this repo. Code-side contract (og:image meta + served image content) independently confirmed correct by this verifier."
  - test: "Read the fifteen-row award pool table in docs/OPS-01-SHIP-GATE.md and confirm the D-01 tone bar."
    expected: "Developer confirms every title is fun to be on, not embarrassing, and no rule singles out a worst player."
    why_human: "Editorial/tone judgment call the plan itself defers to a human (D-01/D-04)."
  - test: "On a phone-width viewport, confirm both share buttons on the Raid tab are reachable without scrolling past the raid table."
    expected: "Both buttons reachable above the fold."
    why_human: "No viewport-emulation harness in this repo; explicit backstop truth."
  - test: "Complete the Search Console pass for `/` and `/analyze/{code}`, and re-run the item-7 and share-rate HogQL windows per the exact tests recorded in docs/OPS-01-SHIP-GATE.md Part 5, then sign Part 5 with a date."
    expected: "All rows counted; Part 5 signed or left explicitly open with updated evidence."
    why_human: "Requires Search Console (gscServer) access and a later-dated PostHog query window neither this verifier nor the executing sessions had available; this is the OPS-01 gap already recorded above."
---

# Phase 3: Share Loop Verification Report

**Phase Goal:** A raider who just analyzed a log wants to post it, and the artifact they post pulls
new players back to ParseForge

**Verified:** 2026-09-16T17:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP Success Criteria) | Status | Evidence |
|---|---|---|---|
| 1 | User can generate a roast/award-style card for a fight and paste it into Discord, where it unfurls as an image with the awards visible. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `lib/awards-engine.ts` (15-rule pool, 45+ tests, `npx vitest run` 226/226 green); `app/og/route.tsx` `view=awards` branch confirmed live: `https://parseforge.gg/og?report=ZjKgNYxVcAqR8pGJ&fight=23&view=awards` → `200 image/png`; **independently fetched and visually inspected** the returned PNG — shows "The Lurker Below KILL", a "RAID AWARDS" header, and 6 real fired rows (Meter Lord — Namja — 899 dps; Triage Master — Izlaz — 671 hps; Flaskless Wonder — 3 named + "+7"; Best Prepared — Andelena; GCD Tourist — Lightstank — 56.5 active; Standing in the Fire — Thalaroka — 248.1K taken) — genuine, stat-backed, non-generic content. `generateMetadata` forwards `view=awards` into the `og:image`/`twitter:image` meta on the live page (confirmed via curl). Only the literal Discord-crawler unfurl was not exercised — see behavior_unverified_items. |
| 2 | User can copy a per-player permalink whose OG image shows that specific player's parse, not a generic report card. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `app/components/ComparisonSummary.tsx` "Share my parse" (`data-protected="share-player"`) calls `buildPlayerShareUrl`; `app/og/route.tsx` PlayerCard branch confirmed live: `https://parseforge.gg/og?report=ZjKgNYxVcAqR8pGJ&fight=23&source=12` → `200 image/png`; **independently fetched and visually inspected** — shows "Samkin", BeastMastery Hunter, DPS 439, Percentile 7, Grade B, Kill pill + 5:46 fight length, "vs top 3 BeastMastery Hunters", "Active Time 43% · 45.9 CPM" — genuinely player-specific, not the generic report fallback (confirmed by contrast with the bare-report OG image, which renders a generic "Raid Analysis SSC/TK" card). Only the literal Discord-crawler unfurl was not exercised. |
| 3a | Protected-elements checklist naming the share CTA and OG pipeline exists for Phases 4 and 7 to honor. | ✓ VERIFIED | `docs/PROTECTED-ELEMENTS.md` exists with all required sections; `scripts/protected-elements.mjs` runs live: `npm run protected-elements -- --report` → **10/10 PASS** against production (re-run by this verifier, matches 03-05/03-06 SUMMARY claims); ROADMAP.md Phase 4 (`**Depends on**`/`**Notes**`) and Phase 7 (`**Notes**`) both name `docs/PROTECTED-ELEMENTS.md` (confirmed via grep). |
| 3b | Share actions reachable without hunting, desktop. | ✓ VERIFIED | `app/components/ComparisonSummary.tsx` places "Share my parse"/"Copy for Discord" in `CardHeader` (top of card); `app/components/RaidOverview.tsx` renders `AwardsPanel` immediately after the header block and before `RaidBuffBar` (confirmed: `<AwardsPanel` render line precedes `<RaidBuffBar` render line); `AnalyzeClient.tsx` header Share (`data-protected="share-header"`) is in the persistent page header. Bottom "Found this useful?" bar confirmed removed (0 occurrences of "Found this useful" in AnalyzeClient.tsx). |
| 3c | Share actions reachable without hunting, mobile. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code places all share buttons at the top of their containing cards (flex-wrap, `CardHeader`/panel-header), consistent with reachability, but no viewport-emulation harness exists in this repo to confirm actual on-device reachability. Explicit `verification: backstop` truth (03-04/03-06 PLAN); recorded NOT PERFORMED in `docs/OPS-01-SHIP-GATE.md` Part 5 as of 2026-09-16. |
| 4 | PostHog reports share rate per analysis against the ~2.8% baseline, AND GSC verification confirms no indexing/canonical disturbance (OPS-01 gate). | ✗ FAILED | Share-rate half: D-14 HogQL run once, counted (0.0% = 0/19 sessions, ~7.5h exposure) — a real, if inconclusive, first reading. GSC half: **never executed** — `docs/OPS-01-SHIP-GATE.md` Part 5 records all three Search Console rows as PENDING ("No gscServer MCP tool... was available this session"). Item-7 live-traffic check on this deployment: threshold 1 **FAIL** (7 pageviews vs ≥20), threshold 2 PASS, threshold 3 NOT EVALUABLE. `.planning/REQUIREMENTS.md` OPS-01 Addendum 3 (2026-09-16) already states, in the project's own words: "OPS-01's Phase 3 re-run is therefore not met." Part 5 ends `Sign-off: LEFT OPEN — not signed`, independently confirmed by reading the full document. |

**Score:** 6/9 must-haves verified (3 present-and-wired-but-behavior-unverified excluded from the numerator per the scoring rule; see coverage detail below); the OPS-01/GSC truth (item 4) is the one genuine FAILED gap.

### Requirement Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|---|---|---|---|---|
| SHARE-01 | 03-01, 03-02, 03-04, 03-06, 03-07 | Roast/award-style shareable card per fight | ✓ Capability proven live in production (code + real-data render independently confirmed); Discord-unfurl and D-04 tone backstops open | `lib/awards-engine.ts`, `app/og/route.tsx`, live curl+visual evidence above |
| SHARE-02 | 03-01, 03-03, 03-04 | Per-player permalink with player-specific OG image | ✓ Capability proven live in production (independently confirmed via visual inspection); Discord-unfurl backstop open | `app/og/route.tsx` PlayerCard branch, `lib/share-links.ts`, live curl+visual evidence above |
| SHARE-03 | 03-04, 03-05 | Share actions prominent + protected from ad/redesign crowding | ✓ Protected-elements checklist and gate script fully verified live (10/10 PASS); desktop placement verified via code; mobile-reachability backstop open | `docs/PROTECTED-ELEMENTS.md`, `scripts/protected-elements.mjs`, ROADMAP.md Phase 4/7 notes |
| OPS-01 (Phase 3 re-run) | 03-05, 03-06, 03-07 | PostHog instrumentation + GSC verification, standing gate | ✗ NOT MET — GSC pass never run, item-7 threshold 1 FAIL, Part 5 unsigned | `docs/OPS-01-SHIP-GATE.md` Part 5 (all sections read), `.planning/REQUIREMENTS.md` OPS-01 Addendum 3 |

REQUIREMENTS.md traceability table cross-checked: SHARE-01, SHARE-02, SHARE-03 rows read "Complete," but REQUIREMENTS.md's own same-day addendum ("SHARE-01/SHARE-02/SHARE-03 Addendum," 2026-09-16) already documents that this checkbox state is ahead of the gate's own sign-off rule and should be read as "capability confirmed live in production; live-traffic/human-review backstops remain open" — this verifier's findings above are consistent with that self-correction, not in tension with it. No orphaned requirement IDs found for Phase 3 (SHARE-01/02/03 declared across plans 03-01–03-04/03-06/03-07; OPS-01 declared in 03-05/03-06/03-07; all accounted for in REQUIREMENTS.md).

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `lib/awards-engine.ts` | 15-rule pool, pure `computeAwards` | ✓ VERIFIED | 397 lines; 15 `id:`/`priority:` pairs confirmed (priorities 1–15, no gaps); `npx vitest run` 226/226 green; no `fetch(`/`posthog` reference |
| `lib/share-links.ts` | Normalized share-link builders + `parseShareRef` allowlist | ✓ VERIFIED | 88 lines; imported and used by `ComparisonSummary.tsx`, `RaidOverview.tsx`, `AnalyzeClient.tsx` |
| `app/og/route.tsx` | Three card branches (awards/player/report), never-fail fallback | ✓ VERIFIED | 461 lines; all three branches confirmed live returning `200 image/png` against production, with real, distinguishable content (visually inspected) |
| `app/components/RaidOverview.tsx` | `AwardsPanel` with real inline `/og` preview | ✓ VERIFIED | `computeAwards(` × 1, `data-protected="awards-panel/awards-preview/share-awards"` × 1 each, rendered before `RaidBuffBar` |
| `app/components/ComparisonSummary.tsx` | "Share my parse" primary + "Copy for Discord" secondary | ✓ VERIFIED | `data-protected="share-player"`/`"share-discord"` × 1 each in `CardHeader` |
| `app/analyze/[reportCode]/AnalyzeClient.tsx` | Normalized header Share, bottom bar removed, `ref` landing funnel | ✓ VERIFIED | `data-protected="share-header"`, `parseShareRef(`, `posthog.capture("share_landing"`, `updateUrlParam("ref", null)` all present exactly once; 0 occurrences of "Found this useful" |
| `docs/PROTECTED-ELEMENTS.md` | Checklist naming every protected element | ✓ VERIFIED | 77 lines; 4 required headings + 6 attribute rows, all cross-checked truthful against owner files |
| `scripts/protected-elements.mjs` | Machine check, exit 0/1/2 discipline | ✓ VERIFIED | 212 lines; `npm run protected-elements -- --report` → 10/10 PASS re-run live against production by this verifier |
| `docs/OPS-01-SHIP-GATE.md` Part 5 | Phase 3 evidence record | ✓ VERIFIED (as an honest, unsigned record) | 2430 lines total; Part 5 spans lines 1714–2429; contains local gate output, preview evidence, production evidence, and an explicit "LEFT OPEN — not signed" close — matches the "known state" briefing exactly |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `app/og/route.tsx` (awards branch) | `lib/awards-engine.ts` | `computeAwards(overview, {...})` | ✓ WIRED | Confirmed by grep + live production render |
| `app/components/RaidOverview.tsx` (AwardsPanel) | `lib/awards-engine.ts` | `computeAwards(data, {...})` (same function, no re-derivation) | ✓ WIRED | One call site each in the OG route and the panel — D-06/D-08 no-drift guarantee holds |
| `app/analyze/[reportCode]/page.tsx` `generateMetadata` | `app/og/route.tsx` | `og:image`/`twitter:image` forwarding `fight`/`source`/`view` | ✓ WIRED | Confirmed live via curl on both the awards URL and the player URL; canonical stays param-free |
| `app/components/ComparisonSummary.tsx` | `lib/share-links.ts` | `buildPlayerShareUrl(window.location.origin, {...})` | ✓ WIRED | No `window.location.href` reads remain in the file (grep-confirmed) |
| `scripts/protected-elements.mjs` | `docs/PROTECTED-ELEMENTS.md` | Parses the DOM-attributes table as its source of truth | ✓ WIRED | Live run confirms all 6 rows match their owner files |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| Awards OG card | `computeAwards(overview, ...)` rows | `/api/raid-overview` (live production, real WCL creds) | Yes — visually confirmed real player names + stats (Namja 899 dps, Izlaz 671 hps, etc.) | ✓ FLOWING |
| Player OG card | `data.dps`, `data.healer`, `metricPercentiles.activeTime` | `/api/analyze` (live production) | Yes — visually confirmed "Samkin," BeastMastery Hunter, DPS 439, Percentile 7, vs top 3, Active Time 43% | ✓ FLOWING |
| Share-rate figure | `sessions_with_share` / `sessions_with_analysis` | PostHog HogQL, project 337485 | Yes (real query, real count) but statistically inconclusive (0/19, ~7.5h exposure) | ✓ FLOWING (low-sample) |
| GSC verification | indexability/coverage state | Search Console `sc-domain:parseforge.gg` | No — query never run this phase | ✗ DISCONNECTED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Full test suite | `npx vitest run` | 18 files / 226 tests passed | ✓ PASS |
| Protected-elements gate | `npm run protected-elements -- --report` | 10/10 PASS (live against production) | ✓ PASS |
| Awards OG branch (live) | `curl .../og?...&view=awards` | `200 image/png`, visually confirmed real award rows | ✓ PASS |
| Player OG branch (live) | `curl .../og?...&fight=23&source=12` | `200 image/png`, visually confirmed real player data | ✓ PASS |
| Report OG branch / canonical (live) | `curl .../og?report=...` + canonical grep | `200 image/png`; canonical param-free | ✓ PASS |
| Production deployment identity | `vercel inspect <alias>` | `id: dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx`, created matching the claimed 09:14:57Z timestamp | ✓ PASS |
| Discord crawler unfurl | — | not run | ? SKIP (external service, no harness — see human_verification) |
| GSC URL inspection | — | not run | ? SKIP (no `gscServer` MCP tool available to this verifier either) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` convention exists in this repo and none is referenced by this phase's plans or SUMMARYs. Step 7c: SKIPPED (no probes declared or discovered).

### Anti-Patterns Found

None. Grepped all files this phase modified (`lib/awards-engine.ts`, `lib/share-links.ts`, `app/og/route.tsx`, `app/components/RaidOverview.tsx`, `app/components/ComparisonSummary.tsx`, `app/analyze/[reportCode]/AnalyzeClient.tsx`, `app/analyze/[reportCode]/page.tsx`, `scripts/protected-elements.mjs`, `docs/PROTECTED-ELEMENTS.md`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|coming soon|not yet implemented` — zero matches.

### Human Verification Required

### 1. Real Discord unfurl (production URLs)

**Test:** Paste `https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&view=awards&ref=awards&v=<fresh>` and `https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12&ref=parse&v=<fresh>` into a real Discord channel, changing the `v=` value each retry.
**Expected:** Both unfurl as images with the award rows / player receipts legible; the longest raider names in the log clip with an ellipsis rather than overflow.
**Why human:** External service (Discord) rendering behavior; no harness exists in this repo. This verifier independently confirmed the underlying contract (og:image meta + served image content) is correct — see the Observable Truths table.

### 2. D-04 award-pool tone review

**Test:** Read the fifteen-row table in `docs/OPS-01-SHIP-GATE.md` Part 5 § "Award pool for review (D-04)" and confirm against the D-01 bar (praise + light jabs, never insulting, no worst-player headline).
**Expected:** Developer states a verdict, or names the row that fails.
**Why human:** Editorial/tone judgment call the plan itself defers to a human (D-01/D-04 in `03-CONTEXT.md`; judgment-tier prohibition in `03-02-PLAN.md`).

### 3. D-13 mobile reachability

**Test:** On a real phone-width viewport, open `https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12`, switch to the Raid tab, and confirm both the awards "Copy link" button and the "Share my parse" button are reachable without scrolling past the analysis tables.
**Expected:** Both buttons reachable above the fold.
**Why human:** No viewport-emulation harness in this repo; explicit backstop truth in `03-04`/`03-06` PLAN frontmatter.

### 4. Complete the OPS-01 gate (GSC pass + re-measured windows)

**Test:** Run the Search Console URL-inspection pass for `/` and `/analyze/ZjKgNYxVcAqR8pGJ`; re-run item 7 on a busier UTC hour; re-run the share-rate HogQL on/after 2026-09-23T09:15Z; sign `docs/OPS-01-SHIP-GATE.md` Part 5 with a date once every row has counted evidence.
**Expected:** Every Part 5 row moves from PENDING/FAIL/NOT-EVALUABLE to a counted PASS, or is explicitly re-recorded as a genuine, accepted FAIL.
**Why human:** Requires Search Console (`gscServer` MCP) access and a later-dated PostHog query window not available to this verification session.

### Gaps Summary

The share-loop *code* is genuinely built, tested, and live in production — this verifier independently confirmed, beyond what any phase SUMMARY claimed, that the awards card and the per-player card both render correct, real, non-generic data in production (via direct image fetch and visual inspection), that the `og:image`/`twitter:image` meta tags correctly point Discord's crawler at those URLs, and that the protected-elements gate is genuinely green against production (10/10, re-run live). SHARE-01, SHARE-02, and the protected-elements half of SHARE-03 are backed by real evidence, not just SUMMARY narrative.

The one genuine gap is the ROADMAP's fourth success criterion (the OPS-01 gate): the PostHog share-rate half has a real, if inconclusive, first reading, but the **Google Search Console verification half was never executed at all**, and the deployment's own item-7 live-traffic check failed its first threshold. This is not a case of the verifier uncovering a hidden problem — it is the project's own documented, deliberate state: the developer explicitly chose "Record now, leave open" (2026-09-16T16:47Z, recorded verbatim in `docs/OPS-01-SHIP-GATE.md`), and `.planning/REQUIREMENTS.md`'s own OPS-01 Addendum 3 already states "OPS-01's Phase 3 re-run is therefore not met." This verification report simply confirms that admission is accurate and structures it as the phase's one blocking gap, per the roadmap's explicit requirement that OPS-01 is "the final success criterion of every phase."

Three additional truths are backstops that legitimately require a human and a real Discord channel / real phone / real Search Console session — none of these were performed as of this session, and none should be inferred as passing from the strong (but not identical) evidence this verifier gathered independently.
