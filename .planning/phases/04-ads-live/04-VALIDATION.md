---
phase: "4"
slug: "ads-live"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-19"
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Content below was authored by `gsd-planner` alongside `04-0*-PLAN.md`; the `status` and
> `nyquist_compliant` flags are only ever set by `/gsd-validate-phase`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 (`package.json` devDependency; `node_modules/.bin/vitest` present) |
| **Config file** | none — vitest runs on defaults; `npm test` is `vitest run` |
| **Quick run command** | `export PATH="$HOME/.local/node20/bin:$PATH"; npx vitest run <file>` |
| **Full suite command** | `export PATH="$HOME/.local/node20/bin:$PATH"; npm test` |
| **Estimated runtime** | ~5 s for a single file; the full suite completed in well under a minute at Phase 3 close (226 tests) |

Standing non-test gates this phase also samples against, all already installed:
`npx tsc --noEmit`, `npm run lint`, `npm run token-audit`, `npm run theme-parity`,
`npm run seo-invariants`, `npm run protected-elements`.

---

## Sampling Rate

- **After every task commit:** the task's own `<automated>` block — at minimum `npx tsc --noEmit`
  plus the new or touched test file.
- **After every plan wave:** `npm test` + `npx tsc --noEmit` + `npm run protected-elements`.
- **Before `/gsd-verify-work`:** full suite green, all six gates green, `npm run lint` with no new
  findings beyond the pre-existing debt in `components/ui/meteors.tsx` and `lib/analysis-engine.ts`.
- **Max feedback latency:** ~60 s for a per-task run; ~3 min for the wave-level set including the
  two dev-server smoke checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | R0-1 | T-04-01 / T-04-03 | Saved terms text is the real page, not an error body; the sent email is recorded verbatim | integration (shell) | `bash` gate over the two saved captures + the Thread table | ✅ (files created by the task) | ⬜ pending |
| 4-01-02 | 01 | 1 | MONY-03 | T-04-02 | Every baseline figure carries the command output that produced it | manual-assisted (CLI capture) | `vercel metrics vercel.speed_insights.cls … --prod` + a Part 6 content gate | ✅ (Vercel CLI 56.3.1) | ⬜ pending |
| 4-01-03 | 01 | 1 | MONY-03 | T-04-02 | The runbook leads with the instant lever, not the build-time one | integration (shell) | Part 6 ordering gate (pause line number < flag line number) | ✅ | ⬜ pending |
| 4-02-01 | 02 | 1 | R0-2 | T-04-06 / T-04-07 | No credential-shaped string reaches a committed fixture | unit (fixture shape) | `npx vitest run lib/__fixtures__/fixtures.test.ts` | ✅ (file exists, extended) | ⬜ pending |
| 4-02-02 | 02 | 1 | R0-2 | T-04-10 | Leaderboard query is partition-scoped, not cross-phase | unit (fixture shape) | `npx vitest run lib/__fixtures__/fixtures.test.ts` | ✅ | ⬜ pending |
| 4-02-03 | 02 | 1 | R0-2 | T-04-06 | Guild/character entities confirmed public before recording | unit + shell | `npm test` + provenance gate | ✅ | ⬜ pending |
| 4-03-01 | 03 | 2 | MONY-02 | T-04-11 / T-04-12 / T-04-17 | Ad gate admits exactly the two consent paths PostHog opts in for; no second consent derivation; no report code in an event property | unit + dev-server smoke | `npx vitest run lib/ads.test.ts`; SSR smoke on port 3996 | ❌ **Wave 0 — this task creates `lib/ads.test.ts`** | ⬜ pending |
| 4-03-02 | 03 | 2 | MONY-02 | T-04-13 / T-04-15 | Report-only CSP names the three ad hosts; ads.txt 404s rather than declaring an empty publisher | integration (dev server) | `tsc`/`eslint` + `/ads.txt` live fetch on port 3997 | ✅ | ⬜ pending |
| 4-03-03 | 03 | 2 | MONY-02 | T-04-14 | A wrong box dimension in the doc table fails the gate | integration (script) | `npm run protected-elements` + a deliberate-tamper gate | ✅ (script exists, extended) | ⬜ pending |
| 4-04-01 | 04 | 2 | R0-3 | T-04-20 / T-04-21 | The lens is pure, never throws on a shape surprise, and invents no field | unit (fixture-driven) | `npx vitest run lib/rankings/parse-lens.test.ts` | ❌ **Wave 0 — this task creates the test file** | ⬜ pending |
| 4-04-02 | 04 | 2 | R0-3 | T-04-18 / T-04-19 | Rate-limit numbers are validated before trust; the gate fails closed on unknown | unit | `npx vitest run lib/rankings/budget.test.ts` | ❌ **Wave 0 — this task creates the test file** | ⬜ pending |
| 4-05-01 | 05 | 3 | MONY-02 | T-04-23 / T-04-27 | No slot reaches a protected-element owner file or a non-whitelisted route | integration (script + dev server) | `npm run protected-elements`; placement gate; SSR smoke on port 3998 | ✅ | ⬜ pending |
| 4-05-02 | 05 | 3 | MONY-02 | T-04-24 | The policy text matches what the site will actually do | integration (shell) + human-check | `/privacy` content gate + developer read | ✅ | ⬜ pending |
| 4-05-03 | 05 | 3 | MONY-02 | T-04-22 / T-04-26 | Auto ads off; env listed, never decrypted | integration (shell) + human-check | unit-id gate; `vercel env ls` name-only gate | ✅ | ⬜ pending |
| 4-06-01 | 06 | 4 | MONY-02 | T-04-36 | Exactly one capture call site per ad event; no high-cardinality property | integration (grep) | full-gate chain + per-event grep gate | ✅ | ⬜ pending |
| 4-06-02 | 06 | 4 | MONY-02 / MONY-03 | T-04-28 / T-04-29 / T-04-30 | The browser provably does not request the ad script on the fail-closed path | integration (preview + netlog) | Part 6 evidence gate + `npm run protected-elements` | ✅ | ⬜ pending |
| 4-06-03 | 06 | 4 | MONY-02 | T-04-23 | Protected elements still reachable at 384px with all four boxes present | manual (recorded) + human-check | developer-review content gate | ✅ | ⬜ pending |
| 4-07-01 | 07 | 5 | R0-1 | T-04-33 | No option auto-selected on the one-way gate | integration (shell) + human-check | Thread/Part 6 decision gate | ✅ | ⬜ pending |
| 4-07-02 | 07 | 5 | MONY-02 | T-04-34 | Production serves only whitelisted slots; canonical stays param-free | integration (live fetch) | `npm run protected-elements` + production contract gate | ✅ | ⬜ pending |
| 4-07-03 | 07 | 5 | MONY-02 / MONY-03 | T-04-35 / T-04-36 / T-04-37 | Item 7 scored on counted live traffic; no softened pass | integration (shell + CLI) | Part 6 evidence gate + post-ship `vercel metrics` read | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/ads.test.ts` — created by 4-03-01 as its RED step, before any ad gate code exists
- [ ] `lib/rankings/parse-lens.test.ts` — created by 4-04-01 as its RED step
- [ ] `lib/rankings/budget.test.ts` — created by 4-04-02 as its RED step
- [ ] `lib/__fixtures__/rankings-report.json` and `rankings-ratelimit.json` — recorded by 4-02-01;
      the two test files above cannot be meaningful without them, which is why 04-04 depends on 04-02
- [ ] `scripts/protected-elements.mjs` ad-slot checks — extended by 4-03-03; the script exists today
      but sees no ad slot, so a slot could ship today with the gate green
- [ ] `docs/OPS-01-SHIP-GATE.md` Part 6 — not a test file, but a required pre-code artifact: D-09
      requires the baseline before the first ad commit, which is why 04-03 depends on 04-01

No framework installation is needed; vitest and all six gate scripts are already present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The RPGLogs Terms and API-docs pages are read and saved | R0-1 | Both canonical pages answer every automated reader with a Forbidden status (re-confirmed by curl in 04-RESEARCH.md Pitfall 5) | Open each in a logged-in browser, copy the full visible text into the dated `.planning/research/` file with a provenance header |
| The approval email is sent from the operator address | R0-1 | No CLI exists for the operator mailbox | Send from info@lootlistplus.com; paste the exact sent text into the Thread table |
| Auto ads is off and the four units are fixed-size | MONY-02 / D-05 | Account-side state with no API this project holds credentials for; no code can observe it | Read the toggle and each unit's type in the AdSense UI and record what was observed |
| The `/privacy` disclosure is accurate | MONY-02 / R0-1 | A grep can prove the words are present but not that the statements are true | Developer reads the four changed paragraphs against actual behaviour before the ads deploy |
| Both-theme appearance and 384px reachability with ad boxes present | MONY-02 / SC1 | No visual-regression harness exists on this project (node-env vitest only); Part 1 item 2 already records this as the only coverage | Preview URL in light and dark at desktop and 384px; one recorded result per route per theme plus a six-row protected-element table |
| The EEA/UK consent-region ad path | MONY-02 / SC3 | The CMP publisher id is a Production-only environment variable, so a preview renders no CMP — the same limitation Phase 2.1 recorded | After the production deploy, observe from an EEA/UK egress (or a VPN session) that a rejection results in no request to the AdSense host |
| A real creative fills a reserved box without shifting anything | MONY-02 / SC2 | Requires a live, approved AdSense account serving real demand | After the production deploy, load a whitelisted route and confirm the box fills in place; the day-2 CLS read is the numeric backstop |
| AdSense reports revenue on live traffic | SC5 | Dashboard-only figure that needs accrued impressions | Read the AdSense earnings view at the day-7 mark and record it into Part 6 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — every task in all seven plans carries at least one `<automated>` block, and each is paired with a `<fails_when>` statement
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — zero tasks lack one
- [ ] Wave 0 covers all MISSING references — the three test files and the two fixtures are created by the tasks that depend on them; confirm at execution time
- [x] No watch-mode flags — every command uses `vitest run`, never a watcher
- [ ] Feedback latency < 60s — holds for per-task runs; the two preview/production evidence tasks are longer by nature
- [ ] `nyquist_compliant: true` set in frontmatter — set only by `/gsd-validate-phase`

**Approval:** pending
