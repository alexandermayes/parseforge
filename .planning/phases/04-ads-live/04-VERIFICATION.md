---
phase: 04-ads-live
verified: 2026-09-22T20:30:00Z
status: human_needed
score: 3/5 roadmap truths verified (2 pending on external/scheduled evidence, not code defects)
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "RPGLogs written commercial-use approval (R0-1) obtained before ads ship"
    reason: "Developer (account owner) issued an explicit, consequence-informed operator override after being told the realistic risk (API-client revocation, not a fine): '2026-09-21: yes, ship without approval it's just using the data pulled in but the product itself isn't really that website. So whatever.' / '2026-09-22: deploy'. This is recorded plainly as a bypass, not disguised as approval, in docs/OPS-01-SHIP-GATE.md ### Deploy decision (Phase 4, 2026-09-22) and honored as-is rather than silently treated as satisfied."
    accepted_by: "Alexander Mayes (developer/account owner, verbatim 2026-09-21 and 2026-09-22 quotes recorded in OPS-01-SHIP-GATE.md)"
    accepted_at: "2026-09-22T09:23:24Z (production deploy timestamp)"
human_verification:
  - test: "Re-run the OPS-01 item 7 HogQL statements against PostHog project 337485 (ad_slot event breakdown by consent_gate_path, analyze-completion impact)."
    expected: "ad_slot_shown/ad_slot_filled events present with correct consent_gate_path values; no measurable drop in analyze-completion rate attributable to ad slots."
    why_human: "No PostHog query channel was available to the executing session (WINDOWS.md #17) or to this verification pass; this is a live-traffic analytics read, not something grep/static inspection can answer."
  - test: "URL-inspect /tbc-audit, the demo analyze page, and /privacy in Google Search Console (sc-domain:parseforge.gg)."
    expected: "No ranking/indexing regression attributable to the ad change; all three routes still indexed as expected."
    why_human: "No GSC access was available to the executing session (WINDOWS.md #18) or to this verification pass."
  - test: "Re-run the three `vercel metrics` commands (lcp_ms, inp_ms, cls; p75; group-by route+device_type) on/after 2026-09-24T09:23:24Z (day-2) and on/after 2026-09-29T09:23:24Z (day-7), and append a dated PASS/breach row against every D-10 trigger in docs/OPS-01-SHIP-GATE.md Part 6."
    expected: "No route/device pair breaches CLS p75 > 0.1 (absolute), LCP p75 worse than baseline by >20%, or INP p75 > 200ms; automatic AdSense pause fires immediately per the D-08 runbook if CLS is breached at either scored read."
    why_human: "These reads are not due yet (WINDOWS.md #19) — today is 2026-09-22, the deploy happened at 09:23:24Z the same day. This is a scheduled, real-traffic measurement no static check can accelerate."
  - test: "Check the AdSense dashboard for account-approval status and confirm real ad revenue is accruing (not just ad requests firing)."
    expected: "Account approved, `ads.txt` recognized, revenue > $0 reported for a meaningful window."
    why_human: "As of 2026-09-22 the AdSense dashboard read 'Getting ready' / `ads.txt` 'Not found' in Google's own UI (developer's direct check, recorded in OPS-01-SHIP-GATE.md sign-off row 13) — this is an external approval state, not inspectable from the codebase or via curl."
  - test: "Confirm RPGLogs' eventual reply to the (still-unsent, per the developer's operator override) commercial-use approval request, or accept the standing revocation risk as an ongoing operating condition."
    expected: "Either a dated reply recorded verbatim in .planning/research/rpglogs-approval-request-2026-09-19.md's Thread table, or an explicit, periodically-reconfirmed developer decision to keep operating on the override."
    why_human: "This is a third-party correspondence outcome and a standing business-risk acceptance, not a code-verifiable fact — the override captured in this VERIFICATION.md's `overrides` block should not be read as this risk having gone away."
---

# Phase 4: Ads Live Verification Report

**Phase Goal:** ParseForge earns ad revenue without the paste-and-analyze flow getting measurably worse
**Verified:** 2026-09-22T20:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

This report deliberately does **not** manufacture a clean "passed" verdict. The phase's own artifacts
(`docs/OPS-01-SHIP-GATE.md` Part 6 sign-off row, `.planning/REQUIREMENTS.md`'s MONY-02/MONY-03
addendum, `.planning/WINDOWS.md` #17-#19) already record this phase as **not fully closed**, and this
verifier's independent inspection of the codebase and live production site agrees with that
self-assessment rather than overriding it. The engineering mechanism is real, live, and correctly
gated; the revenue half of the goal, and three of five OPS-01 evidence rows, are honestly pending —
not fabricated, not silently skipped.

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A visitor sees ads only in whitelisted slots; paste box, analysis tables, share CTA never covered/pushed/delayed | ✓ VERIFIED | `npm run protected-elements` 25/25 PASS against **production** (`docs/OPS-01-SHIP-GATE.md` line ~4272-4300), including per-slot `containment` checks ("no data-protected element within 15 lines"); independently reproduced this session via `curl https://parseforge.gg/tbc-audit` (finds `tbc-audit-mid`/`tbc-audit-end` markers) and `curl https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ` (finds `analyze-end`; `analyze-mid` is client-hydration-gated, confirmed by reading `app/analyze/[reportCode]/AnalyzeClient.tsx:353` — mounts only after `report` state resolves, matches the doc's own explanation) |
| 2 | Ad slots reserve their exact space — CLS measured, not eyeballed | ✓ VERIFIED (with a documented mid-flight fix cycle) | `lib/ads.ts` `AD_SLOTS` defines exact `base`/`md` boxes per slot; `WINDOWS.md` #12 (inline style outranking responsive classes, box never grew to desktop size) and #15/#16 (unfilled-frame flash, then a texture mismatch on the occluding cover) were each found and fixed pre-deploy via pixel-sampled CDP screenshot verification (0% deviation post-fix); today's post-deploy CLS snapshot (Part 6, `Scheduled re-reads` section) shows `/` and `/tbc-audit` at CLS 0/no-data and `/analyze/[reportCode]` desktop at 0.1471 — **below** its own 0.2344 pre-ad baseline, i.e. not worsened, though this single-day, low-sample reading is explicitly not the scored day-2/day-7 comparison |
| 3 | Ads load only after consent is granted for EEA/UK visitors; not at all on reject | ✓ VERIFIED | `lib/ads.ts` `ADMITTED_GATE_PATHS` admits exactly the two `ConsentGatePath` values PostHog also admits (`geo-non-consent-region`, full TCF opt-in), single source of truth per the phase's own assumption-delta decision (no second independent ad-side consent derivation); `lib/ads.test.ts` asserts this across all four gate-path values; Part 6's `### The netlog proof, both directions` (preview) and the post-deploy CDP capture ("a real production ad request fires only for an admitted, non-consent-region visitor... 12 ad-host requests each including real slot-scoped doubleclick.net ad calls", `REQUIREMENTS.md` MONY-02/MONY-03 Addendum) confirm this on live production traffic |
| 4 | LCP/INP/CLS captured before ad code ships and re-measured after, with an agreed rollback trigger | ⚠️ PARTIAL — pre-ad half VERIFIED, post-ad half SCHEDULED not yet due | Pre-ad baseline (`docs/OPS-01-SHIP-GATE.md` `### CWV baseline — pre-ad (D-09)`) captured via exact `vercel metrics --format json` reads, git-sha-anchored before any ad commit (04-01, touched only `.planning/` and `docs/`); rollback trigger (`### Rollback trigger (D-10)`) states 3 fixed numbers. Day-2 (due ≥2026-09-24T09:23:24Z) and day-7 (due ≥2026-09-29T09:23:24Z) re-reads are **not due yet** — deploy happened 2026-09-22T09:23:24Z, verification run same day. Routed to human verification, not marked FAILED (WINDOWS.md #19) |
| 5 | AdSense reports revenue on live traffic; PostHog tracks ad-slot impact on analyze completion; GSC shows no ranking movement (OPS-01 gate) | ✗ NOT YET TRUE — the literal "earns ad revenue" half of the phase goal is unmet | AdSense account status "Getting ready", `ads.txt` reads "Not found" in Google's own dashboard as of 2026-09-22 (developer's direct check, sign-off row 13) — **no revenue has accrued**; PostHog item-7 live-traffic thresholds NOT EVALUABLE (no query channel, WINDOWS.md #17); GSC rows NOT EVALUABLE (no access, WINDOWS.md #18). All three routed to human verification with named closing tests, not silently dropped |

**Score:** 3/5 roadmap truths cleanly verified; 2 are honestly pending on external/scheduled evidence with named closing tests (not code defects, not silently glossed over).

### R0 Contract Scope (PARSEFORGE-RANKINGS-SPEC.md §7 — folded into this phase's requirement IDs)

| # | Item | Status | Evidence |
|---|---|---|---|
| R0-1 | RPGLogs written commercial-use approval obtained before ads ship | ✗ NOT OBTAINED — explicit developer operator override applied instead | `docs/OPS-01-SHIP-GATE.md` `### Deploy decision (Phase 4, 2026-09-22)`: the approval email was never sent (Thread table holds only a `deferred`, then a `no reply — never sent` row); the developer, told plainly the real consequence ("they can revoke your API client — the whole site stops working"), said "yes, ship without approval... So whatever" (2026-09-21) and "deploy" (2026-09-22). Recorded plainly as a bypass, not disguised as approval, and **not** claimed as R0-1 being met. Carried in this VERIFICATION's `overrides` block rather than counted as a silent pass or a blocking gap — see rationale below. |
| R0-2 | Rankings + rate-limit fixtures recorded from real WCL responses | ✓ VERIFIED | `lib/__fixtures__/rankings-{report,ratelimit,encounter,character,zones,guild}.json` all exist; `lib/__fixtures__/fixtures.test.ts` shape-asserts each (04-02-SUMMARY coverage: 3/4 items `status: pass`, `human_judgment: false`); `requirements-completed: [R0-2]` in 04-02-SUMMARY frontmatter |
| R0-3 | Rankings types, pure parse-lens engine, Redis rate-budget gate (no UI) | ✓ VERIFIED | `lib/rankings/parse-lens.ts` + `lib/rankings/parse-lens.test.ts`, `lib/rankings/budget.ts` + `lib/rankings/budget.test.ts` exist; `requirements-completed: [R0-3]` in 04-04-SUMMARY frontmatter; `npx tsc --noEmit` clean across the whole repo (checked this session) |

**Why R0-1 is an override, not a gap or a silent pass:** the task briefing for this verification explicitly asked that this deviation be recorded as a deliberate, informed developer decision rather than either (a) silently treated as satisfied, or (b) used to fail the whole phase as if it were an engineering defect. It is neither — it is a live, accepted business-risk decision made by the account owner with the consequence stated to them in advance. This verifier records it as `PASSED (override)` in the frontmatter `overrides` block per the standard override mechanism, with the override itself pointing at the developer's own verbatim words rather than at this verifier's judgment. It does **not** count toward "the goal fully achieved cleanly" — the sign-off row in `docs/OPS-01-SHIP-GATE.md` itself says `NOT SIGNED`, and this report agrees.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `app/components/AdSlot.tsx` | Reserved-space, consent-gated ad slot component | ✓ VERIFIED | Exists; imported and mounted in `app/tbc-audit/page.tsx` and `app/analyze/[reportCode]/AnalyzeClient.tsx`; box dimensions match `lib/ads.ts` per `protected-elements`'s `:declared` rows |
| `lib/ads.ts` | Slot table (`AD_SLOTS`), consent gate (`shouldLoadAds`/`ADMITTED_GATE_PATHS`), loader | ✓ VERIFIED | Four slots defined (`tbc-audit-end`, `tbc-audit-mid`, `analyze-mid`, `analyze-end`); admits exactly the same 2 consent-gate paths as PostHog, per the phase's own assumption-delta decision |
| `app/ads.txt/route.ts` | `/ads.txt` serving a `DIRECT` line | ✓ VERIFIED | Production `curl https://parseforge.gg/ads.txt` returns HTTP 200, `google.com, pub-2524016639017232, DIRECT, f08c47fec0942fa0` (checked live this session) |
| `scripts/protected-elements.mjs` | Ad-slot placement whitelist gate, checked against `docs/PROTECTED-ELEMENTS.md` | ✓ VERIFIED | Exists; 25/25 PASS against production per Part 6 evidence, including containment checks for every ad slot |
| `docs/OPS-01-SHIP-GATE.md` Part 6 | Phase 4 evidence ledger: baseline, rollback trigger, runbook, deploy record, sign-off | ✓ VERIFIED (as an honest, incomplete ledger — that is its correct state) | Exists, ~1800 lines of dated evidence; ends in an explicit `Sign-off: NOT SIGNED (2026-09-22)` with a 14-row table naming exactly which items PASS and which remain open |
| `.planning/research/rpglogs-approval-request-2026-09-19.md` | RPGLogs approval request, sent, with reply recorded | ✗ INCOMPLETE by design | Draft never sent; Thread table records the deferral and the developer's override decision, not a sent/replied request |
| `lib/rankings/parse-lens.ts`, `lib/rankings/budget.ts` | R0-3 pure engine + Redis budget gate, no UI | ✓ VERIFIED | Both exist with paired `.test.ts` files; no UI wiring found (correct per D-13 — rankings stay non-user-facing until approval) |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `app/tbc-audit/page.tsx` / `AnalyzeClient.tsx` | `app/components/AdSlot.tsx` | direct import + mount | ✓ WIRED | Confirmed via grep and `protected-elements`'s `:owner` rows ("exactly one mount in ...") |
| `AdSlot.tsx` | `lib/ads.ts` (`AD_SLOTS`, `shouldLoadAds`) | import | ✓ WIRED | `lib/ads.ts` is the single declared source of slot geometry; `protected-elements`'s `:declared` rows cross-check doc vs. code vs. live box size |
| `lib/ads.ts` consent gate | `lib/consent.ts` resolved `ConsentGatePath` | shared publisher, not a second derivation | ✓ WIRED | Matches the phase's own assumption-delta decision (D-07); `lib/ads.test.ts` asserts parity across all 4 gate-path values |
| Production ad slots | Real ad network requests | consent-gated script load | ✓ WIRED (network-confirmed) | Part 6 records a fresh CDP capture on real production traffic showing 12 ad-host requests per route including slot-scoped `doubleclick.net` calls, for an admitted non-consent-region visitor only |
| CSP `script-src` | AdSense/Google ad script hosts | header allowlist | ✓ WIRED | Production CSP (checked live this session via `curl -I`) includes `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `ep2.adtrafficquality.google`, `fundingchoicesmessages.google.com`, report-only mode as planned (OPS-02 deferred to Phase 7) |

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|---|---|---|---|---|
| MONY-02 | 04-05, 04-06, 04-07 | AdSense ads live via reserved-space AdSlot + consent-gated loader + placement whitelist | ⚠️ PARTIAL — mechanism SATISFIED, "live/revenue-producing" not yet true | `.planning/REQUIREMENTS.md` itself keeps this row "Pending" and the 2026-09-22 addendum explains why: ad-serving-and-placement half closed by counted evidence; AdSense-approval/revenue half open. This verifier agrees with the project's own self-assessment rather than overriding it. |
| MONY-03 | 04-01, 04-07 | CWV baseline captured before ad code ships; post-ship monitoring with rollback criteria | ⚠️ PARTIAL — baseline + criteria SATISFIED, post-ship monitoring SCHEDULED | Same REQUIREMENTS.md addendum: pre-ad baseline + D-10 rollback numbers closed; day-2/day-7 reads not due |
| R0-1 (folded, no REQUIREMENTS.md row) | 04-01, 04-07 | RPGLogs written approval before commercial (ad) use | ✗ NOT MET — operator override applied | See R0 table above; not tracked in REQUIREMENTS.md traceability at all (pre-existing gap, per 04-04-SUMMARY) |
| R0-2 (folded) | 04-02 | Rankings/rate-limit fixtures recorded | ✓ SATISFIED | See R0 table above |
| R0-3 (folded) | 04-04 | Rankings types + pure engine + budget gate, no UI | ✓ SATISFIED | See R0 table above |

**Orphaned requirements check:** `grep -E "Phase 4" .planning/REQUIREMENTS.md` returns only the MONY-02/MONY-03 traceability rows already covered above — no orphans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` found in `app/components/AdSlot.tsx`, `lib/ads.ts`, `app/ads.txt/route.ts`, `lib/rankings/parse-lens.ts`, `lib/rankings/budget.ts` | — | none | Debt-marker gate: clean |
| `docs/OPS-01-SHIP-GATE.md` | Part 6, `Rollback trigger (D-10)` table vs. `Scheduled re-reads` narrative | Internal tension (informational, not a blocker) | ℹ️ Info | The D-10 table states CLS trigger #1 as a flat "`CLS p75 > 0.1`" absolute number, but the post-deploy narrative reads it as baseline-relative for `/analyze/[reportCode]` ("below its own 0.2344 pre-ad baseline... not against the flat 0.1 figure") to explain why today's 0.1471 reading isn't a breach. This is defensible — the automatic-pause rule is explicitly scoped to only fire "at either read" (day-2/day-7), and today's snapshot is explicitly labeled informal/non-scored — but the D-10 table itself has no written carve-out for a route whose *pre-ad baseline already exceeded 0.1* (0.2344/0.4768 on `/analyze/[reportCode]`, flagged honestly in 04-01-SUMMARY). Recommend the day-2/day-7 scored reads make this carve-out explicit in the D-10 table itself before they run, so the automatic-pause decision isn't made ad hoc under time pressure. Not a blocker — flagged for the developer's attention. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| `/ads.txt` serves the correct DIRECT line | `curl -s https://parseforge.gg/ads.txt` | `google.com, pub-2524016639017232, DIRECT, f08c47fec0942fa0` | ✓ PASS |
| `/tbc-audit` renders both whitelisted ad slots | `curl -s https://parseforge.gg/tbc-audit \| grep -o 'tbc-audit-mid\|tbc-audit-end'` | both markers found | ✓ PASS |
| Demo analyze page renders at least one ad slot in initial SSR | `curl -s .../analyze/ZjKgNYxVcAqR8pGJ \| grep -o 'analyze-mid\|analyze-end'` | `analyze-end` found; `analyze-mid` client-hydration-gated (expected, confirmed in source) | ✓ PASS |
| `/privacy` discloses WCL data use and advertising | `curl -s https://parseforge.gg/privacy \| grep -io 'warcraft logs\|advertis'` | both terms present | ✓ PASS |
| Production CSP allowlists the ad/CMP script hosts, report-only | `curl -sI https://parseforge.gg/tbc-audit \| grep -i content-security-policy-report-only` | `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `ep2.adtrafficquality.google`, `fundingchoicesmessages.google.com` all present | ✓ PASS |
| `npx tsc --noEmit` (whole repo) | `npx tsc --noEmit` | clean, exit 0 | ✓ PASS |

### Human Verification Required

See frontmatter `human_verification` block. Summary:

1. **PostHog item-7 live-traffic / ad_slot HogQL** — no query channel available this session (WINDOWS.md #17).
2. **Search Console rows for `/tbc-audit`, demo analyze page, `/privacy`** — no GSC access this session (WINDOWS.md #18).
3. **Day-2 (≥2026-09-24) and day-7 (≥2026-09-29) CWV re-reads against the D-09 baseline** — not due yet (WINDOWS.md #19).
4. **AdSense dashboard approval + real revenue confirmation** — account reads "Getting ready" as of 2026-09-22; not yet approvable/checkable from the codebase.
5. **RPGLogs approval correspondence / ongoing risk acceptance** — the override recorded above reflects the developer's decision to ship now; it does not resolve the underlying third-party risk, which remains a live, standing condition to monitor.

### Gaps Summary

No gap here reflects a missing or stubbed engineering artifact — every ad-serving, consent-gating, CSP,
and rankings-engine artifact this phase's plans promised exists, is wired, and is confirmed live on
production by both this phase's own evidence and this verifier's independent curl/grep checks. The
phase's own `docs/OPS-01-SHIP-GATE.md` sign-off is explicitly `NOT SIGNED`, and `.planning/REQUIREMENTS.md`
keeps MONY-02/MONY-03 as `Pending` with a same-day addendum explaining exactly why — this verification
report reaches the same conclusion independently rather than contradicting or rubber-stamping it.

What remains open falls into two honestly-distinct buckets:

1. **Scheduled/external evidence with a named closing test** (PostHog access, GSC access, day-2/day-7
   CWV reads, AdSense approval) — none of these are code defects; all have explicit closing tests
   already recorded in the project's own ledger. Routed to human verification, not counted as FAILED.
2. **A deliberate, developer-accepted risk override** (R0-1, RPGLogs approval not obtained) — recorded
   via the `overrides` mechanism rather than as a FAILED truth, because the phase's own documentation
   shows it was a conscious, consequence-informed decision by the account owner, not an oversight or a
   fabricated pass.

The phase goal's literal first half — "ParseForge earns ad revenue" — is **not yet true**: the
mechanism is live and correctly gated, but AdSense has not yet approved the account and no revenue has
accrued. The second half — "without the paste-and-analyze flow getting measurably worse" — is
well-evidenced as true so far (protected-elements 25/25, CDP-confirmed correct consent gating, CLS
readings currently at or below pre-ad baseline), pending the day-2/day-7 scored confirmation.

**Recommendation:** do not force a "passed" status. This phase is in a legitimate, honestly-recorded
holding pattern — proceed to Phase 5 if the developer judges the remaining items acceptable to monitor
asynchronously (they do not block other phases' code, per D-12/D-13's own sequencing), but keep the
five human-verification items above open and revisit `docs/OPS-01-SHIP-GATE.md` Part 6 once the day-2
CWV window opens (2026-09-24) and again at day-7 (2026-09-29).

---

_Verified: 2026-09-22T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
