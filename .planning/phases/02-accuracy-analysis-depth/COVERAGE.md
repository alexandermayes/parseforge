# API Coverage — Warcraft Logs GraphQL v2 (client API) and wago.tools

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

Produced at plan time for Phase 2, which extends ParseForge's existing WCL integration with a new
`events(dataType: Casts)` field and a new un-scoped `table(dataType: Healing)` field, and adds a second
external integration (wago.tools CSV export) behind a build-time script.

Capability ids are namespaced (`report.*`, `table.*`, `events.*`, `world.*`, `wago.*`) because WCL reuses
the same data-type name across its `table` and `events` fields and those are two independent decisions.

**Enumeration provenance — read this before treating the matrix as exhaustive.** WCL's v2 documentation
pages returned HTTP 403 to automated fetches during this phase's research (`02-RESEARCH.md`, Sources ->
Secondary), so the list below is grounded in two things: every field and data type this codebase
demonstrably calls (read from `lib/wcl-queries.ts`, `lib/wcl-fetchers.ts` and `app/api/*/route.ts`), plus
the documented `EventDataType` / `TableDataType` enum members and query roots. It is **not** a live schema
introspection. A capability absent from this table is therefore un-decided rather than opted out, and the
correct fix is an introspection pass, not an assumption. Flagged for the developer.

**The one real hole, stated plainly.** `world.rateLimitData` is opted out, and it is the opt-out worth
revisiting soonest. Nothing in the product currently observes its own WCL quota consumption, and this
phase adds a *paginating* endpoint — so quota headroom becomes a live operational question for the first
time. Present mitigations are all indirect: the timeline route's `MAX_TIMELINE_PAGES` cap, the explicit
`RATE_LIMITS.timeline` bucket, and the existing `wcl_retry` observability event. A follow-up phase should
read the quota directly rather than inferring pressure from retries.

## WCL GraphQL v2 — `reportData.report` fields

| capability | decision | reason |
|---|---|---|
| report.title | INTEGRATE | |
| report.owner | INTEGRATE | |
| report.startTime | INTEGRATE | |
| report.endTime | INTEGRATE | |
| report.zone | INTEGRATE | |
| report.fights | INTEGRATE | |
| report.masterData.actors | INTEGRATE | |
| report.playerDetails | INTEGRATE | |
| report.rankings | INTEGRATE | |
| report.visibility | OPT-OUT | not needed — public versus private is inferred from the WCLError kind, which lib/report-meta.ts already branches on |
| report.archiveStatus | OPT-OUT | not needed yet — an archived report already maps to an existing WCLError kind; a dedicated message is UX polish, not accuracy |
| report.phases | OPT-OUT | not needed yet — no multi-phase encounter exists in the Classic through Cata content this product covers |
| report.segments | OPT-OUT | not needed — the fights field already supplies every boundary the engines use |
| report.exportedCharacters | OPT-OUT | out of scope — character-level identity is not a ParseForge concept; analysis is per report and per fight |
| report.graph | OPT-OUT | out of scope — a time-series graph is the deferred horizontal track-chart view (02-CONTEXT.md Deferred Ideas) |

## WCL GraphQL v2 — `table(dataType:)` members

| capability | decision | reason |
|---|---|---|
| table.DamageDone | INTEGRATE | |
| table.Healing | INTEGRATE | |
| table.Buffs | INTEGRATE | |
| table.Casts | INTEGRATE | |
| table.DamageTaken | INTEGRATE | |
| table.Deaths | INTEGRATE | |
| table.Debuffs | OPT-OUT | not needed yet — debuff uptime is a rotation metric for a later accuracy phase; no requirement in REQUIREMENTS.md reads it |
| table.Interrupts | OPT-OUT | out of scope — interrupt checking is v2 requirement ADV-02, boss-specific mechanic checks |
| table.Dispels | OPT-OUT | out of scope — dispel checking is v2 requirement ADV-02 |
| table.Resources | OPT-OUT | not needed this phase — mana usage was considered for the healer metrics and explicitly not selected (D-05) |
| table.Summons | OPT-OUT | not needed — pet and totem output is folded into the owner's damage table for this product's purposes |
| table.Threat | OPT-OUT | not needed yet — tank-specific analysis has no requirement in this milestone |
| table.Survivability | OPT-OUT | not needed yet — death analysis is v2 requirement ADV-01, which needs per-boss mechanic metadata |

## WCL GraphQL v2 — `events(dataType:)` members

| capability | decision | reason |
|---|---|---|
| events.CombatantInfo | INTEGRATE | |
| events.Deaths | INTEGRATE | |
| events.Casts | INTEGRATE | |
| events.DamageDone | OPT-OUT | not needed yet — per-event damage would serve an ability replay; the aggregated table answers every current requirement |
| events.Healing | OPT-OUT | not needed yet — the healer metrics are aggregate by design (D-05) |
| events.Buffs | OPT-OUT | out of scope — buff and cooldown overlays on the timeline are deferred (D-03); they need a per-spec map that is an accuracy risk |
| events.Debuffs | OPT-OUT | not needed yet — same reasoning as table.Debuffs |
| events.Interrupts | OPT-OUT | out of scope — v2 requirement ADV-02 |
| events.Dispels | OPT-OUT | out of scope — v2 requirement ADV-02 |
| events.Resources | OPT-OUT | not needed this phase — mana usage explicitly not selected (D-05) |
| events.Summons | OPT-OUT | not needed for this product's per-player analysis |
| events.Threat | OPT-OUT | not needed yet — no tank-specific requirement in this milestone |
| events.All | OPT-OUT | not needed, and undesirable — an unfiltered stream multiplies the WCL cost the timeline's page cap exists to bound |

## WCL GraphQL v2 — other query roots

| capability | decision | reason |
|---|---|---|
| world.encounter.characterRankings | INTEGRATE | |
| auth.clientCredentialsToken | INTEGRATE | |
| world.zone | OPT-OUT | not needed — the zone and expansion ids the product needs already arrive on reportData.report.zone |
| world.expansion | OPT-OUT | not needed — same reason as world.zone |
| world.region | OPT-OUT | not needed — ParseForge does not segment analysis by region |
| world.server | OPT-OUT | not needed — ParseForge does not segment analysis by realm |
| world.subregion | OPT-OUT | not needed — ParseForge does not segment analysis by subregion |
| world.characterData | OPT-OUT | not needed yet — per-character history is multi-report trend analysis, v2 requirement ADV-03 |
| world.guildData | OPT-OUT | not needed yet — guild-level analysis is v2 requirement ADV-03 |
| world.progressRaceData | OPT-OUT | out of scope — a progress-race leaderboard is not this product |
| world.userData | OPT-OUT | out of scope — no user auth exists; the WCL integration is server-to-server client credentials only |
| world.rateLimitData | OPT-OUT | not needed yet, and the opt-out worth revisiting soonest — see the note above the tables |
| report.search | OPT-OUT | not needed — the entry point is a pasted URL, and the sitemap list comes from Redis, not from WCL |

## wago.tools (new integration this phase)

| capability | decision | reason |
|---|---|---|
| wago.buildsApi | INTEGRATE | |
| wago.db2CsvExport | INTEGRATE | |
| wago.authenticatedOrWriteEndpoints | OPT-OUT | out of scope — the integration is read-only against public endpoints and sends no credentials |
| wago.nonCsvExportFormats | OPT-OUT | not needed — CSV is machine-readable and is the format the PR #11 workflow already proved |
| wago.webUi | OPT-OUT | not needed — the pipeline is a script, and scraping a UI is what the CSV export exists to avoid |

## Second-integration baseline note

wago.tools is a second external integration introduced alongside the existing WCL one. Its rows were
decided from a full-coverage baseline of its own rather than carried over from WCL's decisions — the two
services share no capability surface, so there is no first-class versus fallback asymmetry to accumulate.
