# RPGLogs API commercial-use approval request — DRAFT (2026-09-19)

Status: **DRAFT, not sent.** Send from the ParseForge operator address (the same identity as `/privacy` and `/terms`: info@lootlistplus.com), not a work account. Fill `<TO>` with the approval address printed on `articles.warcraftlogs.com/help/rpg-logs-api-terms-of-service` (the page 403s automated readers — read it in a browser and save a dated copy beside this file as `wcl-tos-2026-09-19.md`). Record the sent message and every reply verbatim below under "Thread".

Consumers: ROADMAP Phase 4 (R0-1); PARSEFORGE-RANKINGS-SPEC §2.1 / §7 R0-1.

---

To: <TO — approval address from the API ToS page>
From: info@lootlistplus.com
Subject: API commercial-use approval request — ParseForge (parseforge.gg), client "<WCL client name>"

Hi RPGLogs team,

I run ParseForge (https://parseforge.gg), a free WoW Classic / TBC raid-log analyzer. A player pastes a public Warcraft Logs report URL and the site fetches that report through the v2 client API (OAuth client credentials, client name "<WCL client name>", registered to <account email>) and compares the raid's DPS/HPS, gear, consumables, buffs and talents against top-ranked parses. Every report page links back to the source report on warcraftlogs.com, and the site carries no Warcraft Logs branding.

Your API Terms of Service state that use is considered commercial if the integration earns money, including through advertising, and that commercial use needs your approval. I am writing to request that approval before anything changes:

1. Advertising on the existing analyzer. I plan to run Google AdSense display ads on parseforge.gg in reserved slots outside the analysis tables. The API usage pattern does not change: one report fetched on demand when a user pastes a URL, plus the ranking queries used for comparison, all through the issued client key.

2. A planned "rankings lens" built on the same API. I would like to show each player's WCL parse percentile and rank on the analyze page and, later, per-boss / character / guild summary pages, using `report.rankings`, `characterRankings` / `fightRankings`, `zoneRankings` / `encounterRankings`, and `guild.members` / `attendance` / `zoneRanking`. The numbers shown would be yours, attributed to Warcraft Logs with a link back, with no re-derived or re-sold datasets. Nothing would be scraped from the website; everything comes through the GraphQL API.

3. Expected volume and caching. Current traffic is roughly 1,000 organic visits a month; API calls are made only when a user requests a report and results are cached in Redis (report data ~5 minutes at the query layer, computed analyses for hours), so repeat views of the same report do not re-query the API. I read `rateLimitData` and will keep usage inside the published point budget for my client tier; if the rankings surface grows I would upgrade the client tier rather than add keys.

Could you confirm whether (1) and (2) are approved under the Terms, and let me know the exact attribution text/logo requirements you would like displayed wherever API-derived numbers appear, and any user or request limits you want me to observe? I am happy to adjust the design to whatever conditions you set.

Thank you for running the API — ParseForge exists because of it.

<Owner name>
Operator, ParseForge (parseforge.gg)
info@lootlistplus.com

---

## Thread

| Date (UTC) | Direction | Summary | Verbatim copy |
|---|---|---|---|
| — | — | not sent yet | — |
