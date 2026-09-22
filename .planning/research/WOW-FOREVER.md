# World of Warcraft: Forever — support research for ParseForge

**Researched:** 2026-09-18
**Domain:** WCL game-version onboarding · wago.tools era regeneration · expansion assumptions in the codebase
**Confidence:** MEDIUM overall — HIGH on what Forever is and on wago.tools data; LOW on Warcraft Logs exposure (the WCL site and API docs block automated reads and no WCL credentials exist locally, so the negative could not be proven).
**Status of this file:** untracked planning research (not committed). No files under `app/`, `lib/`, `scripts/`, `docs/` were modified.

Provenance tags: `[VERIFIED: …]` = confirmed by a tool this session from an authoritative source; `[CITED: …]` = official/primary documentation read this session; `[ASSUMED]` = inference or community/secondary source — needs confirmation before it becomes a locked decision.

---

## 1. What "World of Warcraft: Forever" is (as of 2026-09-18)

| Fact | Value | Provenance |
|---|---|---|
| Announced | BlizzCon 2026, 12 Sep 2026, by WoW VP Holly Longdale | [CITED: en.wikipedia.org/wiki/World_of_Warcraft:_Forever; massivelyop.com 2026-09-12] |
| What it is | A third, permanent branch of WoW alongside Retail and Classic. Vanilla (2004) ruleset and world, **level cap 60 "indefinitely"**, separate continuity set in WoW's first year (after *Warcraft III Reforged: Forsaken Kingdom*, before Molten Core). Blizzard's own take on "Classic+". | [CITED: warcraft.wiki.gg/wiki/World_of_Warcraft:_Forever; news.blizzard.com article 24304160] |
| Beta | 17 Sep 2026 → 21 Oct 2026 (last full day). Level cap 20 at start, raised to 30 later. Beta content: Skyborne + Zephras Isle, dungeons Hall of Thanes (13–18) and Ruins of Lordaeron (15–20), all zone content to 20; a "Server Slam" later. Nothing carries over. | [CITED: news.blizzard.com/en-us/article/24304160/the-world-of-warcraft-forever-beta-now-live] |
| Launch | 4 Nov 2026 (Blizzard: 3:00 p.m. PT; Icy Veins: 23:00 UTC). Early name reservation 27 Oct–3 Nov for upgrade owners. | [CITED: Blizzard article 24304160; icy-veins.com/wow-forever/] |
| Access | Included with an active subscription / game time; optional Skyborne Heroic/Epic packs and "Warcraft Forever Collection" (Epic Pack $59.99 and Collection $79.99 grant beta access). Skyborne race is the paid exception. | [CITED: warcraft.wiki.gg; gamespot via search] |
| Classes | Exactly the nine vanilla classes: Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock, Druid — no DK/Monk. | [VERIFIED: wago.tools `ChrClasses` CSV for build 1.60.1.69913 — 9 data rows, names quoted verbatim above] |
| New race | Skyborne (both factions). `ChrRaces` rows `95,Sb,Skyborne,"High Order Skyborne"` and `96,Sb,Skyborne,"Windshaper Skyborne"`. New race/class combos (e.g. Forsaken Paladin, Dwarf Shaman, Human Druid, Orc Mage). | [VERIFIED: wago.tools `ChrRaces` CSV 1.60.1.69913]; combos [CITED: Wikipedia; warcraft.wiki.gg] |
| Talents | Three trees per class, **51 points at 60**, seven rows; one-point "gold" talents at 11/21/31 plus a **new one-pointer at 16**. Trees heavily rewritten (community count: 111 new / 284 rewritten of 469 — treat as approximate). Tree *names* are unchanged from Classic. | Tree count/names [VERIFIED: wago.tools `TalentTab` CSV 1.60.1.69913 — 27 rows, e.g. `281,"Feral Combat",DruidFeralCombat`, `361,"Beast Mastery",HunterBeastMastery`]; 51-point/16-row claims [CITED: lfcarry.com talent guide quoting Principal Designer Kris Zierhut, updated 2026-09-17] — [ASSUMED] until checked against the release client |
| Legacy system | Separate "Legacy" trees fed by Legacy Points (16 per character at launch, three trees) earned via achievement-like Legacy Challenges; does **not** consume the 51 talent points. | [CITED: icy-veins.com/wow-forever/legacy-system; wowhead forever news 382842 via search] — [ASSUMED] for exact numbers |
| New zones | Mount Hyjal, Riverglades, Shen'dralas, Zephras Isle, Dalaran (Alterac Mountains). | [CITED: warcraft.wiki.gg]; `Map` rows `2991,"Zephras Isle"`, `2997,"Darkspear Islands"`, `2817,"Starfall Barrow Den"` [VERIFIED: wago.tools `Map` CSV 1.60.1.69913] |
| Dungeons (9) | Hall of Thanes, Ruins of Lordaeron, Wetlands Dig Site, Dalaran, The Drowned City, Krol'dok Stronghold, Alcaz Prison, Blackmaw Hold, Shaper's Terrace. | [CITED: warcraft.wiki.gg] |
| Raids | Launch client has none open. **First raid unlock 9 Dec 2026**: Barrow Deeps (10-player), Hyjal Summit (20-player), Onyxia's Lair (40-player). Spring 2027: two new raids (10 + 20). Summer 2027: "revamped iconic raid" + another raid. Hardcore mode between 2026–27. Datamine: Hyjal Summit 13 encounters, Barrow Deeps 8. | [CITED: icy-veins.com/wow-forever/news/warcraft-forever-roadmap-unveils-raid-unlocks-and-major-updates/]; encounter counts [ASSUMED — wowforeverbuilds.com datamine] |
| Other systems | Healing potions crafted via First Aid; crafted tier sets; GDKP banned; seven party buffs expanded to raid-wide (datamine); no gem sockets (see §3). | [CITED: icy-veins]; raid-wide buffs [ASSUMED — datamine]; no gems [VERIFIED: §3] |
| Client / patch line | **Patch 1.60.1**. Beta builds `1.60.1.69876` (wago created 2026-09-16), `1.60.1.69893` (2026-09-16), `1.60.1.69913` (2026-09-18 03:02 UTC). wago config description: `WOW-69913patch1.60.1_ForeverBeta`. Wowhead also labels the Forever section "Patch 1.60.1". | [VERIFIED: wago.tools/api/builds + wago.tools/builds page]; Wowhead label [CITED: wowhead.com/forever/guide/content-release-roadmap header] |
| Realms | One mega-realm per region, players split by ruleset (Normal/PvP/RP/Hardcore). | [CITED: warcraft.wiki.gg] — [ASSUMED] pending launch |

**Important disambiguation:** wago.tools also lists a product `wow_classic_titan` at `3.80.2.69874` (description `WOW-69874patch3.80.2_ClassicTitan`). That is **Titan Reforged**, the China-only Classic variant (WCL hosts it at `titan.warcraftlogs.com`, "Warcraft Logs Titan Reforged"; Archon: "WoW – CN Classic Titan Reforged"). It is **not** Forever — its DB2 dump contains no Skyborne/Zephras/Barrow rows. [VERIFIED: wago.tools descriptions; titan.warcraftlogs.com title via search; grep of the 3.80.2 SpellName/ItemSparse/ChrRaces/Map CSVs = 0 hits]

---

## 2. Warcraft Logs exposure status

**Bottom line: not observed as exposed as of 2026-09-18 — and this is an *unverified negative*.** WCL (www/classic/vanilla/fresh/sod/titan) returns HTTP 403 to every automated fetch (WebFetch and curl with a browser UA), the v2 API docs (`/v2-api-docs/warcraft/*.doc.html`, also the fflogs mirror) return 403, and no WCL client credentials exist locally (`.env.example` only, in both repo root and `bot/`), so `worldData.expansions` could not be queried. Blizzard's beta article does not mention combat logging or addons at all. [VERIFIED: probes this session]

What *was* observable:

| Signal | Result | Provenance |
|---|---|---|
| `forever.warcraftlogs.com`, `camelot.warcraftlogs.com` | **NXDOMAIN** (no DNS record). Random names also NXDOMAIN, so WCL has no wildcard — a Forever subdomain would show up in DNS when it exists. | [VERIFIED: `dig +short` this session] |
| `titan.warcraftlogs.com`, `vanilla.`, `fresh.`, `sod.`, `classic.` | resolve (Cloudflare 104.26.15.246 / 172.67.72.60) — existing game versions. `titan` = Titan Reforged (CN), not Forever. | [VERIFIED: dig + search result titles] |
| WCL / Archon announcements about Forever | none found in six web searches (Archon, Kihra, Reddit, Discord, Wowhead). | [VERIFIED: searches this session — absence of evidence only] |
| Precedent | SoD was surfaced on `vanilla.warcraftlogs.com`; Anniversary/Fresh got `fresh.warcraftlogs.com`; Titan Reforged got `titan.`. Each variant got its own subdomain + zones + partitions. WCL does not normally rank beta logs. | [CITED: archon.gg SoD article title via search] — [ASSUMED] for the "no beta rankings" part (article body was 403) |

**Timeline implication (inferred):** even if WCL adds a Forever game version at launch (4 Nov 2026), there is nothing to rank until raids open on **9 Dec 2026**; meaningful `characterRankings` (the input to ParseForge's core comparison) will exist only after that. The earliest realistic date for a useful ParseForge Forever release is mid-December 2026. [ASSUMED]

**How the v2 API currently encodes versions (from this repo, which runs against production WCL):**
- `report.zone { id name expansion { id } }` — Classic expansion ids `1000 Classic, 1001 TBC, 1002 Wrath, 1003 Cata, 1004 Mists` — quoted verbatim from `lib/constants.ts:469-476`: `1000: "classic", 1001: "tbc", 1002: "wrath", 1003: "cata", 1004: "mists"`. [VERIFIED: lib/constants.ts:464-476 read this session]
- `report.rankings(fightIDs:)` rows carry `"partition": 2` and `"zone": 1056` and a per-player `"expansion": "tbc"` string. [VERIFIED: lib/__fixtures__/demo-player-dps.json:517-521 and :2246, recorded 2026-09-07]
- `worldData.encounter(id).characterRankings(partition: $partition, …)` — partition scoping already implemented (`app/api/analyze/route.ts:223-239`). [VERIFIED: read this session]
- The API endpoint is one URL for every game version: `https://www.warcraftlogs.com/api/v2/client` (`lib/constants.ts:117`). The app already serves Era, SoD, Anniversary, Wrath and Cata reports through it, so a Forever report will almost certainly arrive through the same endpoint with a **new `expansion.id`** and new zone/encounter ids. [VERIFIED: constants.ts:117; app copy at app/page.tsx:106-107] — new id value [ASSUMED]

**Exact unblock signal to watch (two conditions, both needed):**
1. **WCL:** `worldData { expansions { id name zones { id name partitions { id name } encounters { id name } } } }` returns an expansion whose zones include *Barrow Deeps*, *Hyjal Summit* or a Forever *Onyxia's Lair* (or a Forever-named expansion). Secondary tells: a new `*.warcraftlogs.com` subdomain appearing in DNS (`dig +short forever.warcraftlogs.com`), and Archon adding a "WoW – Forever" section.
2. **wago.tools:** a `1.60.x` build under a *non-beta* product (today Forever lives only under the shared `wow_classic_beta` channel, description suffix `_ForeverBeta`).

---

## 3. wago.tools coverage of the Forever client

**Yes — wago.tools already serves DB2 CSV exports for the Forever beta client**, and the tables the regen pipeline uses are present, with one exception. [VERIFIED: HTTP probes 2026-09-18 against `https://wago.tools/db2/<table>/csv?build=1.60.1.69913`]

| Table | HTTP | Rows (excl. header) | Notes |
|---|---|---|---|
| `SpellItemEnchantment` | 200 | 2,216 | comparable to Classic+TBC's 2,041 derived names |
| `SpellName` | 200 | 31,767 | Anniversary 2.5.6.69795 has 28,695 — Forever adds ~3k spells |
| `SpellEffect` | 200 | 42,449 | |
| `ItemSparse` | 200 | 19,172 | contains "Skyborne" ×26, "Barrow Deeps" ×6, "Hyjal Summit" ×2 |
| `GemProperties` | **404** | — | **table does not exist in the 1.60.1 client.** `ItemSparse.Gem_properties` is `0` on every row; `SocketType_0` is non-zero on only 18 rows (likely placeholders — flag for the audit) |
| `Talent` / `TalentTab` / `ChrClasses` / `ChrRaces` / `Map` / `AreaTable` | 200 | 432 / 27 / 9 / 58 / 75 / 1,372 | Forever-only content confirmed (§1) |
| `JournalInstance` | 404 | — | vanilla-line client has no journal — encounter ids must come from WCL, not the client |

**Product/build resolution facts that matter for `scripts/regen-game-data.mjs`:**
- Forever beta builds are published under **`wow_classic_beta`**, a *shared* beta channel — the same product key carried `5.5.0.62071` (MoP Classic beta) until this month. The script's `product + versionPrefix` matcher (`resolveEraBuild`, script lines 280-293) therefore needs `versionPrefix: "1.60."` to be safe; `product` alone would be wrong the next time Blizzard runs a different Classic beta. [VERIFIED: /api/builds snapshots taken ~1h apart this session showed `wow_classic_beta` latest = `5.5.0.62071` (cached) then `1.60.1.69913`]
- The release product key is **unknown** (Blizzard may introduce a new product such as a `wow_forever`-style key, or reuse `wow_classic_era`). Do not hard-code it before launch. [ASSUMED]
- Beta data is **partially encrypted** — a community datamine reports items/spells "double-encrypted with 8 keys withheld from the client" in build 69893. A module generated from the beta would be incomplete and could shift before launch. Generate for inspection (`--report`) only; commit an era module only from a release build. [ASSUMED — wowprivateservers.vercel.app datamine via search; not an authoritative source]
- Consumable coverage looks vanilla-like: `SpellName` contains "Flask of" ×24 (Anniversary 36), "Elixir of" ×79 (61), "Well Fed" ×31 (38), "Sharpening Stone" ×7 (8), "Rumsey" ×7 (6). Forever adds/changes consumables (healing potions via First Aid), so `CONSUMABLE_CURATION` in `lib/generated/game-data-overrides.json` will need Forever rows — that is product judgment (allowed under D-11) but every id must come from the wago dump. [VERIFIED: grep counts this session]
- Whole-client ID reuse (the reason for the Classic/TBC-first precedence rule) is the central design risk: Forever is a *fork of the vanilla id space* that then adds ~4.9k items / ~3.5k spells. Ids that overlap Classic Era will mostly mean the same thing; **new Forever ids may collide with unrelated TBC/WotLK/Cata ids** and, under the current first-resolved-era-wins composition (`lib/generated/index.ts:60-70`), would silently resolve to the TBC/WotLK name. The composed single-map design cannot express "this report is Forever, so prefer the Forever module". [VERIFIED: index.ts read this session] — collision rate [ASSUMED] until `--report` enumerates it

---

## 4. Codebase impact map (where expansion assumptions live)

All line numbers are from files read this session.

| File | What is encoded | Forever impact |
|---|---|---|
| `lib/url-parser.ts` | `parseWCLUrl` is host-agnostic (matches `/reports/<10–20 alnum>` on any host, or a bare code). `buildWCLUrl` hard-codes `https://classic.warcraftlogs.com/reports/…` (line ~85). Header comment: byte-identical copy at `bot/src/util/parse-url.ts` — port changes to both. | Parsing Forever URLs already works if the report-code format is unchanged. `buildWCLUrl` will deep-link Forever reports to the wrong subdomain (WCL cross-subdomain redirect behaviour [ASSUMED]). Tests in `lib/url-parser.test.ts:13-63` only cover `classic.`/`www.`. |
| `bot/src/index.ts:141` | URL regex `https?:\/\/(?:classic\.)?warcraftlogs\.com\/reports\/…` | **Already rejects `vanilla.`/`fresh.`/`sod.` links and would reject a Forever subdomain** — widen to `(?:[a-z]+\.)?`. `bot/src/commands/analyze.ts:17`, `raid.ts:16`, `util/parse-url.ts:89` hard-code `classic.`. |
| `lib/wcl-client.ts` | Single endpoint `WCL_API_URL`; OAuth; retries; error classification. No game-version logic. | No change expected [ASSUMED: Forever served by the same v2 endpoint]. |
| `lib/wcl-queries.ts` | `REPORT_META_QUERY`/`ENCOUNTER_META_QUERY` fetch `zone { id name expansion { id } }`; `ENCOUNTER_RANKINGS_QUERY` takes `$partition`; player queries fetch `rankings(fightIDs:)` for the partition. | Shape-compatible. Add `worldData` discovery query (expansions → zones → partitions/encounters) for the probe script (§5, F0-1). |
| `lib/wcl-fetchers.ts`, `lib/wcl-helpers.ts` | Top-player fetch keyed by ranking report codes; spec parsing from `playerDetails`. | No expansion assumptions. Verify Forever `playerDetails.specs`/`icon` strings once a report exists (new specs are not expected — same 27 trees). |
| `lib/constants.ts:161-193, 449-506` | `WowheadDomain = "classic"\|"tbc"\|"wrath"\|"cata"\|"mists"`; `EXPANSION_ID_TO_DOMAIN` (1000–1004); zone-name fallback lists (`CLASSIC_ZONE_NAMES` includes SoD/Anniversary names); `CLASS_TALENT_TREES` order per class; `WOWHEAD_URL_DOMAIN` (`wrath→wotlk`, `mists→mop-classic`); `HEALER_SPECS`; `ROLE_MAP`. `getWowheadDomain` defaults to `"classic"` for an unknown expansion id — so **an unrecognised Forever id silently resolves to the Classic Era DB**, which is wrong for Forever-native items/enchants. | Add `"forever"` domain + expansion id (from WCL) + zone names (Barrow Deeps, Hyjal Summit); map to Wowhead's Forever env key (Wowhead runs `wowhead.com/forever/database` — env key [ASSUMED]); verify `CLASS_TALENT_TREES` order against `TalentTab.OrderIndex` for 1.60. **No unit test covers `getWowheadDomain` today** (`lib/constants.test.ts` has zero `Domain`/`expansion` references) — gap. |
| `lib/cla-constants.ts:85-160, 226-236` | `CLASS_BUFF_FAMILIES[].expansions` gating (e.g. Blessing of Salvation `["classic","tbc"]`, Divine Spirit `["classic","tbc","wrath"]`; families without the key apply everywhere); `EXPECTED_TALENT_POINTS` (`classic: 51, tbc: 61, …`). | Add `forever: 51` (verify); review buff families against Forever's raid-wide party buffs and rewritten spells (new spell ids for reworked buffs are plausible). |
| `lib/generated/*` + `scripts/regen-game-data.mjs` | `ERAS` has exactly three descriptors; `TABLES` fixed at five incl. `GemProperties`; `fetchAllTables` throws on any non-200 (script lines 366-372, 376-380); `ROW_FLOORS` require ≥100 gem rows and "a zero-row map is always fatal"; composition is Classic+TBC → WotLK → Cata, first-wins. | Needs: (a) a Forever era descriptor (`product: "wow_classic_beta"` for now, `versionPrefix: "1.60."`, `suffix: "FOREVER"`); (b) per-era optional tables / `hasGems: false` so a missing `GemProperties` and zero gem rows are *expected*, not fatal; (c) a **domain-scoped lookup** (a Forever report consults the Forever map first) instead of adding Forever to the global first-wins chain — otherwise the pinned facts for 2667/3003/32196 in `lib/cla-constants.test.ts:19-88` and Forever-native ids fight over the same map; (d) `docs/GAME-DATA-AUDIT.md` regenerated with the new era. |
| `lib/analysis-engine.ts:165, 245-262, 1297` | Default `wowheadDomain = "tbc"`; tree-based talent detection (`≤3 entries`, unnamed) using `CLASS_TALENT_TREES`. | Forever keeps 3-tree talents, so the tree path applies. Check that the 16-point one-pointer/new talents do not change the `playerDetails.talents` shape (3 entries of points). |
| `lib/cla-engine.ts:410, 512` | Buff family expansion filter; `EXPECTED_TALENT_POINTS[wowheadDomain]` — `undefined` for an unknown domain. | Add a test asserting behaviour for an unknown domain (skip vs. false warning) and add `forever`. |
| `lib/raid-overview-engine.ts`, `lib/healer-metrics.ts`, `lib/timeline-engine.ts`, `lib/awards-engine.ts` | No expansion references (grep: zero hits in awards-engine; raid-overview route has no `getWowheadDomain`). | None expected; cover with a Forever fixture run. |
| `app/api/analyze/route.ts:191-239`, `app/api/cla/route.ts:87` | Domain resolution from client-supplied `zoneExpansionId`/`zoneName` or `ENCOUNTER_META_QUERY`; partition taken from `report.rankings.data[fightID].partition`. | Works generically once `EXPANSION_ID_TO_DOMAIN` knows Forever. Confirm Forever rankings rows carry `partition` (they should — WCL partitions Classic zones by phase). |
| `lib/wcl-types.ts:29, 584, 597`, `lib/report-meta.ts:17`, `app/analyze/[reportCode]/hooks/usePlayerAnalysis.ts:51` | `zoneExpansionId` plumbed SSR → client → API. | No change. |
| `lib/__fixtures__/*`, `scripts/record-wcl-fixtures.mjs` | Recorder hard-codes the demo report `ZjKgNYxVcAqR8pGJ` / fight 23 / source 12 and its six fixture names. | Needs a `--report/--fight/--source/--prefix` mode to record a **public** Forever report as `forever-*.json`, then engine tests parameterised over both fixture sets. Public-report rule in `lib/__fixtures__/README.md` applies. |
| `lib/demo-report.ts`, `app/og/route.tsx:343-348`, `app/opengraph-image.tsx:4,81`, `app/manifest.ts:8` | Demo report is a TBC log; OG copy says "WoW Classic". | Copy is generic enough ("Classic" umbrella); optional Forever demo later. |
| UI/SEO copy — `app/layout.tsx:31-81` (title "Free WoW Classic & TBC Log Analyzer", keywords), `app/components/LandingHero.tsx:73,160`, `app/page.tsx:106-107`, `app/components/Navbar.tsx:105,169`, `app/components/ReportUrlForm.tsx:25,93,96`, `app/tbc-audit/page.tsx:107` (FAQ list of supported versions), `app/analyze/[reportCode]/page.tsx:73` ("— WoW Classic Raid Analysis"), `ReportSummary.tsx:48,107`, `AnalyzeClient.tsx:178`, `FeaturedReports.tsx:63` | Supported-version lists and hard-coded `classic.warcraftlogs.com` outbound links. | Widen lists to include Forever; route outbound WCL links through one helper that picks the subdomain by domain. Title-length rule from PROJECT.md (child titles < ~47 chars) still applies. |
| `app/guides/*`, `app/sitemap.ts` | Five guides, all Classic/TBC framed. | Phase 6 candidate: one Forever tool-intent guide — **segment the cluster first** (`"forever logs"` = navigational/unwinnable; `"forever log analyzer" / "parse" / "audit"` = tool intent) per the hard-won rule in PROJECT.md. |
| PostHog/OPS-01 | `analysis_complete` etc. carry no expansion property (not checked exhaustively). | Add a low-cardinality `expansion_domain` property so the Forever launch can be measured (OPS-01 ships with the change, not after). [ASSUMED: property absent — verify in `lib/analysis-history.ts`/hooks before planning] |

---

## 5. Work breakdown (GSD-sized)

Recommended shape: one small **unblocked prep phase now**, then **gated phases** inserted as decimal phases when the signal fires (ROADMAP convention: decimal = inserted; Phase 3 Share Loop is active, Phase 6 Discoverability is the natural SEO home).

### Phase F0 — Forever readiness (actionable now, no upstream dependency; ~4 plans)

| Plan | Deliverable | Verification |
|---|---|---|
| **F0-1 WCL discovery probe** | `scripts/probe-wcl-game-versions.mjs`: mints a token from env (same secrets discipline as `record-wcl-fixtures.mjs`, never prints secrets), queries `worldData { expansions { id name zones { id name expansion{id} partitions{id name} encounters{id name} } } }`, prints a compact table, exits 1 if any zone/expansion name matches `/forever\|barrow deeps\|hyjal summit/i` (so it doubles as the unblock detector). Also snapshots the expansion-id list into `docs/WCL-GAME-VERSIONS.md` for review. | Run against prod creds via `vercel env pull` to a scratch dir (README procedure); output lists 1000–1004 today; `npx tsc --noEmit` untouched (plain `.mjs`). |
| **F0-2 Regen generalisation (no data change)** | `scripts/regen-game-data.mjs`: per-era `optionalTables`/`hasGems` flag; missing `GemProperties` tolerated only for eras that declare it; `ROW_FLOORS` per era may set gem floors to 0 *only* with `hasGems:false`; a fourth era descriptor `forever` (`wow_classic_beta`, `1.60.`, `lastKnownBuild: "1.60.1.69913"`) that is **report-only** until a `--enable-forever` flag (never writes `game-data.forever.ts` by default). | `npm run regen-game-data -- --report` still produces identical Classic+TBC/WotLK/Cata output (diff `docs/GAME-DATA-AUDIT.md` = build-line only); Forever section of the report lists row counts, enchant-id collisions vs. the three eras, and the 18 `SocketType_0` oddities; `npx vitest run lib/cla-constants.test.ts` and `lib/generated/game-data.test.ts` green and unmodified. |
| **F0-3 Domain-scoped lookup + tests** | `lib/generated/index.ts` exposes `lookupEnchantName(id, domain)` / `lookupGem…(id, domain)` / `lookupConsumable(id, domain)` that consult a per-domain map first, then the composed map; `lib/cla-constants.ts` thin re-exports stay byte-compatible for existing callers; **new** `lib/constants.test.ts` cases for `getWowheadDomain` (each known id, unknown id → `"classic"`, combined "SSC / TK" name) and `cla-engine` unknown-domain talent behaviour. | Full `npm test` green; pinned facts 2667/3003/32196 unchanged; snapshot of `CONSUMABLE_DB` size unchanged; `npm run lint` adds no findings. |
| **F0-4 WCL link helper + bot regex** | `lib/wcl-links.ts` (or extend `url-parser.ts`) `wclReportUrl(code, {fightId, sourceId, domain})` mapping domain → subdomain (`classic` default; table extendable); replace the four hard-coded `classic.warcraftlogs.com` sites (`ReportSummary.tsx:107`, `AnalyzeClient.tsx:178`, `Navbar.tsx:105`, `url-parser.ts buildWCLUrl`); widen `bot/src/index.ts:141` to `(?:[a-z]+\.)?warcraftlogs\.com` and port to `bot/src/util/parse-url.ts`. | `lib/url-parser.test.ts` gains `vanilla.`/`fresh.`/`sod.`/hypothetical `forever.` cases; `npm run seo-invariants` and `npm run protected-elements` unchanged; preview deploy click-through of a report's "Open on Warcraft Logs" link. |

F0 is deliberately data-free: it removes every *structural* blocker so the gated phases become mostly "add rows and record fixtures".

### Phase F1 — Era detection & rankings (**gated on WCL exposure**, ~3 plans)

| Plan | Deliverable | Verification |
|---|---|---|
| F1-1 Expansion mapping | `EXPANSION_ID_TO_DOMAIN[<forever id>] = "forever"`, `WowheadDomain` union + `WOWHEAD_URL_DOMAIN` entry (verify Wowhead env key by loading a `/forever` tooltip), zone names, `EXPECTED_TALENT_POINTS.forever`, `CLASS_TALENT_TREES` order checked against `TalentTab.OrderIndex`. | Unit tests from F0-3 extended; `npx tsc --noEmit`. |
| F1-2 Forever fixtures | Record a **public** Forever raid report (post 9 Dec 2026) with the extended recorder as `lib/__fixtures__/forever-*.json`; README provenance section. | `fixtures.test.ts` shape assertions pass for both sets; rankings rows show a numeric `partition`; `getWowheadDomain` returns `"forever"` for the recorded `zone.expansion.id`. |
| F1-3 Partition-aware comparison proof | `app/api/analyze` end-to-end on the Forever fixture: rankings scoped to the report's partition; spec/role detection for all 9 classes; healer path. | Engine tests green; preview deploy run on the real report; PostHog `analysis_complete` carries `expansion_domain: "forever"`. |

### Phase F2 — Forever game data (**gated on a release client build on wago.tools** + F1, ~3 plans)

| Plan | Deliverable | Verification |
|---|---|---|
| F2-1 Era module | Flip `--enable-forever`; resolve the *release* product/prefix; generate `lib/generated/game-data.forever.ts`; regenerate `docs/GAME-DATA-AUDIT.md`; enumerate and disposition every cross-era collision (domain-scoped lookup from F0-3 makes Forever-native ids win only for Forever reports). | Row floors met; collision list reviewed by a human (WINDOWS.md entries for anything unresolved); existing era outputs byte-identical. |
| F2-2 Consumable curation | Forever rows in `game-data-overrides.json` `consumables` (categories/suboptimal/better-alternative are product judgment; ids and names wago-derived); First-Aid potions decision. | `regen` source-note gate passes; CLA fixture audit shows expected flasks/elixirs/food for the recorded raid. |
| F2-3 Buff families & talents | Review `CLASS_BUFF_FAMILIES` against Forever spell ids (rewritten/raid-wide buffs); add `expansions` gating where Forever differs; talent point expectation verified from the recorded fixture. | `cla-engine.test.ts` Forever cases; no regression in TBC fixture cases. |

### Phase F3 — Surface & SEO (**gated on F1/F2**, ~2 plans; fold into Phase 6 if still open)

| Plan | Deliverable | Verification |
|---|---|---|
| F3-1 Copy + links | Supported-version lists (`LandingHero`, `page.tsx`, `Navbar`, `ReportUrlForm`, `tbc-audit` FAQ), `layout.tsx` metadata (keep title < 47 chars pre-template), OG alt text, Forever subdomain in the link helper. | `npm run seo-invariants` diff vs prod; rendered-title check; `protected-elements` gate. |
| F3-2 Forever guide + measurement | One tool-intent guide (after intent segmentation of the `forever` cluster in GSC), sitemap entry, internal links from home/guides hub; PostHog + GSC verification per OPS-01 (`docs/OPS-01-SHIP-GATE.md`, live-traffic item 7). | Guide indexed in GSC within the 4–6-week window; `expansion_domain` events counted. |

---

## 6. Open questions & blockers

1. **Will WCL expose Forever, when, and under which expansion id / subdomain?** — Blocker for F1. No public statement found; WCL blocks automated reads. Resolve with F0-1 (probe) or by a developer opening `https://www.warcraftlogs.com/` game-version switcher in a browser. [unverified negative]
2. **Which wago.tools product will carry the *release* client?** — Blocker for F2. Today only `wow_classic_beta` (shared channel). Resolve by polling `https://wago.tools/api/builds` for a `1.60.x` build outside `wow_classic_beta` after 4 Nov 2026. [ASSUMED]
3. **Wowhead tooltip env key for Forever** (`WOWHEAD_URL_DOMAIN`) — Wowhead has a `/forever` database, but the `tooltips.js` EnvKey string is unverified. Resolve by inspecting a Wowhead Forever item URL/tooltip attribute. [ASSUMED]
4. **Does WCL rank Forever *dungeons* before 9 Dec?** (SoD precedent: level-band "raids" like BFD were ranked.) Affects whether anything is analysable at launch. [ASSUMED]
5. **Talent payload shape** — do rewritten trees / the 16-point one-pointer change `playerDetails.talents` (3 tree-point entries)? Only a real report answers this. [ASSUMED]
6. **Cross-era id collisions for Forever-native content** — magnitude unknown until F0-2's `--report` enumerates it. The domain-scoped lookup (F0-3) is the mitigation regardless of the number.
7. **Beta encryption** — 8 withheld keys mean beta DB2 dumps are incomplete; never commit a Forever era module from a `_ForeverBeta` build. [ASSUMED — community datamine]
8. **`SocketType_0` non-zero on 18 Forever items despite no `GemProperties` table** — probably placeholder rows; must be listed in the audit rather than guessed at.
9. **Bot parity** — `bot/` is a separate package with its own duplicated parser and a stricter host regex; every URL change needs a mirrored bot change (and the bot is deployed separately — Dockerfile present). Confirm who deploys the bot.
10. **PostHog `expansion_domain`** property — assumed absent; verify before planning F1-3.

---

## 7. Recommendation

**Still blocked for everything that depends on upstream data (F1–F3); a small, cheap prep slice (F0) is actionable now.**

- Do **F0-1 (probe)** and **F0-2 (regen generalisation, report-only)** now or soon — both are low-risk, touch no shipped behaviour, and turn "watch for the signal" into one command each (`node scripts/probe-wcl-game-versions.mjs`; `npm run regen-game-data -- --report`). F0-2 also surfaces the Forever collision picture from the beta dump months early.
- F0-3 and F0-4 are sensible hardening (a real test gap on `getWowheadDomain`; the bot already rejects `vanilla.`/`fresh.`/`sod.` links) but are optional until the signal.
- Do **not** hand-type any Forever ids, add a `1005`-style guess to `EXPANSION_ID_TO_DOMAIN`, or commit a Forever era module from a beta build. Both would violate the accuracy constraint ("no hand-typed ID maps"; "a wrong recommendation is worse than no recommendation").
- Re-check the signal on three dates: **4 Nov 2026** (launch — WCL game version + release client on wago), **9 Dec 2026** (raids — rankings/partitions), and **21 Oct 2026** (beta ends — last chance to inspect the beta dump if useful). Insert F1 as a decimal phase after whichever phase is active when condition 1 (WCL) is true; F2 when condition 2 (release build) is true.

**Exact unblock signal:** `worldData.expansions` (via F0-1) lists an expansion with Forever zones (Barrow Deeps / Hyjal Summit / Onyxia's Lair under a Forever expansion) **and** `https://wago.tools/api/builds` lists a `1.60.x` build under a non-beta product. Until both hold, this stays a pending todo.

---

## Assumptions log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | Forever reports will arrive through the same v2 endpoint with a new `zone.expansion.id` (not a separate API/game-version parameter) | §2, §4 | wcl-client/queries need a game-version argument — F1 scope grows |
| A2 | WCL will not rank beta logs; rankings start with the 9 Dec raid unlock | §2 | Earlier start possible — only changes timing |
| A3 | Release client will move off `wow_classic_beta` to a new/other product | §3 | Regen descriptor must be re-pointed at launch — F2-1 |
| A4 | Beta DB2 dumps are incomplete due to withheld encryption keys | §3, §6 | If wrong, a beta-derived module would merely be early, not incomplete |
| A5 | 51 talent points at 60 and a new 16-point one-pointer; tree order unchanged | §1, §4 | `EXPECTED_TALENT_POINTS.forever`/`CLASS_TALENT_TREES` wrong → false talent warnings |
| A6 | Wowhead tooltips accept a `forever` env key | §4, §6 | Tooltips/icons fail on Forever reports until the key is found |
| A7 | `playerDetails.talents` keeps the 3-entry tree-points shape | §4, §6 | Talent analysis path mis-detects; needs a fixture |
| A8 | `expansion_domain` is not yet a PostHog event property | §4 | Only affects F1-3 sizing |
| A9 | Encounter counts (Hyjal Summit 13, Barrow Deeps 8) and raid-wide party buffs — community datamine | §1 | Cosmetic for planning |
| A10 | WCL cross-subdomain redirects make `classic.warcraftlogs.com` deep-links to Forever reports work | §4 | Broken outbound links until F0-4 ships |

## Sources

**Primary / verified this session**
- wago.tools `https://wago.tools/api/builds` (products, versions, timestamps) and `https://wago.tools/builds?product=wow_classic_titan` (config descriptions `WOW-69913patch1.60.1_ForeverBeta`, `WOW-69874patch3.80.2_ClassicTitan`) — 2026-09-18
- wago.tools DB2 CSV exports for build `1.60.1.69913`: SpellItemEnchantment, SpellName, SpellEffect, ItemSparse, ChrRaces, ChrClasses, Map, AreaTable, Talent, TalentTab (200) · GemProperties, JournalInstance (404); control build `2.5.6.69795` SpellName and `3.80.2.69874` tables
- `dig` DNS probes of `*.warcraftlogs.com`; HTTP probes of WCL site and v2 docs (403)
- Repo files read: `lib/url-parser.ts`, `lib/wcl-client.ts`, `lib/wcl-queries.ts`, `lib/wcl-fetchers.ts`, `lib/wcl-helpers.ts`, `lib/wcl-types.ts`, `lib/constants.ts`, `lib/cla-constants.ts`, `lib/generated/index.ts`, `scripts/regen-game-data.mjs`, `scripts/record-wcl-fixtures.mjs`, `docs/GAME-DATA-AUDIT.md`, `lib/report-meta.ts`, `lib/demo-report.ts`, `lib/analysis-engine.ts` (240-262), `lib/cla-engine.ts` (395-420), `app/api/analyze/route.ts` (180-260), `app/api/cla/route.ts` (80-92), `lib/__fixtures__/README.md` + `demo-player-dps.json`, `bot/src/*` greps, `.planning/ROADMAP.md`, `.planning/PROJECT.md`, `.planning/todos/pending/wow-forever-support.md`

**Official / cited**
- news.blizzard.com/en-us/article/24304160 — "The World of Warcraft: Forever Beta Now Live"
- warcraft.wiki.gg/wiki/World_of_Warcraft:_Forever; en.wikipedia.org/wiki/World_of_Warcraft:_Forever
- icy-veins.com/wow-forever/ and …/news/warcraft-forever-roadmap-unveils-raid-unlocks-and-major-updates/
- wowhead.com/forever/guide/content-release-roadmap (page header "Patch 1.60.1")

**Secondary (LOW confidence)**
- lfcarry.com/guides/wow-forever-talent-calculator (talent counts; Zierhut quote), wowforeverbuilds.com/wow-forever-beta (build-by-build datamine), wowprivateservers.vercel.app datamine (encryption), massivelyop.com 2026-09-12, search-result titles for titan.warcraftlogs.com / archon.gg

---

## RESEARCH COMPLETE

1. WoW: Forever = Blizzard's permanent "Classic+" branch: vanilla ruleset, level 60 cap, 9 classes, new Skyborne race, rewritten 51-point 3-tree talents + separate Legacy system; announced 12 Sep 2026, beta 17 Sep–21 Oct, launch 4 Nov 2026, first raids (Barrow Deeps 10, Hyjal Summit 20, Onyxia 40) unlock 9 Dec 2026.
2. Client line is patch 1.60.1 (builds 1.60.1.69876/69893/69913); wago.tools serves its DB2 tables today under the shared `wow_classic_beta` product, labelled `_ForeverBeta`.
3. `wow_classic_titan` 3.80.2 on wago and `titan.warcraftlogs.com` are Titan Reforged (China), not Forever — do not confuse them.
4. Warcraft Logs shows no observable Forever exposure as of 2026-09-18 (no subdomain in DNS, no announcement found); this is an unverified negative because WCL blocks automated reads and no WCL creds exist locally.
5. The regen pipeline is structurally blocked for Forever: `GemProperties` is absent (404) and gem floors/zero-row rules would fail; Forever has no gem sockets at all.
6. The global first-wins game-data composition cannot express "prefer Forever for Forever reports" — a domain-scoped lookup is needed before any Forever module lands.
7. `getWowheadDomain` silently maps unknown expansion ids to Classic Era (no tests exist for it); the Discord bot's URL regex already rejects non-`classic.` subdomains.
8. Proposed: F0 prep now (WCL probe script, regen generalisation report-only, domain-scoped lookup + tests, WCL link helper/bot regex), then gated F1 (era mapping + fixtures), F2 (era module + curation from a release build), F3 (copy/SEO/OPS-01).
9. Verdict: still blocked for anything needing upstream data; only F0-1/F0-2 are worth doing now, and no Forever ids may be hand-typed or generated from an encrypted beta build.
10. Unblock signal: `worldData.expansions` returns an expansion with Forever zones (probe script) AND wago.tools lists a non-beta 1.60.x build — re-check on 4 Nov and 9 Dec 2026.
