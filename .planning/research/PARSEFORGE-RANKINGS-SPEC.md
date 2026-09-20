# ParseForge Rankings — "take over Warcraft Logs" product spec & feasibility research

**Researched:** 2026-09-18
**Mode:** Feasibility + ecosystem (what WCL is, what the API permits, what ParseForge can build)
**Status of this file:** untracked planning research, written incrementally. No files under `app/`, `lib/`, `scripts/`, `docs/` were modified; nothing installed, deployed or committed.
**Overall confidence:** MEDIUM — HIGH on what the codebase already fetches (read this session); MEDIUM on WCL's ranking mechanics (forum posts by WCL staff plus search snippets of the help pages; the canonical pages return HTTP 403 to automated readers); LOW-to-MEDIUM on the exact API Terms of Service wording (search-engine snippets of the official page; the page itself is 403 to us). Every claim below carries a provenance tag.

Provenance tags: `[VERIFIED]` = confirmed this session from the repo or a primary source; `[CITED]` = official/primary source read or quoted via search snippet this session (date given); `[ASSUMED]` = inference or domain knowledge — must be confirmed before it becomes a locked decision.

Companion documents: `.planning/research/WOW-FOREVER.md` (same day; the two specs share the "probe WCL `worldData` first" prep step and must not contradict each other), `.planning/research/FEATURES.md` (milestone research, 2026-09-04 — its competitor table and anti-feature list are reused, not repeated), `docs/PROTECTED-ELEMENTS.md`, `.planning/ROADMAP.md` (Phases 4–7 already planned).

---

## 0. Executive summary

The owner's brief is two different products wearing one sentence. "Everything Warcraft Logs has — stats, rankings, all-stars — but more" is a **rankings platform**; "simplify Warcraft Logs and make it actionable for normal people" is a **coaching layer**. Only the second is winnable, and it happens to be the one ParseForge already does. This document recommends building the rankings *surface* of the first product on top of WCL's API (leaderboards, character pages, guild pages, new ranking types), while explicitly *not* attempting the parts that would require ParseForge to become a log host (uploader, raw-log parser, event storage, "official" parses).

Three findings drive that recommendation:

1. **ParseForge already receives the parse.** The `report.rankings(fightIDs:)` blob that `/api/analyze` fetches on every request carries, for *every* player in the fight, WCL's own `rankPercent`, `rank`, `best`, `totalParses` and `bracketData`, plus fight-level `speed` and `execution` ranks `[VERIFIED: lib/__fixtures__/demo-player-dps.json, recorded 2026-09-07]`. The codebase discards all of it except `partition`. The cheapest, most accurate rankings product is to *stop discarding it* — the numbers would be WCL's own, not a re-derivation.
2. **Building a WCL clone from raw logs is not a feature, it is a second company.** WCL is a log host first: a desktop uploader, a parser for a text format Blizzard changes without notice, storage for 50–500 MB per raid night per guild, a processing queue, anti-cheat, and a decade of trust. Nobody in the Classic ecosystem has displaced it — every competitor (Wipefest, WoWAnalyzer, Archon, tbc-audit, ParseForge) reads WCL's API instead. The one independent host found, LegacyPlayers, exists only because private servers cannot use WCL.
3. **The API Terms of Service make "commercial" use — explicitly including advertising — subject to prior written approval, and let RPGLogs cap "the number of users you may serve".** `[CITED: search snippets of articles.warcraftlogs.com/help/rpg-logs-api-terms-of-service, retrieved 2026-09-18]`. Phase 4 (Ads Live) already puts ParseForge in that category regardless of rankings. The single most important action in this document is to **email RPGLogs for approval before Phase 4 ships**, and to ask about the rankings surface in the same email. A rankings product that redistributes WCL's leaderboards without that approval is the one thing here that could get the API key revoked and take down the live site.

Recommendation in one line: **do the "Rankings Lens" — a simplified, role-normalized, coaching-first view of WCL's own rankings inside ParseForge, fed by data the app already fetches or can fetch cheaply — and do not build an uploader.** New ranking ideas that WCL does not offer (prep score, consistency, improvement-over-time, guild readiness, per-boss coaching score) are all computable from the existing per-report engines plus a small Redis-backed history, and they are the moat, because WCL cannot copy "actionable" without changing what it is.

Sections 1–10 below expand this: WCL feature inventory, ToS/rate-limit analysis, data-sourcing decision tree, keep/simplify/drop/add mapping, information architecture and SEO, data architecture and cost envelope, GSD-sized phases, risks, open questions, and the verified-vs-inferred ledger.

## 1. What Warcraft Logs actually is (feature inventory)

WCL (operated by RPGLogs LLC; sister brand Archon.gg) is three products stacked: a **log host** (uploader, parser, storage, processing queue), a **report viewer** (every table/event/timeline for one upload), and a **rankings layer** (parses, percentiles, All Stars, leaderboards) computed across all uploads. Almost every third-party tool — including ParseForge — consumes the second and third through the v2 API and leaves the first alone.

| Surface | What it is | How it is computed / sourced | Provenance |
|---|---|---|---|
| **Uploader client** (desktop, Overwolf "Companion", in-game addon) | Reads `WoWCombatLog.txt`, uploads whole files or streams "live logging" (tail the file, push new events). Personal log space per user; guild spaces. | Text combat log written by the game client when `/combatlog` is on (`LoggingCombat(true)`); "advanced combat logging" adds positions/HP. A 3-hour 25-man night is 50–200 MB (older data) to 500 MB+ (current); the file appends forever until the user deletes it. | `[CITED: warcraft.wiki.gg Combat_Log; skaldlogs.com guide; wowcoach.gg 2026-02-13; WCL help/start via search 2026-09-18]` |
| **Report** (`/reports/<code>`) | Fights list; per-fight Damage Done / Healing / Damage Taken / Deaths / Buffs / Debuffs / Casts / Interrupts / Dispels / Resources / Threat tables; Events view with a query-expression filter; Replay (2D map); Problems; per-player Summary with gear/talents (CombatantInfo); Compare view; Report Components (scriptable JS dashboards, VS Code in the browser) and Script Pins. | Parsed from the uploaded events. Anything shown is derivable from `reportData.report { table events graph masterData playerDetails fights rankings }` in the v2 API. | `[VERIFIED: the repo already queries table/events/masterData/playerDetails/fights/rankings — lib/wcl-queries.ts]`, `[CITED: articles.warcraftlogs.com "What Are Report Components?" via search]` |
| **Parse / percentile** | For each player on each kill: `rankPercent` (percentile vs *all* parses of that spec on that boss in the partition), `bracketData`/bracket percent (percentile vs players of similar item level; brackets ≈ 3 ilvls wide), absolute `rank` and `totalParses`; "Today" vs "Historical" evaluation; colour tiers (grey <25, green, blue, purple ≥75, orange ≥95, pink 99 — thresholds `[ASSUMED]` for exact cutoffs). | Only *kills* rank; one parse per character per boss per partition is "locked in" (best). Historical rankings are processed in 24-hour windows (cutoff noon UTC per the help page snippet). | `[VERIFIED: fields in the recorded rankings blob]`, `[CITED: help/ranks via search; raid.flamewreath.com/aboutlogs.html read 2026-09-18]` |
| **Character page** | Per zone: per-boss Best %, Best amount (DPS/HPS), Median %, Kills logged, rank, All Star points; headline "Best Perf. Avg" and "Median Perf. Avg" (mean of per-boss best / median percentiles); spec filter; "by bracket" toggle; historical graph. | `characterData.character{ zoneRankings(zoneID, metric, partition, difficulty, size, byBracket, role, specName, timeframe) encounterRankings(...) }` — JSON payload with `bestPerformanceAverage`, `medianPerformanceAverage`, `allStars[]`, `rankings[]` (per encounter: `rankPercent`, `medianPercent`, `totalKills`, `fastestKill`, `bestSpec`, `bestAmount`, `allStars{points, possiblePoints, rank, regionRank, serverRank, rankPercent}`). | `[VERIFIED: RPGLogs' own SDK — github.com/RPGLogs/RPGLogsApiSdk `src/queries/getCharacterZoneRankings.graphql` and the recorded Jest snapshot, read 2026-09-18; exact keys listed in §3.3]` |
| **All Stars** (per spec, per zone, per partition; world/region/server) | Points across the zone; ranking of characters by total points. | Original (2014–16) formula per boss: `N × (yourDPS / rank1DPS)` with N usually 100. Kihra's 2016 revision proposal: each boss worth `1.2 × N`; `(P/100) × N` from rank percentile P plus up to `0.2 × N` bonus for P ≥ 95 via the ratio formula. WCL staff (2023): "All Star Points are computed once a day"; the overall zone score uses the **single best partition**, not a sum across partitions; the help page says formulas "vary both by game and by metric"; degenerate/broken bosses are removed from All Stars; updates ~07:00 UTC. Current live maximum "120 points" per boss per a search snippet, consistent with the 1.2N revision being what is live. | `[CITED: forums.combatlogforums.com/t/all-stars-revision-proposal/396 (Kihra, 2016-05-01/03) read 2026-09-18; /t/how-is-the-overall-raid-allstar-points-computed/14340 (Vel, 2023-07-19) read 2026-09-18; help/ranks via search]` — exact live formula `[ASSUMED — MEDIUM]` |
| **Zone / boss leaderboards** (`/zone/rankings/<zoneId>`) | Character rankings per boss × spec × metric × partition × region/server, with gear/talents per row; guild rankings by **Progress** (first kills / first full clear), **Speed** (first pull to last boss kill, with per-tier validity rules), **Execution** (deaths + damage taken), and "complete raid speed"; "at risk" (dark-gold) ranks flagged for exploits. | `worldData.encounter(id){ characterRankings(className, specName, metric, partition, bracket, serverRegion, serverSlug, page, includeCombatantInfo, filter) fightRankings(...) }` and `guildData.guild{ zoneRanking(zoneId){ progress speed completeRaidSpeed } }`. | `[VERIFIED: characterRankings args used in lib/wcl-queries.ts]`, `[CITED: search snippets of zone/rankings pages and warcrafttavern guide 2026-09-18; guild zoneRanking metrics per search]` — `fightRankings`/`guild.zoneRanking` shape `[ASSUMED]` |
| **Speed / Execution fight ranks** | Per fight (not per player): how fast the kill was and how clean (deaths, damage taken excluding tanks) vs other kills of that boss. | Present in the `report.rankings` blob as `speed{rank,best,totalParses,rankPercent}` and `execution{...}` with `deaths` and `damageTakenExcludingTanks`. | `[VERIFIED: demo-player-dps.json rankings blob]` |
| **Guild page** | Roster, attendance (per report: who was present), per-zone progress/speed/execution ranks, guild All Stars, recent reports, banner (paid). | `guildData.guild{ members attendance(zoneID, page) zoneRanking }`; `reportData.reports(guildID, zoneID)` lists a guild's public reports. | `[VERIFIED for members/attendance/reports: RPGLogs SDK getGuild.graphql + getGuildReports.graphql, read 2026-09-18]`; `zoneRanking` shape `[ASSUMED — CITED only via search snippet]` |
| **Statistics / Archon** | Popularity-based talent builds, gear (BiS and popular), stat priorities, tier lists "from the top 1% of the current meta"; per-spec, per-boss; the explicit goal is "making logs more approachable". | Aggregated by RPGLogs across *all* logs — third parties cannot reproduce this from the public API at the same scale (see §2 rate limits); ParseForge's `analyzeTalentConsensus` / `analyzeGearPopularity` do a top-N (N=3 today) version per request. | `[CITED: wowhead.com/news/archon-feature-launch… and wowcarry.com 2026 state article via search 2026-09-18]`, `[VERIFIED: TOP_PLAYERS_TO_FETCH = 3 in lib/constants.ts]` |
| **Subscriptions** | Silver $2/mo (ad-free, subscriber processing queue); Gold $5/mo (log archive >12 months, daily addon files, character banners, **more API points**); Platinum (guild banners, guild queue, guild archive, multiple-report analysis, **even more API points**); "Alchemical Society" (early access). | Free reports age out of the viewable archive after 12 months (archive access is the Gold perk). | `[CITED: archon.gg subscriber-benefits pages via search 2026-09-18]` |
| **Adjacent RPGLogs products** | Wipefest (boss-mechanic timelines, Player Score Grid heatmap; full Classic Cataclysm tier support), Archon (meta), Companion app, Discord bots. | All read WCL data. | `[CITED: archon.gg Wipefest articles via search; wipefest.gg]` |

**What WCL is *not*:** it does not tell a player what to change. Its own sister product Archon exists because the report UI is hard to read, and third-party guides (wowcoach.gg 2026-02-13: WCL "shows you data, not answers"; "steep" learning curve) and ParseForge's own `/guides/warcraft-logs-vs-parseforge` copy already position WCL as storage and ParseForge as interpretation `[VERIFIED: app/guides/warcraft-logs-vs-parseforge/page.tsx]`. The owner's brief is therefore aligned with ParseForge's existing thesis, not a pivot.

---

## 2. The API contract: Terms of Service, rate limits, attribution

### 2.1 What the Terms say (as far as they can be read)

The canonical page `articles.warcraftlogs.com/help/rpg-logs-api-terms-of-service` (and every `warcraftlogs.com` / `archon.gg` mirror) returns HTTP 403 to automated readers; `web.archive.org` is not reachable from this environment. The sentences below are search-engine snippets of the official page, cross-checked against a third party's summary (GitHub issue `Gabriel2048/wow-insights#18`, opened 2026-09-10, which itself flags "not verified against the canonical page"). **Confidence MEDIUM; a human must read the page in a browser before any decision rests on it.**

| Clause (quoted from snippets, 2026-09-18) | Consequence for ParseForge |
|---|---|
| "Use of the API is considered 'commercial' if you are earning money from it, including, but not limited to advertising, subscriptions, or you intend to learn from the data and repackage for sale." | **Phase 4 (Ads Live) makes ParseForge a commercial API user.** This is true today regardless of any rankings work. |
| "If your intended usage is commercial, you'll need approval from us by emailing [address on the page]." | Approval must be **requested before Phase 4 ships**, and the rankings surface should be described in the same request. Without it, ads + API = ToS breach. |
| "RPGLogs sets and enforces limits on your use of the APIs (e.g. limiting the number of API requests that you may make or the number of users you may serve), in our sole discretion. You agree to, and will not attempt to circumvent, such limitations documented with each API. If you would like to use any API beyond these limits, you must obtain RPGLogs' express consent (and RPGLogs may decline such request or condition acceptance on your agreement to additional terms and/or charges for that use)." | RPGLogs can cap *users served*, not just calls. Any rankings product that becomes popular is exposed to a unilateral cap or a bill. Multiple client keys to spread load would be "circumventing" — do not. |
| "You agree to display any attribution(s) required by RPGLogs as described in the documentation for the API." | Every page that shows WCL-derived numbers must carry the attribution the docs specify (exact text/logo rules live on the 403'd docs page — read in a browser). ParseForge already links back to WCL per report; leaderboard pages must too. |
| "…you will not perform any data-mining, scraping, crawling, or use any processes that sends automated queries to RPGLogs or any RPGLogs service, or website… other than through authorized use of the RPGLogs APIs." | Everything must come through the GraphQL API with the issued client key — no HTML scraping of `warcraftlogs.com` leaderboards (which 403 anyway). |
| Privacy policy required "describing what is collected and how it is shared, including for advertising" (third-party summary). | `/privacy` exists (Phase 1); it must mention WCL-sourced data and ad sharing before Phase 4. |
| "All use by you of RPGLogs' Brand Features … will inure to the benefit of RPGLogs." | Do not build the brand around "Warcraft Logs" in ParseForge's name, domain or logos; use the attribution form they require and nothing more. |

Nothing found in the snippets *prohibits* showing rankings, caching responses, or storing derived data; but "learn from the data and repackage for sale" combined with the advertising clause means a monetised rankings surface is squarely "commercial" and therefore approval-gated. No clause about cache TTLs or storage duration surfaced; the 12-month report archive limit is a *site* feature, not an API rule `[ASSUMED]`.

**Action (P0, before any rankings code):** the owner opens the ToS and API-documentation pages in a browser, saves them into `.planning/research/` as dated text, and sends the approval email covering (a) AdSense on the existing analyzer, (b) a rankings/character/guild surface built from `characterRankings`, `zoneRankings`, `guild.zoneRanking`, `report.rankings`, with caching in Redis, (c) the expected request volume. Record the reply in `.planning/`. Until the reply arrives, Phases R1+ below stay un-executed.

### 2.2 Rate limits and what they buy

| Fact | Value | Provenance |
|---|---|---|
| Client-credentials API budget | **3,600 points / hour** (free). A Patreon/premium key was reported at **36,000 points / hour**; Gold and Platinum tiers advertise "more" / "even more API points". | `[CITED: forums.combatlogforums.com/t/api-v2-requests-limit-per-second-minute-hour/14659 (user keol quoting the profile page, 2024-01-05) read 2026-09-18; archon.gg subscriber-benefits via search]` |
| Budget introspection | `rateLimitData { limitPerHour pointsSpentThisHour pointsResetIn }` | `[CITED: pkg.go.dev/github.com/math280h/go-wcl RateLimit type, read 2026-09-18]` |
| Point cost per query | Not published in a form we could read; community reports say costs scale with query complexity (events/tables on long fights cost more; simple metadata ~1 point) and that 429s can arrive before the hourly budget is exhausted (a user reported 429 after 300–400 rapid requests, 2023-10-27). One GitHub project noted `limitPerHour` "moved from 9000 to 18000 mid-session", so **read the limit at runtime, never hard-code it**. For the five R0-2 rankings query types, this is now a **measured** value — see the sub-table below — rather than an assumption; the "not published"/`[ASSUMED]` characterization stands only for query types R0-2 did not probe (e.g. the pre-existing player/raid-overview/timeline queries). | `[CITED: same forum thread; github.com/Erilla/SlashWho/issues/282 via search]` — costs `[ASSUMED — LOW]` for unmeasured query types; `[MEASURED]` for the five below |
| ParseForge's current spend profile | Per uncached `/api/analyze`: 1 player query (+1 healer re-query) + 1 rankings query + 1 actors query per top report + 1 top-player query × 3 ≈ 6–8 queries; `/api/cla` batches 12 players per buff query and caps at 15 fights; `/api/timeline` pages up to 20×. 5-minute in-process query cache, 10-minute Redis result cache, per-IP limits 10–60/min. | `[VERIFIED: app/api/analyze/route.ts, lib/constants.ts RATE_LIMITS / MAX_CLA_FIGHTS, lib/wcl-client.ts]` |

#### 2.2.1 Measured point cost per query type — R0-2, recorded 2026-09-20

Computed from consecutive `rateLimitData.pointsSpentThisHour` samples taken immediately
before and after each query type, in the same run, against the free-tier client-credentials
key (`limitPerHour` observed at **18,000** at record time — already above the 3,600
figure `[CITED]` above reports for the free tier, consistent with §2.2's note that the
limit moves; read it at runtime, never assume either number). Two independent runs on
2026-09-20 produced matching deltas for the first four query types (3.00, 3.01, 7.01, 2.00),
so these are treated as stable measurements, not one-off noise.

| Query type (fixture) | Measured Δ`pointsSpentThisHour` | `limitPerHour` at time of measurement | Recorded |
|---|---|---|---|
| `report.rankings(fightIDs:)` (`rankings-report.json`) | **3.00** | 18,000 | 2026-09-20 |
| `worldData.encounter(id:).characterRankings` + `.fightRankings`, page 1, partition-scoped (`rankings-encounter.json`) | **3.01** | 18,000 | 2026-09-20 |
| `characterData.character(...).zoneRankings` + `.encounterRankings` (`rankings-character.json`, `classic.` host) | **7.01** | 18,000 | 2026-09-20 |
| `worldData.zones` (all 44 zones, `rankings-zones.json`) | **2.00** | 18,000 | 2026-09-20 |
| `guildData.guild(...).members` + `.attendance` + `reportData.reports(guildID:)`, one combined query (`rankings-guild.json`) | **20.29** | 18,000 | 2026-09-20 |

No delta came back zero or negative for any of the five query types, so none is recorded as
`inconclusive`. The guild query's higher cost is consistent with it being the only one of the
five that fans out three paginated sub-resources (members, attendance, reports) in a single
request. These deltas are `[MEASURED]` provenance, superseding the `[ASSUMED — LOW]` marker
in the row above for these five query types only; the row's general "not published" framing
stands for every other WCL query type this codebase issues, which R0-2 did not measure.

**Implication.** 3,600 points/hour is enough to *decorate reports* and to *refresh a few hundred leaderboard slices a day*; it is nowhere near enough to *mirror* WCL's rankings. Back-of-envelope: TBC has ~45 raid encounters across zones × ~30 specs × 2 metrics × partitions ≈ 3,000+ (boss, spec, metric, partition) slices *per region*; refreshing each once a day at even 2 points is most of a day's budget, and paging beyond page 1 (100 rows) multiplies it. A rankings surface must therefore be **demand-driven and cached** (compute a slice when someone asks, serve it to everyone for hours), never a nightly crawl of everything. The existing single-flight lock + Redis result cache is exactly the right primitive `[VERIFIED: lib/api-utils.ts cachedApiHandler]`.

### 2.3 Attribution and brand posture

- Every rankings page: "Data from Warcraft Logs" with a link to the corresponding WCL page (boss leaderboard, character page, guild page), in the form the API docs require. This is also good product: it keeps ParseForge honest about *whose* parse it is showing.
- Keep the existing "ParseForge analyzes what Warcraft Logs stores" framing. Do not describe the rankings surface as "ParseForge rankings" — call it a **lens** on WCL rankings ("your WCL parses, explained") until and unless ParseForge computes anything WCL does not (the new metrics in §4 can be ParseForge-branded because they are ParseForge's own computation).

---

## 3. Feasibility and the data-sourcing decision

### 3.1 Verdict

| Question | Verdict | Confidence |
|---|---|---|
| Can ParseForge show rankings, All Stars, character and guild pages built on WCL's API? | **YES**, technically today: every field needed is in the public client API, and several are already in responses the app fetches and throws away. Legally **YES-with-approval**: commercial use needs RPGLogs' written OK, which Phase 4 needs anyway. | HIGH (technical) / MEDIUM (legal — ToS read only via snippets) |
| Can ParseForge compute its *own* parses/percentiles that differ from WCL's? | **NO at WCL's scale** (3,600 points/hour cannot page every boss × spec × partition), and it should not want to: a second percentile that disagrees with WCL's is a trust problem, not a feature. **YES for new metrics WCL does not compute** (prep, consistency, improvement, guild readiness, coaching score) because those come from per-report data ParseForge already processes. | HIGH |
| Can ParseForge become a log host (own uploader, parser, storage) and rank from raw logs? | **MAYBE, but do not.** Feasible in principle (the log is a public text format; open-source parsers exist), but it is a multi-year platform with heavy fixed cost, no data until guilds switch, and no path to displacing WCL in Classic where every tool and every guild already uploads there. | HIGH that it is a bad bet for this product |

### 3.2 Decision tree

```
Do we need data WCL does not expose through the API?
├── No  ──► Option A: WCL-API-derived (decorate + aggregate + cache)          ◄── RECOMMENDED
│           ├── Show WCL's own numbers (rankPercent, All Stars, speed/exec)   → "Rankings Lens"
│           └── Compute ParseForge-only metrics from per-report engine output → "ParseForge Scores"
└── Yes ──► Which data?
            ├── Deeper per-event analysis of a fight WCL already hosts
            │     └── Still Option A: events() + table() cover it (timeline already does this)
            ├── "Official" parses for logs never uploaded to WCL (private-server, opt-out guilds)
            │     └── Option B: own ingestion. Only market found: private servers (LegacyPlayers).
            └── Independence from WCL's ToS / a user cap
                  └── Option B, or Option C: hybrid (WCL for rankings, own upload as a
                      fallback path). C inherits all of B's cost with none of B's moat.
```

### 3.3 Option A — WCL-API-derived (recommended)

**What it is.** ParseForge keeps WCL as the system of record and builds (1) a *lens*: WCL's numbers re-presented for normal people, and (2) *scores*: ParseForge's own computations over per-report data. Both are demand-driven: a page is computed the first time someone asks for it and then served from Redis for hours.

**Data available (all `[VERIFIED]` from RPGLogs' own SDK repo `github.com/RPGLogs/RPGLogsApiSdk` — `src/queries/*.graphql` and recorded Jest snapshots — read 2026-09-18, unless tagged otherwise):**

| Need | API field | Shape actually returned |
|---|---|---|
| Per-player parse for a fight in a report | `report.rankings(fightIDs:)` (already fetched by `/api/analyze`) | per role: `{ name, server{name,region}, class, spec, amount, bracketData, bracket, rank ("~7317"), best, totalParses, rankPercent }`; fight-level `speed{rank,best,totalParses,rankPercent}`, `execution{...}`, `deaths`, `damageTakenExcludingTanks`, `bracketData`, `reportsBlacklistForCharacters` `[VERIFIED: repo fixture]` |
| Character report card | `characterData.character(name, serverSlug, serverRegion){ zoneRankings(zoneID, metric, partition, difficulty, size, byBracket, specName, role, compare, timeframe, includePrivateLogs) }` | `{ bestPerformanceAverage, medianPerformanceAverage, allStars[]{partition, points, possiblePoints, rank, rankPercent, regionRank, serverRank, spec, total}, rankings[]{ encounter{id,name}, rankPercent, medianPercent, totalKills, fastestKill, lockedIn, bestSpec, bestAmount, allStars{points, possiblePoints: 120, rank, regionRank, serverRank, total} } }` |
| A character's kill-by-kill history on one boss (improvement over time) | `character.encounterRankings(encounterID, metric, partition, …, includeCombatantInfo)` | `{ averagePerformance, medianPerformance, bestAmount, fastestKill, ranks[]{ amount, duration, startTime, rankPercent, historicalPercent, todayPercent, rankTotalParses, bracketData, lockedIn, spec, report{code, fightID, startTime}, guild } }` |
| Boss leaderboard (per spec/metric/partition/region/server/bracket) | `worldData.encounter(id).characterRankings(metric, page, difficulty, size, partition, bracket, serverRegion, serverSlug, filter, className, specName, includeCombatantInfo)` | `{ count, hasMorePages, page, rankings[]{ name, class, spec, amount, duration, bracketData, guild, server, report{code,fightID}, startTime, [talents, gear when includeCombatantInfo] } }` — page = 100 rows `[VERIFIED: snapshot + repo type WCLRanking]` |
| Guild speed / execution leaderboard | `worldData.encounter(id).fightRankings(metric: FightRankingMetricType, …)` | `{ rankings[]{ guild, server, duration, deaths, damageTaken, tanks, healers, melee, ranged, bracketData, report, startTime } }` |
| Guild page | `guildData.guild(name, serverSlug, serverRegion){ members(limit,page){data{name,guildRank,level,classID}} attendance(zoneID, limit, page){data{code,startTime,zone,players{name,type,presence}}} tags }`; `reportData.reports(guildID/guildName+server, zoneID, startTime, endTime, limit, page){data{code, visibility, title, zone, startTime, endTime, fights{ id, encounterID, name, kill, difficulty, size, bossPercentage, averageItemLevel, completeRaid, wipeCalledTime }}}` | as listed; `guild.zoneRanking{progress speed completeRaidSpeed}` `[CITED: search snippet; not in SDK queries — ASSUMED shape]` |
| Canonical character ids for a report's players | `report.rankedCharacters{ id, name, classID, hidden, server, guilds }` | `hidden` is the flag for characters who opted out of public ranking display — **must be honoured** |
| Zone metadata (brackets, encounters, difficulties, partitions) | `worldData.zones{ id, name, frozen, brackets{type,min,max,bucket}, encounters{id,name}, difficulties{id,name,sizes}, expansion{id,name} }` (+ `partitions` per WOW-FOREVER §2) | as listed |
| Budget | `rateLimitData{ limitPerHour pointsSpentThisHour pointsResetIn }` | as listed |

Note: the SDK builds a client per game (`buildSdk(token, 'classic.warcraft' | 'vanilla.warcraft' | …)`), i.e. RPGLogs distinguishes game-version endpoints, whereas the repo uses the single `www.warcraftlogs.com/api/v2/client` endpoint for Classic/TBC/SoD reports and it works `[VERIFIED: lib/constants.ts:117 + shipped behaviour]`. Whether `characterData`/`worldData` for Classic characters need the `classic.` host is an `[ASSUMED]` open point for the R0 probe (WOW-FOREVER A1 is the same assumption from the other direction).

**Strengths.** Zero ingestion cost; WCL's numbers stay WCL's (accuracy constraint satisfied by construction); every page is a thin, cacheable transform; the whole thing fits in the current Vercel + Upstash stack; ships in weeks, not quarters; the "actionable" layer is where WCL is structurally weak.

**Weaknesses.** ParseForge remains a dependent: key revocation, a user cap, or a ToS change is existential (it already is — the analyzer has the same dependency, so the *marginal* risk is the approval conversation, not the dependency itself). Rate budget forbids exhaustive mirrors, so "global All Stars table for every spec" is not buildable; "the All Stars for *this* character / *this* guild / *this* boss slice you asked for" is. Data freshness is WCL's (All Stars daily ~07:00 UTC) plus ParseForge's cache TTL.

### 3.4 Option B — own ingestion (own uploader / parser / storage)

What it would take, so the owner can see why this is "no":

| Component | What is involved | Evidence / estimate |
|---|---|---|
| Uploader | A desktop app (Electron/Tauri) or in-game companion that tails `WoWCombatLog.txt`, chunks and uploads it; live-logging mode expected by users. WCL ships three: desktop client, Overwolf Companion, in-game addon. | `[CITED: WCL help/start, Wowhead Companion article via search 2026-09-18]` |
| Parser | The combat-log line format (`timestamp EVENT,srcGUID,srcName,srcFlags,…` with per-event suffix parameters and "advanced" columns) differs by game version and changes with patches; Classic Era, TBC Anniversary, SoD, Cata/MoP Classic and Forever each need their own event/spell tables. Open-source references exist (WoWP in Rust, AGPL; WoWAnalyzer's parser is retail-only). Encounter boundaries (`ENCOUNTER_START/END`), `COMBATANT_INFO` (gear/talents/auras at pull), death recaps, and pet/owner attribution are the hard parts WCL solved over a decade. | `[CITED: warcraft.wiki.gg COMBAT_LOG_EVENT; github.com/rp4rk/WoWP; github.com/WoWAnalyzer/CombatLogParser via search]` |
| Volume | 50–200 MB per 3-hour 25-man night (older figure) to 500 MB+ (current); a guild raiding twice a week ≈ 2–4 GB/month of raw text before compression; 1,000 guilds ≈ 2–4 TB/month ingress, plus parsed event storage for query. | `[CITED: skaldlogs.com guide; wowcoach.gg 2026; Blizzard forum threads via search 2026-09-18]` |
| Processing | Parsing 500 MB in a serverless function is not viable (Vercel function limits); needs workers + object storage + a columnar/event store (WowCoach and sd_wcl use DuckDB-style stores). New infra class entirely. | `[ASSUMED — MEDIUM; Vercel limits per §6]` |
| Verification / anti-cheat | Rankings from raw logs need tamper detection, duplicate-upload dedupe, "at risk" exploit flagging, blacklists — WCL exposes `reportsBlacklistForCharacters` and "at risk" ranks because this is a real, continuous cost. | `[VERIFIED: field in fixture]`, `[CITED: warcrafttavern guide]` |
| Cold start | Rankings are only as good as the population that uploads to you. Every Classic guild uploads to WCL because their raiders' parses live there; a ParseForge-only upload path has zero comparison population on day one and no reason for anyone to switch. | reasoning |
| Legal | Blizzard's Developer API terms do not cover combat-log text, and hosting user-uploaded logs is not itself restricted; but the *player names* in every log are third-party personal data under GDPR — ParseForge would become a data controller for millions of pseudonymous records. | `[ASSUMED — LOW; legal review needed if ever pursued]` |

The only independent hosts found in 2026 are WowCoach (retail-focused, raw-upload, paid AI coaching, $5.99–12.99/mo) and private-server sites (LegacyPlayers for Turtle WoW; WoW-Logs for private WotLK/Cata) `[CITED: wowcoach.gg 2026-02-13; github.com/Legacy-Players/LegacyPlayersV4; wow-logs.co.in via search]`. Both exist where WCL is absent or insufficient; neither displaces it.

**Verdict:** B is a different company (a log host) with a $-per-GB cost curve and no acquisition story for a site that lives on organic search. Revisit only if RPGLogs refuses commercial approval *and* the owner wants to keep ParseForge alive without WCL — and even then, the survivable version is "paste a `WoWCombatLog.txt` for a one-off private analysis" (WowCoach's model), not rankings.

### 3.5 Recommendation

**Option A, in two layers, gated on the ToS conversation:**

1. **Rankings Lens** (WCL's numbers, ParseForge's presentation): parses in the raid table, character report cards, guild pages, boss leaderboards — always attributed, always linking back.
2. **ParseForge Scores** (ParseForge's own numbers, from data it already computes): Prep Score, Consistency, Improvement, Guild Readiness, Boss Coaching Score, role-normalised "who carried" — these are the differentiators and are unaffected by whether WCL later changes a formula.

Do **not** build: an uploader, a raw-log parser, an events store, a second percentile system, or an exhaustive nightly mirror of leaderboards.

---

## 4. WCL feature inventory → keep / simplify / drop / add

Lens: "would a normal raider know what to do differently after seeing this?"

### 4.1 Keep (show WCL's number, attributed)

| WCL feature | Why keep | Source in ParseForge |
|---|---|---|
| Per-player parse (`rankPercent`) on a kill | The single number every raider already understands ("I got a 74"). Missing it makes ParseForge feel incomplete next to WCL. | `report.rankings` blob — already fetched, discarded `[VERIFIED]` |
| Bracket percent ("vs your gear level") | The fairer number for normal players; WCL buries it behind a toggle. Show it *next to* the overall parse with a one-line explanation. | `bracketData`/`bracket` in the same blob; `byBracket` on character queries `[VERIFIED]` |
| Best / median performance average per zone | The two numbers that summarise a character. | `zoneRankings.bestPerformanceAverage` / `medianPerformanceAverage` `[VERIFIED]` |
| All Stars points (per boss, per zone) | Known currency among competitive raiders; cheap to show since the payload includes it. | `zoneRankings.allStars[]`, `rankings[].allStars` `[VERIFIED]` |
| Fight speed / execution rank | The only *raid-level* quality signal WCL gives; almost nobody sees it. Perfect for the Raid tab header ("Kill speed: top 10 %; Execution: top 29 %"). | `report.rankings.speed/execution` `[VERIFIED]` |
| Guild progress / speed / execution rank | Table stakes for a guild page. | `guild.zoneRanking` `[ASSUMED shape]`, `fightRankings` `[VERIFIED]` |
| Attendance | Officers ask for this constantly. | `guild.attendance` `[VERIFIED]` |

### 4.2 Simplify (same data, different presentation)

| WCL presentation | ParseForge presentation | Rationale / pattern borrowed |
|---|---|---|
| Colour-coded percentile with no explanation | "Top 26 % of Beast Mastery Hunters on Lurker this phase — that is better than 3 in 4." One sentence, plain language, then the number. | chess.com Insights frames every stat as a comparison to peers, not a raw score `[CITED: support.chess.com Insights article read 2026-09-18]` |
| Rank % vs bracket % vs historical vs today toggles | Default to **bracket %** (gear-fair), show overall % as secondary, hide historical/today entirely (use whatever the API returns as `rankPercent`). | raid.flamewreath.com's critique: overall percentile "ignores gear differences, the most important factor" `[CITED]` |
| A 25-column table per fight | Three tiles per player: **Output** (parse), **Prep** (consumables/enchants/buffs — ParseForge's CLA), **Survival** (deaths, avoidable damage share). Everything else behind "details". | Mobalytics GPI scores a handful of areas 0–100 and names the weakest `[CITED: mobalytics.gg/gpi via search]` |
| Separate character page per zone with 12 sub-tabs | One **Report Card**: headline sentence, three trends (best, median, consistency), "biggest lever this week", link to the WCL page. | Strava: "the overall numbers aren't as important as general trends" `[CITED: Strava help via search]` |
| Leaderboard = 100 names | Leaderboard = the top 100 **plus what they have in common** (talent consensus %, consumable coverage %, most common enchants — computed from `includeCombatantInfo` rows with the existing `analyzeTalentConsensus`/`analyzeGearPopularity` engines, widened from N=3 to N=100). The names are the proof; the pattern is the product. | Archon's thesis ("what the top 1 % plays") applied per boss `[CITED: wowhead Archon launch article]` |
| All Stars as a points total | "Zone score: 963 / 1080 — you are missing points on Vashj and Kael; those two fights are 68 % of your gap." | Points → *where the points are missing* (actionable) |

### 4.3 Drop (do not rebuild)

| WCL feature | Why drop |
|---|---|
| Raw Events browser, query-expression filters, Replay, Report Components / Script Pins | WCL does this better than anyone; it is the "shows you data, not answers" part. Link out. (Already an anti-feature in `.planning/research/FEATURES.md`.) |
| Uploader / live logging | §3.4. |
| Exhaustive global leaderboards for every spec × boss × partition × region, refreshed nightly | Rate budget; not what normal players need. Demand-driven slices only. |
| A ParseForge-computed percentile that competes with WCL's | Two disagreeing numbers destroy trust; WCL's is the canonical one. ParseForge's *estimated* percentile in `analyzeDps` (page-1 extrapolation, floor 1 / cap 99) should in fact be **replaced** by the real `rankPercent` from the rankings blob when the fight is a kill — that is an accuracy win, not just a feature `[VERIFIED: lib/analysis-engine.ts analyzeDps estimates from one page]`. |
| Progress-race features, Mythic+ / retail surfaces | Out of scope (retail excluded in PROJECT.md). |
| Subscription tiers, banners, archive | Monetisation is ads (Phase 4); anything paid later should be *aggregation/history*, never the single-report answer (REQUIREMENTS "Gating core analysis" out-of-scope row). |

### 4.4 Add (rankings WCL does not have — the moat)

Each row states the formula and the exact inputs ParseForge can obtain. Every score must ship with its definition visible on the page ("how is this calculated?") — accuracy constraint.

| New ranking / score | Definition (computable today) | Inputs & source | Notes / pitfalls |
|---|---|---|---|
| **Prep Score** (per player, per fight; 0–100) | Weighted coverage of: flask/elixirs, food, weapon enhancement, all enchantable slots enchanted, all sockets gemmed, class-appropriate raid buffs present at pull. E.g. 30 flask · 15 food · 15 weapon · 25 enchants (pro-rata) · 15 gems (pro-rata), role-aware (no gem/enchant penalty where the era has none — Forever has no sockets, WOW-FOREVER §3). | `CombatantInfo` auras + gear (already parsed by `detectConsumables`, `analyzeGear`, CLA engine) `[VERIFIED]` | Raid-level Prep Score = mean; guild trend over reports. Cheat-proof (it is at-pull state). Existing awards "Flaskless Wonder"/"Naked Slots" are the same inputs `[VERIFIED: lib/awards-engine.ts]`. |
| **Consistency** (per character, per zone) | `medianPerformanceAverage / bestPerformanceAverage` and the per-boss spread (`rankPercent − medianPercent`). Plain-language: "Your best nights are top 15 %; your typical night is top 45 % — the gap is the opportunity." | `zoneRankings` `[VERIFIED]` | WCL shows both numbers but never the *gap*. Requires ≥3 kills per boss to display (state it). |
| **Improvement over time** (per character, per boss) | Slope of `rankPercent` (or `historicalPercent`) across the last N kills; "up 12 points over 6 kills". Optional: same for Prep Score across analysed reports. | `encounterRankings.ranks[]` (per-kill, dated, with report codes) `[VERIFIED]`; ParseForge's own Redis history for Prep | Use bracket-aware percent where possible so gear upgrades are not mistaken for skill; say which one is shown. |
| **Role-normalised "who carried" leaderboard** (per fight) | Rank all players in the fight by *their own* `rankPercent` (tanks, healers, DPS on one axis) instead of raw damage. Healers and tanks finally appear. | `report.rankings` roles arrays `[VERIFIED]` | This is the Raid-tab tracer (§7 R1). Healer parse is HPS-based on WCL — pair it with ParseForge's effective-HPS/overheal from Phase 2 so it is not misread. |
| **Boss Coaching Score** (per player, per fight) | A composite that is *explicitly not a percentile*: Output (parse, bracket) · Prep · Activity/uptime (`activeTime`, GCD gaps from the Casts table) · Survival (deaths, damage taken share for non-tanks) — each 0–100, shown as four tiles and one "fix this first" sentence chosen by the largest gap to the top-N sample. | Existing `analysis-engine` (`analyzeCasts`, `analyzeAbilities`, `generateSuggestions`, `analyzeMetricPercentiles`) + rankings blob `[VERIFIED]` | Do **not** collapse the four tiles into one number on shared cards (FEATURES.md anti-feature: single blended score is unfair across roles). The composite may exist internally to pick "fix this first". |
| **Guild Readiness** (per guild, per zone, rolling 4 weeks) | Mean Prep Score across the roster's recent kills · attendance stability (share of roster present ≥ 75 % of raids) · death rate per pull vs `fightRankings` median · execution rank trend. Presented as four gauges plus "the three players who most lower the score" (visible to the guild page only, phrased as prep gaps, never as blame). | `reports(guildID, zoneID)` → CLA engine per report; `attendance`; `fightRankings`; `report.rankings.execution` `[VERIFIED for fields]` | Expensive: one guild page = N reports × CLA fan-out. Cap N (e.g. last 6 reports), compute on demand, cache 12 h, and reuse `/api/cla` results already cached for reports people analysed. |
| **Speed vs execution quadrant** (per guild, per boss) | Plot the guild's kill against the `fightRankings` population: fast-and-clean / fast-and-sloppy / slow-and-clean / slow-and-sloppy, with the median lines drawn. | `fightRankings` page 1 (100 kills) + the report's own `speed`/`execution` `[VERIFIED]` | Page-1-only sample is the top 100 — label it "vs the top 100 kills", never "vs everyone". |
| **Server / guild-mates context** ("among people you actually raid with") | Same leaderboards filtered by `serverSlug`/`serverRegion` or by the report's roster. | `characterRankings(serverSlug, serverRegion)` `[VERIFIED args]` | Cheap, and far more motivating for normal players than world rank 18,776. |
| **Weekly recap** (per guild or per character) | "This week: 9 kills, Prep 82 (+6), median parse 47 (+3), best lever: enchants on 4 players." | Redis history of analysed reports + `encounterRankings` | Already listed as whitespace in FEATURES.md (Spotify-Wrapped pattern). Share-card candidate (Phase 3 OG infra). |

**What must be true for every "Add":** the definition is one paragraph, published on the page; inputs are WCL fields or ParseForge engine output with tests (Phase 2 regression net); nothing is shown when the sample is too small (state the threshold); and the copy says *what to do*, not just *where you rank*.

---

## 5. Information architecture, page inventory and the SEO angle

### 5.1 Principles

1. **One question per page, answered in the first sentence.** WCL's pages answer "what happened"; ParseForge's answer "how am I doing and what do I change". Every rankings page opens with a plain-language sentence, then the number, then the lever.
2. **Every ParseForge score is defined on the page** ("How is Prep Score calculated?" disclosure). No unexplained composite.
3. **Nothing new inside the analyze page displaces a protected element** (`docs/PROTECTED-ELEMENTS.md`: `share-header`, `share-player`, `share-discord`, `awards-panel`, `awards-preview`, `share-awards`; `/og` contract; param-free canonical). Rankings decorations are *added rows/tiles*, never a new tab that pushes the awards panel down on mobile without a recorded decision.
4. **Index only pages with ParseForge-computed substance.** Mirror the existing invariant ("indexable only when public"): a character or guild page is `index` only when it carries ParseForge-only content (≥ 1 analysed report with Prep/coaching data, or ≥ 3 kills for consistency); otherwise `noindex, follow`. This is the defence against Google's scaled-content-abuse classification (`.planning/research/PITFALLS.md` Pitfall 4) and against thin doorway pages (PROJECT.md decision "programmatic pages must map to real features").
5. **Segment every keyword cluster by intent before building a page** (PROJECT.md hard-won lesson). Anything with "logs"/"warcraft logs"/a character name + "logs" is navigational to WCL and is *not* a target. Rankings pages target tool/informational intent: "[boss] [spec] parses", "top [spec] talents [boss] tbc", "how good is a 60 parse", "[guild name] raid progress" (guild names are a plausible long tail where WCL and raider.io pages are thin).

### 5.2 Page inventory

| Route | Question it answers | Data | Index? | Phase (§7) | Conflicts / notes |
|---|---|---|---|---|---|
| `/analyze/[code]` — Raid tab: **Parse column + fight Speed/Execution badges** | "How did each of us do, on one fair axis?" | `report.rankings` (already fetched) | existing rules | **R1 (tracer)** | Additive column in the existing raid table + two badges in the fight header; protected elements untouched. Player tab: real `rankPercent` replaces the estimated percentile on kills. |
| `/analyze/[code]` — Player tab: **Coaching tiles** (Output · Prep · Activity · Survival + "fix this first") | "What do I change next raid?" | existing engines + rankings blob | existing rules | R2 | Re-frames `ComparisonSummary`/suggestions; the `share-player`/`share-discord` buttons stay where they are. The per-player OG card (Phase 3) may gain the parse — an OG contract change requires the PROTECTED-ELEMENTS change procedure. |
| `/rankings` (hub) | "Where do I start?" | `worldData.zones` for supported expansions | index | R3 | Hub links to boss pages; also links `/tbc-audit` and guides (internal-link discipline from PROJECT.md). Phase 6 SEO-01 asks for a hub + 10–15 pilot programmatic pages — **this hub and the boss pages should *be* that pilot set** (one keyword map, one uniqueness rubric), not a parallel set. |
| `/rankings/[expansion]/[zone]/[boss]` (+ `?spec=&metric=&region=`; canonical is param-free) | "What do the top players on this boss have in common, and how does a typical parse compare?" | `characterRankings(page 1, includeCombatantInfo)` → top-100 list + talent consensus % + consumable coverage % + enchant/gem popularity; `fightRankings` page 1 for kill-time/deaths medians | index (default spec/metric only; param variants fold via canonical) | R3 | Content is generated from real engine output (SEO-01 uniqueness bar); refreshed on demand with a 6–24 h cache. Must carry WCL attribution + link to the WCL leaderboard. Do not target "[boss] logs" queries. |
| `/character/[region]/[server]/[name]` — **Report Card** | "How good am I, really, and what is my biggest lever?" | `zoneRankings` (best/median/All Stars/consistency) + `encounterRankings` for trend on the weakest boss + ParseForge history (Prep trend) when the character appears in analysed reports | index **only** with ParseForge-computed content; else noindex | R4 | Respect `rankedCharacters.hidden` (render nothing). Privacy: pseudonymous names are personal data in the EU — offer a "remove my page" path and say so in `/privacy` (see §8). Name/server normalisation must match WCL's `serverSlug` rules `[ASSUMED]`. |
| `/guild/[region]/[server]/[name]` — **Guild Readiness** | "Is my guild ready for next week, and who needs what?" | `guild{members attendance}`, `reports(guildID, zoneID)` (last N), `zoneRanking`, `fightRankings`, CLA engine per report | index only with ≥ N analysed reports; else noindex | R5 | Most expensive page (fan-out); cap N, cache 12 h, reuse cached `/api/cla` results. Natural Phase 5 tie-in: the Discord bot can post the weekly readiness recap (SHARE-04). |
| `/rankings/[expansion]/[zone]` — zone overview | "Which bosses is my spec weakest on across the tier?" | aggregate of boss pages already cached | index | R3/R4 | Only after boss pages exist; otherwise it is a thin list. |
| `/recap/[guild-or-character]/[week]` — weekly recap | "What changed this week?" | Redis/Postgres history | noindex (share artefact) | R6 | Phase 3 OG infra; Phase 5 bot distribution. |

**Explicitly not built:** `/reports/*` mirror, events explorer, upload page, All Stars global tables, region-wide "all specs" tables.

### 5.3 Relationship to the planned Phases 4–7

| Planned phase | Interaction with this spec |
|---|---|
| **Phase 4 Ads Live** | **Hard dependency the other way round:** Phase 4 makes API use "commercial" → the RPGLogs approval email must precede Phase 4's deploy, not just R-phases. Ad slots on rankings pages must obey the same whitelist/CLS rules (MONY-02/03); leaderboard pages are long, so they are natural ad inventory — but never above the first-sentence answer. |
| **Phase 5 Community** | Guild pages and weekly recaps are the content the Discord bot posts (SHARE-04); guild-page "claim/verify" could use Discord identity later (not in scope now). |
| **Phase 6 Discoverability** | The `/rankings` hub + boss pages **are** SEO-01's pilot programmatic set. Merge, don't duplicate: one keyword-to-URL map, one uniqueness rubric, the same staged rollout (10–15 pages), the same GSC 4–6-week watch. Guides: one new tool-intent guide ("how to read your parse") replaces one of the planned new guides. |
| **Phase 7 Redesign** | New routes should be built *in the new design language* if Phase 7 has started, else with the Phase 1 tokens and re-skinned under Phase 7's per-route SEO gate. Rankings pages are low-traffic at launch, so they are good first routes for the redesign's "low-traffic first" order. |
| **OPS-01 (standing)** | Every R-phase ships PostHog events (`rankings_viewed{surface}`, `parse_column_seen`, `coaching_tile_clicked{tile}`, `character_card_viewed`, `guild_card_viewed`, low-cardinality) and a GSC pass. |

---

## 6. Data and architecture sketch

### 6.1 Shape

```
                 ┌──────────────────────── WCL v2 GraphQL (client credentials) ──────────────────┐
                 │  report.rankings · characterRankings · fightRankings · zoneRankings ·          │
                 │  encounterRankings · guild{members,attendance} · reports(guildID) · zones ·     │
                 │  rateLimitData                                                                  │
                 └──────────────┬───────────────────────────────────────────────────────────────────┘
                                │  wclQuery() — existing client, token cache, 5-min query cache, retries
                                ▼
   ┌─────────────── lib/rankings/* (new, pure, tested like the Phase 2 engines) ────────────────┐
   │ parse-lens.ts      : rankings blob → per-player {rankPercent, bracket, role} + fight badges │
   │ leaderboard-lens.ts: characterRankings rows → top-100 + consensus (reuses analyzeTalent…)  │
   │ character-card.ts  : zoneRankings/encounterRankings → best/median/consistency/trend        │
   │ prep-score.ts      : CombatantInfo → Prep Score (reuses detectConsumables/analyzeGear)      │
   │ guild-readiness.ts : reports+attendance+CLA results → gauges                                │
   │ budget.ts          : rateLimitData poll → Redis `wcl:budget`; refuse "expensive" work >90 % │
   └──────────────┬──────────────────────────────────────────────────────────────────────────────┘
                  │  cachedApiHandler() — existing single-flight + Redis result cache
                  ▼
   Upstash Redis (existing)                          Postgres (new, only from R4 on)
   ├─ rk:slice:{enc}:{spec}:{metric}:{part}:{region}  ├─ character(id, name, server, region, hidden)
   │    TTL 6–24 h (leaderboard page)                  ├─ character_kill(char_id, enc, ts, rank_pct,
   ├─ rk:char:{region}:{server}:{name}  TTL 6 h         │     bracket_pct, report_code, source='wcl')
   ├─ rk:guild:{region}:{server}:{name} TTL 12 h       ├─ report_prep(report_code, fight, char_id,
   ├─ pf:recent_reports (existing, sitemap)            │     prep_score, breakdown)  ← from analysed reports
   ├─ pf:prep_history:{char} ZSET (R2, small)          └─ guild_snapshot(guild_id, week, readiness…)
   └─ wcl:budget (limitPerHour, spent, resetIn)
                  │
                  ▼
   Next.js routes: /api/rankings/* (POST, rate-limited per bucket) · SSR pages (ISR 1–6 h) ·
   sitemap additions (only index-eligible pages) · /og additions (R6)
```

### 6.2 Ingestion — three modes, no crawler

| Mode | Trigger | What is fetched | Cost control |
|---|---|---|---|
| **Piggyback** (R1–R2) | A visitor analyses a report (existing flow) | Nothing new — `report.rankings` is already in the `PLAYER_FULL_DATA_QUERY` response; `/api/raid-overview` would add `rankings(fightIDs:)` to `RAID_OVERVIEW_QUERY` (one field, same request) | ~0 extra points |
| **On-demand slice** (R3–R5) | First visitor to a leaderboard/character/guild page (or a stale cache) | 1–3 queries per page; page 1 only; `includeCombatantInfo` only for boss pages | Single-flight lock so one visitor pays; TTL 6–24 h; `wcl:budget` gate: if `pointsSpentThisHour / limitPerHour > 0.9`, serve stale or a "come back shortly" state instead of querying (pattern from `Erilla/SlashWho#282` `[CITED via search]`) |
| **Scheduled refresh** (optional, R5+) | Vercel Cron, once a day (Hobby allows daily; Pro allows per-minute — `[CITED: vercel.com changelog, 2026-01]`) | Re-warm only slices viewed in the last 7 days (tracked in a ZSET), ordered by views, until 40 % of the hourly budget is spent | Bounded by budget, not by catalogue size |

No nightly crawl of the catalogue, ever. The catalogue is the visitors' interest graph.

### 6.3 Storage and recompute

- **R1–R3 need only Redis.** Slices are JSON blobs (a 100-row leaderboard with combatant info ≈ 60–150 KB; a character card ≈ 10–20 KB). 2,000 hot slices ≈ 200 MB — inside Upstash pay-as-you-go's first free GB; commands are the cost driver at $0.20 per 100k `[CITED: upstash.com pricing via search 2026-09-18]`. Today's cache traffic is unknown here; the OPS-01 gate should add a Redis command-count read.
- **R4+ history (kill-by-kill, prep-by-report, weekly guild snapshots) wants a relational store**, because the queries are "this character over time", "this guild's roster over 6 reports", and Redis ZSETs per character get awkward at that point. Recommend **Postgres** (Neon via Vercel Marketplace, or Supabase — the owner already runs Supabase for LootList+, so the knowledge transfers). Free tiers cover the first year comfortably at this scale (tens of MB). Do **not** introduce it before a history feature needs it (rule: reuse before adding).
- **Recompute** is deterministic from cached inputs: change a formula → bump a `PREP_SCORE_VERSION` constant → keys roll. Store the formula version with every persisted score so old and new never mix on one page.
- **Game-data dependency**: Prep Score relies on `lib/generated/*` (wago-derived ids). Forever (no gem sockets) and every new era need the era-aware scoring the WOW-FOREVER research already requires (domain-scoped lookup, F0-3). Sequence R2 after WOW-FOREVER F0-3 if both are in flight.

### 6.4 Cost envelope (order of magnitude, `[ASSUMED]` unless cited)

| Item | Now | With R1–R3 | With R4–R6 |
|---|---|---|---|
| WCL points | analyzer traffic only | + ~1–3 points per *first* view of a slice; ≤ 40 % of 3,600/h reserved for rankings | + character/guild pages (1–3 queries each) + optional daily re-warm. If the free budget binds, Gold ($5/mo) / Platinum advertise more points `[CITED: archon.gg subscriber-benefits]` — cheaper than any infra. |
| Upstash | free/PAYG | PAYG: likely < $5/mo at current traffic (commands ≈ 2× page views on rankings routes) | + Postgres free tier (Neon/Supabase) → $0–25/mo |
| Vercel | current plan | ISR pages + a few API routes: negligible | daily cron works on Hobby; per-hour cron or > 60 s functions need Pro ($20/seat/mo) `[CITED via search]` — guild readiness fan-out must stay < 60 s or be split |
| New infra | none | none | Postgres only |
| Own-ingestion (rejected) | — | — | object storage + workers + event store: TB-scale ingress, $100s–1,000s/mo before a single user switches |

### 6.5 What changes in existing code (small, additive)

- `lib/wcl-types.ts`: type the `rankings` blob properly (roles → characters, speed, execution) instead of `Array<{ fightID?, partition? }>` `[VERIFIED: app/api/analyze/route.ts types only partition]`.
- `lib/wcl-queries.ts`: add `rankings(fightIDs:)` to `RAID_OVERVIEW_QUERY`; new `CHARACTER_ZONE_RANKINGS_QUERY`, `CHARACTER_ENCOUNTER_RANKINGS_QUERY`, `ENCOUNTER_FIGHT_RANKINGS_QUERY`, `GUILD_QUERY`, `GUILD_REPORTS_QUERY`, `RATE_LIMIT_QUERY` — copy the argument lists from the RPGLogs SDK `.graphql` files verbatim (§3.3).
- `lib/constants.ts`: new `RATE_LIMITS` buckets (`rankings-slice`, `character`, `guild`), TTL constants.
- `scripts/record-wcl-fixtures.mjs`: record the new responses for a **public** report/character/guild (same public-only rule as `lib/__fixtures__/README.md`) so engines are tested against real shapes before UI exists (Phase 2's Wave-0 lesson, PROJECT.md Key Decisions).
- `app/sitemap.ts`: add index-eligible rankings/character/guild URLs via a second Redis ZSET, never by scanning Postgres at request time; keep `pf:recent_reports` untouched (SEO invariant).

---

## 7. MVP slicing — GSD-sized phases

Convention: like WOW-FOREVER, these are proposed as decimal insertions or as a follow-on milestone after Phase 7; the roadmap owner decides placement. Each phase is a vertical slice that ships something visible, with the OPS-01 gate as its last plan. **R0 is unblocked now; R1 is the thinnest tracer; nothing after R0 executes until the RPGLogs approval reply is recorded.**

### R0 — Contract & approval (no UI; ~3 plans; actionable now)

| Plan | Deliverable | Verification |
|---|---|---|
| R0-1 ToS/approval | Owner reads the ToS + API-documentation pages in a browser, saves dated copies to `.planning/research/wcl-tos-YYYY-MM-DD.md`; drafts and sends the approval email (ads on analyzer + rankings lens + expected volume + caching); logs the thread in `.planning/`. | The saved text exists; the sent email and any reply are recorded verbatim; a decision row is added to PROJECT.md Key Decisions. |
| R0-2 Probe + fixtures | Extend `scripts/record-wcl-fixtures.mjs` (or the WOW-FOREVER F0-1 probe script — **one script, two consumers**) to record `rateLimitData`, `worldData.zones{brackets…}`, `report.rankings` for the demo report, `zoneRankings`/`encounterRankings` for one demo-report player, `characterRankings`+`fightRankings` page 1 for the demo boss, `guild{members,attendance}` + `reports(guildID)` for the demo guild — public entities only; also record whether Classic `characterData` needs the `classic.` host. | Fixtures committed under `lib/__fixtures__/rankings-*.json` with README provenance; a `fixtures.test.ts` shape test per fixture; measured `pointsSpentThisHour` delta per query type written into this document's §2.2 (turns the LOW-confidence cost row into a measured one). |
| R0-3 Types + lens engine | `lib/wcl-types.ts` rankings-blob types; `lib/rankings/parse-lens.ts` (pure: blob → per-player parse rows + fight badges, honouring `hidden` when present); `budget.ts` reading `rateLimitData` into Redis with the 90 % gate. Tests against R0-2 fixtures. | `npm test` green; `npx tsc --noEmit`; no UI change; `npm run seo-invariants`/`protected-elements` unchanged. |

### R1 — Tracer: "your parse, explained" inside the analyze page (~3 plans; gated on R0-1 reply)

| Plan | Deliverable | Verification |
|---|---|---|
| R1-1 Raid-tab parse column | `RAID_OVERVIEW_QUERY` gains `rankings(fightIDs:)`; raid table gets a **Parse** column (bracket % default, overall % on hover, plain-language tooltip) and the fight header gets **Kill speed / Execution** badges with one-sentence explanations; healers/tanks ranked on the same axis ("who carried" sort). WCL attribution line + link on the tab. | Preview deploy on the demo report shows parses matching WCL's report page for the same fight (developer eyeballs three players); `awards-panel`/`share-awards` positions unchanged on mobile (protected-elements gate); PostHog `parse_column_seen`. |
| R1-2 Real percentile on Player tab | On kills, `analyzeDps`'s estimated percentile is replaced by the blob's `rankPercent` (estimate kept only for wipes, labelled "estimated"). `ComparisonSummary` copy: "Top X % of [spec]s on [boss] this phase". | Engine test asserting the swap; fixture-driven parity with the WCL number; share OG card unchanged (contract untouched) unless a recorded PROTECTED-ELEMENTS change adds the parse. |
| R1-3 OPS-01 | PostHog events, GSC pass, item-7 live-traffic check; approval-gated prod deploy. | Signed gate record. |

**Why this is the tracer:** zero new WCL calls, zero new routes, zero SEO surface area, immediately visible, and it converts an *estimate* into WCL's real number — an accuracy win on the core value.

### R2 — Coaching tiles & Prep Score (~4 plans)

Output · Prep · Activity · Survival tiles with "fix this first"; `prep-score.ts` with published formula and era-awareness; per-player Prep history in Redis (opt-in by "remember this character" in localStorage first, no accounts); raid-level Prep Score on the Raid tab; awards engine gains "Most Improved Prep" when history exists. Verification: engine tests, fixture parity, the definition disclosure renders, PostHog `coaching_tile_clicked`, OPS-01.

### R3 — Boss pages + hub (= Phase 6 SEO-01 pilot; ~5 plans)

`/rankings` hub, `/rankings/[exp]/[zone]/[boss]` for 10–15 pilot bosses (TBC first — the demo report's zone), keyword-to-URL map with intent segmentation, uniqueness rubric (consensus %, coverage %, medians — all computed), on-demand slice cache + budget gate, WCL attribution, sitemap ZSET, JSON-LD (`Dataset`/`ItemList` — validate with schema-dts as SEO-04 requires), internal links from `/`, `/tbc-audit`, guides. Verification: pages render from fixtures offline; live page cost measured in points; GSC 4–6-week watch; no navigational keyword targeted.

### R4 — Character Report Card (~4 plans)

Route, name/server/region normalisation, `hidden` handling, index-eligibility rule, consistency + trend from `zoneRankings`/`encounterRankings`, "biggest lever" sentence, privacy copy + removal path, Postgres introduction (kill history) **only if** trend beyond what the API returns per request is needed. Verification: probe a public demo-report character; noindex asserted for a card with no ParseForge content; OPS-01.

### R5 — Guild Readiness (~4 plans)

Route, attendance + last-N reports fan-out reusing cached CLA results, gauges, execution/speed quadrant, cost cap (< 60 s, ≤ N reports), index rule, Phase 5 bot hook (weekly readiness post). Verification: cost measured against budget; a guild with 6 public reports renders in preview; OPS-01.

### R6 — Weekly recap + share (~3 plans)

Recap page (noindex), OG card via the Phase 3 pipeline (PROTECTED-ELEMENTS change procedure for any `/og` param addition), Discord auto-post via SHARE-04. Verification: unfurl check, share-rate HogQL, OPS-01.

**Ordering rationale:** R0 removes the two unknowns that could kill the whole thing (ToS, real shapes/costs) before any code; R1 is pure decoration of already-fetched data; R2 builds the scoring the later pages display; R3 is the SEO surface and should be planned jointly with Phase 6; R4/R5 need history and the most WCL budget, so they come after the budget gate has been measured in production; R6 rides on Phases 3 and 5.

**Research flags:** R3 needs keyword research in GSC before building (Phase 6's own flag); R4 needs a privacy/legal check on character pages (EU personal data; WCL `hidden`); R5 needs a measured cost per guild page before its cache TTL is chosen.

---

## 8. Risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| **ToS: commercial use without approval** (ads in Phase 4 alone trigger it) | Medium / **existential** (key revocation takes down the analyzer, the sitemap's 10k report pages, and organic traffic with it) | R0-1 before Phase 4 ships; keep the approval thread; never spread load over multiple keys; honour any cap they name. |
| **User-count or request cap imposed later** | Medium / high | Budget gate serves stale rather than failing; per-page TTLs are tunable constants; the analyzer (core value) always has budget priority over rankings pages (two Redis "lanes"). |
| **Accuracy: showing a number that disagrees with WCL** | Low if the Lens shows WCL's own fields; medium for ParseForge Scores | Never re-derive WCL's percentile; label estimates; publish every formula; fixture parity tests; thresholds for small samples. |
| **Accuracy: partition / bracket / difficulty mismatches** | Medium | Always scope by the report's `partition` (already done), `difficulty`, `size`; show the scope in the copy ("this phase, 25-man"). |
| **Gaming / cheating** | Low for the Lens (inherits WCL's blacklists and "at risk" flags — pass `reportsBlacklistForCharacters` through and hide those rows); low-medium for Scores (Prep is at-pull state; Consistency can be gamed by privating bad logs — say "based on public logs") | Copy discipline; do not build leaderboards of ParseForge Scores across strangers in v1 — keep Scores per player/guild, ranked only within a raid or against the top-N sample. |
| **Privacy: character pages are personal data** | Medium / medium | Pseudonymous handles + server are still personal data under GDPR; honour WCL `hidden`; add removal path and `/privacy` section; noindex by default; never enrich with off-WCL data. The org-level guidance the assistant operates under also flags names as PII — treat character pages as a compliance surface, not just a feature. |
| **Cost blow-up on guild pages** | Medium / low-medium | Hard caps (N reports, < 60 s), reuse cached CLA, TTL 12 h, budget gate. |
| **Maintenance: every new era/partition/zone** | Certain / medium | Zone/partition metadata from `worldData.zones` at runtime (WOW-FOREVER F0-1 probe), not hand-typed; era-aware Prep Score via generated game data. |
| **Community reaction: "another site scraping WCL"** | Medium / medium | Visible attribution, links back, honest naming ("Rankings Lens on Warcraft Logs data"), no "official parse" claims; ask RPGLogs whether they want a specific attribution; consider posting the plan in their API Discord. |
| **SEO: thin/duplicate pages** | Medium / high (this site lives on organic) | Index-eligibility rule; merge with Phase 6's pilot; staged rollout; uniqueness rubric; GSC watch; never target navigational clusters. |
| **Scope: the brief's "everything WCL has"** | High / high | This document's Drop list is the guard-rail; the owner should sign off on §4.3 explicitly. |

---

## 9. Open questions the owner must decide

1. **Send the RPGLogs approval email — yes/no, and when?** (Blocks R1+ and, per the ToS reading here, Phase 4.) Who signs it and from which address?
2. **Placement:** insert R0 now as a decimal phase, and where do R1–R6 sit relative to Phases 4–7? Recommendation: R0 now; R1 right after Phase 3 closes (it strengthens the share cards' numbers); R3 folded into Phase 6; R4–R6 as the next milestone.
3. **Does ParseForge want character pages at all** given the privacy/thin-content cost, or only guild pages (fewer, richer, less personal)? Recommendation: guild first (R5 before R4) if the owner is uneasy about character pages.
4. **Postgres: Neon (Vercel Marketplace) or Supabase (LootList+ parity)?** Only matters from R4.
5. **Branding:** "Rankings Lens" / "Report Card" / "Readiness" are working names — final names must not use WCL brand features.
6. **Upgrade the WCL client tier** ($5–? /mo for more API points) if the free budget binds — acceptable spend before ads revenue exists?
7. **Should R1's Parse column also change the per-player OG card?** It changes a protected route contract (`/og`), so it needs the PROTECTED-ELEMENTS change procedure and a recorded decision.
8. **Which expansion first?** TBC (demo report, `/tbc-audit`, most traffic today) is the obvious pilot; Forever raids only exist from 9 Dec 2026 (WOW-FOREVER).

---

## 10. Verified vs inferred

### Verified this session (primary sources)
- Repo: `report.rankings` blob shape incl. per-player `rankPercent/rank/best/totalParses/bracketData` and fight `speed/execution` (`lib/__fixtures__/demo-player-dps.json`); only `partition` consumed (`app/api/analyze/route.ts`); `analyzeDps` percentile is a page-1 extrapolation clamped 1–99 (`lib/analysis-engine.ts`); `TOP_PLAYERS_TO_FETCH = 3`, `RATE_LIMITS`, `ANALYSIS_CACHE_TTL = 10 min`, `MAX_CLA_FIGHTS = 15` (`lib/constants.ts`); single-flight + Redis cache (`lib/api-utils.ts`, `lib/kv-cache.ts`); sitemap from `pf:recent_reports` (`app/sitemap.ts`); protected elements list (`docs/PROTECTED-ELEMENTS.md`); awards pool ids (`lib/awards-engine.ts`); existing WCL-vs-ParseForge positioning (`app/guides/warcraft-logs-vs-parseforge/page.tsx`); Phases 4–7 scope (`.planning/ROADMAP.md`, `REQUIREMENTS.md`).
- RPGLogs' official SDK (`github.com/RPGLogs/RPGLogsApiSdk`, read 2026-09-18): argument lists for `zoneRankings`, `encounterRankings`, `characterRankings`, `fightRankings`, `guild{members,attendance}`, `reports(guildID…)`, `rankedCharacters{hidden}`, `zones{brackets…}`, `rateLimitData`; recorded response shapes incl. `possiblePoints: 120` per boss, `bestPerformanceAverage`, `medianPerformanceAverage`, per-kill `historicalPercent/todayPercent`, `fightRankings.deaths/damageTaken`.
- Forum posts by WCL staff (read 2026-09-18): Kihra 2016-05-01/03 (original `N × yourDPS/rank1DPS`; revision `1.2N` = `(P/100)N` + ≤ `0.2N` bonus for P ≥ 95); Vel 2023-07-19 (All Stars daily; zone total from single best partition).
- Third-party pages read: raid.flamewreath.com/aboutlogs.html (bracket vs rank percentile critique); wowcoach.gg comparison (2026-02-13); support.chess.com Insights; forum thread 14659 (3,600 / 36,000 points per hour, user-quoted).

### Cited via search snippets only (page itself 403 or not fetched) — MEDIUM
- RPGLogs API ToS sentences (commercial definition incl. advertising; approval by email; limits on requests *and users served*; attribution; no scraping; privacy policy). **Must be read by a human before any decision.**
- WCL help/ranks statements (rank vs bracket %, 24-h historical windows, All Stars ~07:00 UTC, degenerate bosses removed, "formulas vary by game and metric", max 120/boss).
- Subscription tiers and "more API points" (archon.gg subscriber-benefits); Archon purpose; Wipefest Cata coverage; WoWAnalyzer partial Classic support; combat-log sizes; Upstash/Vercel pricing.

### Assumed / inferred — LOW, verify in R0
- Exact point cost per query type (measure in R0-2); whether Classic `characterData`/`worldData` need the `classic.` host; `guild.zoneRanking` JSON shape; exact percentile colour cut-offs; serverSlug normalisation rules; that the 1.2N revision is the live formula for Classic (the 120 `possiblePoints` snapshot is retail, 2020); legal characterisation of character pages (needs counsel if pursued); the cost envelope numbers.

### Sources (all accessed 2026-09-18)
- github.com/RPGLogs/RPGLogsApiSdk — `src/queries/*.graphql`, `src/queries/__snapshots__/*.snap`, README
- forums.combatlogforums.com: /t/all-stars-revision-proposal/396 · /t/how-is-the-overall-raid-allstar-points-computed/14340 · /t/api-v2-requests-limit-per-second-minute-hour/14659 · /t/api-rate-limit-and-points-spent/10320 · /t/terms-of-use-for-the-api/11796
- articles.warcraftlogs.com/help/rpg-logs-api-terms-of-service (403; snippets) · www.warcraftlogs.com/help/ranks/ (403; snippets) · www.warcraftlogs.com/api/docs (403)
- github.com/Gabriel2048/wow-insights/issues/18 (2026-09-10) · github.com/Erilla/SlashWho/issues/282, /303 (via search)
- raid.flamewreath.com/aboutlogs.html · wowcoach.gg/blog/warcraftlogs-vs-wowanalyzer-vs-wowcoach (2026-02-13) · support.chess.com/en/articles/8708925 · mobalytics.gg/gpi (via search) · Strava help (via search)
- archon.gg subscriber-benefits (via search) · wowhead.com Archon launch news (via search) · wipefest.gg + archon.gg Wipefest articles (via search) · wowanalyzer.com/about (via search)
- pkg.go.dev/github.com/math280h/go-wcl · github.com/K0bus/warcraftlog-api-v2
- warcraft.wiki.gg Combat_Log / COMBAT_LOG_EVENT · skaldlogs.com log guide · github.com/rp4rk/WoWP · github.com/Legacy-Players/LegacyPlayersV4 (404 on fetch; via search) · wow-logs.co.in · murlok.io/about (via search) · ironforge.pro (via search)
- upstash.com/pricing/redis (via search) · vercel.com changelog cron limits (via search)
- Repo files listed in §10 "Verified".

---

## RESEARCH COMPLETE

1. Verdict: build a **Rankings Lens** (WCL's own parses/All Stars/speed/execution re-presented for normal people) plus **ParseForge Scores** (prep, consistency, improvement, coaching, guild readiness) on the WCL API — **do not** build an uploader, parser or own percentile system.
2. ParseForge already fetches WCL's per-player `rankPercent`, `rank`, `totalParses`, `bracketData` and fight `speed`/`execution` in `report.rankings` and discards all but `partition`; surfacing it costs zero extra API calls and replaces today's *estimated* percentile with WCL's real one.
3. RPGLogs' API ToS (read via snippets; page is 403) defines commercial use to include **advertising** and requires **prior email approval**; RPGLogs may cap requests *and users served*. **Phase 4 (Ads Live) already triggers this — send the approval email before Phase 4 ships**, and cover the rankings surface in it.
4. Rate budget is ~3,600 points/hour (more on paid tiers): enough for demand-driven, cached slices; not enough to mirror WCL's leaderboards — never crawl the catalogue.
5. All field names and response shapes for character/guild/encounter rankings are verified from RPGLogs' own SDK repo; All Stars is confirmed at 120 possible points per boss (the 2016 percentile-based revision); a character's kill-by-kill `historicalPercent` history is available per boss.
6. Own ingestion is a second company: 50–500 MB per raid night, a patch-sensitive parser, workers/object storage, anti-cheat, GDPR controller status, and no comparison population on day one; every Classic tool reads WCL instead.
7. Keep parse/bracket/best-median/All Stars/speed/execution/attendance; simplify into one-sentence answers and 3–4 tiles; drop events browser, uploader, exhaustive leaderboards, competing percentiles; add Prep Score, Consistency, Improvement, role-normalised "who carried", Boss Coaching Score, Guild Readiness, speed-vs-execution quadrant, weekly recap — all with published formulas.
8. IA: analyze-page decorations first, then `/rankings` hub + boss pages (which should *be* Phase 6's SEO-01 pilot set), then character and guild pages indexed only when they carry ParseForge-computed content; protected elements and param-free canonicals untouched.
9. Architecture stays Vercel + Upstash for R1–R3 (on-demand slices, single-flight, 6–24 h TTL, `rateLimitData` budget gate at 90 %); Postgres only when kill/prep history is needed (R4+); no new infra class.
10. Phases: **R0 now** (ToS read + approval email, probe/fixtures shared with WOW-FOREVER F0-1, types + lens engine) → **R1 tracer** (Parse column + speed/execution badges + real percentile, zero new calls) → R2 coaching/Prep → R3 boss pages (with Phase 6) → R4 character → R5 guild → R6 recap; nothing past R0 executes until the RPGLogs reply is on file.

