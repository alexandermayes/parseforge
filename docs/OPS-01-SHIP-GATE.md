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

| Route | Theme sweep (Light / Dark) | SEO-invariant diff vs production |
|---|---|---|
| `/` | Deferred — end-of-phase UAT (`workflow.human_verify_mode=end-of-phase`; no automated visual-regression harness exists for this project) | same — canonical/robots/structured-data match; non-failing: `og:image` host differs (`localhost:3987` vs `parseforge.gg`, expected — `metadataBase` resolves per host) |
| `/analyze/ZjKgNYxVcAqR8pGJ` (demo report, all 3 tabs) | Deferred — end-of-phase UAT | same *(with caveat)* — canonical/robots differ locally only because this dev server has no `WCL_CLIENT_ID`/`SECRET` (Vercel-only secret, CLAUDE.md) and so cannot fetch the real report; `generateMetadata`'s index-when-public branching is unchanged by this phase. Structured-data `@type` list matches (empty on both — this route emits no JSON-LD). Non-failing: title/description/`og:title` differ (generic-fallback copy locally vs real report copy in prod, same root cause) |
| `/guides` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production |
| `/guides/how-to-analyze-wow-classic-logs` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production |
| `/guides/improve-dps-wow-classic` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production |
| `/guides/raid-preparation-checklist` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production |
| `/guides/warcraft-logs-vs-parseforge` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production |
| `/guides/wow-classic-loot-council-tools` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production |
| `/privacy` | Deferred — end-of-phase UAT | `no-data` — production returned 404 (not yet deployed; ships in plan 01-09) |
| `/tbc-audit` | Deferred — end-of-phase UAT | same — canonical/robots/structured-data match production |
| `/terms` | Deferred — end-of-phase UAT | `no-data` — production returned 404 (not yet deployed; ships in plan 01-09) |

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

### Pending post-deploy

These two rows genuinely cannot be filled until plan 01-09 ships this phase's code to
production — recorded here as explicitly deferred, not assumed:

1. **PostHog event-definition check** — after deploy, confirm `theme_changed`, `consent_resolved`,
   and `consent_unavailable` appear in the PostHog project's (337485, org LootList+) event
   definitions once real traffic generates them. Pre-deploy grep evidence above proves the call
   sites exist; this step proves they actually reach PostHog in production.
2. **Search Console inspection** — after deploy, URL-inspect all eleven routes (twelve once
   `/privacy` and `/terms` are live) via GSC (MCP `gscServer`) and confirm indexability and
   metadata match what this gate recorded. A route GSC hasn't crawled yet is recorded `no-data`,
   never a pass.
3. **Manual AdSense follow-up** (not part of this gate, tracked separately per
   `260906-kzw-SUMMARY.md`): after deploy, paste `https://parseforge.gg/privacy` into AdSense →
   Privacy & messaging → European regulations → message → site settings.

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
