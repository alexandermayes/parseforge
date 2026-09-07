# Phase 2: Accuracy & Analysis Depth - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Raiders get verifiably correct analysis plus the per-fight depth competitors already offer. This phase delivers: (1) a per-fight **cast timeline** for a selected player inside the existing analyze UI (ACC-03); (2) **healer analysis** judged on healer-relevant metrics — effective HPS, overheal %, healing uptime — compared to top-ranked healers of the same spec, with healer-specific suggestions (ACC-04); (3) a **repeatable wago.tools regeneration** so every enchant/gem/consumable ID traces to a generated data file, re-run this phase with the diff reviewed and an audit doc as proof (ACC-01); (4) **automated tests** for `cla-engine`, `raid-overview-engine`, and `wcl-client` that fail when analysis output changes, plus tests for the new timeline/healer code (ACC-02); (5) PostHog events for the new surfaces and the GSC verification pass (OPS-01).

Out of scope: death analysis / chain-of-events (ADV-01), boss-mechanic checks (ADV-02), multi-report trends (ADV-03), spell-mix and cooldown/mana-usage healer metrics (explicitly not selected — see D-05), buff/cooldown overlays on the timeline (D-03), any redesign of the analyze page (Phase 7), share/OG surfaces (Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Cast timeline (ACC-03)
- **D-01:** The timeline is a new **"Timeline" tab in the player analysis view** (`AnalysisView`), alongside DPS/HPS · Casts · Gear. It loads lazily on tab open (no WCL events fetch unless someone opens it) and the canonical URL stays param-free — no new route, no new indexable surface. — **Reversibility:** reversible — a tab can later be promoted to a route without changing the data path.
- **D-02:** Form is a **vertical cast log**: chronological rows of `timestamp (relative to fight start) · ability icon · ability name · target`. Not a horizontal track chart. Mobile-first readable.
- **D-03:** Log content this phase = **the player's casts + a marker where the player died + highlighted idle gaps** (gap between consecutive casts longer than ~1 GCD, threshold relative not hard-coded per class). No buff/cooldown windows overlay this phase (would need a per-spec "which buffs matter" map — accuracy risk).
- **D-04:** Long fights: **render the full log, virtualised, with per-ability filter chips** to hide filler. Nothing hidden by default; junk spell IDs already excluded via `JUNK_SPELL_IDS` stay excluded. No pagination-by-minute collapse.

### Healer metrics (ACC-04)
- **D-05:** Healers are judged on **effective HPS (healing that landed), overheal %, and healing uptime / active time**. Spell mix vs top healers and cooldown/mana usage were considered and **not selected** for this phase.
- **D-06:** Comparison population stays **top-ranked healers of the same spec** (existing rankings path, partition-scoped per the PR #12 fix). The **percentile stays** but the headline number and ranking basis is **effective HPS**, with the healer's overheal % and uptime shown next to the top players' values. — **Reversibility:** costly — the percentile is the number healers screenshot/share; Phase 3's per-player OG image will bake this definition in.
- **D-07:** Suggestions for healers are **healer-specific rules driven by the new metrics**, with thresholds **relative to top-healer values** (no fixed magic constants): overheal well above top healers → sniping/pre-casting on full targets; uptime well below → idle/late reactions; effective-HPS gap with normal overheal → gear/consumables path. The DPS-shaped rules ("keep your GCD rolling", CPM comparisons) are **not shown to healers**.
- **D-08:** The raid overview's **Healer Breakdown panel picks up the same metrics** (effective HPS + uptime added). One **shared engine helper** computes healer metrics for both `raid-overview-engine` and the `/api/analyze` healer path so the raid table and the player page never disagree.

### Game-data regeneration (ACC-01)
- **D-09:** A **committed script** (`scripts/regen-game-data.mjs`, same family as `token-audit.mjs` / `theme-parity.mjs`) fetches era-pinned CSVs from wago.tools and **generates** the ENCHANT_NAME_DB / GEM_NAME_DB / GEM_STAT_DB / CONSUMABLE_DB data with a header stamping build + generation date. Re-running it produces a git diff; that diff is the review artifact. — **Reversibility:** costly — once engines import generated files, hand-editing them is the anti-pattern this phase exists to end.
- **D-10:** Eras in scope: **Classic Anniversary / TBC Fresh (product `wow_anniversary`), WotLK, and Cata (product `wow_classic`)** — the three builds currently pinned in `lib/cla-constants.test.ts` (2.5.6.69546 / 3.4.5.63697 / 4.4.2.60895), each refreshed to the current wago.tools build for its product. MoP is out. Eras remain separate sections — later clients rewrite older items, never merge into a superset.
- **D-11:** IDs that cannot be derived from client dumps (WotLK/Cata food buff friendly names — all "Well Fed" in game data; TBC food buff IDs 33254–33268 community-standard; engineering tinkers) live in **one explicit overrides file** the script merges in. Every override carries a source note and the generated output **marks them unverified** so the audit can list exactly which IDs are not wago-verified. No hand-typed rows inside generated files.
- **D-12:** Proof of "diff reviewed": the script also emits **`docs/GAME-DATA-AUDIT.md`** (build per era, row counts per map, list of unverified overrides, IDs whose name/stat changed since the last run). The regen lands in **its own PR** the owner reviews; the doc is the standing artifact, same pattern as `docs/TOKEN-AUDIT.md`.

### Engine tests (ACC-02)
- **D-13:** Fixtures are **recorded real WCL GraphQL responses** for 1–2 fights of the **public demo report** (the exact shapes the engines consume: combatant info, buff tables, damage/healing tables, deaths, casts events), stored as JSON under `lib/__fixtures__/`. Public report → no privacy concern. The same fixtures feed timeline and healer tests.
- **D-14:** Assertion style: **behavioural named assertions** on the things that matter (this player flagged for missing enchant X, overheal % = Y, deaths = Z) **plus one full-output `toMatchSnapshot` per engine per fixture** so any unintended change trips. Snapshots update only deliberately (`vitest -u`) with the diff reviewed.
- **D-15:** `wcl-client` tests **stub global `fetch`** (`vi.stubGlobal('fetch', vi.fn())`) with scripted response sequences — 401 → token refresh → 200; 429 → `rate_limited`; timeout via fake timers → `timeout`; error classification for not_found / private / upstream — and stub the kv-cache token cache so no Redis env is required. **No refactor of wcl-client's signature, no new dependency (no MSW).**
- **D-16:** `npm test` stays in CI (`.github/workflows/ci.yml`) and is **added to the OPS-01 ship-gate checklist** so a red suite blocks a prod deploy. Coverage reach = the three named engines + the new timeline builder + the shared healer helper; **new code ships with tests; no coverage-% threshold**.

### Claude's Discretion
- Exact WCL `events(dataType: Casts)` pagination strategy (`nextPageTimestamp` loop), the page cap for very long fights, the cache key/TTL, and the new rate-limit bucket name for the timeline endpoint (add it to `RATE_LIMITS` explicitly — never rely on the 30/60s default).
- Whether the timeline is served by a new `/api/timeline` route or an extension of `/api/analyze` (prefer a separate lazily-called route so the analyze payload doesn't grow).
- Virtualisation approach for the log (a small hand-rolled windowed list is fine; avoid a heavy dependency).
- The precise idle-gap threshold and how "effective HPS" is derived from WCL's Healing table (`total` vs `overheal` fields) — align with how WCL itself ranks HPS so the percentile is consistent with WCL's number.
- Healer-suggestion threshold multipliers (relative to top-healer medians) and copy.
- Generated-file layout (e.g. `lib/generated/game-data.<era>.ts` imported by `cla-constants.ts`, vs regenerating sections in place) and the overrides file format.
- PostHog event names/props for the timeline and healer surfaces — follow the existing snake_case `posthog.capture` conventions; include `report_code`, `fight_id`, role/spec where the existing events do.
- Fixture recording mechanism (one-off script hitting WCL with prod creds pulled to the scratchpad and deleted after, per the CLAUDE.md secrets rule).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & sequencing
- `.planning/ROADMAP.md` — Phase 2 entry: goal, 5 success criteria, note that these tests are what make Phase 7's redesign safe
- `.planning/REQUIREMENTS.md` — ACC-01 (wago regen), ACC-02 (engine tests), ACC-03 (cast timeline), ACC-04 (healer metrics), OPS-01 (standing gate); v2 ADV-01..03 are explicitly out
- `.planning/PROJECT.md` — Core Value ("a wrong recommendation is worse than no recommendation"), Accuracy constraint (no hand-typed ID maps), Measurement constraint, manual confirmed deploys

### Prior-phase decisions that bind this phase
- `.planning/phases/01-foundation-themes-consent/01-CONTEXT.md` — D-11/D-12: all UI colour via `@theme` tokens and `classColor()`/`roleColor()` helpers; token-audit + theme-parity gates must stay green for any new UI (timeline tab, healer panel changes)
- `docs/OPS-01-SHIP-GATE.md` — the repeatable ship gate; D-16 adds `npm test` to it; pending re-check of `theme_changed` / `consent_resolved` PostHog event definitions happens at this phase's gate
- `docs/TOKEN-AUDIT.md` — the pattern `docs/GAME-DATA-AUDIT.md` (D-12) mirrors

### Known concerns this phase closes
- `.planning/codebase/CONCERNS.md` §"Test Coverage Gaps" (the ACC-02 debt, with the priority order from PRODUCTION_HARDENING), §"Food Buff Names: Display-Only Risk" (the overrides D-11 formalises), §"Loose Type Casting in Data Access" (recorded fixtures exercise these casts), §"Rate Limit: Unknown Buckets Default" (new timeline bucket must be explicit)
- `.planning/codebase/TESTING.md` — vitest config, colocated `*.test.ts`, "mock async I/O with `vi`" guidance D-15 follows

### Game-data verification workflow
- `lib/cla-constants.test.ts` — header comment pins the three era builds; the existing ID→name regression pairs must keep passing after regeneration
- Verification workflow notes (wago.tools table joins, era builds, gotchas) are recorded in the project memory `game-data-id-verification.md` and summarised here: CSV endpoint `https://wago.tools/db2/<Table>/csv?build=<build>`; tables SpellItemEnchantment, SpellName, ItemSparse, SpellEffect, GemProperties; enchant name via SpellEffect Effect=53/54 → EffectMiscValue_0 → SpellName (strip `Enchant <slot> - `); gem stat via ItemSparse.Gem_properties → GemProperties.Enchant_ID → SpellItemEnchantment; `https://wago.tools/api/builds` lists current builds per product. The planner should have the regen script encode these joins, not re-derive them.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/wcl-queries.ts` — casts today come only from aggregated `table(dataType: Casts)`; `events(dataType: Deaths)` and `events(dataType: CombatantInfo)` already show the paginated events pattern to copy for `events(dataType: Casts)`. `RAID_DEATH_EVENTS_QUERY` supplies the death marker for D-03.
- `lib/raid-overview-engine.ts` (~L300–390) — already computes per-healer `hps`, `overhealPercent`, `activityPercent` from the Healing table (`total`, `overheal`, `activeTime`); this is the seed of the shared healer helper (D-08). `HealerMetrics` type in `lib/wcl-types.ts` L435.
- `app/api/analyze/route.ts` — healer path detected via `isHealerSpec(spec)` (L101), swaps to `PLAYER_FULL_DATA_QUERY_HEALING` / `TOP_PLAYER_DATA_QUERY_HEALING`, ranks with `metric: "hps"` (L227). D-06/D-07 change what is computed on this path, not the fetch shape.
- `lib/analysis-engine.ts` — `analyzeCasts` / `analyzeCastsAgainstAverage` (CPM comparison) and the suggestion builder (~L527–600) that emits the DPS-shaped "casts" suggestion healers must stop seeing (D-07). `JUNK_SPELL_IDS` filtering reused by the timeline (D-04).
- `app/components/AnalysisView.tsx` (125 lines) — shadcn `Tabs` with `use-url-tab-state`; the Timeline tab (D-01) is one more `TabsTrigger`/`TabsContent`. `app/components/RaidOverview.tsx` `HealerPanel` (L237) gets the extra columns (D-08).
- `lib/demo-report.ts` — the public demo report used for fixtures (D-13).
- `scripts/token-audit.mjs`, `scripts/theme-parity.mjs`, `scripts/seo-invariants.mjs` — the node-script + generated-doc pattern the regen script follows (D-09, D-12).
- `lib/cla-constants.test.ts`, `lib/constants.test.ts` — existing ID regression tests that must keep passing after regeneration.

### Established Patterns
- Engines are pure functions over raw WCL response shapes → fixtures recorded from real responses drop straight in (D-13); results are serialisable JSON → snapshot-friendly (D-14).
- API routes use `cachedApiHandler` (single-flight + shared Redis cache) and per-route `RATE_LIMITS` in `lib/constants.ts`; a timeline route must register its own bucket.
- Errors as data (`WCLError` kinds not_found / private / rate_limited / timeout / upstream) — the classification D-15 asserts on.
- Vitest, node env, colocated `*.test.ts`, no mocks or fixtures yet; `vi.stubGlobal` is the first mocking introduced.
- PostHog: `posthog.capture("snake_case_event", { report_code, ... })` from client components.
- Theme/tokens: every colour from `@theme` tokens; `npm run token-audit` and `npm run theme-parity` are standing gates.

### Integration Points
- `lib/wcl-queries.ts` + `lib/wcl-fetchers.ts` — new casts-events query and fetcher.
- `app/api/` — new timeline route (or analyze extension) with cache key + rate-limit bucket.
- `app/components/AnalysisView.tsx` — Timeline tab; `app/components/RaidOverview.tsx` — HealerPanel columns.
- `lib/cla-constants.ts` — becomes a thin re-export of generated era files + overrides (D-09/D-11).
- `docs/OPS-01-SHIP-GATE.md` — add `npm test`; `.github/workflows/ci.yml` already runs vitest.
- GSC verification: no new indexable routes are introduced (D-01), so the pass is a no-regression check on `/analyze/*` canonicals and metadata.

</code_context>

<specifics>
## Specific Ideas

- Timeline row: `timestamp · icon · name · target`; idle gaps visibly flagged so "why was my parse low" is answerable from the log alone.
- Healer headline number must be the one WCL-consistent effective-HPS figure so the percentile doesn't contradict WCL's own ranking.
- Overrides must be impossible to confuse with generated rows — the PR #11 root cause was hand-typed data hiding next to real data.
- Snapshot failures should never be fixed by reflex `-u`; behavioural assertions exist so the failure reads as a sentence first.

</specifics>

<deferred>
## Deferred Ideas

- Healer **spell mix vs top healers** and **cooldown / mana usage** metrics (needs a per-spec cooldown map through the wago workflow) — candidate for a later accuracy phase or v2 ADV work.
- Timeline **buff/cooldown windows overlay** and a **horizontal track-chart** view — later iteration once the log ships.
- Deep-linkable timeline route — only if Phase 3 share work wants a per-fight timeline permalink.
- A drift-detecting CI test that re-derives maps from vendored CSV slices (considered for D-09, not chosen) — revisit if a regen ever diverges silently.
- MoP (5.5.4) era data — when an engine path consumes it.

</deferred>

---

*Phase: 2-Accuracy & Analysis Depth*
*Context gathered: 2026-09-07*
