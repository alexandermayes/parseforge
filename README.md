# ParseForge

Analyze your WoW Classic raid logs. Paste a Warcraft Logs report URL and get actionable feedback on DPS, gear, consumables, and more — compared against top-ranked players.

**[parseforge.gg](https://parseforge.gg)**

## Features

- **Player Analysis** — Compare your DPS, gear, talents, buffs, and rotation against top-ranked players with percentile breakdowns and improvement suggestions
- **Raid Overview** — Full raid performance board showing throughput, consumables, deaths, and activity for every player in the raid
- **Buff & Gear Audit** — Per-player consumable uptime tracking, missing enchant detection, and gear issue flagging across all fights
- **Personal History** — Track your improvement over time with DPS, percentile, and score deltas between runs

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [Warcraft Logs API v2](https://www.warcraftlogs.com/api/docs) (GraphQL)
- [Tailwind CSS](https://tailwindcss.com)
- Deployed on [Vercel](https://vercel.com)

## Getting Started

```bash
npm install
npm run dev
```

Requires a Warcraft Logs API client ID and secret in your environment variables.
