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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD (planner fills) | — | 0 | ACC-01 | — | N/A | unit | `npx vitest run lib/cla-constants.test.ts` | ✅ (must keep passing post-regen) | ⬜ pending |
| TBD | — | — | ACC-01 | — | N/A | script output review | `node scripts/regen-game-data.mjs --markdown docs/GAME-DATA-AUDIT.md` | ❌ W0 | ⬜ pending |
| TBD | — | — | ACC-02 | — | N/A | unit + snapshot | `npx vitest run lib/cla-engine.test.ts` | ❌ W0 | ⬜ pending |
| TBD | — | — | ACC-02 | — | N/A | unit + snapshot | `npx vitest run lib/raid-overview-engine.test.ts` | ❌ W0 | ⬜ pending |
| TBD | — | — | ACC-02 | — | No real network; `fetch` stubbed; no secrets in fixtures | unit (`vi.stubGlobal('fetch', …)`) | `npx vitest run lib/wcl-client.test.ts` | ❌ W0 | ⬜ pending |
| TBD | — | — | ACC-03 | — | Report code validated before WCL events fetch | unit | `npx vitest run lib/timeline-engine.test.ts` | ❌ W0 | ⬜ pending |
| TBD | — | — | ACC-04 | — | N/A | unit | `npx vitest run lib/healer-metrics.test.ts` | ❌ W0 | ⬜ pending |
| TBD | — | — | ACC-04 | — | N/A | unit | `npx vitest run lib/analysis-engine.test.ts` (extend existing) | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/__fixtures__/` — at least 2 recorded WCL responses for the public demo report (`ZjKgNYxVcAqR8pGJ`, fight 23, source 12 — `lib/demo-report.ts`); feeds ACC-02, ACC-03, ACC-04 tests
- [ ] One-time WCL live-query spike (resolves RESEARCH.md Assumptions A1–A4 / Open Questions 1–2) — before timeline route and healer query changes are finalized
- [ ] `lib/cla-engine.test.ts`, `lib/raid-overview-engine.test.ts`, `lib/wcl-client.test.ts`, `lib/timeline-engine.test.ts`, `lib/healer-metrics.test.ts` — stubs
- [ ] `scripts/regen-game-data.mjs` — does not exist yet (D-09)
- [ ] No framework install needed — vitest already configured and in CI

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
