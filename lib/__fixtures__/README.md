# WCL Fixtures

Recorded real Warcraft Logs GraphQL responses used by this repo's engine tests
(`fixtures.test.ts`, `cla-engine.test.ts`, `raid-overview-engine.test.ts`,
`timeline-engine.test.ts`, `healer-metrics.test.ts` — plans 02-01 through
02-08). These are the exact shapes the engines consume in production, not
hand-built mocks, so a shape-changing regression fails a test instead of
silently drifting from reality.

## Provenance

- **Report:** `ZjKgNYxVcAqR8pGJ` — the public demo report from `lib/demo-report.ts`
  (the same report the landing page's "See a live example" button links to).
- **Fight:** 23
- **DPS source:** 12 (Samkin, Hunter — the demo report's featured player)
- **Healer source:** resolved at record time, not hardcoded — the recorder
  scans fight 23's `playerDetails` for the first player whose parsed spec is
  Restoration, Holy, Discipline or Mistweaver. For this recording that
  resolved to source id 32 (Zulakeyah, Restoration Shaman).
- **Recorded:** 2026-09-07
- **Public confirmation:** this report is publicly viewable — verified by
  opening `https://www.warcraftlogs.com/reports/ZjKgNYxVcAqR8pGJ` in a
  logged-out browser before committing these fixtures. **A fixture must never
  be recorded from a report that is not publicly viewable** — a committed
  fixture is permanent, world-readable data about named players who never
  consented to it. If this report is ever made private, these fixtures must
  be deleted, not kept.

## How to re-record

```bash
export PATH="$HOME/.local/node20/bin:$PATH"
vercel env pull "$SCRATCH/.env.wcl" --environment=production --scope loot-list-plus
set -a; . "$SCRATCH/.env.wcl"; set +a
npm run record-fixtures
rm -f "$SCRATCH/.env.wcl"
```

`$SCRATCH` is a throwaway directory outside the repo (e.g. the session
scratchpad). Never copy the pulled env file into the repo tree, and always
delete it once the recording run finishes — this is a live-credential file,
not a fixture.

## Files

| File | Query | Contents |
|---|---|---|
| `demo-player-dps.json` | `PLAYER_FULL_DATA_QUERY` | The DPS player-analyze path: damage/buffs/casts tables, combatant info, fight bounds |
| `demo-player-healer.json` | `PLAYER_FULL_DATA_QUERY_HEALING` + a second, un-scoped healing query | `reportData` holds the sourceID-scoped per-ability Healing breakdown; the sibling top-level `healingByPlayer` key holds the un-scoped per-player Healing row for the same fight (no `sourceID` argument) |
| `demo-raid-overview.json` | `RAID_OVERVIEW_QUERY` | Raid-wide damage/healing/damageTaken/deaths tables for all players |
| `demo-raid-combatant-info.json` | `RAID_COMBATANT_INFO_QUERY` | Raid-wide `CombatantInfo` events (gear/talents at pull, for every player) |
| `demo-raid-death-events.json` | `RAID_DEATH_EVENTS_QUERY` | Raid-wide death events. Fight 23 in this report has zero deaths, so `data` is a genuinely empty array — not a recording failure |
| `demo-timeline-casts.json` | new probe (`events(dataType: Casts, ...)`, `table(dataType: Casts, ...)`, `masterData.actors`) | `pages`: every recorded page envelope verbatim (pagination contract, not flattened); `pageCount`, `truncatedByCap`; `castsTable`: the aggregated Casts table for the same player (guid → name/icon resolution); `masterData`: the full actor list with no type filter (cast targets include NPCs) |

## Findings — RESEARCH.md Assumptions A1–A5

RESEARCH.md flagged five assumptions about WCL response shapes that no prior
research session could verify (WCL credentials are Vercel-only). This
recording run resolved all five against the real API.

### A1 — `events(dataType: Casts, ...)` argument names and pagination contract

**Confirmed as assumed.** The field accepts `fightIDs`, `sourceID`, `dataType`,
`startTime`, and `limit` exactly as guessed, and returns `{ data,
nextPageTimestamp }`. Pagination works by re-passing the previous page's
`nextPageTimestamp` as the next call's `startTime`: for this fight, page 0
returned `nextPageTimestamp: 7195789` and page 1 (queried with `startTime:
7195789`) returned `nextPageTimestamp: null` with an empty `data` array,
signalling the end of the stream. `TIMELINE_CASTS_QUERY` /
`TIMELINE_CASTS_PAGE_QUERY` in `lib/wcl-queries.ts` use these exact argument
names.

### A2 — Real field names on a single cast event

**Confirmed, with the exact names recorded.** A single element of `events(dataType:
Casts).data` looks like:

```json
{
  "timestamp": 6993145,
  "type": "cast",
  "sourceID": 12,
  "targetID": 110,
  "abilityGameID": 14325,
  "fight": 23
}
```

`abilityGameID` (not a nested `ability` object), `sourceID`, `targetID` and
`timestamp` are all present under exactly the names RESEARCH.md guessed.
`WCLCastEvent` in `lib/wcl-types.ts` types this shape verbatim.

### A3 — Does a sourceID-scoped per-ability Healing entry carry per-ability `overheal`?

**RESEARCH.md's assumption was wrong — corrected here.** RESEARCH.md guessed
the scoped (`sourceID`-filtered) per-ability breakdown would NOT carry
`overheal`. The recorded response shows it does: every entry in
`healing.data.entries` (the scoped table) carries its own `overheal` field,
and summing `overheal` across all per-ability entries for the recorded healer
(127,626) matches the un-scoped per-player row's `overheal` (127,626)
exactly. **What the scoped table still lacks is `activeTime`** — that field
only appears on the un-scoped per-player row (`healingByPlayer`). So Pitfall
1's underlying conclusion — the un-scoped query is required for player-level
healer metrics — still holds, but the reason is `activeTime`, not `overheal`.
`HealerTableRow` in `lib/wcl-types.ts` is deliberately typed against the
un-scoped row (`healingByPlayer`), which is the only shape that carries both
`overheal` and `activeTime` together.

### A4 — Page size WCL honoured for the Casts events probe

**Confirmed.** Requesting `limit: 300` returned exactly 300 events on the
first page for this fight — WCL honoured the requested page size rather than
silently capping it lower. The recorded fight needed only 2 pages total (300
+ 0 after the pagination loop ended), well under the 20-page cap.

### A5 — Does `total` on a per-ability Healing entry already exclude overheal (i.e. is it "effective" healing)?

**Confirmed.** Summing `total` across every per-ability entry in the scoped
table (230,867) matches the un-scoped per-player row's `total` (230,867)
exactly, and both are consistent with `total` representing effective
(non-overheal) healing — the existing per-player HPS calculation in
`app/api/analyze/route.ts` (`throughputEntries.reduce((s,e)=>s+e.total,0)`)
was already computing effective HPS, not gross healing. No pre-existing bug
here.
