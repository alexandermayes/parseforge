# Phase 2: Accuracy & Analysis Depth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 2-Accuracy & Analysis Depth
**Areas discussed:** Cast timeline shape, Healer metrics definition, Game-data regen & eras, Engine test strategy

---

## Cast timeline shape

**Q1 — Where should the per-fight cast timeline live?**

| Option | Description | Selected |
|--------|-------------|----------|
| New tab in player analysis | 'Timeline' tab in AnalysisView; reuses Tabs + use-url-tab-state; lazy-loads; canonical stays param-free | ✓ |
| Inside the existing Casts tab | Below the CPM table; fewer tabs but loads the events query on every Casts view | |
| Own route /analyze/[code]/timeline | Most shareable; new indexable surface needing canonical/noindex rules | |

**Q2 — What form?**

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical cast log | timestamp · icon · name · target, gaps flagged; mobile-friendly; cheapest | ✓ |
| Horizontal track chart | WCL-style lanes; better pattern-spotting; harder on mobile/tokens | |
| Both (log + track strip) | Best UX, ~double UI work | |

**Q3 — What's included beyond casts?**

| Option | Description | Selected |
|--------|-------------|----------|
| Casts + own death + idle gaps | One extra events query; deaths already fetched | ✓ |
| Casts only | Smallest scope | |
| Casts + deaths + buff/cooldown windows | Second events fetch + per-spec buff classification (accuracy risk) | |

**Q4 — Long fights?**

| Option | Description | Selected |
|--------|-------------|----------|
| Full log + ability filter chips | Virtualised; nothing hidden by default | ✓ |
| Full log, no filtering | Simplest | |
| Paged/collapsed by minute | Compact but hides sequence | |

**User's choice:** All recommended options. **Notes:** none.

---

## Healer metrics definition

**Q1 — Which measures replace raw HPS? (multi-select)**

| Option | Description | Selected |
|--------|-------------|----------|
| Effective HPS + overheal % | Healing that landed vs wasted; overheal already computed in raid-overview | ✓ |
| Healing uptime / active time | activeTime from Healing table | ✓ |
| Spell mix vs top healers of same spec | analyzeCasts applied to healer spells | |
| Cooldown & mana usage | Needs per-spec cooldown map through wago workflow | |

**Q2 — Comparison population / percentile?**

| Option | Description | Selected |
|--------|-------------|----------|
| Top healers of same spec, ranked on effective HPS | Keep percentile, earned on effective HPS | ✓ |
| Same-spec comparison, no percentile | Drop the grade | |
| Compare within this raid's healers only | No external rankings | |

**Q3 — Healer suggestions?**

| Option | Description | Selected |
|--------|-------------|----------|
| Healer-specific rules on the new metrics | Thresholds relative to top-healer values | ✓ |
| Metrics only, no suggestions | Zero wrong-recommendation risk, stops short of "why" | |
| Keep shared rules, add a healer note | DPS-shaped advice remains | |

**Q4 — Raid overview HealerPanel?**

| Option | Description | Selected |
|--------|-------------|----------|
| Both surfaces, one engine helper | Shared helper prevents drift | ✓ |
| Per-player analysis only | Tighter phase; surfaces disagree | |

**User's choice:** All recommended options. **Notes:** none.

---

## Game-data regen & eras

**Q1 — Repeatable regeneration?**

| Option | Description | Selected |
|--------|-------------|----------|
| Committed script generates the data files | scripts/regen-game-data.mjs; diff = review artifact | ✓ |
| One-off re-run, document the steps | Manual joins again | |
| Script + CI/test gate on drift | Needs vendored CSVs | |

**Q2 — Eras in scope?**

| Option | Description | Selected |
|--------|-------------|----------|
| Anniversary/TBC Fresh + WotLK + Cata | The three builds pinned in cla-constants.test.ts | ✓ |
| Anniversary/TBC Fresh only | Where the bug was | |
| All four incl. MoP | Not consumed by any engine path | |

**Q3 — Non-derivable IDs?**

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit overrides file, stamped as unverified | Source-noted, listed in audit | ✓ |
| Drop friendly names, fall back to WCL buff name | "Well Fed" everywhere | |
| Keep them inline as today | PR #11 confusion repeats | |

**Q4 — Proof of diff review?**

| Option | Description | Selected |
|--------|-------------|----------|
| Generated audit doc + PR review | docs/GAME-DATA-AUDIT.md + dedicated PR | ✓ |
| PR review only | No in-repo build provenance | |
| Audit doc + regression test pins | Pins go stale on every re-run | |

**User's choice:** All recommended options. **Notes:** none.

---

## Engine test strategy

**Q1 — Fixture source?**

| Option | Description | Selected |
|--------|-------------|----------|
| Recorded real WCL responses from the public demo report | lib/__fixtures__/*.json | ✓ |
| Hand-built minimal fixtures | Encodes assumptions about WCL shape | |
| Both | Best coverage, more upfront work | |

**Q2 — Assertion style?**

| Option | Description | Selected |
|--------|-------------|----------|
| Behavioural assertions + one full-output snapshot per engine | Failures read as sentences; snapshot trips anything else | ✓ |
| Snapshot-only | Blind `-u` risk | |
| Behavioural assertions only | Unasserted changes slip | |

**Q3 — wcl-client isolation?**

| Option | Description | Selected |
|--------|-------------|----------|
| Stub global fetch with scripted responses | vi.stubGlobal; no refactor, no dependency | ✓ |
| Inject fetch/cache as parameters | Refactors the client every route depends on | |
| MSW request interception | New dev dependency | |

**Q4 — Gate and coverage reach?**

| Option | Description | Selected |
|--------|-------------|----------|
| npm test in CI + OPS-01 checklist, engines + new features | No %-threshold | ✓ |
| Engines only, no gate change | Red test doesn't block deploy | |
| Gate + coverage threshold | Invites padding | |

**User's choice:** All recommended options. **Notes:** none.

---

## Claude's Discretion

- Casts-events pagination strategy, page cap, cache key/TTL, rate-limit bucket name
- Separate `/api/timeline` route vs analyze extension
- Virtualisation approach for the log
- Idle-gap threshold; effective-HPS derivation aligned with WCL's HPS ranking basis
- Healer-suggestion multipliers and copy
- Generated-file layout and overrides file format
- PostHog event names/props (existing snake_case conventions)
- Fixture recording mechanism (creds to scratchpad, deleted after)

## Deferred Ideas

- Healer spell-mix and cooldown/mana-usage metrics
- Timeline buff/cooldown overlays; horizontal track-chart view
- Deep-linkable timeline route (only if Phase 3 wants it)
- CI drift test re-deriving maps from vendored CSV slices
- MoP era data
