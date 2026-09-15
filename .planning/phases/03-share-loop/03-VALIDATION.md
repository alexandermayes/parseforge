---
phase: "3"
slug: "share-loop"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-15"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.10 (installed; `vitest.config.ts`, `environment: "node"`) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `export PATH="$HOME/.local/node20/bin:$PATH"; npx vitest run lib/awards-engine.test.ts` |
| **Full suite command** | `export PATH="$HOME/.local/node20/bin:$PATH"; npx vitest run && npx tsc --noEmit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <touched test files>`
- **After every plan wave:** Run `npx vitest run && npx tsc --noEmit && npm run lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SHARE-01 | T-3-01 / — | N/A | unit | `npx vitest run lib/awards-engine.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*(Populated fully by the planner from PLAN.md tasks; see RESEARCH.md ## Validation Architecture for the requirement → test map.)*

---

## Wave 0 Requirements

- [ ] `lib/awards-engine.test.ts` — stubs for SHARE-01 (synthetic `RaidOverviewResult` fixtures per trigger condition + demo fixture)
- [ ] permalink-normalization helper test — stubs for SHARE-02
- [ ] `scripts/protected-elements.mjs` + `npm run protected-elements` — gate for SHARE-03
- [ ] `app/og/route.tsx` `view=awards` branch — route test or documented manual smoke-check convention

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Discord unfurl renders awards image | SHARE-01 | External service rendering | Paste OG URL (with cache-bust param) into a Discord channel; confirm image unfurls with awards visible |
| Share-rate HogQL query vs ~2.8% baseline | OPS-01 | PostHog query, not code | Run documented HogQL in PostHog; record in OPS-01 gate doc |
| GSC indexing/canonicals undisturbed | OPS-01 | External service | Run `scripts/seo-invariants.mjs` + GSC URL inspection per OPS-01 gate |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
