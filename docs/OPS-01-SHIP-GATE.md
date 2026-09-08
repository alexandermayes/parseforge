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
   the event appears in the PostHog project's event definitions (needs real traffic). Evidence:
   the grep count pre-deploy, the event-definition screenshot/listing post-deploy.

5. **Search Console** — after deploy, URL-inspect the affected routes and confirm indexability
   and metadata are unchanged. Evidence: the inspection result per route (`no-data` if GSC hasn't
   crawled it yet).

6. **Prod deploy is manual** and requires explicit developer confirmation:
   ```
   vercel deploy --prod --scope loot-list-plus --yes
   ```
   Never run this from a habit or an assumed approval — confirm with the developer first.

**Recording rules (what makes this a gate, not a habit):**
- A row is marked passing only with the evidence that produced it recorded alongside it.
- A route Search Console has no data for is `no-data` — never a pass, never a silent omission.
- Rows are ordered lexicographically by route path, one row per route; a re-check of a route
  extends its existing row rather than adding a new one.

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

Task 2 (the deploy-route decision) and Task 3 (deploy execution, both-theme sweep, PostHog
post-deploy confirmation, Search Console, and the dated sign-off) continue this section below.
