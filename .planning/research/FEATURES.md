# Feature Research

**Domain:** WoW Classic/TBC raid-log analysis tools (parseforge.gg growth/design/monetization milestone)
**Researched:** 2026-09-04
**Confidence:** MEDIUM (cross-checked across multiple independent web sources per competitor; no single authoritative source, so treat exact pricing/feature claims as directionally correct, verify live before quoting publicly)

## Competitive Landscape Snapshot

| Product | Role in ecosystem | Free tier | Paid tier | Notable mechanic |
|---|---|---|---|---|
| **warcraftlogs.com** | Data source of record; ParseForge builds on top of it | Full report viewing, ads | $2–5+/mo (Silver/Gold/Platinum): ad-free, priority processing, 12mo+ archive, Report Components early access, Discord role | Ads are Google-network display ads; ad-free is the #1 sold perk |
| **wowanalyzer.com** | Per-spec rotation/cooldown static analysis | Full analysis, ads | Patreon $2/mo: ad-free, Discord perks, name color | Explicitly has **no death analysis, no positioning review** — stays in its lane |
| **wipefest.gg** | Boss-mechanics timeline analysis (avoidable dmg, dispels, soaks, interrupts, tank swaps) | Full timeline for single fights | Patreon $3/mo: Player Score Grid heatmap, multi-pull combined view, non-kill-attempt data, Guide tab | Heatmap ("Player Score Grid") is the flagship paid differentiator |
| **tbc-audit.com** | **Direct competitor** — same CLA-style buff/gear/consumable audit as ParseForge's `/tbc-audit` | Paste-a-log enchant/gem/spec audit, no account | Pro €3.99/mo: full history by phase, vertical cast log, trend charts, Top-100 overlay. **Guild €8.99/mo**: full-roster boss-by-boss scorecards, attendance w/ alts, improvement trends | Already monetizing the exact niche ParseForge occupies — see Pitfalls/Roadmap implications |
| **thisisfine.team** | Direct competitor — near-identical value prop to ParseForge's audit tab | Full audit, no login, API key stored locally | None found | Positions explicitly for "guild leader rapid prep check," privacy-first messaging |
| **ParseCard.app** | Viral/share layer, not full analysis | Paste-a-log → 6 auto-generated "awards" (praise + roasts) per fight, adjustable tone (Friendly/Bold/Brutal), downloadable Discord image | Battle.net login unlocks more weekly credits + cross-fight leaderboards | **This is the clearest "roast/grade" mechanic in the niche** |
| **Logs by HLTG** | Discord-native real-time raid tracking | Bot + dashboard, auto-posted rich embeds per pull, shareable "kill cards" (roster render) | Optional Patreon, core stays free | Zero-click distribution: bot posts to guild channel automatically, no one has to "share" |
| **raider.io** | Adjacent (M+/raid progress, not log analysis) | Full profile/score, addon | N/A (ads/sponsorships) | Virality is **addon-embedded** (447M+ downloads exposing scores to everyone in-game), not a manual share button |
| **sixtyupgrades/seventyupgrades** | Adjacent (gear planning, not log analysis) | Full planner | N/A | Cross-link candidate, not a competitor |

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete relative to tbc-audit.com/thisisfine.team, ParseForge's closest direct competitors.

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Paste-a-log → instant audit, no login required | Every competitor (tbc-audit, thisisfine, wowanalyzer) leads with zero-friction entry | LOW | ParseForge already has this — protect it, don't gate it behind auth |
| Gear/enchant/gem/consumable check vs spec | Baseline of the entire "audit" sub-category | LOW | ParseForge already has this (CLA engine) |
| DPS/HPS vs top-ranked-parse comparison | This is WCL's own core UX; any analyzer omitting it feels broken | LOW | ParseForge already has this |
| Shareable link to a specific analysis | Guild leaders paste results into Discord; a URL that reloads the same view is assumed | LOW | ParseForge already has this — the growth question is share *rate*, not existence |
| Mobile-readable results page | Raiders check results on phone between pulls | MEDIUM | Ties into the design-overhaul milestone item |
| Ad-supported free tier that stays usable | Users in this niche tolerate ads (WCL, WoWAnalyzer both do it) as long as core function isn't gated | LOW–MEDIUM | Validates the "ads as default plan" decision in PROJECT.md — just don't block the core paste-and-analyze flow with ads |
| Raid buff uptime checks (Fort, MotW, etc.) | Table stakes in every CLA-style tool (tbc-audit, thisisfine, ParseForge's own CLA) | LOW | Existing |
| Cast timeline / vertical cast log for a fight | tbc-audit Pro, Logs by HLTG both expose this; WoWAnalyzer's "Timeline" does too | MEDIUM | ParseForge lacks this — flagged as capability gap below |

### Differentiators (Competitive Advantage)

Features that set the product apart, chosen to align with Core Value ("accurate, actionable answers to why my parse is low") and the active milestone (viral loop, monetization, community).

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| Roast/award-style shareable result card (à la ParseCard) | This is the single clearest proven share-driver in the niche — playful, ego-driven, Discord-native. Directly targets the "raise share rate from 2.8%" milestone goal | MEDIUM | Needs: per-fight "award" generation logic (best interrupt, worst death, biggest DPS gap vs top parse), tone toggle, downloadable/OG image. Depends on existing OG-image infra (already shipped per PROJECT.md) |
| Death analysis / chain-of-events breakdown | **WoWAnalyzer explicitly lacks this** — it's a proven gap in the market leader, not just a "nice to have." Wipefest and Logs by HLTG cover it (avoidable damage, mechanic-tagged deaths) — ParseForge doesn't yet | HIGH | Requires per-boss-mechanic metadata (ability IDs, damage-type tagging) — likely needs its own phase; flagged in PITFALLS.md for deeper research |
| Guild-level, multi-report trend view | tbc-audit's Guild tier (€8.99/mo) proves people pay for this; it's the most defensible monetizable feature seen in this research because it requires accumulating a guild's report history over time (data moat) | HIGH | Depends on: Redis-backed report history already partially exists (`pf:recent_reports`); needs guild-identity linking (roster matching across reports), trend charting. Natural premium-tier candidate if ParseForge ever charges |
| Discord bot / webhook auto-post on new report | Logs by HLTG proves this is a strong retention/distribution loop — zero-click, guild sees results without anyone "sharing" | MEDIUM–HIGH | Requires a persistent bot process (new infra beyond current stateless Next.js app) or a lighter webhook-relay approach; ties into "stand up a Discord" community requirement in PROJECT.md |
| Boss-specific mechanic checks (soaks, dispels, interrupts, tank swaps) | Wipefest's core differentiator vs WoWAnalyzer; currently absent from ParseForge, which is DPS/HPS + gear/buff focused | HIGH | Needs per-encounter mechanic data (boss ability IDs, expected soak counts) — TBC-specific data entry per raid tier, non-trivial ongoing maintenance cost |
| Cross-promotion surface with LootList+ | Explicit PROJECT.md requirement; no competitor has an equivalent sister-site, so this is uniquely ParseForge's to win | LOW | Simple nav/footer links + shared-audience messaging (e.g., "plan your BiS list next" CTA on ParseForge results, "audit your raid" CTA on LootList+); low complexity, should ship early |
| Weekly/periodic raid recap (Spotify-Wrapped-style) | Not seen shipped by any competitor in this niche — genuine whitespace. Combines existing DPS/HPS + buff/gear data into a single "here's your week" share moment | MEDIUM | Depends on: report-history accumulation (same Redis dependency as guild trend view); good SEO-content byproduct too |
| Healer-specific metrics (dispel timing, healing cooldown alignment, overhealing context) | Wipefest and WoWAnalyzer both do healer-aware analysis; ParseForge's DPS-centric framing under-serves healers, ~30% of any raid roster | MEDIUM–HIGH | Table-stakes-adjacent for healers specifically, differentiator relative to ParseForge's current DPS-first design; healers are an underserved, vocal sub-audience worth winning |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Full parity with WarcraftLogs' raw data explorer (every event table, every filter) | "Power users want everything WCL has" | WCL already does this better than anyone could rebuild; duplicating it wastes effort competing with the data source ParseForge depends on | Stay in the "answers, not raw data" lane — link out to WCL for raw exploration, keep ParseForge focused on interpreted/actionable output |
| Real-time/live pull tracking (bot posts mid-fight) | Logs by HLTG does this and it looks impressive | Requires a persistent bot process + WCL live-log polling infra that doesn't exist today; large infra lift for a feature that's not core to "why is my parse low" | Post-log analysis + async Discord auto-post on new report is enough; defer live tracking indefinitely |
| Hard paywall on core analysis | "Guild/Pro tiers work for tbc-audit, why not us" | PROJECT.md's Core Value is accuracy/trust; gating the core "why is my parse low" answer behind a paywall contradicts the free-tool positioning that drives the SEO/organic strategy (this milestone's #1 channel) | Monetize via ads (already the stated plan) and reserve any future paid tier for *aggregation/history* features (guild trends, recap automation) that require ongoing infra cost — never for the core single-report audit |
| Letter-grade / single-number "overall score" for a whole raid | Feels like an easy virality hook | Risks being perceived as inaccurate or unfair when the underlying per-mechanic data is nuanced (a single score can't fairly represent tank vs healer vs DPS roles) — directly conflicts with the stated Core Value that "a wrong recommendation is worse than no recommendation" | Use the ParseCard-style *per-category* awards (best interrupt, most improved, biggest gap vs top parse) instead of one blended score — narrower claims are easier to keep accurate |
| Building a full Discord bot platform in this milestone | Community requirement + Logs by HLTG precedent make it tempting to scope big | Persistent bot hosting is new infra class (not stateless Vercel functions), meaningfully larger scope than "stand up a feedback channel" | Ship the community Discord server first (feedback channel, low effort); treat bot/webhook auto-posting as a later, separately-scoped differentiator once the server exists and has demand signal |

## Feature Dependencies

```
Guild-level multi-report trend view
    └──requires──> Persistent report-history storage per guild/roster
                       └──requires──> Existing pf:recent_reports Redis pipeline (extend, don't replace)
                       └──requires──> Roster/character identity matching across reports

Weekly raid recap (share moment)
    └──requires──> Persistent report-history storage per guild/roster   (same dependency as above)

Discord bot auto-post on new report
    └──requires──> Community Discord server (PROJECT.md active requirement)
    └──requires──> Persistent bot process OR WCL guild-webhook-relay (new infra)

Roast/award shareable card
    └──enhances──> Existing OG-image / share-buttons infra (already shipped)
    └──requires──> Per-fight "award" derivation logic (new, but built on existing analysis-engine outputs)

Death analysis / chain-of-events
    └──requires──> Per-boss mechanic metadata (ability IDs, damage tagging) — same data dependency as:
Boss-specific mechanic checks (soaks/dispels/interrupts)
    └──requires──> Per-boss mechanic metadata (ability IDs, expected mechanic counts per encounter)

Healer-specific metrics
    └──enhances──> Existing HPS analysis (extend analysis-engine, not a rebuild)

Cross-promotion with LootList+
    └──conflicts with──> nothing; lowest-complexity item, no blocking dependency
```

### Dependency Notes

- **Guild trend view and weekly recap share one dependency** (persistent per-guild/roster report history) — if the roadmap builds one, the other becomes meaningfully cheaper. Sequence them adjacently.
- **Death analysis and boss-specific mechanic checks share the same underlying data need** (per-encounter mechanic/ability metadata for TBC raids). This is the single highest-complexity, highest-ongoing-maintenance capability gap identified — it should get its own research pass before being roadmapped (see PITFALLS.md).
- **Discord bot auto-posting depends on the community Discord existing first** — don't build the bot before the server has members to post into.
- **Roast/award cards build on infra ParseForge already has** (OG images, share buttons) — this is the cheapest high-leverage item for the "raise share rate" goal and should be prioritized early in the milestone.
- **Cross-promotion with LootList+ has no dependencies** — purely additive, ships independently of everything else.

## MVP Definition

Framed for *this milestone* (not a from-scratch product), i.e., what to ship first among the differentiators above.

### Launch With (this milestone's first wave)

- [ ] Roast/award-style shareable result card — cheapest, highest-confidence lever on the stated "raise share rate from 2.8%" goal; builds on existing OG-image infra
- [ ] LootList+ ↔ ParseForge cross-promotion links — zero dependencies, explicit PROJECT.md requirement, low complexity
- [ ] Community Discord server (feedback channel) — explicit PROJECT.md requirement, unblocks future bot work
- [ ] Ads shipped as default monetization, scoped to never block the core paste-and-analyze flow — matches table-stakes precedent (WCL, WoWAnalyzer both do this successfully)

### Add After Validation (next wave, once share/ads land)

- [ ] Cast timeline / vertical cast log per fight — closes a table-stakes gap vs tbc-audit/thisisfine/WoWAnalyzer; trigger: once accuracy work stabilizes existing engines
- [ ] Healer-specific metrics extension — trigger: once core DPS accuracy improvements (stated top priority) ship, extend the same analysis-engine pattern to HPS
- [ ] Discord bot/webhook auto-post — trigger: once the community Discord has active membership and reports demand for it

### Future Consideration (v2+, needs its own research/design pass)

- [ ] Death analysis / chain-of-events breakdown — defer: needs dedicated per-boss mechanic metadata research (see PITFALLS.md flag); high accuracy risk if rushed, which conflicts with Core Value
- [ ] Boss-specific mechanic checks (soaks/dispels/interrupts) — defer: same metadata dependency as death analysis; bundle into one future phase
- [ ] Guild-level multi-report trend view — defer: highest complexity, but flagged as the most defensible *future* monetization surface (tbc-audit already proves willingness to pay €8.99/mo for this exact feature) — worth scoping seriously in a later milestone once ads are live and stable

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| Roast/award shareable card | HIGH | MEDIUM | P1 |
| LootList+ cross-promotion | MEDIUM | LOW | P1 |
| Community Discord server | MEDIUM | LOW | P1 |
| Ads (default monetization) | MEDIUM (revenue) | LOW | P1 |
| Cast timeline / vertical cast log | MEDIUM | MEDIUM | P2 |
| Healer-specific metrics | MEDIUM | MEDIUM–HIGH | P2 |
| Discord bot auto-post | MEDIUM | MEDIUM–HIGH | P2 |
| Death analysis / chain-of-events | HIGH | HIGH | P3 |
| Boss-specific mechanic checks | HIGH | HIGH | P3 |
| Guild-level multi-report trend view | HIGH (monetization potential) | HIGH | P3 |

**Priority key:**
- P1: Ship this milestone
- P2: Should have, next wave within or just after this milestone
- P3: Future milestone, needs its own scoping/research

## Competitor Feature Analysis

| Feature | tbc-audit.com | WoWAnalyzer | Wipefest | ParseForge (current) | ParseForge (recommended) |
|---|---|---|---|---|---|
| Free paste-a-log audit | Yes | Yes | Yes | Yes | Keep as-is, protect from ad-blocking flow |
| Gear/enchant/consumable check | Yes (core) | No (rotation-focused) | Partial | Yes (CLA engine) | Keep, already strong |
| Death/mechanic analysis | No | No | Yes | No | Defer to P3, needs metadata research |
| Cast timeline | Yes (Pro) | Yes (free) | Yes (free) | No | Add in P2 |
| Multi-report/guild trends | Yes (Guild tier, paid) | No | Yes (Patreon, multi-pull) | No | Defer to P3 as future monetization surface |
| Shareable award/roast card | No | No | No | Partial (share buttons only, no award mechanic) | Add in P1 (ParseCard is the model) |
| Discord bot distribution | No | Yes (link-reply bot) | Yes (link-reply bot + summaries) | No (manual share only) | Add in P2, after Discord server exists |
| Ads on free tier | No (subscription-only) | Yes | Unclear | Not yet (planned) | Ship in P1 per PROJECT.md decision |

## Sources

- [WoWAnalyzer official site](https://wowanalyzer.com/) — MEDIUM confidence (cross-checked across 2+ independent search results)
- [WowCoach.gg: WarcraftLogs vs WoWAnalyzer vs WowCoach](https://wowcoach.gg/blog/warcraftlogs-vs-wowanalyzer-vs-wowcoach) — LOW confidence (single-source claim re: no death analysis, not independently re-verified against WoWAnalyzer docs)
- [Wipefest official site](https://www.wipefest.gg/) — LOW confidence
- [Archon.gg: How to Improve Your Raid With Wipefest](https://archon.gg/classic-wrath/articles/help/how-to-improve-your-raid-with-wipefest) — LOW confidence
- [Wipefest Patreon](https://www.patreon.com/wipefest) — LOW confidence
- [Warcraft Logs Subscribe page](https://www.warcraftlogs.com/subscribe) — LOW confidence (pricing not independently re-verified live)
- [tbc-audit.com/pro](https://www.tbc-audit.com/pro) and [tbc-audit.com/guild](https://www.tbc-audit.com/guild) — LOW confidence (JS-rendered SPA, content inferred from search snippets, not directly fetched — recommend live verification before quoting pricing in any external-facing doc)
- [thisisfine.team/about](https://thisisfine.team/about) — MEDIUM confidence (fetched directly)
- [ParseCard.app](https://www.parsecard.app/) — MEDIUM confidence (fetched directly)
- [Logs by HLTG](https://logsbyhltg.com/) — MEDIUM confidence (fetched directly)
- [WoWAnalyzer Patreon](https://www.patreon.com/wowanalyzer/about) — LOW confidence
- [Raider.IO](https://raider.io/) and [CurseForge Raider.IO addon page](https://www.curseforge.com/wow/addons/raiderio) — LOW confidence
- [Sixty Upgrades](https://sixtyupgrades.com/tbc) — LOW confidence
- ParseForge's own `.planning/PROJECT.md` — HIGH confidence (first-party project source)

**Confidence caveat:** All competitor claims above come from web search snippets and two direct fetches, not authenticated/paywalled inspection of competitor products. Exact pricing (tbc-audit €3.99/€8.99, Wipefest $3, WoWAnalyzer $2, WCL $2-5+) should be treated as **directionally correct but not launch-quotable** without a live re-check immediately before any roadmap or pricing decision that depends on it.

---
*Feature research for: WoW Classic/TBC raid-log analyzer growth milestone*
*Researched: 2026-09-04*
