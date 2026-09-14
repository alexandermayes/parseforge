---
created: 2026-09-13
source: developer request (session 2026-09-13), following Blizzard's "World of Warcraft Forever" announcement
resolves_phase:
resolved:
---

# Add World of Warcraft Forever support when logs become available

Blizzard has announced **World of Warcraft Forever**. ParseForge currently
analyzes Classic / TBC-era Warcraft Logs reports; when WCL begins accepting
Forever logs, the site should support them too.

Not actionable until upstream data exists. Trigger to start work: WCL exposes
Forever reports/zones/partitions through the GraphQL API (check `worldData`
zones + `reportData` for a new game version / partition set).

When triggered, scope will likely include:
1. **Era/game-version detection** — `lib/wcl-client.ts` / `wcl-queries.ts` /
   `wcl-helpers.ts`: recognise the Forever game version, partition scoping for
   rankings (rankings queries must stay partition-aware — see ROADMAP
   anti-patterns), and any new zone/encounter IDs in `lib/constants.ts`.
2. **Game data** — extend the wago.tools regeneration pipeline
   (`npm run regen-game-data`, `scripts/regen-game-data.mjs`, `lib/generated/*`)
   with a Forever era module. Respect the Classic/TBC-first era-precedence rule
   (ID reuse across client builds) and go through `docs/GAME-DATA-AUDIT.md`.
   **No hand-typed ID maps.**
3. **Analysis engines** — `cla-engine`, `raid-overview-engine`,
   `analysis-engine`, `healer-metrics`: confirm consumable/enchant/gem/talent
   rules hold for Forever; add fixtures (`lib/__fixtures__`, recorded via
   `record-wcl-fixtures.mjs`) so the regression net covers the new era.
4. **URL parsing + UI copy** — `lib/url-parser.ts` if WCL URL shape differs;
   landing hero / guides / metadata mention "Classic / TBC" in places and
   should be widened.
5. **SEO/content** — landing FAQ + a guide page targeting Forever tool-intent
   queries (fold into Phase 6 if it is still open at the time); OPS-01 gate
   (PostHog events + GSC pass) as usual.

Sequencing: fits naturally as an insertion after whichever phase is active when
WCL support lands (decimal phase, e.g. 3.1 / 4.1), or as part of Phase 6
Discoverability if timing aligns. Decide at that point via `/gsd-phase`.
