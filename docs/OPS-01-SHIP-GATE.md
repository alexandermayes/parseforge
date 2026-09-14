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
