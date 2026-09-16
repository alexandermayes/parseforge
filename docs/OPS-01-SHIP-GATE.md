# OPS-01 Ship Gate

Standing PostHog + GSC verification gate — REQUIREMENTS.md `OPS-01`: "Every user-facing
change ships WITH PostHog instrumentation and GSC verification (sitemap/indexing/metadata) —
enforced as a phase-gate, not a follow-up task."

This document has two parts: **Part 1** is the reusable checklist every later phase runs
verbatim. **Part 2** is Phase 1's own recorded evidence against that checklist.

_Route table note (Phase 1 deviation):_ the eleven-route table below covers every `page.tsx`
under `app/` **at the time this gate ran**, including `/privacy` and `/terms` — two routes
added by quick task `260906-kzw` after 01-08-PLAN.md was authored. The plan's frontmatter
named a 9-route set; this gate uses the live route inventory instead, per the plan's own stated
criterion ("every `page.tsx` under `app/`") and this session's project-specific instruction to
treat `/privacy`/`/terms` as legitimate routes. See 01-08-SUMMARY.md `## Deviations from Plan`.

---

## Part 1 — The reusable gate

Run this checklist before every production deploy, for every phase. A row may only be marked
**passing** when the evidence that produced it is recorded alongside it — an unevidenced pass is
a claim, not a gate. A route Search Console has no data for is recorded as `no-data`, never as a
pass and never silently dropped. Route rows are ordered lexicographically by path so two runs of
the gate are diffable; a second check on an existing route **extends** that route's row, it does
not add a duplicate row.

1. **Local gate** — run and capture output verbatim:
   ```
   export PATH="$HOME/.local/node20/bin:$PATH"
   npx tsc --noEmit
   npm run lint
   npm test
   npm run theme-parity
   npm run token-audit
   ```
   Evidence: the captured command output (exit codes + summary lines).

   **A non-zero `npm test` exit blocks a production deploy — no override, no
   "known failure" allowance.** `npm test` is already a CI step
   (`.github/workflows/ci.yml`, before `npm run build`/`npm run lint`), and
   this local-gate row is where that consequence is stated for a human
   running the gate by hand: a red suite is not a row you check "passing
   with a caveat" and move past — it stops the deploy in step 6 until it is
   green again. The evidence for this row is the suite's summary line
   (`Test Files N passed (N)` / `Tests N passed (N)`), captured verbatim
   like every other row in this document.

   **Test-suite reach (Phase 2 / plan 02-08).** Coverage is recorded here by
   naming the files that carry it, not by a coverage-percentage number — a
   percentage threshold can be reached by a shallow, assertion-free suite
   just as easily as a meaningful one, and the actual bar this project holds
   is that new code ships with tests anchored to real branches and real past
   bugs (D-16). As of this phase, the suite reaches:
   - `lib/cla-engine.test.ts` — gear/enchant/gem/class-buff audit logic
   - `lib/raid-overview-engine.test.ts` — healer metrics, death timeline,
     buff coverage, role sort order
   - `lib/wcl-client.test.ts` — OAuth token refresh, retry ceiling, timeout,
     every `WCLError` classification
   - `lib/timeline-engine.test.ts` — cast timeline, idle gaps, death marker
   - `lib/healer-metrics.test.ts` — effective HPS / overheal / uptime, plus
     the raid-overview/player-page cross-surface parity guarantee (D-08)
   - `lib/generated/game-data.test.ts` — the regenerated enchant/gem/gem-stat
     game-data guard against the pre-regeneration pinned facts
   - `lib/__fixtures__/fixtures.test.ts` — the recorded-fixture shape guard
   alongside the test files that already existed before this phase
   (`lib/api-utils.test.ts`, `lib/async-pool.test.ts`,
   `lib/cla-constants.test.ts`, `lib/consent.test.ts`,
   `lib/constants.test.ts`, `lib/url-parser.test.ts`, and
   `lib/analysis-engine.test.ts`). **No coverage-percentage threshold is
   enforced, and none is planned** — see the reasoning above.

   **Snapshot discipline.** The snapshots committed under
   `lib/__snapshots__/` (`cla-engine.test.ts.snap`,
   `raid-overview-engine.test.ts.snap`) are updated only deliberately, with
   the diff reviewed before committing. A snapshot refreshed by reflex when
   it fails converts the regression net this phase built into a green light
   that certifies nothing — worse than an honestly failing test, because it
   looks like proof. If a snapshot fails, read what changed and why before
   deciding whether to accept the new value.

2. **Both-theme route sweep** — every route with a `page.tsx` under `app/`, checked in both
   Light and Dark (navbar theme control). There is no automated visual-regression harness for
   this project (node-env Vitest only) — this manual pass is the only coverage. Check: no
   unreadable text, no unstyled/dark-on-light card, tables and progress bars legible, grade and
   percentile badges readable, class-coloured player names readable, navbar/footer correct.
   Evidence: a per-route recorded result for each theme.

3. **SEO invariants** — `npm run seo-invariants`. Diffs the local render's `<title>`, canonical,
   `robots`, `description`, `og:title`, `og:image`, and sorted JSON-LD `@type` list against the
   production render at the same path. Evidence: the route table the script prints (`npm run
   seo-invariants -- --report` for a non-failing inspection run, or `--markdown <path>` to
   append to a file).

4. **PostHog instrumentation** — every new user-facing interaction shipped this phase has
   exactly one `posthog.capture` call site (grep-verifiable pre-deploy). After deploy, confirm
   the event appears in the PostHog project's event definitions — but note what that
   confirms and what it does not: an event definition persists once created, so its presence
   is evidence that an event was ingested at some point in the past, not evidence that
   anything is being ingested now. Proving current ingestion is item 7's job, the mandatory
   post-deploy live-traffic check below — **item 4 alone can no longer close the PostHog half
   of this gate (D-08).** Evidence: the grep count pre-deploy; item 7 supplies the post-deploy
   proof this item no longer can.

   **Share-rate figure (Phase 3 / D-14).** Share rate is the count of distinct sessions with any
   `share_action` event divided by the count of distinct sessions with an `analysis_complete`
   event, over the measurement window, compared against the ~2.8% baseline. The exact HogQL,
   run verbatim against PostHog project `337485`:
   ```sql
   SELECT
     (SELECT count(DISTINCT $session_id) FROM events WHERE event = 'share_action' AND timestamp >= now() - INTERVAL 7 DAY) AS sessions_with_share,
     (SELECT count(DISTINCT $session_id) FROM events WHERE event = 'analysis_complete' AND timestamp >= now() - INTERVAL 7 DAY) AS sessions_with_analysis,
     sessions_with_share * 100.0 / nullif(sessions_with_analysis, 0) AS share_rate_pct
   ```
   The legacy `share_link_copied` and `discord_copied` events keep firing this phase (dual-emit
   alongside `share_action`) so the ~2.8% baseline series is not broken — retiring them is
   deferred to a later phase, not part of this gate.

5. **Search Console** — after deploy, URL-inspect the affected routes and confirm indexability
   and metadata are unchanged. Evidence: the inspection result per route (`no-data` if GSC hasn't
   crawled it yet).

6. **Prod deploy is manual** and requires explicit developer confirmation:
   ```
   vercel deploy --prod --scope loot-list-plus --yes
   ```
   Never run this from a habit or an assumed approval — confirm with the developer first.

7. **Post-deploy live-traffic check (mandatory)** — this is the row that would have caught the
   Phase 1/2 outage (`.planning/phases/02.1-posthog-consent-gate-hotfix/02.1-DIAGNOSIS.md`):
   both prior gates passed item 4 on an event definition that was created weeks earlier and never
   ingested again. Item 4 alone can no longer close this gate — this item counts events.

   **When:** run against production, within 60 minutes of the prod deploy from item 6, querying
   the 60-minute window that follows that deploy. If fewer than 60 minutes have elapsed, wait — a
   partial window is never recorded as a pass.

   **Where:** PostHog project `337485`. The PostHog MCP connector's *default* project is
   `LootList+ App`, not ParseForge — any session running this check must run `switch-project
   337485` first, or every query below is silently answered from the wrong project.

   **Thresholds (each stated with the side of equality that passes):**
   - At least 20 `$pageview` events in the window — **exactly 20 passes.**
   - From at least 2 distinct non-consent-region `$geoip_country_code` values — **exactly 2
     passes.**
   - A PostHog `$pageview` count at least 50% of Vercel Web Analytics page views for the same
     window — **exactly 50% passes.** Vercel Web Analytics is the reference signal because it is
     already mounted in `app/layout.tsx`, it is wholly independent of PostHog and of the consent
     gate, and comparing the two would have exposed this outage on its first day.

   **The exact HogQL** (both queries, run verbatim):
   ```sql
   SELECT properties.$geoip_country_code AS country, count() AS pageviews FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 60 MINUTE GROUP BY country ORDER BY pageviews DESC
   ```
   ```sql
   SELECT properties.consent_gate_path, count() FROM events WHERE timestamp >= now() - INTERVAL 60 MINUTE GROUP BY 1
   ```

   **The failure rule, stated as strongly as the local-gate rule in item 1:** zero `$pageview`
   events in the window is a **FAIL**, not a `no-data` row. A phase whose events cannot be
   observed fails this gate and may not be signed off as recorded-not-assumed. There is no
   override and no known-quiet-period allowance — if traffic is genuinely too low to reach 20 in
   an hour, widen the window and say so explicitly in the evidence rather than lowering the bar
   silently.

   **Browser-level proof (sub-item):** GNU `timeout` and `gtimeout` are both absent on this
   machine and the bare Chrome command does not exit on its own, so the bound is alarm-based:
   ```
   perl -e 'alarm 45; exec @ARGV' "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-first-run --user-data-dir=<fresh dir> --virtual-time-budget=12000 --log-net-log=<file> --dump-dom <url>
   ```
   then:
   ```
   grep -oE '"url":"[^"]*/ingest/(e|i/v0/e)/[^"]*"' <file>
   ```
   must return at least one line. **Use a fresh profile** (`<fresh dir>` created new each run) —
   a reused profile may carry an opt-in cookie from a prior session and would prove nothing about
   a first-time visitor.

   **What to paste as evidence:** the query output verbatim (country rows and gate-path rows),
   the Vercel Analytics figure it was compared against, and the netlog grep output.

8. **Protected elements (Phase 3 / D-15)** — run `npm run protected-elements`, with the evidence
   being the printed row table (one row per `data-protected` attribute plus the four `/og`/canonical
   route-contract rows). A fatal exit (2) means the gate could not see its subject — a missing or
   empty checklist, an owner file that no longer exists, or an unreachable base URL — and is never
   recorded as a pass; only a clean run with every row printed `PASS` and exit 0 counts. This item
   is a hard input to Phase 4's ad-placement whitelist (an ad may not cover, push down, or delay
   any element this checklist names) and to Phase 7's per-route SEO gate (a redesign may not
   remove any element the checklist names).

   **Carried-forward items (from STATE.md Blockers/Concerns, open — not resolved by this gate):**
   - The deployment `dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5`'s own item-7 row is unsigned (Phase 2.1's
     re-measurement landed on a low-traffic UTC hour: thresholds 1 and 2 FAILed, threshold 3 was
     NOT EVALUABLE). Action needed: re-measure a full 60-minute window against this same
     deployment on a busier UTC hour, with a window-granularity Vercel Web Analytics read (the
     CLI API only exposes an hour-rounded aggregate).
   - Google Search Console reports `/` as "Crawled – currently not indexed" (crawl 2026-09-05,
     predating the Phase 2 deploy) — pre-existing and unexplained for the homepage. Action needed:
     investigate via GSC (recrawl request, check for a competing canonical or a robots
     directive) and confirm whether it resolves after this phase's deploy.

**Recording rules (what makes this a gate, not a habit):**
- A row is marked passing only with the evidence that produced it recorded alongside it.
- A route Search Console has no data for is `no-data` — never a pass, never a silent omission.
- Rows are ordered lexicographically by route path, one row per route; a re-check of a route
  extends its existing row rather than adding a new one.
- A gate row about ingested events is passing only when it carries counted events — an absent
  count is a **FAIL** for that row, never a `no-data`.

---

## Part 2 — Phase 1 evidence

### Local gate output (2026-09-06, this session)

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ npx tsc --noEmit
(no output — exit 0)

$ npm run lint
✖ 1697 problems (1101 errors, 596 warnings)
— all findings are pre-existing .codex/.claude/.agents scaffolding debt (out of scope
  per CLAUDE.md); zero findings in app/, lib/, components/, scripts/ (confirmed via a
  path-prefix filter over the full lint output).

$ npm test
 Test Files  7 passed (7)
      Tests  59 passed (59)

$ npm run theme-parity
theme-parity: PASS — no parity or divergence issues found.

$ npm run token-audit
- Total findings: 57
- Allowlisted: 57
- Non-allowlisted (gate-relevant): 0
- Missing required @theme categories: none
```

### Route table (theme sweep + SEO-invariant diff)

One row per route, lexicographic order by path. Both columns are recorded on the same row per
the Part 1 recording rules — a second check on a route extends this row, it never duplicates it.

| Route | Theme sweep (Light / Dark) | SEO-invariant diff vs production | Live after deploy (01-09, 2026-09-06) | Search Console (URL inspection, 2026-09-06 post-deploy) |
|---|---|---|---|---|
| `/` | Deferred — end-of-phase UAT (`workflow.human_verify_mode=end-of-phase`; no automated visual-regression harness exists for this project) | same — canonical/robots/structured-data match; non-failing: `og:image` host differs (`localhost:3987` vs `parseforge.gg`, expected — `metadataBase` resolves per host) | 200; CMP script host `fundingchoicesmessages.google.com` present in HTML (publisher ID reached the build); 5 recent-report links rendered | PASS — "Submitted and indexed"; last crawled 2026-09-05 (**pre-deploy crawl** — post-deploy re-crawl not yet observed); rich results: none |
| `/analyze/ZjKgNYxVcAqR8pGJ` (demo report, all 3 tabs) | Deferred — end-of-phase UAT | same *(with caveat)* — canonical/robots differ locally only because this dev server has no `WCL_CLIENT_ID`/`SECRET` (Vercel-only secret, CLAUDE.md) and so cannot fetch the real report; `generateMetadata`'s index-when-public branching is unchanged by this phase. Structured-data `@type` list matches (empty on both — this route emits no JSON-LD). Non-failing: title/description/`og:title` differ (generic-fallback copy locally vs real report copy in prod, same root cause) | 200 | PASS — "Submitted and indexed"; last crawled 2026-08-26 (pre-deploy crawl); rich results: none |
| `/guides` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production | 200 | PASS — "Submitted and indexed"; last crawled 2026-07-29 (pre-deploy crawl); rich results: Breadcrumbs |
| `/guides/how-to-analyze-wow-classic-logs` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production | 200 | PASS — "Submitted and indexed"; last crawled 2026-08-30 (pre-deploy crawl); rich results: Breadcrumbs |
| `/guides/improve-dps-wow-classic` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production | 200 | PASS — "Submitted and indexed"; last crawled 2026-08-21 (pre-deploy crawl); rich results: Breadcrumbs |
| `/guides/raid-preparation-checklist` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production | 200 | PASS — "Submitted and indexed"; last crawled 2026-08-17 (pre-deploy crawl); rich results: Breadcrumbs |
| `/guides/warcraft-logs-vs-parseforge` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production | 200 | PASS — "Submitted and indexed"; last crawled 2026-08-21 (pre-deploy crawl); rich results: Breadcrumbs |
| `/guides/wow-classic-loot-council-tools` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production | 200 | PASS — "Submitted and indexed"; last crawled 2026-08-21 (pre-deploy crawl); rich results: Breadcrumbs |
| `/privacy` | Deferred — end-of-phase UAT | `no-data` pre-deploy (production returned 404) → post-deploy: live with param-free canonical `https://parseforge.gg/privacy`, indexable, listed in `/sitemap.xml` | 200 | `no-data` — NEUTRAL, "URL is unknown to Google", never crawled (page went live with this deploy; now in sitemap — re-inspect at next gate) |
| `/tbc-audit` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production | 200 | PASS — "Submitted and indexed"; last crawled 2026-08-25 (pre-deploy crawl); rich results: Breadcrumbs |
| `/terms` | Deferred — end-of-phase UAT | `no-data` pre-deploy (production returned 404) → post-deploy: live with param-free canonical `https://parseforge.gg/terms`, indexable, listed in `/sitemap.xml` | 200 | `no-data` — NEUTRAL, "URL is unknown to Google", never crawled (page went live with this deploy; now in sitemap — re-inspect at next gate) |

Full per-field diff detail: `npm run seo-invariants -- --report` (verbatim command output below).

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ npm run seo-invariants -- --report --base http://localhost:3987
/: diff-report-only — ogImage (non-failing): local="http://localhost:3987/opengraph-image?f0febbec01d0ca06" prod="https://parseforge.gg/opengraph-image?f0febbec01d0ca06"
/analyze/ZjKgNYxVcAqR8pGJ: diff-report-only — canonical (non-failing: local dev server has no WCL_CLIENT_ID/SECRET (Vercel-only secret) — cannot fetch real report data locally, so this is a local-environment artifact, not a code regression): local="https://parseforge.gg" prod="https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ"; robots (non-failing: same caveat): local="noindex" prod="index, follow"; title (non-failing): local="Report ZjKgNYxVcAqR8pGJ | ParseForge" prod="SSC / TK — WoW Classic Raid Analysis | ParseForge"; description (non-failing): local="WoW Classic raid performance analysis — DPS percentiles, gear audits, buff tracking, and improvement suggestions." prod="Player-by-player analysis of SSC / TK in SSC / TK — DPS/HPS percentiles, gear and enchant audits, buff uptime, and improvement tips for 27 raiders."; ogTitle (non-failing): local="ParseForge raid analysis" prod="SSC / TK — WoW Classic Raid Analysis"
/guides: same (canonical/robots/structured-data match production)
/guides/how-to-analyze-wow-classic-logs: same (canonical/robots/structured-data match production)
/guides/improve-dps-wow-classic: same (canonical/robots/structured-data match production)
/guides/raid-preparation-checklist: same (canonical/robots/structured-data match production)
/guides/warcraft-logs-vs-parseforge: same (canonical/robots/structured-data match production)
/guides/wow-classic-loot-council-tools: same (canonical/robots/structured-data match production)
/privacy: no-data (production returned 404)
/tbc-audit: same (canonical/robots/structured-data match production)
/terms: no-data (production returned 404)

$ npm run seo-invariants -- --base http://localhost:3987
(same output; exit 0 — no canonical/robots/structured-data regression for any route with production data)
```

### PostHog instrumentation (pre-deploy grep evidence)

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ grep -c 'theme_changed' app/components/ThemeToggle.tsx
1
$ grep -c 'startConsentListener(' app/components/PostHogProvider.tsx
1
$ grep -c 'consent_resolved' app/components/PostHogProvider.tsx
2
$ grep -c 'consent_unavailable' app/components/PostHogProvider.tsx
1
```

`theme_changed` and `consent_unavailable` each have exactly one capture site, as required.
`consent_resolved` appears twice — both inside the single `startConsentListener` registration's
`switch` statement (`app/components/PostHogProvider.tsx`), one per mutually-exclusive branch
(`opt-in-full` → `accepted: true`, `cookieless` → `accepted: false`). This is one logical capture
site with two outcomes of the same decision, not a duplicate/double-counting site — a single
visitor's consent resolution can only take one branch, never both. See 01-08-SUMMARY.md
`## Deviations from Plan` for why this differs from the plan's literal "count must equal 1"
wording.

### Sitemap pipeline (unchanged, verified intact)

```
$ grep -q 'export const usingSharedCache' lib/kv-cache.ts && echo OK
OK
$ grep -q 'export async function recordRecentReport' lib/kv-cache.ts && echo OK
OK
$ grep -q 'export async function getRecentReports' lib/kv-cache.ts && echo OK
OK
$ grep -q 'recordRecentReport' lib/report-meta.ts && echo OK
OK
$ grep -q 'getRecentReports' app/sitemap.ts && echo OK
OK
```

None of Phase 1's numbered plans (01-01 through 01-07) touch `lib/kv-cache.ts`,
`lib/report-meta.ts`, or `app/sitemap.ts` — confirmed via `git log --oneline -- lib/kv-cache.ts
lib/report-meta.ts app/sitemap.ts`, whose most recent hit before this plan is quick task
`260906-kzw` (`bb816bb`) adding two `STATIC_ROUTES` entries (`/privacy`, `/terms`) to
`app/sitemap.ts` — a pure addition that doesn't touch the `getRecentReports`/`DEMO_REPORT`
pipeline (verified in `260906-kzw-SUMMARY.md` D4 and re-confirmed by the grep checks above).

### Production deploy (plan 01-09, 2026-09-06)

Developer approval: a Vercel **preview** deployment was created first
(`parseforge-bpny2a7d1-loot-list-plus.vercel.app`, behind team SSO) and offered for a visual
pass; the developer then replied `deploy-now` at the 01-09 decision checkpoint.

```
$ vercel deploy --prod --scope loot-list-plus --yes
Production  https://parseforge-424ibrxax-loot-list-plus.vercel.app
Aliased     https://parseforge.gg
readyState  READY
```

Build-log note: `[kv-cache] getRecentReports failed: Dynamic server usage` lines appear during
the static prerender of `/` and `/sitemap.xml`. This is pre-existing (`lib/kv-cache.ts` is
untouched by Phase 1 — its `cache: "no-store"` fetch dates from commit `a4aaf75`) and harmless
at runtime: the live sitemap and homepage below both carry recent-report data.

Live verification (all from `https://parseforge.gg`, immediately post-alias):

```
all 13 paths 200: / /guides /guides/* (5) /tbc-audit /privacy /terms
                  /analyze/ZjKgNYxVcAqR8pGJ /sitemap.xml /robots.txt
CMP script host present in / HTML: fundingchoicesmessages.google.com   ← MONY-01 live
sitemap.xml: 4837 <loc> entries, 4827 /analyze/ report URLs, /privacy + /terms listed
homepage: 5 distinct /analyze/ recent-report links
/privacy canonical: https://parseforge.gg/privacy (param-free)
```

### Search Console (post-deploy, 2026-09-06, MCP `gscServer`, property `sc-domain:parseforge.gg`)

Per-route verdicts are recorded in the route table above (fifth column). Summary: 9/11 routes
PASS "Submitted and indexed" with rich results unchanged (Breadcrumbs on guides + tbc-audit,
none on `/` and the analyze route — matching the pre-deploy baseline in 01-08-SUMMARY.md).
**All nine `last_crawled` dates predate this deploy** (newest 2026-09-05), so these confirm the
routes entered the deploy indexed; they do not yet confirm Google's view of the *new* build.
`/privacy` and `/terms` are `no-data` (unknown to Google, never crawled). Re-inspect all eleven
at the next phase gate; a route that regresses to non-PASS then is a Phase 1 defect.

### PostHog event definitions (post-deploy, 2026-09-06 ~21:45 PDT)

| Event | Result | Evidence / reason |
|---|---|---|
| `theme_changed` | `no-data` | PostHog MCP (`posthog`) OAuth was completed by the developer but the MCP server disconnected before exposing its tools this session, so the event-definition query could not be run. Independently: the event only materialises after a real visitor uses the navbar toggle; the deploy was minutes old at check time. Call site verified pre-deploy (grep above). |
| `consent_resolved` | `no-data` | Same connection reason. Additionally fires only for EEA/UK visitors (`opt-in-full` / `cookieless` branches), so no-data is the expected value until EEA traffic arrives. Call site verified pre-deploy. |
| `consent_unavailable` | `no-data` | Same connection reason. Fires only when a visitor's CMP is blocked/absent past `CMP_TIMEOUT_MS`; expected to stay absent in a healthy deployment. |

Re-check at the next phase gate via PostHog → Data management → Events (project 337485) or
the PostHog MCP `event-definition` command once the connection is stable. A row here flips to
**present** only with the listing that proves it.

### Manual follow-up (outside this gate)

- **AdSense privacy-policy URL** (tracked per `260906-kzw-SUMMARY.md`): paste
  `https://parseforge.gg/privacy` into AdSense → Privacy & messaging → European regulations →
  message → site settings. The page is live as of this deploy.

### Sign-off — Phase 1 (2026-09-06)

| Gate step | Result | Evidence |
|---|---|---|
| 1. Local gate | **pass** | tsc / lint / 59 tests / theme-parity / token-audit output above |
| 2. Both-theme route sweep | **deferred → end-of-phase UAT** | `.planning/WINDOWS.md` entries 1–3; `human_verify_mode=end-of-phase` |
| 3. SEO invariants | **pass** | `seo-invariants` exit 0 (11 routes; re-run independently by the orchestrator against a fresh dev server on port 3971 with identical results) |
| 4. PostHog instrumentation | pre-deploy **pass** / post-deploy **no-data** | grep counts above / table above |
| 5. Search Console | **pass (pre-deploy crawl)** ×9 / **no-data** ×2 | route table, fifth column |
| 6. Manual prod deploy | **pass** | `deploy-now` given at the 01-09 checkpoint after a preview; deployment `parseforge-424ibrxax` aliased to parseforge.gg; CMP script host present in prod HTML |

Nothing in this table is marked passing without the output that produced it. The two
`no-data` families (PostHog definitions, GSC for the two new routes) are recorded, not assumed,
and are the first items to re-inspect at the Phase 2 gate.

Regenerate this report's SEO-invariant section with `npm run seo-invariants -- --markdown
docs/OPS-01-SHIP-GATE.md` (appends a fresh route table) or re-run `npm run token-audit --
--markdown docs/TOKEN-AUDIT.md` for the token-audit companion artifact — see
[`docs/TOKEN-AUDIT.md`](./TOKEN-AUDIT.md) for the DSGN-01 token audit this gate's local-gate step
depends on.

All eleven routes confirmed responding `200` from the local dev server (port 3987) before this
sweep was scheduled — see Task 1 verification below. The theme-sweep column is deferred to the
phase's end-of-phase human-verify sweep (per `workflow.human_verify_mode=end-of-phase` in
`.planning/config.json`), consistent with every other Phase 1 plan's deferral pattern
(01-01 through 01-07) — no jsdom/RTL/Playwright harness exists in this project
(01-RESEARCH.md Open Question 3), and this session's executor has no browser-automation tool
available. This is a `human_judgment: true` deliverable, not a silent skip: it is recorded in
this plan's SUMMARY.md `coverage:` block and in `.planning/WINDOWS.md` so it stays visible
through to phase close.

---

## Part 3 — Phase 2 evidence

Phase 2 (02-accuracy-analysis-depth) shipped a cast timeline, healer-relevant metrics and
suggestions, a regenerated wago.tools game-data pipeline, and a regression net over three
previously-untested engines (ACC-01 through ACC-04). This section is written in two passes: Task
1 (02-09) runs the pre-deploy half of the gate below; Task 2 is the deploy decision checkpoint;
Task 3 completes the post-deploy half (route sweep, PostHog confirmation, Search Console, and the
dated sign-off) once the developer's decision is executed.

### Local gate output (2026-09-08, Task 1, this session)

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ npx tsc --noEmit
(no output — exit 0)

$ npm run lint
✖ 1698 problems (1101 errors, 597 warnings)
— unscoped run exits 1, but every error/warning line traces to the untracked .codex/
  scaffolding directory (confirmed via a path-prefix filter over the full output: the only
  app/lib/components/scripts finding is one pre-existing `<img>` LCP warning in
  app/components/CastTimeline.tsx, already documented as pre-existing debt in 02-08-SUMMARY.md).
  A scoped run over this project's own source confirms the gate-relevant result:
  `npx eslint app lib components scripts` -> 1 problem (0 errors, 1 warning), exit 0.

$ npm test
 Test Files  14 passed (14)
      Tests  135 passed (135)
   Duration  571ms

$ npm run theme-parity
theme-parity: PASS — no parity or divergence issues found.

$ npm run token-audit
- Total findings: 57
- Allowlisted: 57
- Non-allowlisted (gate-relevant): 0
- Missing required @theme categories: none
```

All five commands are green by the gate-relevant measure (`tsc` exit 0; suite 135/135; both
audit scripts pass with zero gate-relevant findings). The unscoped `npm run lint` exit code is
recorded honestly as non-zero rather than rounded to a pass — per this document's own recording
rule, an unevidenced pass is a claim, not a gate, and the counter-evidence (the scoped run, and
the path-prefix filter over the unscoped run) is recorded alongside it rather than substituted
for it. This mirrors the Phase 1 Part 2 precedent for the identical `.codex/` noise.

### SEO invariants (2026-09-08, Task 1, local dev server on port 3987)

`app/analyze/[reportCode]/page.tsx` — the canonical and `robots` logic Phase 2's new Timeline
sub-tab must not disturb — was confirmed unchanged by this phase: `git log --oneline -- 'app/analyze/[reportCode]/page.tsx'` shows its most recent commit is `a4aaf75` (a pre-Phase-1 growth PR), and no Phase 2 plan (02-01 through 02-08) lists it in `files_modified`. The canonical it emits (`https://parseforge.gg/analyze/${reportCode}`) carries no query parameters, so the Timeline tab's `?ptab=timeline` permutation folds into the same indexable URL as every other sub-tab (D-01).

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ npm run seo-invariants -- --base http://localhost:3987
/: diff-report-only — ogImage (non-failing): local="http://localhost:3987/opengraph-image?f0febbec01d0ca06" prod="https://parseforge.gg/opengraph-image?f0febbec01d0ca06"
/analyze/ZjKgNYxVcAqR8pGJ: diff-report-only — canonical (non-failing: local dev server has no WCL_CLIENT_ID/SECRET (Vercel-only secret) — cannot fetch real report data locally, so this is a local-environment artifact, not a code regression): local="https://parseforge.gg" prod="https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ"; robots (non-failing: same caveat): local="noindex" prod="index, follow"; title (non-failing): local="Report ZjKgNYxVcAqR8pGJ | ParseForge" prod="SSC / TK — WoW Classic Raid Analysis | ParseForge"; description (non-failing): local="WoW Classic raid performance analysis — DPS percentiles, gear audits, buff tracking, and improvement suggestions." prod="Player-by-player analysis of SSC / TK in SSC / TK — DPS/HPS percentiles, gear and enchant audits, buff uptime, and improvement tips for 27 raiders."; ogTitle (non-failing): local="ParseForge raid analysis" prod="SSC / TK — WoW Classic Raid Analysis"
/guides: same (canonical/robots/structured-data match production)
/guides/how-to-analyze-wow-classic-logs: same (canonical/robots/structured-data match production)
/guides/improve-dps-wow-classic: same (canonical/robots/structured-data match production)
/guides/raid-preparation-checklist: same (canonical/robots/structured-data match production)
/guides/warcraft-logs-vs-parseforge: same (canonical/robots/structured-data match production)
/guides/wow-classic-loot-council-tools: same (canonical/robots/structured-data match production)
/privacy: same (canonical/robots/structured-data match production)
/tbc-audit: same (canonical/robots/structured-data match production)
/terms: same (canonical/robots/structured-data match production)
```

Exit 0. Every route reports `same` or a non-failing diff already explained (the local dev
server's missing WCL credentials, and `og:image`'s expected per-host `metadataBase`
resolution) — no canonical, `robots`, title, description or JSON-LD regression for `/analyze` or
any other route. This is the same pair of non-failing caveats Phase 1's Part 2 recorded for the
identical two routes, confirming nothing about the SEO-relevant surface moved between phases.

### PostHog instrumentation (pre-deploy grep evidence, 2026-09-08, Task 1)

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ grep -rn 'posthog.capture("timeline_viewed"' app/ lib/
app/analyze/[reportCode]/hooks/useTimeline.ts:70:      posthog.capture("timeline_viewed", {
$ grep -rn 'posthog.capture("timeline_error"' app/ lib/
app/analyze/[reportCode]/hooks/useTimeline.ts:78:      posthog.capture("timeline_error", {
$ grep -rn 'posthog.capture("timeline_filter_used"' app/ lib/
app/analyze/[reportCode]/hooks/useTimeline.ts:105:      posthog.capture("timeline_filter_used", {
$ grep -rn 'posthog.capture("analysis_complete"' app/ lib/
app/analyze/[reportCode]/hooks/usePlayerAnalysis.ts:65:        posthog.capture("analysis_complete", {
```

`timeline_viewed`, `timeline_error` and `timeline_filter_used` each have exactly one capture
call site, all in `app/analyze/[reportCode]/hooks/useTimeline.ts`. `analysis_complete` — carried
forward from Phase 1, now extended with healer-role properties per 02-07 — still has exactly one
call site, in `app/analyze/[reportCode]/hooks/usePlayerAnalysis.ts` (02-07 consolidated what was
previously multiple `analysis_error` literal call sites into one closure; `analysis_complete`
itself was already singular).

**Note on the plan's literal verify script:** `02-09-PLAN.md`'s Task 1 `<verify>` block computes
this count via `grep -rl "$e" app/ | xargs grep -c "posthog.capture(\"$e\"" | awk -F: '{s+=$2}'`.
When `grep -rl` matches exactly one file (true for all three timeline events — each lives in a
single hook file), `xargs grep -c` on a single filename argument omits the `filename:` prefix
GNU/BSD grep only adds for 2+ file arguments, so the count lands in awk's `$1`, not `$2`, and the
script sums 0 for the exact case it's meant to confirm as passing. This is a shell-script bug in
the plan's own verify text, not a regression in this phase's instrumentation: the count above,
taken with a prefix-stable `grep -rn ... | wc -l` and cross-checked by direct file inspection,
confirms all three events at exactly 1. Recorded here rather than silently worked around, per the
deviation-documentation rule.

### Game-data regeneration diff review (ACC-01, 2026-09-08, Task 1)

`docs/GAME-DATA-AUDIT.md` was read in full as part of this gate, per D-12's acceptance-artifact
requirement for ACC-01 — a phase that shipped the regeneration pipeline but never read its own
output has not satisfied the requirement.

- **Unverified overrides:** 133 entries (`enchantNames` id 88, plus two more enchant ids, plus
  130 `consumableNames` overrides — the bulk of the list). Every entry carries a per-id source
  note explaining why client data alone could not supply the value (buff-aura names omitting an
  item-type prefix, generic "Well Fed" labels shared across dozens of foods, spell ids with no
  resolvable `Name_lang` in any of the three regenerated client builds, or two Cata
  weapon-enhancement ids — 96264, 96294 — whose resolved value could not be corroborated against
  another era and is explicitly flagged for a future verification pass). None is presented as
  wago-verified when it is not; 02-06-SUMMARY.md's own frontmatter records a full 178-row
  parity check confirming every override is behaviour-preserving against the pre-regeneration,
  previously-verified (PR #11-era) values.
- **Changed values since the previous run:** 0 — `docs/GAME-DATA-AUDIT.md`'s "Changed values
  since the previous run" section reads "(none — every resolved value matches the previous run)".
  No regression was introduced between the 02-06 regeneration and this gate's review.
- **Cross-era collisions:** enumerated separately (809 enchant, 295 gem per 02-06-SUMMARY.md),
  never silently resolved — `lib/generated/index.ts` documents the Classic+TBC-first collision
  precedence this project settled on (a deliberate reversal of the plan's literal "later era
  wins" text, empirically required — see 02-06-SUMMARY.md `## Deviations from Plan`).

This closes the review half of ACC-01's acceptance artifact. The two flagged-but-unresolved ids
(96264, 96294) are not a blocker for this gate — they resolve to real, previously-verified values,
not placeholders — but are worth carrying forward as a follow-up verification item (see
`.planning/WINDOWS.md`).

### Task 1 acceptance-criteria verification (all automated, 2026-09-08)

| Criterion | Result |
|---|---|
| All five local-gate commands recorded verbatim | ✅ above |
| `npm run seo-invariants` exits 0, route table recorded | ✅ above |
| `app/analyze/[reportCode]/page.tsx` confirmed unchanged, canonical confirmed param-free | ✅ above |
| Each of the three timeline events has exactly one `posthog.capture` call site | ✅ above (script-bug note recorded) |
| `docs/GAME-DATA-AUDIT.md` read, unverified-override and changed-value counts recorded | ✅ above (133 / 0) |
| No Phase 1 row rewritten, no route row duplicated | ✅ — Part 2 untouched; the Phase 2 route table for the both-theme sweep and Search Console (step 2, step 5) is added by Task 3, extending rows by route path rather than duplicating them |

### Task 2 — deploy-route decision (2026-09-08)

Developer decision recorded: **`preview-first`** — run a preview deploy, do the both-theme route
sweep, the mobile Timeline pass, and the real-gear game-data name check against it, then return
for the production deploy.

**Also-decide (push + PR):** push + PR first, already done ahead of this task by the orchestrator.
`origin/main` was fast-forwarded to `55d2010` (Phase 1 + Phase 2 planning docs); branch
`growth/phase-2-accuracy-depth` (= `main` HEAD `58242be`, the Phase 2 commits) was pushed and
**PR #15** opened: https://github.com/alexandermayes/parseforge/pull/15. No further push or PR
action is taken by this plan — local `main` remains the working branch for the rest of Task 3;
the orchestrator syncs the branch/PR afterward.

Task 3 (deploy execution, both-theme sweep, PostHog post-deploy confirmation, Search Console, and
the dated sign-off) continues this section below. **This dispatch runs the PREVIEW half of Task 3
only** — no `--prod` command runs until a further explicit developer approval.

### Task 3 (preview half) — deploy and non-interactive checks (2026-09-08)

**Precondition check.**

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ vercel whoami
Vercel CLI 56.3.1 (Node.js 20.20.2)
alexandermayes
```
Authenticated as `alexandermayes` — precondition satisfied.

**Preview deploy** (`vercel deploy --scope loot-list-plus --yes` — no `--prod`):

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ vercel deploy --scope loot-list-plus --yes
Deploying loot-list-plus/parseforge
  Inspect         https://vercel.com/loot-list-plus/parseforge/7KKe2LX2zj7GYezXVuc1jRn7cEtX
  Preview         https://parseforge-7yjzs8yw5-loot-list-plus.vercel.app
Building… (Next.js 16.1.6, Turbopack) — Compiled successfully in 8.3s
Route (app): all 24 routes generated (○ static ×13, ƒ dynamic ×11), matching the local build's
route set (11 page.tsx routes plus API/asset routes) — no route added or removed by this phase
{
  "status": "ok",
  "deployment": {
    "id": "dpl_7KKe2LX2zj7GYezXVuc1jRn7cEtX",
    "url": "https://parseforge-7yjzs8yw5-loot-list-plus.vercel.app",
    "inspectorUrl": "https://vercel.com/loot-list-plus/parseforge/7KKe2LX2zj7GYezXVuc1jRn7cEtX",
    "readyState": "READY"
  }
}
```

- **Preview URL:** https://parseforge-7yjzs8yw5-loot-list-plus.vercel.app
- **Inspect URL:** https://vercel.com/loot-list-plus/parseforge/7KKe2LX2zj7GYezXVuc1jRn7cEtX
- **Deployment id:** `dpl_7KKe2LX2zj7GYezXVuc1jRn7cEtX`
- No `--prod` flag was used; `readyState: READY` confirms a clean preview build with no build
  errors. The build-log `[kv-cache] ... Dynamic server usage` lines are the same pre-existing,
  harmless prerender noise Phase 1's 01-09 recorded (untouched `cache: "no-store"` fetch in
  `lib/kv-cache.ts`, dates to commit `a4aaf75`).

**Non-interactive route check — blocked by Vercel team SSO (expected, same as Phase 1).**
Attempted a Node-`fetch` HEAD-style status check of all 11 `page.tsx` routes plus `/sitemap.xml`
and `/robots.txt` against the preview URL:

```
$ node -e '... fetch(base + p, { redirect: "manual" }) ...'
302 / -> https://vercel.com/sso-api?url=...
302 /analyze/ZjKgNYxVcAqR8pGJ -> https://vercel.com/sso-api?url=...
302 /guides -> https://vercel.com/sso-api?url=...
[... all 13 paths checked, all 302 to vercel.com/sso-api ...]
```

Every path 302-redirects to `vercel.com/sso-api` — this preview deployment is protected by
Vercel's team SSO (Standard Protection), the same behaviour 01-09-SUMMARY.md recorded for its
preview (`parseforge-bpny2a7d1-loot-list-plus.vercel.app (behind team SSO)`). This is expected,
not a build defect: only an authenticated team member's browser session can load the preview, so
the automated route/SEO-diff checks that ran cleanly against `localhost` in Task 1 cannot also run
non-interactively against this URL without a Vercel Protection Bypass secret, which is not
provisioned for this project. `npm run seo-invariants -- --base <preview-url>` was not attempted
for the same reason — its underlying fetch would hit the identical SSO redirect. Recorded here
rather than silently skipped, per the gate document's own evidence rule.

**What this leaves for the developer's manual pass.** The developer is logged into the
`loot-list-plus` Vercel team in their browser, so the SSO redirect resolves transparently for
them. The both-theme route sweep, the Timeline mobile pass, and the real-gear game-data name
check (Task 3's step 2, plus the ACC-01/ACC-03 human-check items) all run against
https://parseforge-7yjzs8yw5-loot-list-plus.vercel.app in that authenticated session — see the
checkpoint below for the exact steps.

**PostHog / Search Console (step 4/5) not yet run.** Real user traffic and a production alias are
required for both — the preview URL is not the production domain Search Console tracks, and no
traffic has hit the preview yet. These remain for the post-approval production half of Task 3.

**Production deploy: not run in this dispatch.** No `vercel deploy --prod` command was issued
by this half of Task 3. It required a further explicit developer approval after the preview
sweep below — recorded in the next section.

### Developer's preview sweep (2026-09-08)

The developer performed the both-theme, 11-route sweep and the Timeline-specific checks against
the preview URL (`https://parseforge-7yjzs8yw5-loot-list-plus.vercel.app`, authenticated via
their own `loot-list-plus` Vercel team SSO session, per the "What this leaves for the developer's
manual pass" note above):

- Every route with a `page.tsx` under `app/` (11 routes), Light and Dark
- The Timeline sub-tab on the demo report's analyze page at a 375px viewport: scroll behaviour,
  ability-chip filter toggling, idle bands and the death band
- Real-gear game-data names on the demo report — the regenerated enchant/gem/consumable names
  from `docs/GAME-DATA-AUDIT.md` rendering correctly against a real report rather than a pinned
  test pair (ACC-01's live-render half)
- The healer card (Overheal / Uptime rows with top-healer comparison values) on the demo report

**Result: approved, no issues reported.** The developer's approval is the record for this step —
per this document's own recording rule, a step this project has no browser-automation harness for
is a `human_judgment: true` deliverable, and the human's verdict is the evidence.

### Task 2 (continued) — production deploy approval

Following the approved preview sweep, the developer approved the production deploy. The Claude
Code auto-mode classifier initially denied the executor's own `vercel deploy --prod` invocation;
the developer added a `Bash(vercel deploy:*)` permission and the orchestrator ran the command
once, in this session, immediately after the preview approval above — the same
approval-then-execute sequence Task 2's decision required, carried out by the orchestrator rather
than by a spawned executor because of the classifier denial, not because the approval step was
skipped.

### Task 3 (production half) — deploy and post-deploy evidence (2026-09-08)

**Production deploy** (`vercel deploy --prod --scope loot-list-plus --yes`, run by the
orchestrator ~18:10 UTC after the developer's approval above):

```
$ vercel deploy --prod --scope loot-list-plus --yes
(exit 0)
Deployment id   dpl_5bwk1fJJNuZXkoC5poPGFZQpGy6c
Deployment URL  https://parseforge-b45f73r62-loot-list-plus.vercel.app
```

`vercel inspect` confirms: target `production`, status `Ready`, aliases
`https://parseforge.gg` and `https://www.parseforge.gg`.

**Orchestrator's immediate live checks** (before this dispatch resumed):

```
GET https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ  -> 200, age: 0
POST https://parseforge.gg/api/timeline  {}         -> 400 (route exists; validation rejects the empty body)
```

**This dispatch's post-deploy evidence** (2026-09-08, continuing Task 3):

*seo-invariants, re-run against a fresh local dev server (port 3990) and the now-updated
production:*

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ npm run seo-invariants -- --base http://localhost:3990
/: diff-report-only — ogImage (non-failing): local="http://localhost:3990/opengraph-image?f0febbec01d0ca06" prod="https://parseforge.gg/opengraph-image?f0febbec01d0ca06"
/analyze/ZjKgNYxVcAqR8pGJ: diff-report-only — canonical (non-failing: local dev server has no WCL_CLIENT_ID/SECRET (Vercel-only secret) — cannot fetch real report data locally, so this is a local-environment artifact, not a code regression): local="https://parseforge.gg" prod="https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ"; robots (non-failing: same caveat): local="noindex" prod="index, follow"; title (non-failing): local="Report ZjKgNYxVcAqR8pGJ | ParseForge" prod="SSC / TK — WoW Classic Raid Analysis | ParseForge"; description (non-failing): local="WoW Classic raid performance analysis — DPS percentiles, gear audits, buff tracking, and improvement suggestions." prod="Player-by-player analysis of SSC / TK in SSC / TK — DPS/HPS percentiles, gear and enchant audits, buff uptime, and improvement tips for 27 raiders."; ogTitle (non-failing): local="ParseForge raid analysis" prod="SSC / TK — WoW Classic Raid Analysis"
/guides: same (canonical/robots/structured-data match production)
/guides/how-to-analyze-wow-classic-logs: same (canonical/robots/structured-data match production)
/guides/improve-dps-wow-classic: same (canonical/robots/structured-data match production)
/guides/raid-preparation-checklist: same (canonical/robots/structured-data match production)
/guides/warcraft-logs-vs-parseforge: same (canonical/robots/structured-data match production)
/guides/wow-classic-loot-council-tools: same (canonical/robots/structured-data match production)
/privacy: same (canonical/robots/structured-data match production)
/tbc-audit: same (canonical/robots/structured-data match production)
/terms: same (canonical/robots/structured-data match production)
```

Exit 0, no canonical/robots/structured-data regression for any route against the now-deployed
production build — identical result to Task 1's pre-deploy run (same two non-failing caveats:
missing local WCL credentials, per-host `og:image`).

*11-route + sitemap/robots 200 sweep against production:*

```
200 / (age=0)
200 /analyze/ZjKgNYxVcAqR8pGJ (age=0)
200 /guides (age=9)
200 /guides/how-to-analyze-wow-classic-logs (age=9)
200 /guides/improve-dps-wow-classic (age=9)
200 /guides/raid-preparation-checklist (age=9)
200 /guides/warcraft-logs-vs-parseforge (age=8)
200 /guides/wow-classic-loot-council-tools (age=8)
200 /privacy (age=8)
200 /tbc-audit (age=8)
200 /terms (age=7)
200 /sitemap.xml (age=0)
200 /robots.txt (age=139)
```

All 13 paths (11 `page.tsx` routes + sitemap + robots) respond 200 on the live production alias.

*Live `POST /api/timeline` with a valid body — proof the Timeline path works end-to-end against
production Redis and real WCL credentials, per `lib/__fixtures__/README.md`'s recorded
provenance (report `ZjKgNYxVcAqR8pGJ`, fight 23, DPS source 12 — Samkin):*

```
$ node -e '... POST https://parseforge.gg/api/timeline {"reportCode":"ZjKgNYxVcAqR8pGJ","fightId":23,"sourceId":12} ...'
status 200
encounterName: "The Lurker Below"
fightDuration: 346111
playerName: "Samkin"
castCount: 159
rows.length: 168
truncated: false
idleThresholdMs: 2762
```

`castCount: 159` and `idleThresholdMs: 2762` match STATE.md's recorded 02-05 calibration for this
exact fight/player exactly (see the Phase 02 / 02-05 decision entry: "demo report fight 23/Samkin
calibration: 2762ms threshold, 9 idle rows across 159 casts"), confirming the deployed Timeline
route is computing the same values in production that the local engine tests proved. This is the
live end-to-end proof the checkpoint resolution asked for.

**PostHog event definitions (post-deploy) — `no-data`.** This gsd-executor dispatch has no
PostHog MCP tool in its available tool set (the same limitation 01-09-SUMMARY.md recorded: "GSC
MCP tools are not available to gsd-executor, so Tasks 2–3 ran inline in the orchestrator" —
the same is true here for the PostHog MCP in this dispatch). `timeline_viewed`,
`timeline_error`, `timeline_filter_used`, `analysis_complete`, `theme_changed` and
`consent_resolved` are all recorded `no-data` for this reason, not because traffic is absent —
their call sites are independently verified pre-deploy (grep evidence, Task 1 section above and
Phase 1 Part 2). Re-check via the orchestrator or a session with the PostHog MCP connected at the
next phase gate, per this document's own recording rule (an unavailable check is `no-data`, never
a pass and never silently dropped).

**Search Console (post-deploy) — `no-data`.** Same reason: this dispatch has no `gscServer` MCP
tool available. `/analyze/ZjKgNYxVcAqR8pGJ` and `/` are recorded `no-data` for this gate; both
were last confirmed indexable pre-deploy in Phase 1's Part 2 (see the route table there), and no
route or metadata change affecting `/analyze` shipped this phase (confirmed unchanged in Task 1
above). Re-inspect via the orchestrator or a PostHog/GSC-MCP-connected session at the next phase
gate.

### Sign-off — Phase 2 (2026-09-08)

| Gate step | Result | Evidence |
|---|---|---|
| 1. Local gate | **pass** | tsc / scoped-lint (1 warning) / 135 tests / theme-parity / token-audit — Task 1 section above |
| 2. Both-theme route sweep | **pass** | Developer's preview sweep, 11 routes × Light/Dark, approved with no issues; Timeline 375px pass (scroll, chips, idle/death bands) and real-gear game-data names also approved |
| 3. SEO invariants | **pass** | `seo-invariants` exit 0 pre-deploy (Task 1, localhost:3987) and post-deploy (this section, localhost:3990) — identical non-failing caveats both times, no canonical/robots/structured-data regression |
| 4. PostHog instrumentation | pre-deploy **pass** / post-deploy **no-data** | grep counts (Task 1: `timeline_viewed`, `timeline_error`, `timeline_filter_used`, `analysis_complete` each ×1) / PostHog MCP unavailable to this dispatch (reason recorded above) |
| 5. Search Console | **no-data** | `gscServer` MCP unavailable to this dispatch (reason recorded above); both inspected routes were PASS pre-deploy at the Phase 1 gate and no metadata/route change shipped this phase for `/analyze` |
| 6. Manual prod deploy | **pass** | `preview-first` decision (Task 2) → developer approved preview sweep → developer approved production deploy → `vercel deploy --prod --scope loot-list-plus --yes` → `dpl_5bwk1fJJNuZXkoC5poPGFZQpGy6c`, aliased `parseforge.gg` + `www.parseforge.gg`, `vercel inspect` confirms target `production` / status `Ready` |

**Outstanding, carried forward to the Phase 3 gate:**
- PostHog event definitions for `timeline_viewed`, `timeline_error`, `timeline_filter_used`,
  `analysis_complete`, and the Phase-1-carried-forward `theme_changed` / `consent_resolved` —
  needs a session with the PostHog MCP connected and real post-deploy traffic.
- Search Console re-inspection of `/analyze/{code}` and `/` against the Phase 2 build — needs a
  session with the `gscServer` MCP connected.
- The two flagged-but-unresolved game-data ids from the ACC-01 review (Cata weapon-enhancement
  ids 96264, 96294 — resolve to real, previously-verified values, not placeholders, so not a
  blocker; see `.planning/WINDOWS.md`).
- `git push origin main` — PR #15 branch (`growth/phase-2-accuracy-depth`) was pushed and opened
  this phase, but local `main` itself remains ahead of `origin/main`; the orchestrator syncs this
  after the plan closes, per Task 2's also-decide note.

Nothing in this table is marked passing without the evidence that produced it. Both `no-data`
rows have the same, honestly-recorded cause (MCP tool unavailability in this dispatch, not
missing traffic or a broken instrumentation site) and are the first items to re-run at the next
gate — mirroring Phase 1's own pattern of naming its outstanding items rather than omitting them.

---

## Part 4 — Phase 2.1 evidence

Phase 2.1 (posthog-consent-gate-hotfix) fixed a live regression: `cookieless_mode: "on_reject"`
made every `capture()` call a silent no-op while consent stayed `PENDING`, and non-EEA/UK
visitors never got a `__tcfapi` callback to resolve it — see `02.1-DIAGNOSIS.md`. This section
records the **preview half** of this phase's gate evidence (02.1-03): the local gate, the preview
deployment, the deployed `/api/geo` response, and the D-10 netlog proof. The **live-traffic row
(item 7) is left explicitly open below**, pending the production deploy in 02.1-04 — this section
does not sign the gate off.

### Local gate output (2026-09-14, 02.1-03, this session)

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ npx tsc --noEmit
(no output — exit 0)

$ npx vitest run
 Test Files  16 passed (16)
      Tests  161 passed (161)
   Duration  1.77s

$ npx eslint lib/geo.ts lib/geo.test.ts app/api/geo/route.ts app/api/geo/route.test.ts \
    lib/consent.ts lib/consent.test.ts app/components/PostHogProvider.tsx
(no output — exit 0)

$ npm run theme-parity
theme-parity: PASS — no parity or divergence issues found.

$ npm run token-audit
- Total findings: 57
- Allowlisted: 57
- Non-allowlisted (gate-relevant): 0
- Missing required @theme categories: none
```

**Lint scope note (same caveat as Parts 2 and 3):** repo-wide `npm run lint` carries roughly 1698
pre-existing problems, all traced to the untracked `.codex/`/`.claude/`/`.agents/` scaffolding
directories (out of scope per CLAUDE.md) — not this phase's evidence. The gate-relevant evidence
is the **scoped** `npx eslint` run above, over exactly the seven files 02.1-01 created or
modified, exiting 0. This is not a claim that the whole repository is lint-clean.

### SEO invariants (2026-09-14, local dev server on port 3993)

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ npm run seo-invariants -- --base http://localhost:3993
/: diff-report-only — ogImage (non-failing): local="http://localhost:3993/opengraph-image?f0febbec01d0ca06" prod="https://parseforge.gg/opengraph-image?f0febbec01d0ca06"
/analyze/ZjKgNYxVcAqR8pGJ: diff-report-only — canonical/robots (non-failing: local dev server has no WCL_CLIENT_ID/SECRET) — same non-failing caveats as every prior gate run
/guides ... /privacy ... /tbc-audit ... /terms: same (canonical/robots/structured-data match production)
seo-invariants exit: 0
```

No canonical/robots/structured-data regression — this phase touches no route or metadata surface
(only `lib/`, `app/api/geo/`, and `app/components/PostHogProvider.tsx`).

### Preview deployment (2026-09-14)

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ vercel --global-config ~/.vercel-personal deploy --scope loot-list-plus --yes
Preview   https://parseforge-ng0khtpbv-loot-list-plus.vercel.app
{
  "status": "ok",
  "deployment": {
    "id": "dpl_7JGkziQrpZrhKfvxHJNAmtuXfuFy",
    "url": "https://parseforge-ng0khtpbv-loot-list-plus.vercel.app",
    "readyState": "READY"
  }
}
```

- **Branch/commit deployed:** `growth/phase-2-review-fixes` at `110a22d` (HEAD at deploy time —
  includes 02.1-01's consent-gate source fix and 02.1-02's OPS-01 hardening/addenda; no
  uncommitted changes present at deploy time).
- **Deployment id:** `dpl_7JGkziQrpZrhKfvxHJNAmtuXfuFy`
- **Preview URL:** `https://parseforge-ng0khtpbv-loot-list-plus.vercel.app`
- Every `vercel` invocation in this plan carried `--global-config ~/.vercel-personal`. The
  flagged Task 1 pre-flight (`whoami` → `alexandermayes`, `teams ls` → lists `loot-list-plus`,
  `project ls --scope loot-list-plus` → lists `parseforge`) passed with no developer interaction
  before this deploy was attempted, per D-11/CLAUDE.md.
- No production deploy was run in this plan.

### The bypass (approved, redacted)

The preview sits behind Vercel team SSO — an unauthenticated request 302s to
`vercel.com/sso-api`. The developer enabled **Protection Bypass for Automation** for this project
and approved its use for this verification. The secret was read from a scratchpad file
(`bypass.env`, key `VERCEL_AUTOMATION_BYPASS_SECRET`) directly into a shell variable — never
echoed — and every recorded excerpt below had the secret value `sed`-redacted before being
written to disk. Two transports were used, both documented here by name/parameter only:
- `curl` (for `/api/geo`): header `x-vercel-protection-bypass: <redacted>`
- headless Chrome (cannot set request headers): query parameters
  `?x-vercel-protection-bypass=<redacted>&x-vercel-set-bypass-cookie=true` appended to the
  navigated URL, which caused Vercel to set a bypass cookie on the first hit so the rest of the
  page load inherited it.

The netlog file itself (which briefly carries the secret in its top-level navigation URL) stayed
in the session scratchpad and was never committed; every line copied out of it into this document
or the SUMMARY was `sed`-redacted first. No bypass secret value appears anywhere in this
document, in any pasted excerpt, or in the repository.

### Deployed `/api/geo` response (2026-09-14)

```
HTTP/2 200
age: 0
cache-control: private, no-store
content-type: application/json
x-matched-path: /api/geo
x-vercel-cache: MISS

{"isConsentRegion":false}
```

Full headers recorded (redacted) confirm: `Cache-Control: private, no-store` present, **no**
`Set-Cookie` header at all, `content-type: application/json`. Read through the approved bypass
header directly against the deployed preview.

### RESEARCH Open Question 1 — answered

**Question:** does a preview deployment receive `x-vercel-ip-country` the same way production
does (undocumented by Vercel, per `02.1-RESEARCH.md` Pitfall 3 / Assumption A2)?

**Answer: yes.** The developer's real, non-consent-region egress IP produced
`{"isConsentRegion":false}` from the deployed `/api/geo` Route Handler on this preview —
identically via a plain `curl` request and via headless Chrome navigating the same URL. Preview
deployments receive real Vercel geo headers for the requester's actual IP, not a synthetic or
fail-closed value. This closes RESEARCH's Open Question 1 and confirms Assumption A2 empirically
rather than by further doc-reading: nothing about "preview" changes Vercel's geo-header behavior.

### The D-10 netlog proof (2026-09-14)

**The bounded command, run against the preview with a fresh Chrome profile:**
```
PROFILE_DIR=<fresh dir under the session scratchpad, created only for this run>
NETLOG=<scratchpad>/02.1-preview-netlog.json
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.7977.84 Safari/537.36"
perl -e 'alarm 45; exec @ARGV' "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-first-run \
  --user-data-dir="$PROFILE_DIR" \
  --user-agent="$UA" \
  --virtual-time-budget=12000 \
  --log-net-log="$NETLOG" \
  --dump-dom "https://parseforge-ng0khtpbv-loot-list-plus.vercel.app/?x-vercel-protection-bypass=<redacted>&x-vercel-set-bypass-cookie=true"
```

**Grep result:**
```
$ grep -oE '"url":"[^"]*/ingest/(e|i/v0/e)/[^"]*"' "$NETLOG"
"url":"https://parseforge-ng0khtpbv-loot-list-plus.vercel.app/ingest/i/v0/e/?ip=0&_=1789423083437&ver=1.360.0&compression=gzip-js"
"url":"https://parseforge-ng0khtpbv-loot-list-plus.vercel.app/ingest/i/v0/e/?ip=0&_=1789423088829&ver=1.360.0&compression=gzip-js"
"url":"https://parseforge-ng0khtpbv-loot-list-plus.vercel.app/ingest/i/v0/e/?ip=0&_=1789423092854&ver=1.360.0&compression=gzip-js&beacon=1"
12 matching lines total (posthog-js's netlog phase logging records each request 4 times — START/
HEADERS/etc — for these 3 distinct capture requests at three separate flush timestamps roughly
3-5s apart, consistent with the SDK's default 3s batch-flush interval firing repeatedly across
the run; the third carries `beacon=1`, a `navigator.sendBeacon` flush on page teardown).
```

**Result: capture-requests = 12 (3 distinct `/ingest/i/v0/e/` POSTs).** Compared against the
production baseline this is measured against — **zero** capture requests, from the identical
technique run against `https://parseforge.gg/` on 2026-09-14 per `02.1-DIAGNOSIS.md` §3 — this is
the whole difference this phase set out to prove: the first `$pageview` (and subsequent captures)
now reach PostHog for a non-consent-region visitor with no `__tcfapi` involvement at all.

### Finding: the bare D-10 command has a false-negative trap (headless-Chrome bot filtering)

**This was not anticipated by RESEARCH, VALIDATION, or the plan, and is recorded here because it
changes how this technique must be run from now on.** The literal command in `02.1-RESEARCH.md`,
`02.1-VALIDATION.md`, and Part 1 item 7's own "browser-level proof" sub-item (added by 02.1-02)
omits `--user-agent`. Run that way — as this session first did, five times, with generous
real-wall-clock waits up to 12s and multiple diagnostic techniques (CDP console/network
instrumentation, a temporary debug-logged redeploy) — it produces **zero** capture requests
**even against this already-fixed code**, for a reason that has nothing to do with the consent
gate: `node_modules/posthog-js/dist/module.js` ships a built-in bot/crawler filter
(`_is_bot()`, gated by `opt_out_useragent_filter` which defaults to `false`, i.e. the filter is
**on** by default) whose blocklist includes the literal substring `"headlesschrome"` — and
Chrome's own headless mode reports exactly that in `navigator.userAgent`
(`...HeadlessChrome/152.0.0.0...`). When the filter matches, `capture()` returns silently with no
error, no console warning, and no network request — indistinguishable, from the outside, from the
original consent bug.

This was diagnosed empirically in this session by: (1) confirming the pipe itself works (a
manual, hand-crafted `curl` POST straight to `/ingest/e/` returned `{"status":"Ok"}`); (2)
confirming via CDP-instrumented console logging on a temporary debug-logged redeploy that
`applyDecision`/`applyOutcome`/`setConsentReady`/`ph.capture("$pageview")` all ran correctly, with
`isOptedOut()` flipping `true → false` exactly as designed, and `ph.capture()` was called with
`isOptedOut()` already `false` — yet still no network request followed; (3) finding the literal
`"headlesschrome"` string in the installed SDK's bot blocklist and confirming the `_is_bot()`
gate wraps the entire body of `capture()`. The temporary debug `console.log` lines were added only
to `app/components/PostHogProvider.tsx` on a disposable diagnostic preview deploy
(`dpl_AVRyQo6THLcTpm6UXJ6vj9ivsU5D`, not the deployment recorded above) and were reverted via
`git checkout` before the evidence-gathering deploy above was made — the deployment this document
records as evidence (`dpl_7JGkziQrpZrhKfvxHJNAmtuXfuFy`) never carried debug logging.

**The fix used for the netlog run above:** override `--user-agent` to a standard desktop Chrome
string with `Headless` removed (see the command block above). This does not change what is being
tested — the same real deployed code, the same real network round trip, the same real consent
logic — it only removes an artifact of the test tool's own default UA string that would otherwise
make this exact command produce a false negative **regardless of whether the app is correct**.

**Follow-up needed (not done here — Part 1 is not modified by this plan):** Part 1 item 7's
"browser-level proof" sub-item command should gain the same `--user-agent` override, or an
explicit note that `opt_out_useragent_filter: true` would be needed in `posthog.init()` if a
bot-like UA must ever be measured for real. Recorded as a follow-up in `.planning/WINDOWS.md`; the
production baseline in `02.1-DIAGNOSIS.md` §3 remains valid as evidence of the outage because it
is corroborated independently by that diagnosis's multi-day real-user PostHog event-volume data
(section 1), not solely by its own netlog run.

### What this preview cannot show

`NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` and `NEXT_PUBLIC_POSTHOG_HOST` are **Production-only** environment
variables (confirmed in `02.1-CONTEXT.md` and re-confirmed by this deploy: no Google CMP script
tag appears anywhere in the requests this preview made). This preview therefore exercises and
proves **only the non-consent-region geo path** of the tracer. The consent-region (EEA/UK/CH) TCF
path — dialog timing, cookieless-on-reject, replay-only-on-full-opt-in — is observable only on
production, in 02.1-04. **Developer follow-up (outside this phase):** add
`NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` to the Preview environment if a future phase wants to exercise the
TCF path on a preview deployment.

### Item 7 (live-traffic check) — explicitly open

**Not run in this plan.** Item 7 requires production traffic within 60 minutes of a **production**
deploy; this plan performed no production deploy (D-11, CLAUDE.md — preview only). This row is
pending 02.1-04, which runs the production deploy and the live-traffic HogQL check. It is
recorded here as open, not as `no-data` and not as a pass — per this document's own recording
rule, an absent count is a FAIL for that row if claimed complete, so it is left unclaimed instead.

### Preview-half status (not a gate sign-off)

**This plan does not sign off the Phase 2.1 gate.** Per Part 1's item 7 and this phase's own
design, Phase 2.1's gate is not complete until the production deploy and its live-traffic check
run in 02.1-04. This section records the preview evidence only; the dated sign-off table (in the
style of Parts 2 and 3's own `Sign-off` sections) belongs to 02.1-04, once the live-traffic row
above is no longer open.

### Production deploy (2026-09-14, 02.1-04, Task 2)

Developer's explicit yes was given in this session before any production command ran (Task 1);
recorded verbatim in `02.1-04-SUMMARY.md`.

```
Deployment id:   dpl_HY5319wSDVw3M4ibBU42JrSTgw4e
Deployment URL:  https://parseforge-dw7yctna6-loot-list-plus.vercel.app
Created:         2026-09-14T22:16:59Z
Aliased:         https://parseforge.gg, https://www.parseforge.gg
Target:          production   Status: Ready
Built from:      growth/phase-2-review-fixes @ 8693498
Rollback target: dpl_4KnNGpjHrY9q1vwECEXZRaNFF5u7 (PR #16, live immediately prior)
```

**The 60-minute window this gate is measured over: `2026-09-14T22:16:59Z` → `2026-09-14T23:16:59Z`
(UTC).**

`/api/geo` post-deploy: `HTTP 200`, body `{"isConsentRegion":false}`, `Cache-Control: private,
no-store`, no `Set-Cookie` header.

**Production netlog (D-10 proof against the live site).** Fresh Chrome profile created only for
this run, the same `--user-agent` override 02.1-03 documented as necessary against posthog-js's
built-in headless-Chrome bot filter, run against the bare `https://parseforge.gg/` — no bypass
secret or query parameters, because production carries no deployment protection:

```
$ grep -oE '"url":"[^"]*/ingest/(e|i/v0/e)/[^"]*"' "$NETLOG" | wc -l
16
```

16 matching lines / **3 distinct capture requests** (three flush timestamps, the third carrying
`beacon=1` — same phase-logging quadruplication 02.1-03 recorded), against the **2026-09-14
production baseline of zero** (`02.1-DIAGNOSIS.md` §3). The regression is closed on the live site,
not only on a preview.

**Post-deploy local suite** (at the deployed commit): `npx vitest run` → 161/161 passed; `npx tsc
--noEmit` → exit 0, no output.

**Deviation recorded (no production impact).** While probing for a way to read Vercel Analytics
from this session, a bare `vercel --global-config ~/.vercel-personal` invocation with no
subcommand was run, which created an unintended **preview** deployment
(`parseforge-hjr7rkdvv-loot-list-plus.vercel.app`). Production (`dpl_HY5319wSDVw3M4ibBU42JrSTgw4e`,
aliased to `parseforge.gg`) was not affected; no action was needed.

### Live-traffic check (item 7) — production run (2026-09-14, 02.1-04, Task 2)

PostHog project `337485` (confirmed project name "ParseForge" after `switch-project 337485`).
Both queries from Part 1 item 7 run verbatim over `timestamp >= toDateTime('2026-09-14
22:16:59') AND timestamp < toDateTime('2026-09-14 23:16:59')` (the exact 60-minute window above),
at approximately 23:18Z — after the full window had elapsed.

**Query 1 — `$pageview` by `properties.$geoip_country_code`:**

```sql
SELECT properties.$geoip_country_code AS country, count() AS pageviews FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 60 MINUTE GROUP BY country ORDER BY pageviews DESC
```

| Country | Pageviews | Distinct people | In `CONSENT_REGIONS` (`lib/geo.ts`)? |
|---|---|---|---|
| US | 13 | 4 | No |
| BR | 7 | 3 | No |
| CA | 5 | 1 | No |

**Total: 25 `$pageview`, 3 distinct countries, all 3 classified non-consent-region** by direct
lookup against `CONSENT_REGIONS` in `lib/geo.ts` (none of US/BR/CA appear in that set). First
`$pageview` at 22:18:13Z, last at 23:02:56Z — both inside the window.

**Caveat, recorded honestly:** 1–2 of the US pageviews are this executor's own production netlog
run (Task 2) hitting `https://parseforge.gg/` with a real, JS-executing headless-Chrome session.
The total clears the 20-event threshold even after discounting them (23–24 ≥ 20).

- **Threshold "≥ 20 `$pageview`": 25 ≥ 20 — PASS.**
- **Threshold "≥ 2 distinct non-consent-region countries": 3 ≥ 2 — PASS.**

**Query 2 — `consent_gate_path` breakdown:**

```sql
SELECT properties.consent_gate_path, count() FROM events WHERE timestamp >= now() - INTERVAL 60 MINUTE GROUP BY 1
```

| `consent_gate_path` | Count | Distinct people |
|---|---|---|
| `geo-non-consent-region` | 89 | 8 |

No `tcf-accept`, `tcf-reject` or `tcf-timeout` value appears — no EEA/UK/CH visitor arrived in this
window. **The TCF path is recorded as UNOBSERVED, not as passing.** As noted in this Part's "What
this preview cannot show" section above, the preview rendered no Google CMP at all because
`NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` is a Production-only variable — this production window was
therefore the first opportunity in the whole phase to observe the consent-region path, and it did
not occur. **Mismatch backstop (T-02.1-21):** no consent-region country appears under
`tcf-timeout` in this breakdown — there is nothing to route to Phase 4 from this window, because
there is no consent-region traffic in it at all.

**All events ingested in the window, by name** (from the same query family, all-events form):
`$pageview` 25, `$autocapture` 19, `$web_vitals` 16, `raid_overview_complete` 9, `$pageleave` 7,
`fight_selected` 4, `analysis_complete` 3, `report_submitted` 2, `tab_switched` 1, `$rageclick` 1,
`player_selected` 1, `report_url_invalid` 1 — **12 distinct event types actually ingested**, an
unambiguous restoration of live capture.

**The five previously-never-ingested events, checked for real ingestion in this window (not
merely for an event-definition's existence):**

| Event | Count in window | Status |
|---|---|---|
| `theme_changed` | 0 | not observed in window (no triggering action — needs a navbar theme toggle) |
| `consent_resolved` | 0 | not observed in window (requires a TCF/consent-region visitor; none arrived) |
| `timeline_viewed` | 0 | not observed in window (no triggering action — needs a Timeline tab open) |
| `timeline_filter_used` | 0 | not observed in window (no triggering action — needs an ability-chip filter toggle) |
| `timeline_error` | 0 | not observed in window (no triggering action, and not expected to fire absent an error) |

Each is recorded as "not observed in window (no triggering action)" — distinct from "not working" —
per the plan's own instruction; none is recorded as a pass or a fail.

**Vercel Web Analytics comparison — threshold 3, PENDING:**

Vercel Web Analytics pageviews for the identical window (`2026-09-14T22:16:59Z` –
`2026-09-14T23:16:59Z`) could **not be read** from this session:
- The Vercel MCP connector available here is authenticated to a different team (403 response
  against `loot-list-plus`).
- The personal Vercel CLI token (`~/.vercel-personal`) exposes no Web Analytics endpoint.
- A `vercel logs` runtime-log proxy was attempted and judged **unfit** as a substitute: the CLI
  caps output at 100 lines per query, and 4 of 6 ten-minute slices of the window hit that cap, so
  "≥ 160 unique page-document requests" is only a lower bound, not the real figure. The requests
  are also crawler-dominated (roughly 45 distinct `/analyze/<code>` URLs hit once each, `/guides`
  ×31, `/tbc-audit` ×29) — crawlers execute no JavaScript and are counted by neither PostHog nor
  Vercel Web Analytics, so this proxy cannot stand in for either signal. Only ≥ 5 `/api/geo`
  invocations (a proxy for JS-executing loads) appear in the log sample, consistent with the 8 real
  people PostHog recorded above. Zero `geo_header_missing` log lines appeared.

**This threshold is recorded as PENDING — not evaluated, not failed.** The real Vercel Web
Analytics pageview count for this exact window must be read from
`https://vercel.com/loot-list-plus/parseforge/analytics` (custom range 2026-09-14 22:16–23:17
UTC) before this row can be scored. For reference, 25 PostHog pageviews passes the ≥ 50% threshold
at a Vercel figure of ≤ 50.

**Item 7 overall: two of three thresholds PASS (counted events, pasted above); the third is
PENDING pending a number this session could not read. Per this document's own recording rule, an
un-evaluated threshold is not a pass — item 7 is not signed as complete.**

### Code-review follow-up shipped after this deploy, not yet in production (2026-09-14, Task 3)

After the measured deploy above, an advisory code review ran against the 02.1 branch
(`02.1-REVIEW.md`): 1 Critical, 4 Warning, 2 Info findings. CR-01 — `PostHogProvider` trusted the
`/api/geo` JSON body without runtime validation, so a JSON-shaped 5xx payload would fail **open**
(opt the visitor in) instead of closed. WR-01 — no fetch timeout on `/api/geo`. WR-02 — a
whitespace-only geo header was not logged as `geo_header_missing`. WR-03 — the `__tcfapi` listener
could double-fire `consent_resolved`/`consent_unavailable` on a repeat TCF resolution. WR-04 —
missing an explicit return type on the `/api/geo` `GET` handler.

`02.1-REVIEW-FIX.md` records all five fixed on the branch (commits `90f5a46`, `0e03d9b`,
`7a7cf0c`, `9657535`, `9da21c4`), suite 161 → 162, `tsc` clean. **None of these five fixes are in
the deployment measured above** (`dpl_HY5319wSDVw3M4ibBU42JrSTgw4e` was built from `8693498`,
which predates all five commits). Shipping them requires a separate, developer-approved production
deploy — out of scope for this plan. **Recorded here as a required follow-up, not performed in
this plan.**

### Search Console (Part 1 item 5) — no GSC MCP tool available this session (Task 3)

This phase's `files_modified` touch only `lib/geo.ts`, `app/api/geo/route.ts`, `lib/consent.ts`
and `app/components/PostHogProvider.tsx` — no `page.tsx`, no route, and no metadata surface
changed, so the expected Search Console result is no change to any route's indexability or
metadata. This session has no `gscServer`-equivalent MCP tool available to actually run the URL
inspection (the same limitation Part 3 recorded for its own post-deploy Search Console row), so
this row is recorded as **`no-data`** for this gate — a legitimate outcome for this row, unlike the
live-traffic row above. STATE.md's standing follow-up about `/` showing "Crawled - currently not
indexed" belongs to the Phase 3 gate, per this plan's own instruction, and is not investigated
here.

### Phase 2.1 Sign-off — NOT SIGNED (2026-09-14, Task 3)

Per this document's own oldest rule (a row is passing only with its evidence beside it — an
unevidenced pass is a claim, not a gate) and per Task 3's own precondition (all three item-7
thresholds must pass before this section signs), **Phase 2.1 is not signed off.** One threshold —
the Vercel Web Analytics ratio — is PENDING, not evaluated, so item 7 as a whole cannot be marked
passing, and the phase-level sign-off table used by Parts 2 and 3 is deliberately not written here.

**What remains before this gate can be signed:**
1. Read the real Vercel Web Analytics pageview figure for the window `2026-09-14 22:16:59Z` –
   `23:16:59Z` from `https://vercel.com/loot-list-plus/parseforge/analytics` and compute the ratio
   against the 25 PostHog `$pageview` events recorded above (pass at Vercel ≤ 50).
2. If that ratio passes, sign this section with a date and extend `.planning/REQUIREMENTS.md`'s
   OPS-01 entry with the real date the criterion was met (D-09).
3. Separately — and not a precondition for item 7's own pass/fail — get the developer's approval
   for a follow-up production deploy of the five code-review fix commits above, since none of them
   are in the deployment this gate measured.

Until step 1 resolves, OPS-01's PostHog criterion remains **not-yet-met** for Phase 2.1, exactly as
it was for Phase 1 and Phase 2 before their own corrections — see the addendum in
`.planning/REQUIREMENTS.md`.

**Verification note on this Part's own automated secret/IP scan:** Part 1 item 7's committed
evidence (`## Finding: the bare D-10 command has a false-negative trap`, pre-existing since
02.1-03) contains a dot-separated Chrome version number embedded in a User-Agent string, which
Task 3's own verify script's dotted-quad pattern matches as a false positive — it is a browser
version, not an IP address or a credential. Recorded here rather than silently reworded, since
that text belongs to a prior plan and this plan's edits are additive-only.

### Vercel Web Analytics figure and final item 7 scoring (gap closure 02.1-05, 2026-09-15)

**Vercel Web Analytics figure, with provenance:**
- Figure (page views): **23**
- Dashboard URL: `https://vercel.com/loot-list-plus/parseforge/analytics` — team LootListPlus
  (slug `loot-list-plus`), project `parseforge`, environment filter "Production", hostname
  parseforge.gg (+2)
- Range set: the range picker displayed "Sep 14, 3:16pm …" with the end of the range truncated
  and illegible in the screenshot; the chart's x-axis spans 3pm–4pm. The developer was instructed
  to set 3:16 PM – 4:17 PM Pacific — the start (3:16 PM) is confirmed visually, the end is not.
- Timezone: US Pacific, daylight time (PDT, UTC−7). The developer's own words were "It's PST
  btw"; on 2026-09-14 Pacific observes daylight time, so 3:16 PM PDT = 22:16 UTC, matching this
  window's start (`2026-09-14T22:16:59Z`) exactly.
- Window match: **not confirmed as exactly the 60-minute window** — the range's end time is
  illegible in the screenshot, so this figure is recorded as an **upper bound**, per this plan's
  own rule for a range that may be wider than the window.
- Reader: the developer, via a screenshot supplied in-session on 2026-09-15 (UTC), reading the
  dashboard directly. No browser automation was used (the Chrome extension was not connected). No
  Vercel or PostHog credential, cookie, token or session value was requested, read, printed or
  stored.

**Threshold scoring** — thresholds 1 and 2 restated from the 2026-09-14 production run above,
threshold 3 computed against the figure just recorded:

- Threshold 1 (≥ 20 `$pageview` events — 25 counted in the 2026-09-14 production window): PASS
- Threshold 2 (≥ 2 distinct non-consent-region countries — 3 counted: US, BR, CA): PASS
- Threshold 3 (PostHog `$pageview` count ≥ 50% of the Vercel Web Analytics figure for the same
  window — PostHog 25, Vercel figure 23 (upper bound; the true window figure is ≤ 23) → 25 / 23 ≈
  108.7%, well above the 50% line; the result holds a fortiori for any true window figure ≤ 23):
  PASS

### Phase 2.1 Sign-off — SIGNED (2026-09-15, gap-closure 02.1-05)

This section **supersedes** the `### Phase 2.1 Sign-off — NOT SIGNED (2026-09-14, Task 3)` section
above it, which stays in place unedited. All three item 7 thresholds now read PASS with the Vercel
Web Analytics figure recorded above.

| Gate step | Result | Evidence |
|---|---|---|
| 1. Local gate | **pass** | `npx tsc --noEmit` exit 0; 161/161 tests; scoped `eslint` exit 0; `theme-parity` PASS; `token-audit` 0 non-allowlisted findings (02.1-03, "Local gate output") |
| 2. Both-theme route sweep | **deferred → end-of-phase UAT** | `human_verify_mode=end-of-phase`, same deferral pattern as Parts 1–3 |
| 3. SEO invariants | **pass** | `seo-invariants` exit 0; no canonical/robots/structured-data regression (02.1-03) |
| 4. PostHog instrumentation | pre-deploy **pass** / post-deploy **pass** | grep evidence (02.1-01/02.1-03); 12 distinct event types ingested in the item 7 window (above) |
| 5. Search Console | **no-data** | no GSC MCP tool available this session (02.1-04, Task 3) |
| 6. Manual prod deploy | **pass** | developer's explicit yes; `dpl_HY5319wSDVw3M4ibBU42JrSTgw4e`, created `2026-09-14T22:16:59Z`, aliased to `parseforge.gg` |
| 7. Post-deploy live-traffic check | **pass** | all three threshold lines above read PASS |

**Two scoping notes on what this sign-off does and does not cover:**
(i) This sign-off scores the OPS-01 gate rows only. ROADMAP SC3's named custom events —
`theme_changed`, `timeline_viewed`, `timeline_filter_used`, `timeline_error`, `consent_resolved`,
`consent_unavailable` — were **not observed** in the 2026-09-14 measured window and are tracked
separately in gap-closure plans 02.1-06 and 02.1-08.
(ii) The `tcf-accept` / `tcf-reject` / `tcf-timeout` gate paths remain **unobserved**, because no
EEA/UK/CH visitor arrived in the measured window, and the Search Console row for this phase remains
`no-data` exactly as 02.1-04 recorded it.

Nothing in this table is marked passing without the evidence that produced it, per this document's
own oldest rule. Item 7's third threshold specifically rests on a Vercel figure recorded as an
**upper bound** (end-of-range unconfirmed) — the PASS is robust to that uncertainty because 23 is
far below the 50-figure ceiling and any true value at or below 23 also clears it.

### Targeted custom-event observation (gap closure 02.1-06, 2026-09-15)

This section closes the automatable half of the Truth 5 gap left open by `02.1-VERIFICATION.md`
("`theme_changed` and `timeline_viewed` (at minimum) should appear in the query results with
`consent_gate_path` populated") and by the "Phase 2.1 Sign-off — SIGNED" scoping note above, which
named `theme_changed`, `timeline_viewed`, `timeline_filter_used`, `timeline_error`,
`consent_resolved` and `consent_unavailable` as **not observed** in the 2026-09-14 measured window.
It is a **targeted follow-up test, not the original 60-minute post-deploy window measured on
2026-09-14** — the plan's own `missing` clause explicitly accepts a targeted manual test in place
of waiting for an organic session, and this section is that test, run against a separate,
later, named window.

**Deployment observed:** `dpl_HY5319wSDVw3M4ibBU42JrSTgw4e`, built from commit `8693498` — the
same production build the 2026-09-14 item-7 evidence above measured. No new deploy was made for
this observation.

**Window and route:** UTC `2026-09-15T18:26:27Z` – `2026-09-15T18:28:57Z` (the raw interaction
window ended `2026-09-15T18:26:57Z`; the recorded end bound carries a 2-minute margin so a
trailing analytics-batch flush falls inside the query window). Route: **automation-performed** —
the developer authorized browser automation in-session ("you drive it") because the
Claude-in-Chrome extension was not connected; the orchestrator drove production with a fresh-profile
headless Chrome instance over the DevTools Protocol, with the User-Agent overridden to a standard
desktop Chrome string (same false-negative-avoidance fix as 02.1-03's netlog run — see
`### Finding: the bare D-10 command has a false-negative trap` above) and real pointer events for
every click. Only `parseforge.gg` was navigated; no Vercel page, no PostHog page, no form
submission, no account action, and no other site.

**Interactions performed** (copied from the session interaction record):
- Loaded `https://parseforge.gg/`.
- Theme: clicked the navbar theme control (`aria-label="Toggle theme"`), selected **Light**;
  opened the control again and selected **Dark**.
- Timeline: opened
  `https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12&tab=player&ptab=timeline`; the
  Cast Timeline rendered with 13 ability chips (the hook's auto-run fires `timeline_viewed`, no
  click required).
- Filter: clicked one ability filter chip, then clicked the **All** reset chip.
- **Not performed:** the optional step 5 error-inducing load
  (`fight=999999&source=999999`) — the developer did not explicitly agree to it in this session, so
  it was skipped rather than assumed. `timeline_error` is recorded below as not triggered by
  design, not as absent-and-fine.

**Both query forms.** Part 1 item 7's own queries use a relative `now() - INTERVAL 60 MINUTE`
bound; that relative form is copied here verbatim from Part 1 item 7 above and was **not re-run**
for this section — the window this section observes is already in the past by the time this
section was written, so a relative-window query would answer a different (empty) window, not this
one. Stating that plainly rather than pretending it was executed:

```sql
SELECT properties.consent_gate_path, count() FROM events WHERE timestamp >= now() - INTERVAL 60 MINUTE GROUP BY 1
```

The explicit-bounds query actually executed, filtered to the six named events and grouped by event
and gate path — **bounds interpreted in UTC** (the PostHog project's confirmed timezone is UTC,
matching the record file's UTC start/end):

```sql
SELECT event, properties.consent_gate_path AS consent_gate_path, count() AS count
FROM events
WHERE timestamp >= toDateTime('2026-09-15 18:26:27')
  AND timestamp < toDateTime('2026-09-15 18:28:57')
  AND event IN ('theme_changed', 'timeline_viewed', 'timeline_filter_used', 'timeline_error', 'consent_resolved', 'consent_unavailable')
GROUP BY event, consent_gate_path
ORDER BY event
```

Before reading any number, the PostHog connector was switched to project `337485` with
`switch-project 337485`, and the response confirmed the active project as "ParseForge" (id
337485, organization "LootList+", project timezone UTC) — the connector's prior default was a
different application ("LootList+ App", id 310668). This confirmation is recorded here per the
plan's own requirement, without pasting any token.

**Result table, verbatim** (first run, no retry needed):

| event | consent_gate_path | count |
|---|---|---|
| `theme_changed` | `geo-non-consent-region` | 2 |
| `timeline_filter_used` | `geo-non-consent-region` | 2 |
| `timeline_viewed` | `geo-non-consent-region` | 1 |

The three named events absent from this table — `timeline_error`, `consent_resolved`,
`consent_unavailable` — returned a taxonomy warning from the connector ("Event '…' was not found in
this project taxonomy" for each of the three), i.e. none of the three has ever ingested in this
project; each carries count 0 for this window below.

**Per-event status (six of six, none left without a line):**

- Event `theme_changed`: count 2, observed, consent_gate_path "geo-non-consent-region".
- Event `timeline_viewed`: count 1, observed, consent_gate_path "geo-non-consent-region".
- Event `timeline_filter_used`: count 2, observed, consent_gate_path "geo-non-consent-region".
- Event `timeline_error`: count 0, not triggered by design — the optional error-inducing step
  (step 5) was not agreed to in this session and was skipped.
- Event `consent_resolved`: count 0, structurally unobservable from this egress — a
  non-consent-region visitor never starts the `__tcfapi` listener, so there is no consent event to
  emit from a US egress; the observation moves to gap plan 02.1-08 (EEA/UK session).
- Event `consent_unavailable`: count 0, structurally unobservable from this egress — same reason as
  `consent_resolved` above; deferred to 02.1-08.

**What this closes and what it does not.** `theme_changed`, `timeline_viewed` and
`timeline_filter_used` — the three events a non-consent-region session can produce — are now
counted-observed with `consent_gate_path = geo-non-consent-region` attached, closing that half of
the Truth 5 gap. `timeline_error` remains untriggered by design (a scoped, one-attempt-only optional
step the developer did not authorize this session, not a defect). `consent_resolved` and
`consent_unavailable` remain structurally unreachable from any non-consent-region egress and are
explicitly hand-off to 02.1-08 rather than left as an unexplained zero. No application source was
changed to produce this section, and every added line above is aggregate counts, event names and
gate-path literals — no per-visitor row, address, session-recording link, or credential from either
service.

### Re-deploy gate run (gap closure 02.1-07, 2026-09-15)

**Decision (Task 1).** The developer's answer to the deploy decision was recorded verbatim in-session
as **"ship it"** (2026-09-15 UTC), given in direct reply to a checkpoint that stated all five
commits, the full price (a new 60-minute window, a re-run of all three item 7 thresholds, another
Vercel Web Analytics figure), the rollback command and target, and the decline branch.

On the Vercel-figure route (agreed in the same checkpoint, per this plan's own requirement), the
developer's first answer was "developer reads it"; when the window elapsed the developer instead
said, verbatim: **"Stop asking for me to do things. Do it for me please."** The orchestrator then
obtained the figure itself — route and limitations recorded below. Both statements are recorded here
as given.

**Deployment.** New deployment id **`dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5`** — production, `Ready`,
aliased to `https://parseforge.gg` and `https://www.parseforge.gg`. Deployed commit
**`dd19b0ba1716d180a915bd9ad483d50d945cdcfc`** (HEAD of `growth/phase-2-review-fixes` at deploy
time; contains all five review-fix commits). UTC deploy timestamp (from `vercel inspect`'s
`created` field): **`2026-09-15T19:16:13Z`**. Rollback target:
**`dpl_HY5319wSDVw3M4ibBU42JrSTgw4e`** (or `vercel --global-config ~/.vercel-personal rollback
--scope loot-list-plus`).

Preconditions re-verified before deploying: `vercel --global-config ~/.vercel-personal whoami` →
`alexandermayes`; all five commits (`90f5a46`, `0e03d9b`, `7a7cf0c`, `9657535`, `9da21c4`) confirmed
ancestors of HEAD via `git merge-base --is-ancestor`; working tree clean; local gates green
(`npx tsc --noEmit` exit 0; `npx vitest run` 162/162; scoped `eslint` — 1 pre-existing warning,
`CastTimeline.tsx:42`, img/LCP, already documented, nothing new added). Deploy command:
`vercel --global-config ~/.vercel-personal deploy --prod --scope loot-list-plus --yes`.

**The five commits shipped by this deploy:**
- `90f5a46` — CR-01: `PostHogProvider` now validates the `/api/geo` response body at runtime, so a
  JSON-shaped 5xx fails **closed** (does not opt the visitor in) instead of failing open.
- `0e03d9b` — WR-01: adds a 5-second timeout to that `/api/geo` fetch.
- `7a7cf0c` — WR-02: logs a whitespace-only geo header as `geo_header_missing` instead of treating
  it as present.
- `9657535` — WR-04: adds an explicit return type to the `/api/geo` route's `GET` handler.
- `9da21c4` — WR-03: stops the `__tcfapi` listener from double-firing `consent_resolved` /
  `consent_unavailable` on a repeat TCF resolution.

**Browser-level netlog proof, against the new production build.** Fresh Chrome profile, standard
desktop `--user-agent` override (no "Headless" substring), bare `https://parseforge.gg/`, no bypass
parameters → **16 capture-request lines** to `/ingest/` (2026-09-14 pre-fix production baseline was
0). `/api/geo` answered `200`.

**In-window interaction repeat (02.1-06's four interactions, re-run inside this deploy's window).**
Route: the automation route 02.1-06 recorded — orchestrator-driven headless Chrome via CDP, fresh
profile, User-Agent override, `parseforge.gg` only. `2026-09-15T19:22:42Z` → `2026-09-15T19:23:07Z`:
loaded `/`; theme Light then Dark via `button[aria-label="Toggle theme"]` (`html.class`
light→dark confirmed); loaded
`https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12&tab=player&ptab=timeline` (13
ability chips rendered); clicked one ability chip, then **All**. 16 `/ingest/` requests observed,
including 5 `POST /ingest/i/v0/e/` batches. The optional error-inducing load (`fight=999999`) was
**not** performed, matching 02.1-06's own scope.

**Measured window.** The full 60 minutes elapsed before any query ran (first query at
`2026-09-15T20:17Z`): **`2026-09-15T19:16:13Z` → `2026-09-15T20:16:13Z`**, bounds interpreted in
**UTC** (confirmed PostHog project timezone). Connector confirmation, recorded before any number was
read: `switch-project 337485` → "Switched to project 337485 … currently in project \"ParseForge\"
(id: 337485) within organization \"LootList+\" … Project timezone: UTC."

**Item 7's relative-form queries** (Part 1 item 7, copied verbatim — **not re-run**, since the window
is already in the past by the time this section was written and a relative-window query would answer
a different, empty window, not this one):

```sql
SELECT properties.$geoip_country_code AS country, count() AS pageviews FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 60 MINUTE GROUP BY country ORDER BY pageviews DESC
```

```sql
SELECT properties.consent_gate_path, count() FROM events WHERE timestamp >= now() - INTERVAL 60 MINUTE GROUP BY 1
```

**Explicit-bounds queries actually executed** (HogQL, bounds interpreted in **UTC**):

Query 1:
```sql
SELECT properties.$geoip_country_code AS country, count() AS pageviews
FROM events
WHERE event = '$pageview'
  AND timestamp >= toDateTime('2026-09-15 19:16:13', 'UTC')
  AND timestamp < toDateTime('2026-09-15 20:16:13', 'UTC')
GROUP BY country
ORDER BY pageviews DESC
```

Result, verbatim:

| country | pageviews |
|---|---|
| US | 3 |

Query 2:
```sql
SELECT properties.consent_gate_path AS consent_gate_path, count() AS count
FROM events
WHERE timestamp >= toDateTime('2026-09-15 19:16:13', 'UTC')
  AND timestamp < toDateTime('2026-09-15 20:16:13', 'UTC')
GROUP BY 1
ORDER BY count DESC
```

Result, verbatim:

| consent_gate_path | count |
|---|---|
| geo-non-consent-region | 19 |

Query 3 (the six named custom events, same window):
```sql
SELECT event, properties.consent_gate_path AS consent_gate_path, count() AS count
FROM events
WHERE timestamp >= toDateTime('2026-09-15 19:16:13', 'UTC')
  AND timestamp < toDateTime('2026-09-15 20:16:13', 'UTC')
  AND event IN ('theme_changed', 'timeline_viewed', 'timeline_filter_used', 'timeline_error', 'consent_resolved', 'consent_unavailable')
GROUP BY event, consent_gate_path
ORDER BY event
```

Result, verbatim:

| event | consent_gate_path | count |
|---|---|---|
| theme_changed | geo-non-consent-region | 2 |
| timeline_filter_used | geo-non-consent-region | 2 |
| timeline_viewed | geo-non-consent-region | 1 |

(Connector taxonomy note: `timeline_error`, `consent_resolved` and `consent_unavailable` have never
been seen in this project — count 0 for each, for the same reason 02.1-06 recorded: no triggering
action / structurally unreachable from a non-consent-region egress.) These three observed counts —
`theme_changed`, `timeline_viewed`, `timeline_filter_used` — came from the in-window interaction
repeat above, so they were observed **inside a genuine post-deploy window**, which is ROADMAP SC3
read literally.

**Vercel Web Analytics figure and its provenance.** Route: the developer declined to read the
dashboard himself ("Stop asking for me to do things. Do it for me please"); the Claude-in-Chrome
extension was not connected; the Vercel MCP connector is authenticated to a different team (403 on
scope `loot-list-plus`). The orchestrator therefore used the **Vercel CLI's authenticated beta API
passthrough** — `vercel --global-config ~/.vercel-personal --scope loot-list-plus api "<endpoint>"`
(personal login `alexandermayes`; the CLI holds the token, nothing was read or printed) — against
`GET /v1/query/web-analytics/visits/aggregate` with `projectId=parseforge`,
`teamId=team_TI2b6b1clUIlT3tZgaMSBnPV`, production filter (API default). URL/endpoint in place of a
dashboard URL — this route did not use the dashboard: the Vercel API endpoint path above, reached
through the authenticated CLI passthrough rather than a browser session at
`https://vercel.com/loot-list-plus/parseforge/analytics`.

**Granularity limitation, recorded exactly:** the API rounds `since`/`until` to whole **hours** for
aggregate queries (echoed query: since `2026-09-15T19:00:00.000Z`, until
`2026-09-15T21:00:00.000Z`), and the `/visits/count` endpoint floored both bounds to the **day** and
returned 0 — so the exact 60-minute window is **not readable at window granularity** through this
route. The figure below is therefore an **upper bound** over `19:00:00Z`–`21:00:00Z` (120 minutes,
containing the whole 60-minute window):

Vercel page views 19:00–21:00Z by country (verbatim, environment production): DE pv=5 vis=3; CZ
pv=4 vis=2; US pv=4 vis=2; BR pv=9 vis=1; DK pv=1 vis=1; SG pv=2 vis=1 → **TOTAL 25 pageviews, 10
visitors.**

By hour bucket: 19:00 bucket → DE 2, CZ 2, US 4, BR 9 (=17); 20:00 bucket → DE 3, CZ 2, DK 1, SG 2
(=8). The 19:00 bucket includes `19:00`–`19:16Z` on the **old** build; the 20:00 bucket includes
`20:16`–`21:00Z`, which is **outside** the measured window — both widen the figure further beyond
the true window value. Timezone: UTC (API). Read by: the orchestrator, via the CLI, on 2026-09-15 at
approximately `20:4xZ`.

**Threshold scoring for the new window:**

- Threshold 1 (≥ 20 `$pageview` events in the new window — exactly 20 passes; 3 counted, all from
  US): FAIL
- Threshold 2 (≥ 2 distinct non-consent-region `$geoip_country_code` values, classified against
  `CONSENT_REGIONS` in `lib/geo.ts` by lookup — exactly 2 passes; 1 counted (US; not in
  `CONSENT_REGIONS`)): FAIL
- Threshold 3 (PostHog `$pageview` count ≥ 50% of the Vercel Web Analytics figure for the same
  window — exactly 50% passes; PostHog count 3, Vercel figure 25 over the wider 2-hour upper-bound
  range described above → 3 / 25 ≈ 12% of an **upper bound**, which a shortfall against can never
  itself be scored FAIL — passing at the exact window would require the true Vercel figure to be
  ≤ 6): NOT EVALUABLE

**Closing verdict — this deploy's gate row is NOT signed.** Thresholds 1 and 2 did not pass: 3
`$pageview` events against a required 20, and 1 distinct non-consent-region country (US) against a
required 2. Threshold 3 is not evaluable at window granularity given the data available this
session. What would close this row: re-measure a full 60-minute window against this same deployment
on a busier hour — the PostHog hourly series (below) shows the **old** build also produced 1-pageview
hours at 12:00, 13:00, 16:00 and 17:00Z the same day, and 24 pageviews in the 22:00Z hour on
2026-09-14 — together with a Vercel Web Analytics figure read at window granularity from the
dashboard rather than the CLI's hour-rounded aggregate endpoint.

**02.1-05's sign-off is untouched.** The `### Phase 2.1 Sign-off — SIGNED (2026-09-15, gap-closure
02.1-05)` section above, covering the 2026-09-14 window, is not edited, retracted or superseded by
this section — it rests on its own evidence for its own window. This section covers a different
deploy and a different window; it is recorded honestly as unsigned, and that does not soften or
qualify the earlier sign-off.

**Finding, surfaced to the developer and not patched here — an apparent capture gap that predates
this deploy.** PostHog hourly `$pageview` counts (UTC) on the **old** build, up to the
`19:16Z` cutover: Sep 14 22:00 → 24 (3 countries); 23:00 → 7; Sep 15 05:00 → 14; 07:00 → 20; 11:00 →
18; 12:00 → 1; 13:00 → 1; 15:00 → 16; 16:00 → 1; 17:00 → 1; 18:00 → 3 (US 2, CA 1); 19:00 → 4 (US).
Low-volume hours are a normal feature of this site's traffic, and the 2026-09-14 measured window
happened to land on the day's peak hour.

Cross-checking capture by country on the **old** build (Vercel API `2026-09-14T19:00Z`–
`2026-09-15T20:00Z` as echoed, vs PostHog `$pageview` `2026-09-14T19:00Z`–`2026-09-15T19:00Z`): US 61
vs 63; CA 11 vs 24; BR 15 vs 7; SG 6 vs 0; TR 3 vs 8; UA 2 vs 20; RS 2 vs 0; AR 1 vs 1; AU 1 vs 1; PE
1 vs 2. EEA countries (DE 29, GB 25, DK 10, CZ 10, FR 9, PL 6, and others) are absent from PostHog as
designed — no capture before TCF consent. PostHog `consent_gate_path` over that same day:
`geo-non-consent-region` 478 events / 30 visitors; `(null)` 2.

Interpretation: PostHog over-counts SPA navigations relative to Vercel for most non-consent
countries, but SG (0 vs 6) and RS (0 vs 2) visitors were never captured on the old build either, and
BR was roughly 1:1 before `19:00Z`. The BR/SG capture gap visible in this deploy's own window is
therefore most plausibly a **pre-existing** gap for a subset of non-consent-region visitors
(consistent with client-side ad-blockers blocking the `/ingest/` PostHog paths while leaving
Vercel's first-party analytics script largely unaffected) rather than a regression introduced by the
five fixes shipped in this deploy — every orchestrator-driven interaction in this window was
captured with `consent_gate_path = geo-non-consent-region`, and `/api/geo` answered in roughly
0.3–0.6 s from a US client, well under the new 5-second timeout. Recorded here as a finding for the
developer, not fixed in this plan; a candidate follow-up is a `WINDOWS.md` item to quantify the
PostHog-vs-Vercel capture ratio per country over a full week.

### EEA/UK TCF observation (gap closure 02.1-08, 2026-09-15)

**Not performed.** No EEA/UK/CH consent-region browser session was run in this plan.

**Deployment the session would have run against.** The current production deployment is
**`dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5`**, built from commit **`dd19b0ba1716d180a915bd9ad483d50d945cdcfc`**
(short `dd19b0b`; see `### Re-deploy gate run (gap closure 02.1-07, 2026-09-15)` above). Commit
**`9da21c4` (WR-03, the `capturedGatePathRef` consent-event dedupe) IS in this deployed build** — it
is one of the five review-fix commits that deploy shipped. Had an EEA/UK/CH session been performed,
its Session C (CMP re-confirmation) result would therefore have been a meaningful test of the
dedupe, not a test of a build that predates the fix.

**Reason, recorded verbatim from Task 1.** The developer did not run any session and had earlier
said, verbatim: **"Stop asking for me to do things. Do it for me please."** — a decline of the
manual EEA/UK/CH session ask. The orchestrator could not perform it either: no EEA/UK/CH egress
exists in this environment (Vercel derives `x-vercel-ip-country` from the visitor's real IP, which
cannot be spoofed from a US client), the Claude-in-Chrome extension was not connected in this
session, and no VPN is available to the automation. Result: no session was performed.

**The exact test that would close this.** A developer-run browser session from a real EEA, UK or
Swiss egress IP (a VPN exit in, e.g., Germany, Ireland or the UK), using a **fresh private browser
window opened after the VPN is already connected** — a reused profile may already carry a prior
consent choice or opt-in cookie and would prove nothing about a first-time visitor. Three sessions,
any one of which narrows the gap and Session B alone being the most valuable if only one is run:

- **Session A — explicit reject.** Fresh private window, DevTools Network tab filtered to
  `ingest`, load `https://parseforge.gg/`. Before the dialog resolves: confirm no request to
  `/ingest/e/` or `/ingest/i/v0/e/`. Click reject. After: confirm no session-replay start and no
  `ph_*` / `__ph_opt_in_out_*` cookie for `parseforge.gg`.
- **Session B — full opt-in (do this one first if only one is run).** New fresh private window,
  same setup. Before interacting: confirm no capture request yet. Accept all. Note the UTC time.
  After: confirm capture requests and session replay both start; optionally log `__tcfapi`
  `eventStatus` values via `addEventListener` to count how many resolved events the CMP emitted.
- **Session C — CMP re-confirmation (tests the WR-03 dedupe; meaningful now that `9da21c4` is
  live).** Fresh window: accept, then re-open the CMP's privacy / manage-options entry point and
  confirm again, so the CMP re-emits a resolved TCF event for the same visit. Note the UTC bounds.
  Expectation: `consent_resolved` fires exactly once across both resolutions.

For whichever sessions are run: egress country, UTC start and end, whether the CMP dialog appeared,
and the observations in the developer's own words, unfiltered to match expectations.

**What remains behaviour-unverified.** ROADMAP SC2, `02.1-VERIFICATION.md` Truth 4 (real-browser
EEA/UK behaviour unchanged), and MONY-01's live proof all remain **behaviour-unverified** — not
"verified by unit tests," not "verified by code review." The 21 unit tests over
`deriveConsentGateOutcome` and the code review confirming the SDK-call mapping are recorded evidence
about the *logic*; they are not evidence about the *wiring*, and no amount of either upgrades this
claim. This matches the plan's own flagged MONY-01 assumption verbatim.

**Consent-region gate paths — none exercised this session:**

- Gate path `tcf-accept`: count 0, not exercised.
- Gate path `tcf-reject`: count 0, not exercised.
- Gate path `tcf-timeout`: count 0, not exercised.

**Consent events — closing what 02.1-06 handed forward, both still unresolved:**

- Event `consent_resolved`: count 0, not exercised.
- Event `consent_unavailable`: count 0, not exercised.

**WR-03 dedupe:**

- WR-03 dedupe: not exercised (no opt-in session was performed). The deployed build (`dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5`,
  commit `dd19b0b`) DOES contain the `9da21c4` dedupe fix, so this test is ready to run and would be
  meaningful whenever an EEA/UK/CH session becomes available — nothing about the fix itself is in
  question, only whether it has ever been exercised by a real browser.

No application source was read for numbers and none was modified to produce this section. Nothing
above is a per-visitor row, an address, a session-recording link, or a credential.

---

## Part 5 — Phase 3 evidence

Phase 3 (03-share-loop) shipped the awards engine and its `/og?view=awards` card, per-player
receipts on the `PlayerCard` OG image and a "Share my parse" primary button, the Raid tab awards
panel with its real inline `/og` preview, the header Share normalization + landing-attribution
funnel, and the `docs/PROTECTED-ELEMENTS.md` checklist plus its `scripts/protected-elements.mjs`
gate (SHARE-01, SHARE-02, SHARE-03, OPS-01). This section records this plan's (03-06) own
gate-run evidence — the **preview half** of the gate. Nothing here is a sign-off; the production
deploy and its own live-traffic check are 03-07's job.

### Local gate output (2026-09-16, Task 1, this session)

A pre-existing gap was found and fixed before this gate could run at all — recorded as a deviation
below (Rule 3, blocking issue), not silently worked around: ESLint's flat config
(`eslint.config.mjs`) does not honor `.gitignore`, so the bare `npm run lint` invocation was
sweeping the untracked `.claude/`/`.codex/`/`.agents/`/`.gsd/`/`.impeccable/`/`.planning/`
directories (GSD tooling, out of scope per CLAUDE.md), producing ~1698 findings and 80+ seconds of
output — the exact condition that stalled the previous attempt at this gate. Fixed by adding those
six directories to `eslint.config.mjs`'s `globalIgnores` array (commit `4409a0a`, ahead of Task 1).

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ npx tsc --noEmit
(no output — exit 0)

$ npm run lint
✖ 1 problem (0 errors, 1 warning)
— the single pre-existing app/components/CastTimeline.tsx no-img-element warning (documented lint
  debt per CLAUDE.md, untouched by this phase). Exit 0.

$ npm test
 Test Files  18 passed (18)
      Tests  226 passed (226)

$ npm run theme-parity
theme-parity: PASS — no parity or divergence issues found.

$ npm run token-audit
- Total findings: 64
- Allowlisted: 64
- Non-allowlisted (gate-relevant): 0
- Missing required @theme categories: none

$ npm run protected-elements
PASS  attr:awards-panel  found in app/components/RaidOverview.tsx
PASS  attr:awards-preview  found in app/components/RaidOverview.tsx
PASS  attr:share-awards  found in app/components/RaidOverview.tsx
PASS  attr:share-discord  found in app/components/ComparisonSummary.tsx
PASS  attr:share-header  found in app/analyze/[reportCode]/AnalyzeClient.tsx
PASS  attr:share-player  found in app/components/ComparisonSummary.tsx
PASS  route:analyze-canonical  canonical=https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ
PASS  route:og-awards  200 image/png
PASS  route:og-player  200 image/png
PASS  route:og-report  200 image/png

10 passed, 0 failed
```

All six local-gate commands exit 0 by the gate-relevant measure. (The `token-audit` finding count,
64, is higher than Phase 2's 57 — the delta is new Satori-only hex mirrors this phase's OG card
work added to `app/og/route.tsx`/`lib/constants.ts`, all allowlisted for the same
cannot-resolve-a-custom-property reason as every prior OG-route finding; 0 non-allowlisted.) The
`protected-elements` run above is a base-URL-default run against production
(`https://parseforge.gg`) — it proves the route contract's fallback safety net (an unrecognized or
outdated card branch still returns a 2xx image), not that this phase's new card content is live in
production yet; the preview-deployment run in the next section is the one that exercises the new
code.

### SEO invariants (2026-09-16, local dev server on port 3987)

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ npm run seo-invariants -- --base http://localhost:3987
/: no-data (production returned fetch failed)
/analyze/ZjKgNYxVcAqR8pGJ: diff-report-only — canonical (non-failing: local dev server has no WCL_CLIENT_ID/SECRET (Vercel-only secret) — cannot fetch real report data locally, so this is a local-environment artifact, not a code regression): local="https://parseforge.gg" prod="https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ"; robots (non-failing: same caveat): local="noindex" prod="index, follow"; title (non-failing): local="Report ZjKgNYxVcAqR8pGJ | ParseForge" prod="SSC / TK — WoW Classic Raid Analysis | ParseForge"; description (non-failing): local="WoW Classic raid performance analysis — DPS percentiles, gear audits, buff tracking, and improvement suggestions." prod="Player-by-player analysis of SSC / TK in SSC / TK — DPS/HPS percentiles, gear and enchant audits, buff uptime, and improvement tips for 27 raiders."; ogTitle (non-failing): local="ParseForge raid analysis" prod="SSC / TK — WoW Classic Raid Analysis"
/guides: same (canonical/robots/structured-data match production)
/guides/how-to-analyze-wow-classic-logs: same (canonical/robots/structured-data match production)
/guides/improve-dps-wow-classic: same (canonical/robots/structured-data match production)
/guides/raid-preparation-checklist: same (canonical/robots/structured-data match production)
/guides/warcraft-logs-vs-parseforge: same (canonical/robots/structured-data match production)
/guides/wow-classic-loot-council-tools: same (canonical/robots/structured-data match production)
/privacy: same (canonical/robots/structured-data match production)
/tbc-audit: same (canonical/robots/structured-data match production)
/terms: same (canonical/robots/structured-data match production)

seo-invariants exit: 0
```

Recorded honestly rather than silently omitted: the `/` row shows `no-data (production returned
fetch failed)` — a single transient network failure reaching `https://parseforge.gg/` for that
one route's diff comparison during this run, not a regression in this phase's code (this phase
touches no `page.tsx` route or its metadata; `/analyze/[reportCode]/page.tsx`'s canonical/robots
logic is confirmed unchanged by `git log`, same as every prior Part in this document). Every other
route reports `same` or the same pair of non-failing local-environment caveats (missing WCL
credentials, per-host `og:image`) this document has recorded since Part 2. Exit 0 — no
canonical/robots/structured-data regression.

### PostHog instrumentation (pre-deploy grep evidence)

```
$ grep -rn 'kind: "report_link"' app --include='*.tsx' --include='*.ts'
app/analyze/[reportCode]/AnalyzeClient.tsx:125:        kind: "report_link",
$ grep -rn 'kind: "player_link"' app --include='*.tsx' --include='*.ts'
app/components/ComparisonSummary.tsx:235:      kind: "player_link",
$ grep -rn 'kind: "awards_link"' app --include='*.tsx' --include='*.ts'
app/components/RaidOverview.tsx:286:        kind: "awards_link",
$ grep -rn 'kind: "discord_text"' app --include='*.tsx' --include='*.ts'
app/components/ComparisonSummary.tsx:221:      kind: "discord_text",
$ grep -rn 'posthog.capture("share_landing"' app --include='*.tsx' --include='*.ts'
app/analyze/[reportCode]/AnalyzeClient.tsx:161:      posthog.capture("share_landing", { ref: resolvedRef, report_code: reportCode });
$ grep -rn 'posthog.capture("share_link_copied"' app --include='*.tsx' --include='*.ts'
app/analyze/[reportCode]/AnalyzeClient.tsx:123:      posthog.capture("share_link_copied", { report_code: reportCode, url });
$ grep -rn 'posthog.capture("discord_copied"' app --include='*.tsx' --include='*.ts'
app/components/ComparisonSummary.tsx:212:    posthog.capture("discord_copied", {
```

Each of the four `share_action` kinds (`report_link`, `player_link`, `awards_link`,
`discord_text`) has exactly one call site, as does `share_landing`. The two legacy events
(`share_link_copied`, `discord_copied`) also each have exactly one call site and keep firing this
phase per D-14, so the pre-existing ~2.8% baseline series is not broken by this phase's dual-emit.

### Award pool for review (D-04)

The full fifteen-row pool, transcribed verbatim from `03-02-SUMMARY.md` (the exact shipped pool,
not a description of it) for the developer's tone review at this gate:

| priority | id | title | icon | tone | fires when | stat shown |
|---|---|---|---|---|---|---|
| 1 | first-to-die | First to Die | 💀 | jab | someone died this fight | "{time} in" |
| 2 | top-dps | Meter Lord | ⚔️ | praise | highest-throughput non-healer | "{n} dps" |
| 3 | top-hps | Triage Master | ✨ | praise | highest-hps healer | "{n} hps" |
| 4 | flaskless | Flaskless Wonder | 🧪 | jab | any player without a flask | "no flask" |
| 5 | best-prepared | Best Prepared | 🛡️ | praise | fully flasked/fed/enchanted/weapon-enhanced, highest ilvl among them | "flask + food + weapon + full enchants" |
| 6 | graveyard-shift | Graveyard Shift | ⚰️ | jab | someone died 2+ times (names everyone tied at the max) | "{n} deaths" |
| 7 | gcd-tourist | GCD Tourist | 🕰️ | jab | lowest-activity non-healer with throughput is below 80% active | "{pct} active" |
| 8 | fire-dancer | Standing in the Fire | 🔥 | jab | max avoidable damage taken is >=1.5x the raid's median | "{n} taken" |
| 9 | naked-slots | Enchants? Never Heard of Her | 🔧 | jab | someone is missing 3+ enchants (names everyone, ranked by count) | "{n} missing enchants" |
| 10 | skipped-breakfast | Skipped Breakfast | 🍖 | jab | someone has no food buff (names everyone) | "no food buff" |
| 11 | dull-blade | Dull Blade | 🗡️ | jab | a melee/tank has no weapon enhancement (casters never qualify) | "no weapon enhancement" |
| 12 | iron-man | Iron Man | 🪨 | praise | the raid had a death but this player had zero, highest damage-taken among survivors | "0 deaths · {n} taken" |
| 13 | watering-the-garden | Watering the Garden | 💧 | jab | a healer overhealed 50%+ | "{pct}% overheal" |
| 14 | kept-them-breathing | Kept Them Breathing | 💚 | praise | a healer was 85%+ active | "{pct}% healing uptime" |
| 15 | punching-up | Punching Up | 🎯 | praise | the lowest-ilvl non-healer (in a 10+ ilvl spread) kept pace at/above the raid's median throughput | "ilvl {n} · {n} dps" |

This table is the exact artifact the developer's D-04 tone review (below, in
`### Developer review (preview)`) checks against — praise alongside light jabs, every jab tied to
a measurable stat, nothing insulting about a named real raider, no single worst-player headline.

### Preview deployment (2026-09-16, Task 2, this session)

**Precondition note.** The Task 1 executor's checkpoint reported that `vercel env pull
--environment=preview` returns 29 preview vars with no `VERCEL_AUTOMATION_BYPASS_SECRET` line, even
after the developer confirmed Protection Bypass for Automation was enabled. This session did not
re-run `env pull` (checked twice already, per the checkpoint). Instead the secret was sourced
directly from the project's REST record: `GET /v9/projects/parseforge?slug=loot-list-plus` returns
a `protectionBypass` object whose one key (scope `automation-bypass`) *is* the secret value. That
key was read straight into a shell variable, confirmed non-empty by **length only** (32 characters
— never the value), and used as a request header below. It was never echoed, written to a repo
file, or included in any command's captured output; the shell variable and its one-off scratchpad
copy were both cleared at the end of this task. `env pull`'s continued silence on this var (across
two checks by two different executors) is recorded as an open oddity, not investigated further —
the REST path fully substitutes for it and this plan's own T-03-22 mitigation (never printed, never
committed) was upheld regardless of which path supplied the value.

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ vercel --global-config ~/.vercel-personal deploy --scope loot-list-plus --yes
Preview   https://parseforge-5y0xngn15-loot-list-plus.vercel.app
{
  "status": "ok",
  "deployment": {
    "id": "dpl_GF769NUm3eSbsQ2anhXzuTsTk8P1",
    "url": "https://parseforge-5y0xngn15-loot-list-plus.vercel.app",
    "readyState": "READY",
    "target": null
  }
}
```

- **Deployment id:** `dpl_GF769NUm3eSbsQ2anhXzuTsTk8P1`
- **Preview URL:** `https://parseforge-5y0xngn15-loot-list-plus.vercel.app`
- **Created:** 2026-09-16T08:55:00Z (per `vercel inspect`, converted from the CLI's local
  `01:55:00 GMT-0700` timestamp)
- **Branch/commit deployed:** `growth/phase-2-review-fixes` at `840b05f` — HEAD at deploy time, the
  same commit Task 1 recorded as its own HEAD; `git status --short` immediately before and after
  the deploy showed only the untracked GSD-scaffolding directories every prior Part in this
  document has recorded as out of scope (`.codex/`, `.gsd/`, `.impeccable/`, plus
  `.planning/milestone.lock`, `.planning/state.json`, `AGENTS.md` — none are tracked files this
  phase touches), no uncommitted changes to any tracked file.
- No `--prod` flag was passed anywhere in this task. No `promote`/`alias` command was run.

**Live route checks against the preview** (bypass header `x-vercel-protection-bypass: <redacted>`,
each URL cache-busted with a `cb=<unix timestamp>` query param per RESEARCH Pitfall 1):

```
$ curl -s -D - -o /dev/null -H "x-vercel-protection-bypass: <redacted>" \
    "https://parseforge-5y0xngn15-loot-list-plus.vercel.app/og?report=ZjKgNYxVcAqR8pGJ&fight=23&view=awards&cb=<ts>"
HTTP/2 200
content-type: image/png

$ curl -s -D - -o /dev/null -H "x-vercel-protection-bypass: <redacted>" \
    "https://parseforge-5y0xngn15-loot-list-plus.vercel.app/og?report=ZjKgNYxVcAqR8pGJ&fight=23&source=12&cb=<ts>"
HTTP/2 200
content-type: image/png

$ curl -s -D - -o /dev/null -H "x-vercel-protection-bypass: <redacted>" \
    "https://parseforge-5y0xngn15-loot-list-plus.vercel.app/og?report=ZjKgNYxVcAqR8pGJ&cb=<ts>"
HTTP/2 200
content-type: image/png

$ curl -s -H "x-vercel-protection-bypass: <redacted>" \
    "https://parseforge-5y0xngn15-loot-list-plus.vercel.app/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12"
HTTP/2 200
<link rel="canonical" href="https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ"/>
```

All three preview OG branches (awards, player, bare report) return `200 image/png`. The preview's
analyze page canonical carries no query string (`?fight=23&source=12` on the request, no query
string on the canonical) — matching every prior Part's production canonical and confirming this
phase's card work didn't regress it on a deployment that actually carries the new code (unlike
Task 1's production-base `protected-elements` run, which only proved the fallback contract).

**`npm run protected-elements` against the preview** — run, and its result recorded honestly rather
than treated as the pass this row's acceptance criteria wants:

```
$ npm run protected-elements -- --base https://parseforge-5y0xngn15-loot-list-plus.vercel.app
PASS  attr:awards-panel  found in app/components/RaidOverview.tsx
PASS  attr:awards-preview  found in app/components/RaidOverview.tsx
PASS  attr:share-awards  found in app/components/RaidOverview.tsx
PASS  attr:share-discord  found in app/components/ComparisonSummary.tsx
PASS  attr:share-header  found in app/analyze/[reportCode]/AnalyzeClient.tsx
PASS  attr:share-player  found in app/components/ComparisonSummary.tsx
PASS  route:analyze-canonical  canonical=https://vercel.com/login
FAIL  route:og-awards  200 text/html; charset=utf-8
FAIL  route:og-player  200 text/html; charset=utf-8
FAIL  route:og-report  200 text/html; charset=utf-8

7 passed, 3 failed
```

**Read first, as the task instructed:** `scripts/protected-elements.mjs`'s `fetchRoute()` calls
plain `fetch(url, { redirect: "follow" })` with no header parameter anywhere in the script, and
`docs/PROTECTED-ELEMENTS.md` documents no bypass mechanism for its own live-route half. The script
has no way to attach `x-vercel-protection-bypass`, so its three route checks against an
SSO-protected preview simply followed Vercel's redirect to the login page
(`200 text/html; charset=utf-8`, and a canonical of `https://vercel.com/login` that happens to
contain no `?` and so scores a coincidental, meaningless PASS on
`route:analyze-canonical`) — this is a tooling gap in the script, not a regression in the
deployed routes, which the direct `curl` evidence immediately above already proves are `200
image/png` with a clean canonical. The six `attr:*` checks are unaffected (they read local source
files, not the live base) and all six pass. Per the task's own instruction not to add features
beyond the plan, this gap is recorded here rather than patched; a follow-up to give the script an
optional bypass-header flag is logged to `.planning/WINDOWS.md`.

### What this preview cannot show

`NEXT_PUBLIC_GOOGLE_CMP_PUB_ID` and `NEXT_PUBLIC_POSTHOG_HOST` are **Production-only** environment
variables (per `.planning/STATE.md` Blockers/Concerns and confirmed again by Phase 2.1's Part 4
record). This preview therefore renders no Google CMP and sends PostHog captures nowhere
observable from this session — the EEA/UK/CH TCF consent path and live PostHog ingestion for this
phase's new `share_action`/`share_landing` events are **not observable here**. RESEARCH's open
Assumption A3 (no developer-run EEA/UK/CH session has exercised these specific events) stays open
after this plan; closing it is 03-07's item-7 live-traffic check against production, the same
pattern Phase 2.1 used (Part 4's own item 7).

### Developer review (preview)

All three checks below require a human — this executor performed none of them, per this plan's own
design (RESEARCH: "no headless-browser or viewport harness exists in this repo") and this session's
explicit resume instructions. Each is recorded as **not-performed**, with the exact test that would
close it and the exact preview URLs to use, never softened into a pass.

**1. Award pool tone (D-04) — not performed.**
Exact test: read the fifteen-row table in `### Award pool for review (D-04)` above and confirm the
D-01 bar — praise alongside light jabs, every jab tied to a measurable fact the row's own `stat
shown` column proves, nothing insulting about a named real raider, no single worst-player
headline. Closes when the developer states, in this document or `03-06-SUMMARY.md`'s follow-up,
that the pool as shipped clears that bar (or names the specific row that doesn't).

**2. Real Discord unfurl — not performed.**
Exact test: paste each URL below into a real Discord channel and confirm it unfurls as an image
with the rows and receipts legible, paying specific attention to whether the row with the longest
raider names in the demo log clips with an ellipsis rather than overflowing (RESEARCH Pitfall 2 /
Assumption A2). Append a throwaway query param and change it on every retry — Discord caches an
embed and its proxied image by exact URL for an undocumented period (RESEARCH Pitfall 1), so
re-pasting the same link after a fix proves nothing.
- Awards link: `https://parseforge-5y0xngn15-loot-list-plus.vercel.app/analyze/ZjKgNYxVcAqR8pGJ?fight=23&view=awards&ref=awards&v=<change-this-each-retry>`
- Player link: `https://parseforge-5y0xngn15-loot-list-plus.vercel.app/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12&ref=parse&v=<change-this-each-retry>`

**Caveat this executor flags rather than resolves:** this preview sits behind Vercel Deployment
Protection, so an unauthenticated fetcher — including Discord's own unfurl crawler, which cannot
send custom headers any more than it can run this document's `curl` commands — will 302 to Vercel's
SSO login instead of the real card, exactly as `npm run protected-elements` just demonstrated
above. Closing this check for real requires one of: (a) the developer temporarily disables
Deployment Protection for this one preview so Discord's crawler can reach it unauthenticated, then
re-enables it afterward; (b) the developer appends their own copy of
`?x-vercel-protection-bypass=<secret>&x-vercel-set-bypass-cookie=true` to the URL before pasting —
noting that doing so persists the secret in that Discord channel's message history, so the secret
should be rotated afterward if this route is used; or (c) this specific check is deferred to
03-07, where the same two URLs work against `https://parseforge.gg` with no SSO involved at all.
This executor recommends (c) as the lowest-risk close, but the decision belongs to the developer.

**3. Mobile reachability (D-13) — not performed.**
Exact test: on a phone-width viewport (real device or a resized real browser — not this session's
scriptable tooling), open
`https://parseforge-5y0xngn15-loot-list-plus.vercel.app/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12`
(bypass header needed the same way the curl checks above needed it, or use the Deployment
Protection disable from item 2), switch to the Raid tab, and confirm both the awards "Copy link"
button and the player "Share my parse" button are reachable without scrolling past the analysis
tables. Closes when the developer confirms this in this document or in `03-06-SUMMARY.md`'s
follow-up (or files a defect if either button requires scrolling past a table first).

**Part 5 remains unsigned below this line** — no sign-off table, no dated approval. The production
deploy and its own live-traffic gate row are 03-07's job, per this plan's own objective and Part
4's precedent.

---

## Part 5 (continued) — 03-07 production half

### Production deploy

**Developer approval (Task 1 decision checkpoint), recorded verbatim.** Timestamp: 2026-09-16T09:11Z.
Option id selected: **`deploy-now`**. The prompt the developer answered: "Deploy Phase 3 to
production now? (Task 2 will run only the command your choice authorizes and record your approval
verbatim in Part 5.)" The `deploy-now` option's own text, as presented: "Ship HEAD adaea2f to
parseforge.gg now. Share loop starts generating the live data OPS-01 needs; Discord unfurl and
item-7 become measurable. Rollback = redeploy prior commit."

**Preconditions re-verified before deploying, this session:** `git rev-parse HEAD` →
`adaea2f13914f35e8a7ff1b4b8bd3a424cd66251`, matching the approved HEAD exactly; `git status --short`
showed only the same untracked GSD-scaffolding paths every prior Part in this document records as
out of scope (`.codex/`, `.gsd/`, `.impeccable/`, `.planning/milestone.lock`,
`.planning/research/.cache/*`, `.planning/state.json`, `AGENTS.md`) — no uncommitted change to any
tracked file. The orchestrator's own diff check (`840b05f` → `adaea2f`) had already confirmed the
delta since 03-06's own preview deploy touches only `.planning/` and `docs/` — zero application
files — so this deploy ships exactly the application code the 03-06 preview proved.

**Deploy command:** `vercel --global-config ~/.vercel-personal deploy --prod --scope loot-list-plus
--yes`.

**Result:**
- **Deployment id:** `dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx`
- **Deployment URL:** `https://parseforge-3oskjc2ii-loot-list-plus.vercel.app`
- **Aliased:** `https://parseforge.gg`, `https://www.parseforge.gg`
- **Target / status:** `production` / `Ready` (`vercel inspect` confirmed)
- **Deployed commit:** `adaea2f13914f35e8a7ff1b4b8bd3a424cd66251` — recorded from `git rev-parse
  HEAD` immediately before the deploy call, the same method Part 4 used for
  `dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5`; this CLI-driven deploy is not git-integration-linked, so
  Vercel's own deployment record carries no `gitSource` SHA to cross-check against.
- **UTC deploy timestamp** (`vercel inspect`'s `created` field, converted from the CLI's local `Sep
  16 2026 02:14:57 GMT-0700`): **`2026-09-16T09:14:57Z`**. This opens the item-7 60-minute window
  below.
- **Rollback target:** the immediately-prior production deployment is
  `dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5` (`https://parseforge-10dpibrmf-loot-list-plus.vercel.app`,
  created `2026-09-15T19:16:13Z`, confirmed via `vercel ls` + `vercel inspect` this session) — a
  redeploy of that build, or `vercel --global-config ~/.vercel-personal rollback --scope
  loot-list-plus`, restores the prior state per the approved option's own "Rollback = redeploy
  prior commit" text.

No `promote`, `alias`, or second `deploy --prod` command was run. Exactly one production deploy
command executed this task.

### Post-deploy production route-contract evidence (2026-09-16, ~09:16Z)

```
$ export PATH="$HOME/.local/node20/bin:$PATH"
$ for U in "https://parseforge.gg/og?report=ZjKgNYxVcAqR8pGJ&fight=23&view=awards" \
           "https://parseforge.gg/og?report=ZjKgNYxVcAqR8pGJ&fight=23&source=12" \
           "https://parseforge.gg/og?report=ZjKgNYxVcAqR8pGJ"; do
  curl -s -o /dev/null -w '%{http_code}:%{content_type}\n' "$U"
done
200:image/png
200:image/png
200:image/png

$ curl -s "https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ" | grep -o 'rel="canonical" href="[^"]*"'
rel="canonical" href="https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ"
```

All three production OG branches (awards, player, bare report) return `200 image/png`; the
production analyze canonical carries no query string.

```
$ npm run protected-elements
PASS  attr:awards-panel  found in app/components/RaidOverview.tsx
PASS  attr:awards-preview  found in app/components/RaidOverview.tsx
PASS  attr:share-awards  found in app/components/RaidOverview.tsx
PASS  attr:share-discord  found in app/components/ComparisonSummary.tsx
PASS  attr:share-header  found in app/analyze/[reportCode]/AnalyzeClient.tsx
PASS  attr:share-player  found in app/components/ComparisonSummary.tsx
PASS  route:analyze-canonical  canonical=https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ
PASS  route:og-awards  200 image/png
PASS  route:og-player  200 image/png
PASS  route:og-report  200 image/png

10 passed, 0 failed
```

`npm run protected-elements` exits 0 against production, all ten rows PASS — unlike Task 1's
production-base run earlier in this Part (which only proved the fallback safety net before this
deploy shipped), this run proves the new card content itself is live.

### Item 7 — post-deploy live-traffic check: **PENDING**

**Window this deployment opens (UTC):** `2026-09-16T09:14:57Z` → `2026-09-16T10:14:57Z`. Per Part 1
item 7's own rule, a partial window is never recorded as a pass — this plan's own execution session
cannot itself wait out a 60-minute window, so this row is recorded PENDING rather than run early or
skipped.

**The exact HogQL to run, verbatim, once the window above has fully elapsed** (PostHog project
`337485` — `switch-project 337485` first, since the connector's default project is `LootList+ App`,
not ParseForge):

Query 1 (pageviews by country):
```sql
SELECT properties.$geoip_country_code AS country, count() AS pageviews
FROM events
WHERE event = '$pageview'
  AND timestamp >= toDateTime('2026-09-16 09:14:57', 'UTC')
  AND timestamp < toDateTime('2026-09-16 10:14:57', 'UTC')
GROUP BY country
ORDER BY pageviews DESC
```

Query 2 (consent gate path coverage):
```sql
SELECT properties.consent_gate_path AS consent_gate_path, count() AS count
FROM events
WHERE timestamp >= toDateTime('2026-09-16 09:14:57', 'UTC')
  AND timestamp < toDateTime('2026-09-16 10:14:57', 'UTC')
GROUP BY 1
ORDER BY count DESC
```

Query 3 (this phase's new events, with consent_gate_path — closes RESEARCH A3):
```sql
SELECT event, properties.consent_gate_path AS consent_gate_path, count() AS count
FROM events
WHERE timestamp >= toDateTime('2026-09-16 09:14:57', 'UTC')
  AND timestamp < toDateTime('2026-09-16 10:14:57', 'UTC')
  AND event IN ('share_action', 'share_landing', 'share_link_copied', 'discord_copied')
GROUP BY event, consent_gate_path
ORDER BY event
```

Also needed: the Vercel Web Analytics page-view figure for the same window (production filter,
window-granularity if the dashboard allows it; the hour-rounded CLI aggregate endpoint is a known
upper-bound-only fallback per Part 4's precedent) for threshold 3.

**Thresholds to score once counted (Part 1 item 7, unmodified):**
- Threshold 1: ≥ 20 `$pageview` events in the window — exactly 20 passes. Zero events is a FAIL,
  never `no-data`.
- Threshold 2: ≥ 2 distinct non-consent-region `$geoip_country_code` values — exactly 2 passes.
- Threshold 3: PostHog `$pageview` count ≥ 50% of the Vercel Web Analytics figure for the same
  window — exactly 50% passes.

**Status: PENDING.** No count has been read for this window — this executor has no PostHog MCP
tool and no `POSTHOG_PERSONAL_API_KEY`/`POSTHOG_API_KEY` credential in this environment (`env | grep
-ci posthog` → `0`), and the window has not elapsed inside this run regardless. Recorded as PENDING,
not estimated, not assumed, not borrowed from any prior deploy's window.

### Share-rate figure (D-14): **PENDING**

**The exact HogQL to run, verbatim** (Part 1 item 4, PostHog project `337485`, 7-day trailing
window — independent of the item-7 window above):
```sql
SELECT
  (SELECT count(DISTINCT $session_id) FROM events WHERE event = 'share_action' AND timestamp >= now() - INTERVAL 7 DAY) AS sessions_with_share,
  (SELECT count(DISTINCT $session_id) FROM events WHERE event = 'analysis_complete' AND timestamp >= now() - INTERVAL 7 DAY) AS sessions_with_analysis,
  sessions_with_share * 100.0 / nullif(sessions_with_analysis, 0) AS share_rate_pct
```

Also needed, same window: whether `share_landing` appears at all, and with which `ref` values —
```sql
SELECT properties.ref AS ref, count() AS count
FROM events
WHERE event = 'share_landing' AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY 1
ORDER BY count DESC
```

**Status: PENDING.** Same reason as item 7 — no PostHog credential or MCP tool available to this
executor. The numerator, denominator, resulting percentage, the counts (not only the ratio), the
comparison against the ~2.8% baseline, `share_landing` presence/ref breakdown, and whether captured
`share_action`/`share_landing` events carry `consent_gate_path` all remain to be filled in once
these queries are run. Never fabricated, never estimated from Query 3 above alone (that query's
window is item 7's 60-minute window, not this HogQL's 7-day window — the two are not
interchangeable).

### Carried-forward item: `dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5` item-7 row — **superseded**

That deployment (Part 4's unsigned item-7 row, thresholds 1/2 FAIL, threshold 3 NOT EVALUABLE) is
no longer in production — this plan's deploy (`dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx`) replaced it at the
`parseforge.gg`/`www.parseforge.gg` aliases at `2026-09-16T09:14:57Z` (confirmed via `vercel ls` +
`vercel inspect` this session: `dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5` now shows age `14h`, no longer the
newest production entry). Rather than leave that row looking open against a build no longer live,
it is recorded here as **superseded** — its own thresholds are not retroactively re-scored, and the
live gate obligation for production traffic now points at this deployment's own item-7 window
(`### Item 7 — post-deploy live-traffic check` above), not at the superseded deployment's.

### Search Console pass: **PENDING**

Per Part 1 item 5, this phase introduces no new indexable route (03-CONTEXT.md), so the check is a
no-regression one. This executor has no `gscServer` MCP tool available in this session (same
limitation Part 3 recorded for its own dispatch). The exact test that would close this, per route:

- **`/`** — URL-inspect via Search Console (`sc-domain:parseforge.gg`), confirm indexability
  unchanged (currently "Crawled – currently not indexed" per STATE.md, crawl date 2026-09-05,
  predating even the Phase 2 deploy) and confirm no metadata regression. **Also**: record the
  current coverage state and crawl date at inspection time, and either request a recrawl via the
  URL Inspection tool's "Request indexing" action and record that it was requested, or record the
  specific reason it could not be (e.g., a daily recrawl-request quota already spent this session).
  Do not guess at why `/` is uncrawled-since-indexing — record only what the inspection tool
  states.
- **`/analyze/ZjKgNYxVcAqR8pGJ`** — URL-inspect, confirm indexability and metadata unchanged from
  the Phase 1/2 baseline (route confirmed untouched by this phase's `git log` — same check every
  prior Part ran).
- **No new indexed URL for an awards-view or `ref` permutation** — confirm via Search Console's
  Pages report (or a site: search) that no `?view=awards`, `?ref=awards`, or `?ref=parse` variant of
  `/analyze/ZjKgNYxVcAqR8pGJ` appears as a separately indexed URL (expected: none, since the
  canonical the route emits is always the param-free form, confirmed again in this Part's own
  post-deploy evidence above).

**Status: PENDING.** No inspection was run this session. Recorded as PENDING with the exact test
above, not as `no-data` folded silently into a pass, and not skipped.

### Developer review backstops — production URLs (rewritten from 03-06's preview URLs)

The three developer-only checks 03-06 recorded as not-performed against the preview remain
**not performed** — production removes the SSO complication 03-06 flagged, but performing the
checks still requires a human. Their closing tests, rewritten to the now-live production URLs (no
bypass header, no SSO, needed):

**1. Award pool tone (D-04) — still not performed.** Exact test unchanged from 03-06: read the
fifteen-row table in `### Award pool for review (D-04)` above and confirm the D-01 bar. Closes when
the developer states, in this document or `03-07-SUMMARY.md`, that the pool as shipped clears that
bar (or names the row that doesn't).

**2. Real Discord unfurl — still not performed.** Exact test: paste each URL below into a real
Discord channel and confirm it unfurls as an image with rows and receipts legible, specifically
checking whether the longest raider names in the demo log clip with an ellipsis rather than
overflow (RESEARCH Pitfall 2 / Assumption A2). Change the `v=` value on every retry — Discord caches
an embed and its proxied image by exact URL for an undocumented period (RESEARCH Pitfall 1).
- Awards link: `https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&view=awards&ref=awards&v=1789550356`
- Player link: `https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12&ref=parse&v=1789550356`

No SSO/bypass complication applies to these — production carries no Deployment Protection. This is
the first point at which a genuine, unauthenticated Discord-crawler unfurl test is actually possible
for this phase, per 03-06's own recommendation (option "c") to defer this specific check here.

**3. Mobile reachability (D-13) — still not performed.** Exact test: on a phone-width viewport (real
device or a resized real browser), open
`https://parseforge.gg/analyze/ZjKgNYxVcAqR8pGJ?fight=23&source=12`, switch to the Raid tab, and
confirm both the awards "Copy link" button and the player "Share my parse" button are reachable
without scrolling past the analysis tables. Closes when the developer confirms this in this
document or in `03-07-SUMMARY.md`'s follow-up (or files a defect).

### Part 5 status — outstanding items (NOT YET SIGNED)

Part 5 is **not signed** as of this session. Every item below has a name and an exact closing test —
none is omitted, none is softened into a pass, and no prior phase's evidence or threshold has been
reused or lowered to reach a signature:

| # | Item | Status | Closing test |
|---|---|---|---|
| 1 | Item 7 live-traffic thresholds (this deployment's `09:14:57Z`–`10:14:57Z` window) | PENDING | Run the three HogQL queries in `### Item 7` above against PostHog project 337485 once the window has fully elapsed, plus the Vercel Web Analytics figure for the same window |
| 2 | Share-rate figure (D-14) | PENDING | Run the two HogQL queries in `### Share-rate figure (D-14)` above against PostHog project 337485 |
| 3 | Search Console — `/` no-regression + recrawl status | PENDING | URL-inspect `/` via `sc-domain:parseforge.gg`; record coverage state, crawl date, and whether a recrawl was requested |
| 4 | Search Console — `/analyze/ZjKgNYxVcAqR8pGJ` no-regression | PENDING | URL-inspect the route; confirm indexability/metadata unchanged |
| 5 | Search Console — no separately-indexed awards/ref permutation | PENDING | Pages report / site: search for `?view=awards`, `?ref=awards`, `?ref=parse` variants of the analyze route |
| 6 | D-04 award-pool tone review | NOT PERFORMED | Developer reads `### Award pool for review (D-04)` and states a verdict |
| 7 | Real Discord unfurl (production URLs) | NOT PERFORMED | Paste the two production links above into a real Discord channel, changing `v=` each retry |
| 8 | D-13 mobile reachability (production URL) | NOT PERFORMED | Phone-width viewport pass on the production analyze page's Raid tab |

Rows already closed by this session: the production deploy itself, all three production OG-route
contracts, the production canonical, and `npm run protected-elements` against production (all
recorded with evidence above), and the `dpl_CDCu1FVfPZcd8dHr4RpLcrHWJcJ5` item-7 row (recorded
superseded, not re-scored).
