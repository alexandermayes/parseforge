---
phase: 04-ads-live
plan: 01
subsystem: infra
tags: [ops-01, wcl-api, terms-of-service, vercel-metrics, core-web-vitals, rollback]

# Dependency graph
requires: []
provides:
  - Dated, provenance-headed captures of the RPGLogs API Terms of Service and API documentation, human-read in a browser (both pages 403 automated readers)
  - The commercial-use approval address (advertising@archon.gg, ToS §2a) and the finding that neither canonical page states the required attribution text/logo — that must come from RPGLogs' reply
  - docs/OPS-01-SHIP-GATE.md Part 6: an exact, dated, per-route/per-device pre-ad CWV baseline (vercel metrics CLI, not a dashboard read), the D-10 rollback trigger, the D-08 runbook, and the D-11/D-14 observation and escalation clocks
  - PROJECT.md Key Decisions row recording the developer's 2026-09-21 deferral of the approval email
affects: [04-03, 04-04, 04-05, 04-06, 04-07]

# Actuals (#2632)
actuals:
  tokens: 16000
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vercel metrics --format json summary[] as the authoritative whole-window p75 figure, distinct from the default text table's per-bucket avg column — documented explicitly to prevent 04-07 comparing the wrong number"
    - "Append-only OPS-01 Part 6, following the same dated-subsection convention as Parts 2-5"

key-files:
  created:
    - .planning/research/wcl-tos-2026-09-19.md
    - .planning/research/wcl-api-docs-2026-09-19.md
  modified:
    - .planning/research/rpglogs-approval-request-2026-09-19.md
    - .planning/PROJECT.md
    - docs/OPS-01-SHIP-GATE.md

key-decisions:
  - "Developer deferred sending the RPGLogs commercial-use approval request on 2026-09-21 after supplying the browser captures; Task 1 recorded as PARTIAL, not rounded up to complete"
  - "Approval address confirmed as advertising@archon.gg (ToS §2a); WCL client display name still unknown, left as an explicit TBD in the draft rather than guessed"
  - "vercel metrics --format json summary[] adopted as the baseline table's number source (single p75 over the full 7-day window), not the default text table's bucketed avg column, to keep 04-07's comparison apples-to-apples"
  - "Pre-existing /analyze/[reportCode] CLS p75 (0.2344 desktop / 0.4768 mobile, already above the 0.1 rollback trigger) recorded as-is in the baseline, not smoothed over — it is the baseline ads must not worsen, not a target"
  - "Lighthouse mobile lab run recorded as unavailable (npx install-confirmation block in this sandbox, not a network failure); not added to package.json; Chrome DevTools fallback named as an open backstop per the plan's own must_haves entry"
  - "D-14 approval clock recorded as NOT STARTED (no sent date exists yet) rather than computing a day-14 deadline from a fabricated send date"

requirements-completed: [MONY-03]

coverage:
  - id: D1
    description: "Dated ToS/API-docs captures with provenance headers, saved from developer-supplied browser PDFs"
    verification:
      - kind: other
        ref: "gate script embedded in 04-01-PLAN.md Task 1 <verify> (byte-size, provenance-line, commercial-clause checks)"
        status: pass
    human_judgment: false
  - id: D2
    description: "RPGLogs commercial-use approval request sent and recorded verbatim in the Thread table"
    verification: []
    human_judgment: true
    rationale: "Developer explicitly deferred this step on 2026-09-21; not sent, not verifiable as complete. This deliverable is INCOMPLETE by design (see Deferred Issues) and a human must send it before it can pass."
  - id: D3
    description: "docs/OPS-01-SHIP-GATE.md Part 6 pre-ad CWV baseline, rollback trigger, runbook and clocks"
    verification:
      - kind: other
        ref: "gate scripts embedded in 04-01-PLAN.md Task 2/Task 3 <verify> (Part 6 structure, metric names, threshold numbers, runbook line-ordering)"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-09-21
status: complete
---

# Phase 4 Plan 1: WCL ToS capture (deferred send) + pre-ad CWV baseline Summary

**RPGLogs Terms/API-docs captured with provenance and the approval address identified, but the developer deferred sending the request; the pre-ad CWV baseline, rollback trigger, runbook and both escalation clocks are fully written into OPS-01 Part 6 via exact `vercel metrics` reads.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-09-21 (continuation from a prior checkpoint; this session began fresh with zero prior commits)
- **Completed:** 2026-09-21
- **Tasks:** 3 (Task 1 partial by design, Tasks 2-3 complete)
- **Files modified:** 5

## Accomplishments

- Saved the RPGLogs API Terms of Service and API documentation as dated, provenance-headed text under `.planning/research/`, sourced from the developer's own browser-saved PDFs (both canonical pages 403 automated readers — confirmed again this session, matching 04-RESEARCH.md Pitfall 5)
- Identified the commercial-use approval address (`advertising@archon.gg`, ToS §2a) and the load-bearing finding that **neither** canonical page states the required attribution text/logo — §6b of the ToS defers to "the documentation," and the API-docs capture contains only OAuth/GraphQL content, zero attribution language. That text must come from RPGLogs' eventual reply.
- Filled every placeholder in the approval-request draft that was legitimately knowable this session (To, From, owner name) and left the WCL client display name as an explicit TBD rather than guessing it; flipped the file's Status line to a dated DEFERRED state per the developer's verbatim instruction to hold sending
- Recorded the deferral as a new row in `.planning/PROJECT.md` Key Decisions
- Built `docs/OPS-01-SHIP-GATE.md` `## Part 6 — Phase 4 evidence` end to end: an exact, dated, per-route/per-device pre-ad CWV baseline table (six rows, zero `no-data`) read via `vercel metrics --format json`, the D-10 rollback trigger table, the D-08 rollback runbook (AdSense dashboard pause first, `NEXT_PUBLIC_ADS_ENABLED` + redeploy second, breach-recording third — verified line-number-ordered), and the D-11 CWV observation clock plus the D-14 approval escalation clock
- Recorded, rather than hid, that `/analyze/[reportCode]` already runs CLS p75 above the 0.1 rollback trigger *before any ad code ships* — this is now the documented baseline the ad rollout must not worsen further, not a target it needs to clear

## Task Commits

Each task was committed atomically:

1. **Task 1: R0-1 — capture the Terms in a browser, send the approval request, record the thread** — `9031c2e` (docs) — PARTIAL: capture + record done, send deferred by the developer
2. **Task 2: Capture the pre-ad CWV baseline into OPS-01 Part 6 (D-09)** — `1dd03d6` (docs)
3. **Task 3: Write the rollback trigger, the runbook and the two clocks into Part 6 (D-10, D-11, D-08, D-14)** — `09eee20` (docs)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS)

## Files Created/Modified

- `.planning/research/wcl-tos-2026-09-19.md` — dated, provenance-headed capture of the RPGLogs API Terms of Service (28,970 bytes; contains the §2a commercial-use clause and the §6b attribution clause)
- `.planning/research/wcl-api-docs-2026-09-19.md` — dated, provenance-headed capture of the WCL API docs page (10,982 bytes; OAuth + GraphQL only, no attribution section — the key negative finding)
- `.planning/research/rpglogs-approval-request-2026-09-19.md` — legitimately-known placeholders filled (To, From, owner name); WCL client name left as an explicit TBD; Status flipped to a dated DEFERRED state; Thread table's placeholder row replaced with a `deferred` row (not `sent`)
- `.planning/PROJECT.md` — one new Key Decisions row recording the 2026-09-21 deferral
- `docs/OPS-01-SHIP-GATE.md` — new `## Part 6 — Phase 4 evidence` section (CWV baseline, rollback trigger, runbook, observation/escalation clocks)

## Decisions Made

- **vercel metrics number source.** The CLI's default text table's `avg` column is the average of per-4h-bucket p75 values, not the single p75-over-the-whole-window figure D-09 asks for. Used `--format json`'s `summary[]` array (the true whole-window p75) as the baseline table's authoritative source instead, and documented the distinction explicitly in Part 6 so 04-07's post-ship comparison reads the same statistic, not the smoothed one.
- **Honest incompleteness over a fabricated pass.** Task 1's own automated gate is designed to fail on the "sent row" / "no remaining placeholders" checks in this session, by the resume instructions' explicit design — the developer chose to defer sending. This SUMMARY records Task 1 as PARTIAL rather than rounding it up, and does not edit the plan's gate script to make it pass.
- **No fabricated day-14 start date.** Since no email was sent, Part 6's approval clock records that the day-14 window has not started, rather than computing a deadline from an invented send date. It states the formula (`sent date + 14 days`) and the three D-14 escalation options, to be dated once the email is actually sent.
- **Lighthouse not installed via a bare `npx`.** The environment's `npx` refused to silently download `lighthouse@12.8.2` without confirmation (a sandbox install-confirmation policy, not a network outage — `registry.npmjs.org` was reachable). Per the plan's own contingency, this is recorded as an open backstop with the Chrome DevTools fallback named, and `lighthouse` was not added to `package.json`.

## Deviations from Plan

None beyond what the resume instructions explicitly directed (Task 1's partial completion is not a deviation — it is the developer's own recorded decision, executed as instructed, not an executor auto-fix under Rules 1-4).

## Issues Encountered

- The plan's Task 2 action named `--group-by deviceType`, but the live `vercel metrics schema` output shows the actual shared dimension is `device_type` (snake_case). Using the literal `deviceType` string silently returned `(not set)` for every row instead of erroring — caught by cross-checking against `vercel metrics schema vercel.speed_insights` before trusting the output, and the correct dimension name is what the Part 6 evidence blocks and baseline table use. Not logged as a Rule 1-3 deviation because it did not require touching any file outside this plan's own `files_modified` list — it only changed which flag value was passed to a read-only CLI query.

## User Setup Required

None - no external service configuration required this plan (the AdSense/RPGLogs `user_setup` items named in this plan's frontmatter are the very R0-1 send step recorded as deferred above, and the Vercel CLI read, which succeeded under the existing personal login).

## Next Phase Readiness

- **Ready:** Tasks 2 and 3 fully close MONY-03's "captured before ad code ships" requirement with a provably-ordered git sha and exact per-route/per-device figures; the D-10 rollback numbers, D-08 runbook and D-11 observation clock are all agreed and written down before any ad code exists in the repo. 04-03 through 04-06 (AdSlot, consent-gated loader, CSP entries, R0-2/R0-3 rankings engine code, preview deploy) can proceed per D-12/D-13 — none of that work earns money and none of it is gated on the approval reply.
- **Blocker for 04-07 only:** the production ad deploy checkpoint in 04-07 cannot proceed — R0-1's Thread table has no `sent` row, only a `deferred` one. Before that checkpoint can pass, a human (or a future plan) must: (1) read the WCL client's display name from `https://www.warcraftlogs.com/api/clients`, (2) fill it into `rpglogs-approval-request-2026-09-19.md`, (3) send the email from `info@lootlistplus.com` to `advertising@archon.gg`, and (4) replace the `deferred` Thread row with a `sent` row carrying the exact sent text and a dated Status line. Until then, D-14's day-14 escalation clock also cannot start.

## Deferred Issues

- **R0-1 is INCOMPLETE.** `requirements-completed` above deliberately omits `R0-1` (it is listed in the plan's `requirements` frontmatter but is not marked complete here) because the approval email was not sent — the developer explicitly chose to defer sending on 2026-09-21 after supplying the two browser captures, the account email (`info@lootlistplus.com`) and the sign-off name (`Alexander (Zev)`), but did not supply the WCL client display name and did not send. Remaining to close R0-1: read the client name from `https://www.warcraftlogs.com/api/clients`, fill it into the draft, send from `info@lootlistplus.com` to `advertising@archon.gg`, and record a real `sent` row (verbatim text, dated Status line) in the Thread table.
- **04-07 must not run until the reply is recorded.** The production ad deploy is a `checkpoint:human-action` gated on the Thread table carrying real approval text (D-12). This gate is untouched by this plan and remains fully in force.
- **Lighthouse mobile lab reference not run** (backstop-only per the plan's `must_haves.truths`, `verification: backstop`) — `npx lighthouse` was blocked by this sandbox's install-confirmation policy, not a network failure. Closing test: run the Chrome DevTools Lighthouse panel (Mobile preset) against `https://parseforge.gg/`, the demo report's analyze URL, and `https://parseforge.gg/tbc-audit`, and append the LCP/TBT/CLS/version figures to Part 6.

## Self-Check: PASSED

- `[ -f .planning/research/wcl-tos-2026-09-19.md ]` → FOUND
- `[ -f .planning/research/wcl-api-docs-2026-09-19.md ]` → FOUND
- `[ -f .planning/research/rpglogs-approval-request-2026-09-19.md ]` → FOUND (modified, not created)
- `[ -f docs/OPS-01-SHIP-GATE.md ]` → FOUND (modified, Part 6 present)
- `git log --oneline --all --grep="04-01"` → FOUND: `9031c2e`, `1dd03d6`, `09eee20`
- Task 2 `<verify>` automated blocks: both re-ran this session and printed `metrics-read-ok` / `part6-baseline-ok`
- Task 3 `<verify>` automated block: re-ran this session and printed `part6-rollback-ok`
- Task 1 `<verify>` automated block: re-ran this session, correctly FAILS on the placeholder/sent-row checks (`GATE-FAIL: the approval request still carries draft placeholders`) — this is the expected, correct result of the developer's deferral, not a defect
- `npx tsc --noEmit` → clean (no source files touched this plan)
- `git diff --name-only e4896a3..HEAD` → touches only `.planning/` and `docs/`, confirming the plan's own verification item ("No file under `app/`, `lib/` or `scripts/` was modified by this plan")

---
*Phase: 04-ads-live*
*Completed: 2026-09-21*
</content>
