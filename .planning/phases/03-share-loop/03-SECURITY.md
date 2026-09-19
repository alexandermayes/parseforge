---
phase: "03"
slug: "share-loop"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-19"
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
>
> Register origin: **authored at plan time** — every one of the ten `03-0N-PLAN.md` files carries a
> `<threat_model>` block (50 threats: 40 mitigate, 10 accept, 0 transfer). With `asvs_level: 1` and
> zero open dispositions, this audit is the L1 grep-depth verification the secure-phase workflow
> prescribes (no `gsd-security-auditor` spawn, per CLAUDE.md — the skill wrapper and agent are not
> installed in this profile): each stated mitigation was located in code, tests, git history or a
> named doc during this 2026-09-19 verify-work session against HEAD `fc21ae2`. No implementation
> file was modified; `npx vitest run` (226/226 passed) and `npx tsc --noEmit` (clean) were run once
> as corroborating evidence.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| unfurl bot → `/og` | Discord/Reddit/any crawler controls every query param (`report`, `fight`, `source`, `view`) on an unauthenticated public route | Attacker-controlled query string |
| `/og` → `/api/raid-overview`, `/api/analyze`, `/api/report` | Server-to-server fetches pinned to the production origin, sharing the `anon` rate-limit identity when no forwarded IP exists | Report code, fight id, source id |
| WCL report data → rendered card / award pool | Third-party, user-supplied strings (player names, boss names, report titles) reach a Satori text node or a named award row | Player/boss names, metrics |
| URL query string → client state / PostHog | `tab`, `fight`, `source`, `view`, `ref` are fully visitor-controlled and drive tab selection, panel state, and analytics properties | Visitor-supplied query params |
| browser → clipboard / same-origin `/og` image | Copied share URLs and the awards preview `<img>` are built client-side from component props, never `window.location` state | Report code, fight id, origin |
| checklist doc → gate script → live base URL | `docs/PROTECTED-ELEMENTS.md` drives which files `scripts/protected-elements.mjs` reads and which live routes it fetches; `--base` is operator-supplied | File paths, route contracts |
| repository → Vercel (preview + production) | Deploys publish code to an internet-reachable host; a preview deploy's SSO bypass secret authorises unauthenticated access to a non-public deployment | Build artifact, bypass secret (never printed/committed) |
| PostHog / Vercel / Search Console readings → gate document | Externally-sourced counts, crawl states and analytics figures are transcribed into `docs/OPS-01-SHIP-GATE.md`, which gates the milestone | Aggregate counts, crawl status, deployment ids |
| developer session → this repo | Signed-in Search Console/Discord/PostHog sessions and Vercel tokens are reached through the developer's own credentials, which must never enter the repo or transcript | Credential paths named, never opened |
| gate document → requirements/windows ledgers → future phases | A signed Part 5 becomes the evidence `.planning/REQUIREMENTS.md` and `.planning/WINDOWS.md` carry forward, and that Phases 4–7 build on | Sign-off status, closure dispositions |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation / Evidence (L1) | Status |
|-----------|----------|-----------|----------|-------------|----------------------------|--------|
| T-03-01 | Tampering | `view` param, `app/og/route.tsx` | medium | mitigate | `app/og/route.tsx:406` exact-literal `view === "awards"` before any fetch; anything else falls to the `ReportCard` branch | closed |
| T-03-02 | Tampering | `fight` param, awards branch | medium | mitigate | `app/og/route.tsx:406` `Number.isInteger(fightId) && fightId >= 0` gate before the fetch fires | closed |
| T-03-03 | Denial of Service | `/og`→`/api/raid-overview` on the shared `anon` bucket | low | accept | Pre-existing pattern; `fetchJson` (`app/og/route.tsx:36-43`) returns `null` on non-2xx and the branch degrades to `ReportCard` — no surfaced error | closed |
| T-03-04 | Information Disclosure | report codes in the awards branch | low | accept | Only publicly-viewable WCL reports resolve; a private report's fetch returns `null` and degrades to `ReportCard` — no new access boundary | closed |
| T-03-05 | Tampering | WCL-supplied names rendered by Satori | low | mitigate | Names pass through JSX text children only (never `dangerouslySetInnerHTML`); every name/stat span sets an explicit `maxWidth`+`overflow: hidden` (`app/og/route.tsx` `PlayerCard`/`AwardsCard`, e.g. lines 199-208, 283-291, 316-325) | closed |
| T-03-06 | Spoofing | server-to-server fetch origin | medium | mitigate | `app/og/route.tsx:378-382` pins `origin` to `https://parseforge.gg` when `NODE_ENV === "production"`; only falls back to the request origin in dev | closed |
| T-03-07 | Tampering | degenerate-fight arithmetic (zero duration, empty roster) | low | mitigate | `lib/awards-engine.ts:349-354` `computeAwards` guards `!overview`, empty `players`, and non-positive `fightDuration`, returning an empty award list; tests `lib/awards-engine.test.ts:711,717,722` ("returns an empty awards array for a falsy overview / empty players array / fightDuration of 0") | closed |
| T-03-08 | Repudiation | an award naming a real raider with no verifiable basis | medium | mitigate | Every `AwardRow.stat` is computed from the fight's own data (e.g. `lib/awards-engine.ts:84,100,116,339`); test `lib/awards-engine.test.ts:764` "fires no rule unconditionally — only an explicit allowlist fires on a minimal all-zero fight" | closed |
| T-03-09 | Information Disclosure | player names in an award row | low | accept | Only publicly-viewable WCL reports resolve; the same names already appear in the existing raid table on the same page — no new disclosure | closed |
| T-03-10 | Tampering | `fight`/`source` params, player branch of `/og` | medium | mitigate | `app/og/route.tsx:415-417` reuses the existing integer-and-non-negative parse before the fetch; report code already validated via `isValidReportCode` | closed |
| T-03-11 | Denial of Service | two fetches per unfurl on the player branch | low | accept | `app/og/route.tsx:419-424` runs both in one `Promise.all`; `/api/report` carries the highest rate-limit budget (`report: 60` vs. `analyze: 30`/`raid-overview: 30`/`cla: 10` in `lib/constants.ts:135-141`) and `fetchJson` degrades to `null` on 429 | closed |
| T-03-12 | Information Disclosure | player card for a private/errored report | medium | mitigate | `app/og/route.tsx:426` only renders `PlayerCard` when `data?.playerName` is present, else falls through; `app/components/ComparisonSummary.tsx` share button only renders once an analysis has loaded | closed |
| T-03-13 | Spoofing | origin used to build the copied permalink | low | mitigate | `lib/share-links.ts` builders take `origin` as an explicit first parameter (never read a global); call sites pass `window.location.origin` explicitly (`app/components/RaidOverview.tsx:282`, `app/components/ComparisonSummary.tsx:205`, `AnalyzeClient.tsx:120`); pinned by `lib/share-links.test.ts:13-51` | closed |
| T-03-14 | Tampering | `ref` param reaching a PostHog property | medium | mitigate | `lib/share-links.ts:24-26` `parseShareRef` allowlists exactly `"share"\|"parse"\|"awards"`, case-sensitive exact match, else `null`; only the resolved value is passed to `posthog.capture` (`AnalyzeClient.tsx:159-162`); tests `lib/share-links.test.ts:69-84` cover empty/null/undefined/unknown-word/case-variant/URL/`<script>` payloads all returning `null` | closed |
| T-03-15 | Tampering | `tab`/`view` params driving initial render | low | mitigate | `AnalyzeClient.tsx:34` `isTabMode` narrows `tab` against `TAB_MODES` allowlist (`"player"\|"raid"\|"cla"`); `view` is compared with `=== "awards"` to a single literal (`AnalyzeClient.tsx:403`) — neither interpolated into markup or an outbound URL | closed |
| T-03-16 | Information Disclosure | inline awards preview image | low | accept | `buildAwardsOgPath` (`lib/share-links.ts:74-84`) builds a same-origin `/og` URL from an already-validated report code and fight id (`app/components/RaidOverview.tsx:295`); shows the same public data as the adjacent table | closed |
| T-03-17 | Repudiation | double-counted landing events | low | mitigate | `AnalyzeClient.tsx:151-164` guards the capture-and-strip effect with `useRef` (`refCaptureRanRef`), empty dependency array, runs exactly once per mount | closed |
| T-03-18 | Denial of Service | panel triggering extra API load | low | accept | `AwardsPanel` computes awards from the `RaidOverviewResult` already in memory (`app/components/RaidOverview.tsx:252-260`); issues no fetch of its own; the preview image hits the cached `/og` route | closed |
| T-03-19 | Tampering | attribute/path values parsed from the checklist table | low | mitigate | `scripts/protected-elements.mjs:91-101` `checkAttribute` treats a non-existent owner file as `fatal: true` (exits 2), not a silent skip; all six `data-protected` attributes verified present in their owner files (`ComparisonSummary.tsx:276,294`, `AnalyzeClient.tsx:201`, `RaidOverview.tsx:298,311,356`) | closed |
| T-03-20 | Denial of Service | gate's live fetches against production | low | accept | `scripts/protected-elements.mjs:191-196` issues exactly 4 unauthenticated GETs per run against already-cached public routes — same order of magnitude as the pre-existing `seo-invariants` gate | closed |
| T-03-21 | Repudiation | a gate that greens without checking anything | high | mitigate | `scripts/protected-elements.mjs:73-89` (empty/missing checklist) and `:198-201` (unreachable base) both call `fatal()` → `process.exit(2)`, never a silent pass | closed |
| T-03-22 | Information Disclosure | Vercel protection-bypass secret | high | mitigate | `docs/OPS-01-SHIP-GATE.md:908-924` records the secret was pulled to a throwaway path, used as a header, never printed; repo-wide pattern scan for `x-vercel-protection-bypass: [A-Za-z0-9]{10}`, `VERCEL_AUTOMATION_BYPASS_SECRET=`, `sk_live`/`sk_test`, AWS keys, PEM headers across `docs/OPS-01-SHIP-GATE.md`, `docs/PROTECTED-ELEMENTS.md`, `.planning/REQUIREMENTS.md` returns 0 matches (verified this session) | closed |
| T-03-23 | Elevation of Privilege | deploying to production from the preview plan | high | mitigate | `03-06-SUMMARY.md:99` "no `--prod` flag used anywhere"; `03-06-PLAN.md:79,148` explicitly excludes `--prod`; production deploy is a separate plan (03-07) | closed |
| T-03-24 | Repudiation | a preview observation recorded as a gate pass | high | mitigate | `docs/OPS-01-SHIP-GATE.md` Part 5 preview section carries no sign-off; every unperformed check recorded not-performed with a named closing test | closed |
| T-03-25 | Elevation of Privilege | production deploy command | high | mitigate | `03-07-PLAN.md:74` `<task type="checkpoint:decision" gate="blocking-human">` precedes the `--prod` step; `03-07-SUMMARY.md:39,111` records the developer's verbatim "deploy-now" approval before the deploy ran | closed |
| T-03-26 | Repudiation | sign-off without evidence / threshold quietly lowered | high | mitigate | `docs/OPS-01-SHIP-GATE.md:2424` "Sign-off: LEFT OPEN — not signed" recorded when item-7 read FAIL/PASS/NOT-EVALUABLE rather than fabricated as a pass; `git show f737a64 --stat` (Part 5 close-out commit) is 82 insertions / 0 deletions | closed |
| T-03-27 | Information Disclosure | deploy output / env listings pasted into the gate doc | medium | mitigate | `docs/OPS-01-SHIP-GATE.md` records only deployment ids (e.g. `dpl_6Pj5Lz5Q1tSJYSCtUu3YTvtRx3mx`) and commit hashes; repo-wide secret-pattern scan (T-03-22 evidence) returns 0 matches | closed |
| T-03-28 | Tampering | SEO invariants on the live site | high | mitigate | `app/analyze/[reportCode]/page.tsx:45,81` canonical is always `https://parseforge.gg/analyze/{code}` with no query string; `generateMetadata` forwards only `fight`/`source`/`view` into the OG URL, never `ref` (`page.tsx:38-41`); Search Console pass confirms no separately-indexed permutation (`docs/OPS-01-SHIP-GATE.md:2778` Row 6 "PASS") | closed |
| T-03-29 | Repudiation | a Part 5 row passed without the external observation | high | mitigate | `03-08-PLAN.md:297-298,366-367` verify commands assert named fields (`Coverage state:`, `Last crawl:`, `Google-selected canonical:`, verdict lines) exist in the counted-result subsection before the gate can pass | closed |
| T-03-30 | Tampering | committed gate document's existing evidence | high | mitigate | `git show --stat 4382152` (34 ins/0 del) and `19609aa` (114 ins/0 del) on `docs/OPS-01-SHIP-GATE.md` — both 03-08 commits are purely additive | closed |
| T-03-31 | Information Disclosure | developer's Google/Discord session, credential paths | high | mitigate | `03-08-PLAN.md:57` "MUST NOT print, copy, move or paste the value of any credential"; `docs/OPS-01-SHIP-GATE.md` names `~/.config/gsc/*`, Vercel tokens, `.env*` but never opens them; secret-pattern scan (T-03-22 evidence) clean | closed |
| T-03-32 | Spoofing | a permutation "none found" claimed unsourced | medium | mitigate | `docs/OPS-01-SHIP-GATE.md:2778` Row 6 names the source consulted: "a `site:` query returns only the param-free route" | closed |
| T-03-33 | Repudiation | threshold scored on a partial/borrowed window | high | mitigate | `docs/OPS-01-SHIP-GATE.md:2600-2603` query run `2026-09-18T22:10:48Z`, later than the scored window end `07:00:00Z`, explicitly noted as "proving a full window was scored rather than a partial one" | closed |
| T-03-34 | Tampering | item 7's three thresholds | high | mitigate | `docs/OPS-01-SHIP-GATE.md:2650` "Threshold evaluation (Part 1 item 7's own thresholds, applied exactly as written, unmodified)" table records Counted beside Result for all 3 thresholds | closed |
| T-03-35 | Tampering | committed gate document's existing evidence (03-09) | high | mitigate | `git show --stat 7a06fd6` on `docs/OPS-01-SHIP-GATE.md`: 170 insertions / 0 deletions | closed |
| T-03-36 | Information Disclosure | PostHog/Vercel credentials | high | mitigate | `docs/OPS-01-SHIP-GATE.md:2601-2604` records only project/team/deployment identifiers (PostHog project 337485, `dpl_...` id); secret-pattern scan for `phc_[A-Za-z0-9]{20,}`, `KV_REST_API_TOKEN=`, `UPSTASH_REDIS_REST_TOKEN=`, `WCL_CLIENT_SECRET=` returns 0 matches | closed |
| T-03-37 | Repudiation | dated sign-off written over an uncounted row | critical | mitigate | `03-07-PLAN.md`-style `checkpoint:decision` pattern reused; `docs/OPS-01-SHIP-GATE.md:2711-2716` records both developer replies verbatim ("sign-now", "you call") plus the orchestrator's resolution; `grep -cE '^### Phase 3 Sign-off — (SIGNED|LEFT OPEN) \('` verify pattern (`03-10-PLAN.md:272`) enforces exactly one heading — confirmed exactly one exists at `docs/OPS-01-SHIP-GATE.md:2800` | closed |
| T-03-38 | Tampering | existing REQUIREMENTS.md addenda/traceability rows | high | mitigate | `git diff -U0 1d43ef7~1 1d43ef7 -- .planning/REQUIREMENTS.md \| grep -cE '^-[^-]'` → `0` (the 03-10 commit that touches REQUIREMENTS.md is purely additive); Addenda 2, 3, 4 and the SHARE addenda all present in `.planning/REQUIREMENTS.md` | closed |
| T-03-39 | Repudiation | a WINDOWS.md entry closed without its closing evidence | high | mitigate | `.planning/WINDOWS.md` entry `#10` shows `status: fixed`, `resolved_at: "2026-09-19T01:10:28.150Z"`, matching the counted item-7 closure in `docs/OPS-01-SHIP-GATE.md`; entries `#9`/`#11` remain `status: open`, matching the gate doc's stated open dispositions — no entry silently disappeared | closed |
| T-03-40 | Information Disclosure | PostHog credentials during the share-rate re-run | medium | mitigate | `03-10-SUMMARY.md` records "no share-rate HogQL run" this plan (re-run date-gated, not performed); no credential value appears in the transcribed evidence (T-03-36 scan) | closed |
| T-03-SC-01 | Tampering | npm/pip/cargo installs (03-01) | high | accept | accepted — `git diff main..HEAD -- package.json package-lock.json`: only a new npm script entry (`protected-elements`), zero dependency changes | closed |
| T-03-SC-02 | Tampering | npm/pip/cargo installs (03-02) | high | accept | accepted — no packages added; awards-engine is pure TS with no new imports | closed |
| T-03-SC-03 | Tampering | npm/pip/cargo installs (03-03) | high | accept | accepted — no packages added | closed |
| T-03-SC-04 | Tampering | npm/pip/cargo installs (03-04) | high | accept | accepted — no packages added | closed |
| T-03-SC-05 | Tampering | npm/pip/cargo installs (03-05) | high | accept | accepted — `scripts/protected-elements.mjs:38-41` imports only `node:fs`, `node:url`, `node:path`, `node:process` | closed |
| T-03-SC-06 | Tampering | npm/pip/cargo installs (03-06) | high | accept | accepted — this plan deploys existing code, adds no dependency | closed |
| T-03-SC-07 | Tampering | npm/pip/cargo installs (03-07) | high | accept | accepted — production deploy of existing code, `package.json`/`package-lock.json` diff confirms no dependency change | closed |
| T-03-SC-08 | Tampering | npm/pip/cargo installs (03-08) | high | accept | accepted — documentation-only plan | closed |
| T-03-SC-09 | Tampering | npm/pip/cargo installs (03-09) | high | accept | accepted — documentation-only plan | closed |
| T-03-SC-10 | Tampering | npm/pip/cargo installs (03-10) | high | accept | accepted — documentation/planning-file-only plan | closed |

*Status: open · closed · open — below `high` threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (`high`) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*
*`T-03-SC-NN` are the per-plan supply-chain rows (originally all titled `T-03-SC`), suffixed by plan (01–10) for uniqueness.*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01 | T-03-03 | Pre-existing pattern for the player branch; `fetchJson` already returns null on a 429 and the branch degrades to `ReportCard`. No new code. | developer (plan-time disposition, 03-01-PLAN.md) | 2026-09-16 |
| R-02 | T-03-04 | Only publicly-viewable WCL reports resolve; a private report's raid-overview call returns null and the card degrades. No new access boundary. | developer (plan-time disposition, 03-01-PLAN.md) | 2026-09-16 |
| R-03 | T-03-09 | Only publicly-viewable WCL reports resolve; the same names already appear in the raid table on the same page. No new disclosure. | developer (plan-time disposition, 03-02-PLAN.md) | 2026-09-16 |
| R-04 | T-03-11 | Both fetches run in one `Promise.all` so no serial latency is added; `/api/report` has the highest rate-limit budget in the system and degrades to null on a 429. | developer (plan-time disposition, 03-03-PLAN.md) | 2026-09-16 |
| R-05 | T-03-16 | Same-origin `/og` URL built from an already-validated report code and fight id; shows the same public data as the table beside it. | developer (plan-time disposition, 03-04-PLAN.md) | 2026-09-16 |
| R-06 | T-03-18 | The panel computes awards from data already in memory; it issues no fetch of its own. | developer (plan-time disposition, 03-04-PLAN.md) | 2026-09-16 |
| R-07 | T-03-20 | Four unauthenticated GETs per run against already-cached public routes; same order of magnitude as the pre-existing `seo-invariants` gate. | developer (plan-time disposition, 03-05-PLAN.md) | 2026-09-16 |
| R-08 | T-03-SC-01 … T-03-SC-10 | No packages added by any plan in this phase (RESEARCH `## Package Legitimacy Audit`: zero new dependencies across all ten plans); `package.json`/`package-lock.json` diff vs. `main` confirms only a script-entry addition. | developer (plan-time disposition, each `03-0N-PLAN.md`) | 2026-09-16 – 2026-09-19 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-19 | 50 | 50 | 0 | verify-work verify:post secure-phase step (orchestrator-delegated, L1 grep-depth; `gsd-secure-phase` skill and `gsd-security-auditor` not installed) |

**Corroborating evidence run this session:** `npx vitest run` — 226/226 tests passed across 18 files (including `lib/share-links.test.ts`, `lib/awards-engine.test.ts`); `npx tsc --noEmit` — clean, no errors. Repository-wide secret-pattern scans (Vercel bypass secret, PostHog project key, Upstash/KV tokens, WCL client secret, AWS keys, PEM blocks) across `docs/OPS-01-SHIP-GATE.md`, `docs/PROTECTED-ELEMENTS.md`, and `.planning/REQUIREMENTS.md` returned zero matches. `git diff main..HEAD -- package.json package-lock.json` confirms zero dependency changes phase-wide. Per-commit additive-only checks (`git diff -U0 <commit>~1 <commit>`) were re-run against the exact commits each plan's own verify block names (`f737a64`, `1d43ef7`, `4382152`, `19609aa`, `7a06fd6`) and all show zero deleted lines, matching each plan's stated mitigation.

**Not covered by this audit:** `03-REVIEW.md` findings WR-01, WR-02, WR-03, and IN-01 remain explicitly deferred (per `docs/OPS-01-SHIP-GATE.md`'s Phase 3 Sign-off text) to a future `/gsd-code-review --fix` pass; this SECURITY.md does not assess or close them. `.planning/WINDOWS.md` entries `#9` and `#11` remain open by the gate's own conditional sign-off (D-04 first-hand verdict, real Discord unfurl, and the date-gated D-14 share-rate re-run) — these are tracked product/process follow-ups, not open security threats in this register.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-19
