# Phase 3: Share Loop - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-15
**Phase:** 3-Share Loop
**Areas discussed:** Award content & tone, Roast card surface & URL, Player permalink & OG card, Share CTA & measurement

---

## Award content & tone

### How roast-y should the awards be?

| Option | Description | Selected |
|--------|-------------|----------|
| Mixed: praise + gentle roast | Top awards alongside light jabs; self-deprecating guild humour, never insulting | ✓ |
| Positive only | Only celebrate MVPs, cleanest player, best-prepared, top healer | |
| Full roast | Every award has a dig; worst player is the headline | |

**User's choice:** Mixed: praise + gentle roast (recommended)

### How should the awards on a card be chosen?

| Option | Description | Selected |
|--------|-------------|----------|
| Conditional slate, fixed count | Pool of ~12–15 rules with trigger conditions; card shows top 5–6 that fired by fixed priority | ✓ |
| Fixed slate, always shown | Same 6 awards every card, even when "nobody died" | |
| Small fixed core + rotating extras | 3 always-on + 2–3 conditional roasts | |

**User's choice:** Conditional slate, fixed count (recommended)

### What data can award rules draw on?

| Option | Description | Selected |
|--------|-------------|----------|
| Raid-overview data only | One existing cached `/api/raid-overview` call per fight | ✓ |
| Raid overview + per-player percentiles | One `/api/analyze` call per raider (25–40 WCL queries per card) | |
| Raid overview + cast timeline | Paginated events fetch per raider for idle-gap awards | |

**User's choice:** Raid-overview data only (recommended)

### What does each award row show, and who writes the names?

| Option | Description | Selected |
|--------|-------------|----------|
| Title + player + the stat that earned it | Stat makes every roast verifiable; Claude drafts names, user reviews pool | ✓ |
| Title + player only | Cleaner, receipts live on the linked page | |
| Title + player + stat + one-line quip | Adds a joke per award; denser card, more copy review | |

**User's choice:** Title + player + stat (recommended)

---

## Roast card surface & URL

### Where should the awards page live so Discord can unfurl it?

| Option | Description | Selected |
|--------|-------------|----------|
| Param on the existing report page | `/analyze/{code}?fight=12&view=awards`; canonical stays param-free; no new indexable surface | ✓ |
| Dedicated route | `/analyze/{code}/awards/{fightId}`; new canonical/noindex + sitemap exclusion | |
| Image-only, no page | PNG attachment, no link back | |

**User's choice:** Param on the existing report page (recommended)

### What does the user see in the analyze UI when they generate/land on the awards card?

| Option | Description | Selected |
|--------|-------------|----------|
| Awards panel + live card preview | Rows on the Raid tab plus the actual 1200×630 `/og` image inline with Copy link | ✓ |
| Awards panel only, no image preview | Rows only; image exists only for unfurlers | |
| Modal/dialog | Generate button opens a dialog with preview + copy link | |

**User's choice:** Awards panel + live card preview (recommended)

### Which fights can get an awards card?

| Option | Description | Selected |
|--------|-------------|----------|
| Any single fight, kills and wipes | One card per pull; header shows Kill / Wipe (xx%) | ✓ |
| Kills only | Only completed boss kills | |
| Single fights + "All Bosses" raid-night card | Adds an aggregate card across the report | |

**User's choice:** Any single fight, kills and wipes (recommended)
**Notes:** "All Bosses" aggregate card recorded as a deferred idea.

### How should the awards card relate visually to the existing OG scorecard?

| Option | Description | Selected |
|--------|-------------|----------|
| Same brand shell, new award layout | Reuse `Shell`; boss + Kill/Wipe header, 5–6 award rows, class-coloured names, small icon per award | ✓ |
| Distinct "trophy" style | Parchment/gold-frame achievement look | |
| You decide | Claude picks within the brand constraint | |

**User's choice:** Same brand shell, new award layout (recommended)

---

## Player permalink & OG card

### What URL does "Share my parse" copy?

| Option | Description | Selected |
|--------|-------------|----------|
| Normalized existing URL | Always `/analyze/{code}?fight={id}&source={id}`; dedicated button builds it explicitly | ✓ |
| Short vanity path | `/p/{code}/{fight}/{source}` redirect/rewrite; new route | |
| Keep copying location.href | No change to what's copied | |

**User's choice:** Normalized existing URL (recommended)

### What should the per-player OG image show?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep the layout, add the receipts | Kill/Wipe + fight length, "vs top N specs", healer eff-HPS + overheal % or DPS active-time % | ✓ |
| Keep exactly as-is | Only fix permalink plumbing | |
| Redesign around the #1 suggestion | Top improvement tip as headline | |

**User's choice:** Keep the layout, add the receipts (recommended)

### What happens to the existing "Copy for Discord" action?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both, link is primary | "Share my parse" is the big button; Copy for Discord secondary; both events kept | ✓ |
| Replace with link only | Remove text scorecard; one action, one event | |
| Merge into one share menu | Single Share button opens a menu | |

**User's choice:** Keep both, link is primary (recommended)

### What should the landing experience be for a shared parse link?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-open the Player tab with that player loaded | `source` present + `tab` absent → Player tab; `view=awards` → Raid tab with panel open | ✓ |
| Land on the Raid tab, highlight the player | Raid overview entry with the player's row highlighted | |
| Keep current behaviour | Whatever tab the sharer had open | |

**User's choice:** Auto-open the Player tab with that player loaded (recommended)

---

## Share CTA & measurement

### Where do share actions live on the analyze page?

| Option | Description | Selected |
|--------|-------------|----------|
| Contextual buttons + persistent header | "Share my parse" on the scorecard, "Copy awards link" by the preview, header Share stays; drop the bottom bar; mobile buttons above the fold | ✓ |
| Sticky share bar | Bar pinned to viewport bottom/side | |
| Header-only share menu | One header button opens a menu | |

**User's choice:** Contextual buttons + persistent header (recommended)

### How should "share rate" be defined in PostHog?

| Option | Description | Selected |
|--------|-------------|----------|
| One `share_action` event with a `kind` prop, over analyses | `kind: report_link \| player_link \| awards_link \| discord_text`; rate = sessions with `share_action` ÷ sessions with `analysis_complete`; legacy events dual-emit one phase | ✓ |
| Keep separate events per action | Add `player_link_copied`, `awards_link_copied`; HogQL sum over four | |
| Page-view denominator | Share events ÷ `/analyze/*` pageviews | |

**User's choice:** One `share_action` event with a `kind` prop, over analyses (recommended)

### What form should the protected-elements checklist take?

| Option | Description | Selected |
|--------|-------------|----------|
| Doc + machine check, like the existing gates | `docs/PROTECTED-ELEMENTS.md` + `data-protected` attributes + `scripts/protected-elements.mjs` in the OPS-01 gate | ✓ |
| Doc only | Markdown checklist ticked manually | |
| Doc + tests | Component-level vitest assertions that buttons render | |

**User's choice:** Doc + machine check, like the existing gates (recommended)

### How should inbound visits from shared links be attributed?

| Option | Description | Selected |
|--------|-------------|----------|
| Add a `ref` param to every copied link | `ref=share/parse/awards`; `share_landing` event on first load; param stripped from the address bar | ✓ |
| Rely on referrer only | Use `$referrer`; Discord desktop often sends none | |
| Skip inbound attribution this phase | Share rate only | |

**User's choice:** Add a `ref` param to every copied link (recommended)

---

## Claude's Discretion

- Exact award pool (names, thresholds, priority, icons) — drafted by Claude, reviewed by the user before ship; tie-breaking display.
- How the OG route fetches raid-overview data for `view=awards` and what unfurls when slow/failed (never fail an unfurl).
- OG cache TTLs; whether the awards engine is consumed via a small API or directly by the OG route and panel (one module for both).
- In-app preview mechanism (`<img>` at the `/og` URL), whether panel rows link to scorecards, button copy and confirmation styling.
- Share-button behaviour for private/failed reports (none render).
- File layout for `lib/awards-engine.ts`, the `data-protected` vocabulary, the `protected-elements.mjs` mechanism.

## Deferred Ideas

- "All Bosses" aggregate raid-night awards card.
- Percentile- and timeline-based awards.
- Retiring legacy `share_link_copied` / `discord_copied` after one phase of dual-emit.
- Auto-posting reports to Discord (SHARE-04, Phase 5).
- Deep-linkable timeline permalink (Phase 2 deferred; not needed here).
- Reviewed, not folded: `wow-forever-support.md` todo (unrelated to sharing).
