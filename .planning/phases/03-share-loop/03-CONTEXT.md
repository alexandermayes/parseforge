# Phase 3: Share Loop - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning

<domain>
## Phase Boundary

A raider who just analyzed a log can post it, and what they post pulls new players back to ParseForge. This phase delivers: (1) an **auto-generated roast/award card per fight** that unfurls in Discord as an image with the awards visible (SHARE-01); (2) a **per-player permalink** whose OG image shows that specific player's parse — "look at MY parse" — not a generic report card (SHARE-02); (3) **share actions reachable without hunting** on the analyze page on desktop and mobile, plus a **protected-elements checklist** that Phases 4 (ads) and 7 (redesign) must honor (SHARE-03); (4) a **PostHog share-rate metric** against the ~2.8 % baseline and inbound share-landing attribution, with a GSC pass confirming no indexing/canonical disturbance (OPS-01).

Out of scope: auto-posting reports to Discord via bot/webhook (SHARE-04, Phase 5 — needs COMM-01 first), any ad slots or ad code (Phase 4), redesigning the analyze page beyond what the share surfaces need (Phase 7), new indexable routes (none are introduced — see D-05), an "All Bosses" aggregate awards card (deferred), and new analysis metrics — awards are computed from data the engines already produce.

</domain>

<decisions>
## Implementation Decisions

### Award content & tone (SHARE-01)
- **D-01:** Tone is **mixed — praise plus gentle roast**. Positive awards (e.g. Top DPS, Top HPS, Iron Man / no deaths, Best Prepared) sit alongside light jabs (e.g. First to Die, Flaskless Wonder, GCD Tourist). Roasts are self-deprecating-guild-humour level and **never insulting** — the card names real raiders from a public log and must be fun to be on, not embarrassing. No "full roast" headline of the worst player.
- **D-02:** Awards come from a **conditional slate with a fixed display count**: a pool of **~12–15 award rules**, each with a trigger condition (First to Die only fires if someone died; Flaskless Wonder only if someone lacked a flask; etc.). The card shows the **top 5–6 that fired, ranked by a fixed priority order**. Every card looks full; there are never empty "nobody died" rows. The pool, trigger conditions and priority order live in one pure, unit-tested engine module (see code_context).
- **D-03:** Award rules draw on **raid-overview data only** — the existing per-fight `/api/raid-overview` result (`RaidOverviewResult`: per-player throughput, deaths + death timeline, avoidable damage, activity %, flask/food/weapon-enhancement, missing enchants, average item level, healer HPS/overheal/activity). One already-cached, already-regression-tested call per card. **No per-raider `/api/analyze` fan-out and no cast-timeline fetch** for awards this phase. — **Reversibility:** reversible — adding percentile- or timeline-based awards later is additive to the rule pool.
- **D-04:** Each award row shows **title + winning player(s) + the stat that earned it** (e.g. "First to Die — Thrallfan (0:42 in)", "Flaskless Wonder — Healbot, Grimm"). The stat makes every roast verifiable from the log — accuracy is the core value and a stat-backed award ends Discord arguments. No per-award quip line. **Claude drafts WoW-flavoured award names; the user reviews the full pool before it ships** (a human checkpoint in the plan, not a discretionary call).

### Roast card surface & URL (SHARE-01, SEO invariants)
- **D-05:** The awards card lives as a **param on the existing report page**, e.g. `/analyze/{code}?fight={id}&view=awards`. The existing `app/og/route.tsx` renders the awards card when `view=awards` is present; `generateMetadata` forwards the param into the OG URL exactly as it does `fight`/`source` today. **The canonical stays the param-free `/analyze/{code}`**, so this is not a new indexable surface — no sitemap, robots or `recordRecentReport` change. **No dedicated route, no image-only download.** — **Reversibility:** costly — the `view=awards` URL shape becomes the thing people paste into Discord; changing it later means redirects for links already in the wild.
- **D-06:** In the analyze UI, the **Raid tab gets an awards panel**: the fired awards as rows **plus the actual 1200×630 card image rendered inline** (the same `/og` output Discord will show) with a "Copy awards link" button beside it. Users see exactly what will unfurl before they paste. Not a modal, not rows-only.
- **D-07:** **Any single fight is eligible — kills and wipes.** Wipes are the most roast-able pulls. The card header shows the boss name and **Kill / Wipe (xx %)** so context is unambiguous. The "All Bosses (Average)" selection does **not** get a card this phase (deferred).
- **D-08:** Visually the awards card **reuses the existing OG `Shell`** (brand row, gold top bar, `parseforge.gg` footer) with a **new award layout inside**: boss + Kill/Wipe header, 5–6 award rows with class-coloured player names and a small icon/emoji per award. Same Satori constraints as today (hex mirrors of tokens — the documented exception to the token rule).

### Player permalink & OG card (SHARE-02)
- **D-09:** A **dedicated "Share my parse" button on the player scorecard** copies a **normalized permalink**: always `/analyze/{code}?fight={id}&source={id}` (plus the `ref` param from D-16), with `tab` and any other params stripped and `source` always present. It reuses the existing `PlayerCard` OG path and the param-free canonical; **no short vanity path, no new route**. The header Share button remains the report-level link and stops copying raw `location.href` (it copies the normalized report URL).
- **D-10:** The per-player OG image **keeps the current `PlayerCard` composition** (boss, class-coloured name, spec/class, DPS-or-HPS, percentile, big grade badge) and **adds receipts**: Kill/Wipe + fight length, a "vs top {N} {spec}s" comparison label, and one proof line — **healers get effective HPS + overheal %** (the Phase 2 D-06 basis; the percentile shown must be the effective-HPS percentile), **DPS get active-time %**. Not a redesign around the #1 suggestion.
- **D-11:** The existing **"Copy for Discord" text scorecard stays as a secondary action**; the link-only "Share my parse" is the primary button. Both keep working so guilds that paste inline stats into recap threads aren't broken.
- **D-12:** **Landing behaviour:** when a visitor arrives with `source` present and `tab` absent, the page **auto-opens the Player tab with that player's analysis already loading** — the visitor sees exactly what the card promised. Same rule for `view=awards` → Raid tab with the awards panel open and scrolled into view. Today `AnalyzeClient` defaults to the Raid tab whenever `tab` is absent; that default changes only for these two cases.

### Share CTA placement, measurement & protection (SHARE-03, OPS-01)
- **D-13:** **Contextual share buttons + persistent header Share.** Each shareable thing gets its button where it is read: "Share my parse" at the top of the player scorecard, "Copy awards link" beside the awards preview; the header Share stays as the report-level link. **On mobile the contextual button sits at the top of its card, not below the fold.** The bottom "Found this useful? Share it with your guild." glass bar is **removed** (weakest position; also the slot ads would want). No sticky share bar, no header-only menu.
- **D-14:** **One `share_action` PostHog event** with `kind: "report_link" | "player_link" | "awards_link" | "discord_text"` plus `report_code`, `fight_id`, `tab` (and the standing `consent_gate_path` super property). **Share rate = distinct sessions with any `share_action` ÷ distinct sessions with `analysis_complete`.** The legacy `share_link_copied` and `discord_copied` events **keep firing for this phase** (dual-emit) so the ~2.8 % baseline series is not broken; their removal is a later-phase cleanup. The exact HogQL for the share-rate figure is recorded in the OPS-01 gate doc for this phase.
- **D-15:** The **protected-elements checklist is a doc plus a machine check**, following the `seo-invariants` / `token-audit` pattern: `docs/PROTECTED-ELEMENTS.md` lists every protected element (share buttons, awards panel/preview, `/og` route and its `report`/`fight`/`source`/`view` params, permalink shape, OG `<meta>` wiring in `generateMetadata`), each DOM element carries a stable `data-protected="…"` attribute, and `scripts/protected-elements.mjs` fails when any listed attribute is missing from the rendered analyze page. The script is **added to the OPS-01 ship gate** and named in ROADMAP Phase 4/7 notes as a hard input. — **Reversibility:** costly — Phase 4's ad-placement whitelist and Phase 7's per-route SEO gate both consume this file and these attribute names.
- **D-16:** **Inbound attribution via a `ref` param on every copied link** (`ref=share` for the report link, `ref=parse` for a player permalink, `ref=awards` for an awards link). On first load the analyze page captures **`share_landing`** with the ref kind, then **strips `ref` from the address bar** (`history.replaceState`) so it never propagates into further copies. The canonical is already param-free, so SEO is unaffected; the OG route ignores `ref`. This gives PostHog a "share → landing → new analysis" funnel.

### Claude's Discretion
- The exact award pool (names, trigger thresholds, priority order, per-award icon) — drafted by Claude, **reviewed by the user before ship** (D-04); tie-breaking when several players qualify (list up to 2–3 names, then "+N").
- How the `/og` route obtains raid-overview data for `view=awards` (POST to `/api/raid-overview` via the same origin-pinned `fetchJson` pattern) and what unfurls when that call is slow or fails — must never fail the unfurl; the existing `ReportCard` fallback is acceptable, a "card still cooking" variant is fine.
- Cache headers / TTL for the awards OG image; whether the awards rules run in the OG route or are exposed through a small API the UI panel also reads (prefer one engine module consumed by both so the panel rows and the image can never disagree — same principle as Phase 2 D-08).
- The in-app card preview mechanism (an `<img>` pointing at the `/og` URL is fine; no client-side canvas rendering).
- Whether awards rows in the panel link to the player's scorecard.
- Button copy, "Copied!" confirmation styling, icon choices — must use `@theme` tokens (token-audit / theme-parity stay green).
- Share-button behaviour when the report failed to load or is private: no share buttons render (there is nothing to unfurl); the `noindex` shell is unchanged.
- File layout for the awards engine (`lib/awards-engine.ts` + `lib/awards-engine.test.ts` with fixtures from `lib/__fixtures__/`), the `data-protected` attribute vocabulary, and the `scripts/protected-elements.mjs` mechanism (render the analyze page for the demo report on a preview/prod URL and assert the attributes — same shape as `seo-invariants`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & sequencing
- `.planning/ROADMAP.md` — Phase 3 entry: goal, 4 success criteria, note that the protected-elements checklist is a hard input to Phase 4's ad whitelist; Phase 5 SHARE-04 depends on this phase's share surfaces
- `.planning/REQUIREMENTS.md` — SHARE-01, SHARE-02, SHARE-03 (this phase); SHARE-04 (Phase 5 — out); OPS-01 standing gate incl. the 2026-09-14/15 addenda
- `.planning/PROJECT.md` — Core Value ("a wrong recommendation is worse than no recommendation" → awards must be stat-backed), Viral-loop Active requirement (~2.8 % share rate), SEO invariants, Brand constraint, manual confirmed deploys, "per-player share image bakes in the healer percentile basis — a `costly` decision to revisit in Phase 3"

### Prior-phase decisions that bind this phase
- `.planning/phases/02-accuracy-analysis-depth/02-CONTEXT.md` — D-06 (healer headline = effective-HPS percentile; "Phase 3's per-player OG image will bake this definition in"), D-08 (one shared helper so two surfaces never disagree — the principle D-02/D-06 here follow), D-13 (recorded WCL fixtures under `lib/__fixtures__/` — reuse for awards-engine tests)
- `.planning/phases/01-foundation-themes-consent/01-CONTEXT.md` — D-11/D-12: all UI colour via `@theme` tokens and `classColor()`/`roleColor()`; token-audit + theme-parity gates must stay green for the new panel and buttons
- `.planning/phases/02.1-posthog-consent-gate-hotfix/02.1-CONTEXT.md` — D-07 (`consent_gate_path` on every event, incl. the new `share_action` / `share_landing`), D-08 (mandatory counted post-deploy live-traffic check), D-11 (preview first, prod only on explicit confirmation)
- `docs/OPS-01-SHIP-GATE.md` — the repeatable gate; this phase adds `scripts/protected-elements.mjs` and the share-rate HogQL to it and records a Part 5 with counted evidence; the unsigned 02.1-07 redeploy row and the GSC "Crawled – currently not indexed" investigation are carried into this phase's gate (STATE.md)

### Code under change
- `app/og/route.tsx` — `Shell`, `PlayerCard`, `ReportCard`, origin-pinned `fetchJson`, param validation, cache headers, "never fail an unfurl" fallback; D-05/D-08/D-10 extend this file
- `app/analyze/[reportCode]/page.tsx` — `generateMetadata` forwards `fight`/`source` into `/og?…` and keeps `alternates.canonical` param-free; D-05 adds `view`
- `app/analyze/[reportCode]/AnalyzeClient.tsx` — `handleShareLink` (copies `location.href`, emits `share_link_copied`), header Share button, bottom "Found this useful?" bar (removed by D-13), tab default `"raid"` when `tab` absent (changed by D-12), `updateUrlParam`
- `app/components/ComparisonSummary.tsx` — `formatForDiscord` + `handleCopyDiscord` (`discord_copied`); D-11 keeps it secondary, D-14 dual-emits
- `app/components/RaidOverview.tsx` — the Raid tab that hosts the awards panel (D-06)
- `lib/raid-overview-engine.ts`, `lib/wcl-types.ts` (`RaidOverviewResult`, `RaidPlayerMetrics`, `DeathDetail`, `HealerMetrics`) — the only data source for award rules (D-03)
- `lib/healer-metrics.ts` — the effective-HPS/overheal helper the PlayerCard receipts must use (D-10)
- `scripts/seo-invariants.mjs`, `scripts/token-audit.mjs` — the node-script gate pattern `scripts/protected-elements.mjs` follows (D-15)
- `next.config.ts` — CSP (report-only); the inline `<img>` preview of `/og` is same-origin, no CSP change expected — verify

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/og/route.tsx` already renders a **per-player scorecard** (`PlayerCard`) when `?report=&fight=&source=` are valid, and a branded `ReportCard` otherwise, with an origin-pinned `fetchJson` to our own API and a never-fail fallback. The awards card is a third branch on `view=awards`; the receipts (D-10) are additive fields on `PlayerCard`.
- `generateMetadata` in `app/analyze/[reportCode]/page.tsx` already builds the OG URL from `fight`/`source` and keeps the canonical param-free — the exact pattern D-05 extends with `view`.
- `RaidOverviewResult` (per-player deaths + `deathTimeline` with `fightTimeMs`, `avoidableDamage`, `activityPercent`, `consumables`, `missingEnchants`, `avgItemLevel`, `throughput`, `healerMetrics` with `overhealPercent`) supplies every award in D-03 without new WCL queries. `ReportMeta.fights` carries kill/wipe + boss % for the D-07 header.
- `lib/__fixtures__/` (Phase 2 D-13 recorded WCL responses for the public demo report) — drive `awards-engine` tests the same way `raid-overview-engine.test.ts` is driven.
- `app/components/ComparisonSummary.tsx` — the player scorecard where "Share my parse" (D-09/D-13) sits; `formatForDiscord` stays for D-11.
- shadcn `Button`, `Check`/`Link2`/`Copy` lucide icons, the `copied` state pattern in `AnalyzeClient` — reuse for the new buttons.
- `scripts/seo-invariants.mjs` — renders live pages and asserts invariants; `scripts/protected-elements.mjs` mirrors its shape.

### Established Patterns
- OG rendering is Satori (`next/og` `ImageResponse`) with **hex mirrors of tokens** (`CLASS_COLORS_HEX`, `GRADE_HEX`) — the documented exception to the token rule; new cards stay inside that exception and nowhere else.
- Errors as data; the OG route **never fails an unfurl** — every new branch must keep a fallback.
- API routes use `cachedApiHandler` (single-flight + shared Redis); `/api/raid-overview` is already cached, so an unfurl for a freshly viewed fight is warm.
- PostHog: `posthog.capture("snake_case_event", { report_code, … })` from client components; `consent_gate_path` is a registered super property.
- URL state via `useSearchParams` + `updateUrlParam` in `AnalyzeClient`; `use-url-tab-state` for tabs.
- Vitest, node env, colocated `*.test.ts`; `npx tsc --noEmit`, `npx vitest run`, `npm run lint`, `npm run token-audit`, `npm run theme-parity` are local gates; `npm run build` is Vercel-only.
- Deploys: preview → developer eyeballs → explicit prod confirmation → counted OPS-01 live-traffic check within 60 min.

### Integration Points
- `app/og/route.tsx` — `view=awards` branch + `PlayerCard` receipts.
- `app/analyze/[reportCode]/page.tsx` — forward `view` into the OG URL; canonical untouched.
- `app/analyze/[reportCode]/AnalyzeClient.tsx` — landing rules (D-12), header Share normalization, `share_landing` capture + `ref` strip (D-16), remove bottom bar (D-13).
- `app/components/RaidOverview.tsx` — awards panel + inline preview + "Copy awards link" (D-06).
- `app/components/ComparisonSummary.tsx` — "Share my parse" primary button (D-09), Copy for Discord secondary (D-11).
- New `lib/awards-engine.ts` (+ test) consumed by both the OG route and the Raid-tab panel.
- New `docs/PROTECTED-ELEMENTS.md`, `scripts/protected-elements.mjs`, `package.json` script, `docs/OPS-01-SHIP-GATE.md` Part 1 item + Part 5 evidence.
- GSC verification: no new indexable routes; the pass is a no-regression check that `/analyze/*` canonicals stay param-free and `?view=`/`?ref=` permutations don't appear as separate indexed URLs.

</code_context>

<specifics>
## Specific Ideas

- Award rows read like guild banter with receipts: "First to Die — Thrallfan (0:42 in)", "Flaskless Wonder — Healbot, Grimm". The stat is what makes the joke land and what makes it fair.
- The awards preview in the Raid tab must be **the same image Discord shows** — no separate in-app rendering that could drift from the unfurl.
- A wipe card is a feature, not an edge case: "Wipe (37 %)" in the header, "First to Die" near the top of the priority order.
- "Share my parse" is the button; "Copy for Discord" is the fallback for people who want inline text.
- The bottom "Found this useful?" bar goes away — share actions live where the content is read, and they must be visible above the fold on mobile.
- Every copied link carries `ref=` so the second half of the phase goal ("pulls new players back") is a measurable funnel, not a hope.

</specifics>

<deferred>
## Deferred Ideas

- **"All Bosses" aggregate raid-night awards card** (Most Deaths All Night, etc.) — needs aggregate rule definitions; raid-overview runs per fight today. Candidate for a later share iteration.
- **Percentile- and timeline-based awards** ("Best Parse 94th pct", "Longest AFK") — would need per-raider `/api/analyze` fan-out or paginated casts fetches; revisit if the raid-overview-only pool proves too thin.
- **Retiring the legacy `share_link_copied` / `discord_copied` events** once one phase of dual-emit has established the `share_action` series.
- **Auto-posting new public reports to Discord** — SHARE-04, Phase 5 (after COMM-01).
- **Deep-linkable timeline permalink** (Phase 2 deferred item) — not needed by this phase's share surfaces.

### Reviewed Todos (not folded)
- `wow-forever-support.md` (score 0.2, keyword match on "phase" only) — World of Warcraft Forever era support; unrelated to sharing, not actionable until WCL exposes Forever logs.

</deferred>

---

*Phase: 3-Share Loop*
*Context gathered: 2026-09-15*
