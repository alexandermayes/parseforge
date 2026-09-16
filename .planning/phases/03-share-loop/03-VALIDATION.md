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
| 03-01-01 | 01 | 1 | SHARE-01 | T-03-01, T-03-02, T-03-05, T-03-06 | `view` allowlisted against one literal before any fetch; integer-validated `fight`; names escaped via JSX text nodes with explicit max widths | unit + route smoke | `npx vitest run lib/awards-engine.test.ts` · `npx tsc --noEmit && npx eslint …` · wiring grep gate · `next dev` + curl `/og?…&view=awards` | ❌ W0 (test created by this task) | ⬜ pending |
| 03-01-02 | 01 | 1 | SHARE-02, SHARE-03 | T-03-14 | `parseShareRef` allowlists exactly three values; builders never read the browser location | unit | `npx vitest run lib/share-links.test.ts` · purity grep gate · `npx tsc --noEmit && npx eslint …` | ❌ W0 (test created by this task) | ⬜ pending |
| 03-02-01 | 02 | 2 | SHARE-01 | T-03-07, T-03-08 | every rule trigger is a comparison that is false on NaN; every row carries a measured stat | unit | `npx vitest run lib/awards-engine.test.ts` · `npx tsc --noEmit && npx eslint …` | ✅ (03-01) | ⬜ pending |
| 03-02-02 | 02 | 2 | SHARE-01 | T-03-08 | no rule may fire on an empty fight (loop test over the whole pool) | unit + human | `npx vitest run lib/awards-engine.test.ts` · `npx vitest run` · pool-size grep gate · `<human-check>` tone review | ✅ (03-01) | ⬜ pending |
| 03-03-01 | 03 | 2 | SHARE-02 | T-03-10, T-03-11, T-03-12 | existing integer validation unchanged; parallel fetch degrades to null; outcome omitted when unknown | integration (route smoke) + regression | `npx tsc --noEmit && npx eslint … && npx vitest run` · receipts wiring grep gate · `next dev` + curl player OG URL | ✅ (healer-metrics.test.ts) | ⬜ pending |
| 03-03-02 | 03 | 2 | SHARE-02 | T-03-13 | permalink built from an explicit origin argument, never the live address bar | source assertion + gates | `npx tsc --noEmit && npx eslint … && npm run token-audit && npm run theme-parity` · share-wiring grep gate | ✅ (share-links.test.ts) | ⬜ pending |
| 03-04-01 | 04 | 2 | SHARE-01, SHARE-03 | T-03-16, T-03-18 | preview image is a same-origin `/og` URL built from an already-validated code; panel issues no fetch | source assertion + gates | `npx tsc --noEmit && npx eslint … && npm run token-audit && npm run theme-parity` · panel-wiring grep gate | ✅ (awards-engine.test.ts) | ⬜ pending |
| 03-04-02 | 04 | 2 | SHARE-02, SHARE-03 | T-03-13 | header Share copies a normalized URL; the weakest share slot is removed | source assertion + gates | `npx tsc --noEmit && npx eslint … && npm run token-audit && npm run theme-parity` · header-share grep gate | ✅ (share-links.test.ts) | ⬜ pending |
| 03-04-03 | 04 | 2 | SHARE-03 | T-03-14, T-03-15, T-03-17 | only the allowlisted `ref` value reaches the capture; the effect runs once per mount | source assertion + regression | `npx tsc --noEmit && npx eslint … && npx vitest run` · landing-wiring grep gate · ref-allowlist grep gate | ✅ (share-links.test.ts) | ⬜ pending |
| 03-05-01 | 05 | 3 | SHARE-03 | T-03-19 | the checklist may not name an attribute that does not exist in its owner file | doc-contract assertion | checklist-shape gate · checklist-truthful gate (row-by-row grep against owner files) | ❌ W0 (doc created by this task) | ⬜ pending |
| 03-05-02 | 05 | 3 | SHARE-03, OPS-01 | T-03-19, T-03-20, T-03-21 | a missing checklist or an unreachable base exits 2 — never a silent green | integration (node-script gate) | `npm run protected-elements -- --report` · fail-first proof (synthetic row ⇒ exit 1) · unreachable-base proof (⇒ exit 2) · `npx eslint scripts/protected-elements.mjs` | ❌ W0 (script created by this task) | ⬜ pending |
| 03-05-03 | 05 | 3 | OPS-01 | T-03-21 | the gate-doc edit is additive; no existing OPS-01 item may be weakened | doc-contract assertion | gate-doc string gate · gate-doc additive gate (`git diff` removed-line count) · roadmap-notes gate | ✅ (docs exist) | ⬜ pending |
| 03-06-01 | 06 | 4 | SHARE-01, SHARE-02, SHARE-03, OPS-01 | T-03-24 | Part 5 opens with no sign-off; instrumentation call sites counted pre-deploy | full local gate + source assertion | `npx tsc --noEmit && npm run lint && npm test && npm run theme-parity && npm run token-audit && npm run protected-elements` · Part-5 shape gate · instrumentation grep gate | ✅ | ⬜ pending |
| 03-06-02 | 06 | 4 | SHARE-01, SHARE-02, SHARE-03 | T-03-22, T-03-23, T-03-24 | preview only (never `--prod`); bypass secret never printed or committed | preview evidence + human | preview-record gate · Part-5-unsigned gate · no-secret-committed gate · `<human-check>` (pool tone, Discord unfurl, mobile reachability) | ✅ | ⬜ pending |
| 03-07-01 | 07 | 5 | OPS-01 | T-03-25 | the production deploy is gated on an explicit recorded human decision | checkpoint (blocking-human) | N/A — `checkpoint:decision`, no runnable command | ✅ | ⬜ pending |
| 03-07-02 | 07 | 5 | SHARE-01, SHARE-02, SHARE-03, OPS-01 | T-03-25, T-03-27, T-03-28 | production canonical re-asserted param-free; no secret recorded | production evidence + integration | `npm run protected-elements` (prod base) · prod OG + canonical contract gate · Part-5 production-record gate | ✅ | ⬜ pending |
| 03-07-03 | 07 | 5 | OPS-01 | T-03-26, T-03-28 | Part 5 ends signed-with-evidence or open-with-the-closing-test — never neither, never both | doc-contract assertion + full gate | sign-off shape gate · additive gate · `npx tsc --noEmit && npm test && npm run protected-elements` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity:** every task except the `checkpoint:decision` (03-07-01) carries at least one
runnable `<automated>` command, so there is never a run of 3 consecutive tasks without automated
feedback.

---

## Wave 0 Requirements

Every Wave 0 gap RESEARCH.md flagged is created by a task inside this phase's first wave (or, for
the SHARE-03 gate, by plan 03-05 before the phase can seal):

- [ ] `lib/awards-engine.test.ts` — stubs for SHARE-01 (synthetic `RaidOverviewResult` fixtures per trigger condition + the recorded demo fixture). **Created by task 03-01-01.**
- [ ] `lib/share-links.ts` + `lib/share-links.test.ts` — the permalink-normalization and `ref`-allowlist helper for SHARE-02 and the Pitfall-5 control. **Created by task 03-01-02.**
- [ ] `scripts/protected-elements.mjs` + `npm run protected-elements` — the SHARE-03 gate, with its fail-first proof. **Created by task 03-05-02.**
- [ ] `app/og/route.tsx` `view=awards` branch — **convention decided, not deferred:** no Satori-rendering test harness is introduced. The branch is covered by (a) a source-assertion grep proving the `view` allowlist and the `computeAwards` wiring exist, and (b) a live HTTP smoke against a `next dev` server asserting 200 + `image/png` for the awards URL AND for an unrecognised `view` (the never-fail-an-unfurl contract). Card *content* is verified manually at 03-06 (Discord) and 03-07 (production). This is recorded in `docs/PROTECTED-ELEMENTS.md` → `## How this is enforced`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Discord unfurl renders awards image | SHARE-01 | External service rendering | Paste OG URL (with cache-bust param) into a Discord channel; confirm image unfurls with awards visible |
| Share-rate HogQL query vs ~2.8% baseline | OPS-01 | PostHog query, not code | Run documented HogQL in PostHog; record in OPS-01 gate doc |
| GSC indexing/canonicals undisturbed | OPS-01 | External service | Run `scripts/seo-invariants.mjs` + GSC URL inspection per OPS-01 gate |
| Discord unfurl renders the player permalink card | SHARE-02 | External service rendering | Paste a player permalink (fresh cache-bust param each retry) into a Discord channel; confirm the parse and the receipts are legible (03-06 task 2) |
| Award pool tone clears the D-01 bar | SHARE-01 | Human judgement, not a mechanical check (D-04) | Read the fifteen-row pool table recorded in OPS-01 Part 5; confirm fun-to-be-on, nothing insulting, no worst-player headline (03-06 task 2) |
| Long-name award row clips with an ellipsis (RESEARCH A2) | SHARE-01 | Satori render, no visual-regression harness in this repo | Inspect the awards card for the log's longest raider names during the 03-06 Discord review |
| Contextual share buttons reachable on a phone (D-13) | SHARE-03 | No viewport harness — node-env Vitest only | On a phone-width viewport, confirm the awards Copy link and Share my parse buttons sit above the analysis tables (03-06 task 2) |
| `consent_gate_path` present on the new share events (RESEARCH A3) | OPS-01 | PostHog live traffic | Inspect captured `share_action` / `share_landing` events in project 337485 during the 03-07 item-7 window |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
