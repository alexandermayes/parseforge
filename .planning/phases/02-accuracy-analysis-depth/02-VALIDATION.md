---
phase: "02"
slug: "accuracy-analysis-depth"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-07"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.10 (`package.json`) |
| **Config file** | `vitest.config.ts` — `environment: "node"`, `include: ["lib/**/*.test.ts", "app/**/*.test.ts"]` |
| **Quick run command** | `export PATH="$HOME/.local/node20/bin:$PATH"; npx vitest run <changed-file>.test.ts` |
| **Full suite command** | `export PATH="$HOME/.local/node20/bin:$PATH"; [ -d node_modules ] || npm ci; npm test` (= `vitest run`) |
| **Estimated runtime** | ~10 seconds (currently 7 files / 59 tests; grows this phase) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <changed-file>.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green (also required by the OPS-01 ship-gate local step, `docs/OPS-01-SHIP-GATE.md`)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

All commands are prefixed with `export PATH="$HOME/.local/node20/bin:$PATH";` in the plans; the first
command of each plan additionally guards with `[ -d node_modules ] || npm ci;`. Omitted here for width.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01 T1 | 02-01 | 1 | ACC-02, ACC-03, ACC-04 | T-02-01, T-02-02 | No credential or token reaches a fixture; pulled env file deleted; public report only | fixture recording + negative grep | `for f in demo-player-dps demo-player-healer demo-raid-overview demo-raid-combatant-info demo-raid-death-events demo-timeline-casts; do test -s "lib/__fixtures__/$f.json"; done` | ❌ W0 (this task creates them) | ⬜ pending |
| 02-01 T2 | 02-01 | 1 | ACC-02, ACC-03, ACC-04 | — | N/A | unit (fixture shape guard) | `npx vitest run lib/__fixtures__/fixtures.test.ts` | ❌ W0 | ⬜ pending |
| 02-02 T1 | 02-02 | 2 | ACC-03 | T-02-03, T-02-04, T-02-05, T-02-06 | Report code and both ids validated before any cache key or WCL query; explicit rate-limit bucket; hard page cap | unit + source assertions | `npx vitest run lib/timeline-engine.test.ts` | ❌ W0 | ⬜ pending |
| 02-02 T2 | 02-02 | 2 | ACC-03 | T-02-06 | Server message only via errorResponse; fixed fallback copy | source assertions + full suite | `npm test` | ✅ extend | ⬜ pending |
| 02-03 T1 | 02-03 | 2 | ACC-01 | T-02-08, T-02-09, T-02-10 | Row-count floors evaluated before any write; header-indexed CSV parsing; per-era build prefix match | script output review | `node scripts/regen-game-data.mjs --report` | ❌ W0 | ⬜ pending |
| 02-03 T2 | 02-03 | 2 | ACC-01 | T-02-10 | No override id inside a generated module | unit (generated-data regression) | `npx vitest run lib/generated/game-data.test.ts` | ❌ W0 | ⬜ pending |
| 02-04 T1 | 02-04 | 3 | ACC-04 | T-02-12 | Divide-by-zero and absent-row guards; un-scoped row is the only valid input | unit | `npx vitest run lib/healer-metrics.test.ts` | ❌ W0 | ⬜ pending |
| 02-04 T2 | 02-04 | 3 | ACC-04 | T-02-13 | One computation, two surfaces — cross-surface equality asserted | unit + region-free negative grep | `npx vitest run lib/healer-metrics.test.ts lib/constants.test.ts` | ✅ extend | ⬜ pending |
| 02-05 T1 | 02-05 | 3 | ACC-03 | T-02-15 | Truncated set only on the page-cap exit path | unit | `npx vitest run lib/timeline-engine.test.ts` | ✅ extend | ⬜ pending |
| 02-05 T2 | 02-05 | 3 | ACC-03 | T-02-16, T-02-17, T-02-SC | Filtering is DOM-only, no refetch; no new virtualisation dependency | source assertions + dependency gate | `node -e 'const d=require("./package.json").dependencies; ...'` (see plan) | ✅ extend | ⬜ pending |
| 02-06 T1 | 02-06 | 3 | ACC-01 | T-02-20 | Curation floor makes a partial name resolution a hard failure | JSON schema assertion + script output | `node scripts/regen-game-data.mjs --report` | ✅ extend | ⬜ pending |
| 02-06 T2 | 02-06 | 3 | ACC-01 | T-02-19 | Cutover is behaviour-preserving; no inline map literal survives | unit (existing regression suite, unmodified) | `npx vitest run lib/cla-constants.test.ts` | ✅ must keep passing post-regen | ⬜ pending |
| 02-06 T3 | 02-06 | 3 | ACC-01 | T-02-18 | Unverified ids separable from wago-verified ones after composition | script output review | `node scripts/regen-game-data.mjs --markdown docs/GAME-DATA-AUDIT.md` | ❌ W0 | ⬜ pending |
| 02-07 T1 | 02-07 | 4 | ACC-04 | T-02-21, T-02-22 | Every healer rule gated on a nonzero top-healer sample count | unit | `npx vitest run lib/analysis-engine.test.ts` | ✅ extend | ⬜ pending |
| 02-07 T2 | 02-07 | 4 | ACC-04 | T-02-23 | Flat, low-cardinality numeric event props only; no free text | source assertions + full suite | `npm test` | ✅ extend | ⬜ pending |
| 02-08 T1 | 02-08 | 4 | ACC-02 | T-02-25, T-02-26 | Exactly one snapshot per engine beside named behavioural assertions | unit + snapshot | `npx vitest run lib/cla-engine.test.ts lib/raid-overview-engine.test.ts` | ❌ W0 | ⬜ pending |
| 02-08 T2 | 02-08 | 4 | ACC-02 | T-02-24, T-02-SC | No real network; fetch stubbed; token cache mocked; no secret in the test | unit (`vi.stubGlobal('fetch', …)`) | `npx vitest run lib/wcl-client.test.ts` | ❌ W0 | ⬜ pending |
| 02-08 T3 | 02-08 | 4 | ACC-02 | — | A red suite blocks a production deploy, stated in the gate | doc assertion + full suite | `npm test` | ✅ extend | ⬜ pending |
| 02-09 T1 | 02-09 | 5 | ACC-01..04 | T-02-28 | Every gate row carries its evidence verbatim; no-data never recorded as a pass | full local gate | `npx tsc --noEmit && npm run lint && npm test && npm run theme-parity && npm run token-audit` | ✅ | ⬜ pending |
| 02-09 T2 | 02-09 | 5 | ACC-01..04 | T-02-27 | Production deploy gated on explicit developer approval (`gate="blocking-human"`) | checkpoint:decision | — (checkpoint, no automated command) | — | ⬜ pending |
| 02-09 T3 | 02-09 | 5 | ACC-01..04 | T-02-27, T-02-30 | Deploy command matches the recorded decision; no env value recorded | CLI + manual sweep | `vercel whoami --scope loot-list-plus` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Every Wave 0 gap below is owned by a named plan; none is left for an executor to discover mid-flight.

- [ ] `lib/__fixtures__/` — six recorded WCL responses for the public demo report (`ZjKgNYxVcAqR8pGJ`, fight 23, source 12 — `lib/demo-report.ts`), plus a provenance README answering RESEARCH.md A1–A5 → **plan 02-01, task 1**
- [ ] One-time WCL live-query spike resolving RESEARCH.md Assumptions A1–A4 and Open Questions 1–2 — folded into the same recording run, so the shapes are learned before the timeline route and the healer query changes are written → **plan 02-01, task 1**
- [ ] `lib/__fixtures__/fixtures.test.ts` — the shape guard over the recorded fixtures → **plan 02-01, task 2**
- [ ] `lib/timeline-engine.test.ts` → **plan 02-02, task 1** (extended by 02-05, task 1)
- [ ] `lib/healer-metrics.test.ts` → **plan 02-04, task 1** (extended by 02-04, task 2)
- [ ] `lib/generated/game-data.test.ts` → **plan 02-03, task 2**
- [ ] `lib/cla-engine.test.ts`, `lib/raid-overview-engine.test.ts` → **plan 02-08, task 1**
- [ ] `lib/wcl-client.test.ts` → **plan 02-08, task 2**
- [ ] `scripts/regen-game-data.mjs` (D-09) → **plan 02-03, task 1** (extended by 02-06, tasks 1 and 3)
- [ ] `scripts/record-wcl-fixtures.mjs` → **plan 02-01, task 1**
- [ ] No framework install needed — vitest is already configured and already in CI, and no plan in this phase installs any package (RESEARCH.md Package Legitimacy Audit)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Timeline tab renders a readable, virtualised cast log on mobile | ACC-03 | Visual/layout | Open `/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12` → Timeline tab at 375px width; scroll full log; toggle ability filter chips |
| Regen diff reviewed by owner | ACC-01 | Human review is the acceptance artifact (D-12) | Open the regen PR; read `docs/GAME-DATA-AUDIT.md` changed-IDs + unverified-overrides lists |
| PostHog events land for new surfaces; GSC verification pass | OPS-01 | External services | Follow `docs/OPS-01-SHIP-GATE.md` 6-step checklist |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
