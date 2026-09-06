---
phase: quick-260906-kzw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/privacy/page.tsx
  - app/terms/page.tsx
  - app/components/LandingHero.tsx
  - app/sitemap.ts
  - .planning/todos/pending/privacy-policy-page.md
  - .planning/todos/completed/privacy-policy-page.md
autonomous: true
requirements:
  - TODO-privacy-policy-page

estimate:
  tokens: 48000
  raw_tokens: 37000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "A visitor can load https://parseforge.gg/privacy and read a privacy policy that accurately describes ParseForge's actual data handling (WCL report data, Upstash caching, PostHog, Google CMP, Vercel, Wowhead)."
    - "A visitor can load https://parseforge.gg/terms and read a plain-language terms of service naming an individual operator and California governing law."
    - "A visitor on the landing page can reach both pages from the footer without knowing the URLs."
    - "Both pages are discoverable by Google: present in /sitemap.xml, indexable (no noindex), with param-free canonicals."
    - "Each page links to the other and shows 'Last updated: 2026-09-06'."
    - "The pending todo .planning/todos/pending/privacy-policy-page.md is closed out under .planning/todos/completed/ with a resolved marker."
  artifacts:
    - app/privacy/page.tsx
    - app/terms/page.tsx
    - .planning/todos/completed/privacy-policy-page.md
  key_links:
    - "LandingHero.tsx <footer> -> next/link to /privacy and /terms (the only in-app entry point; without it the pages are orphaned)."
    - "app/sitemap.ts STATIC_ROUTES -> ${BASE}/privacy and ${BASE}/terms (the crawl path; must not disturb the getRecentReports pipeline below it)."
    - "app/privacy/page.tsx <-> app/terms/page.tsx cross-links."
    - "Privacy policy prose <-> lib/consent.ts + PostHogProvider.tsx behavior (the policy is only correct while it matches this code)."
---

<objective>
Ship two static legal pages — `/privacy` and `/terms` — written to match what ParseForge's
code actually does, link them from the landing-page footer, add them to the sitemap, and
close the pending `privacy-policy-page` todo.

Purpose: the Phase 01 AdSense/Google CMP consent message was published with a blank privacy
policy URL (AdSense shows a "missing privacy policy" warning), and GDPR expects a consent
dialog to link a policy. This unblocks that field and gives the site the legal surface a
soon-to-be ad-supported product needs.

Output: `app/privacy/page.tsx`, `app/terms/page.tsx`, footer links in `LandingHero.tsx`,
two new `STATIC_ROUTES` entries in `app/sitemap.ts`, and the todo moved to
`.planning/todos/completed/`.
</objective>

<execution_context>
@/Users/alexander.mayes/Code/parseforge/.claude/gsd-core/workflows/execute-plan.md
@/Users/alexander.mayes/Code/parseforge/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@/Users/alexander.mayes/Code/parseforge/CLAUDE.md
@/Users/alexander.mayes/Code/parseforge/.claude/CLAUDE.md
@.planning/STATE.md
@.planning/todos/pending/privacy-policy-page.md

# The static-page pattern to copy verbatim (metadata, canonical, BreadcrumbList
# JSON-LD, layout + typography classes). Read this FIRST — do not invent a layout.
@app/guides/raid-preparation-checklist/page.tsx

# The files being modified
@app/components/LandingHero.tsx
@app/sitemap.ts

# The ground truth the privacy prose must describe. The policy is a description of
# this code, not boilerplate — if prose and code disagree, the code wins.
@lib/consent.ts
@app/components/PostHogProvider.tsx
@app/layout.tsx
</context>

<facts_established_from_code>
Verified by reading the source during planning. Use these; do not re-derive or guess.

- **Consent (lib/consent.ts):** TCF v2.2 via `window.__tcfapi`. Four outcomes —
  `opt-in-full`, `cookieless`, `opt-in-non-eea`, `pending`. `gdprApplies === false`
  (non-EEA/UK) resolves to `opt-in-non-eea` immediately. TCF purpose 1 decides
  full opt-in vs. cookieless. `CMP_TIMEOUT_MS = 3000` fails closed to `pending`.
- **PostHog (app/components/PostHogProvider.tsx):** `capture_pageview: false` with
  manual `$pageview` capture; `autocapture: true`; `capture_pageleave: true`;
  `person_profiles: "always"`; `cookieless_mode: "on_reject"`;
  `disable_session_recording: true` with replay started only on `opt-in-full` /
  `opt-in-non-eea`; `session_recording.maskAllInputs: true`;
  `enable_recording_console_log: false`. Ingestion is proxied through `/ingest`.
- **Third-party scripts (app/layout.tsx):** Wowhead tooltips from
  `https://wow.zamimg.com/js/tooltips.js`; Google CMP from
  `https://fundingchoicesmessages.google.com/i/${NEXT_PUBLIC_GOOGLE_CMP_PUB_ID}`;
  `@vercel/analytics` and `@vercel/speed-insights`.
- **Caching (lib/kv-cache.ts, lib/constants.ts, lib/wcl-client.ts):** Upstash Redis
  when provisioned, per-instance `Map` fallback. `ANALYSIS_CACHE_TTL = 10 minutes`
  for analysis results; `QUERY_CACHE_TTL_MS = 5 minutes` for the WCL GraphQL query
  cache. `pf:recent_reports` is a Redis sorted set of public report codes that feeds
  the sitemap.
- **No accounts:** there is no auth, no user table, no password, no payment code
  anywhere in the repo.
- **`app/sitemap.ts`:** static entries live in the `STATIC_ROUTES` array; the mapper
  adds `lastModified: now` to each. `getRecentReports` runs below it — leave untouched.
- **Node is not on PATH.** Every shell block below starts with
  `export PATH="$HOME/.local/node20/bin:$PATH"`. `node_modules` is present.
- **npm scripts:** `lint` -> `eslint`, `test` -> `vitest run`. Do **not** run
  `npm run build` (it prerenders `/` and `/sitemap.xml`, which need prod env).
</facts_established_from_code>

<tasks>

<task type="auto">
  <name>Task 1: Create the /privacy and /terms static pages</name>
  <files>app/privacy/page.tsx, app/terms/page.tsx</files>
  <action>
Create two new static server components (no `"use client"`, no data fetching), both
copying the structure of `app/guides/raid-preparation-checklist/page.tsx`:
`export const metadata: Metadata` with `title`, `description`,
`alternates.canonical` (param-free absolute URL), and `openGraph`
(`title`/`description`/`url`); a module-level `breadcrumbJsonLd` object
(`@type: BreadcrumbList`) injected via
`<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }} />`;
`<main className="mx-auto max-w-3xl py-16">` wrapping
`<article className="prose-custom space-y-8">`; a `<header className="space-y-3">`
with `<h1 className="text-3xl font-bold tracking-tight text-gradient-gold">`; body
sections as `<section className="space-y-4">` with
`<h2 className="text-xl font-semibold">` and `<p className="text-muted-foreground">`;
internal navigation via `next/link`; link styling `text-gold-from hover:underline`.
Do not add a `robots` field — both pages must stay indexable by default.

Breadcrumbs are two levels (Home -> the page), unlike the guides' three:
position 1 `Home` / `https://parseforge.gg`, position 2 the page title / its canonical URL.

Both pages show a `Last updated: 2026-09-06` line (muted, directly under the h1) and
cross-link the other page in a closing section. Write the actual prose yourself — the
outlines below fix the scope and the facts; the wording is yours. Keep it plain-language
and readable, not legalese; ParseForge is operated by **an individual operator** (never
name a company or legal entity). Contact everywhere is `info@lootlistplus.com`, rendered
as visible plain text wrapped in a `mailto:` link.

**Accuracy rule:** every factual claim in the privacy policy must be traceable to the
`<facts_established_from_code>` block above or to `lib/consent.ts` /
`app/components/PostHogProvider.tsx` / `app/layout.tsx`. Do not describe cookie
categories, retention schedules, DPO appointments, or data-processing agreements that
do not exist in this codebase.

---
**`app/privacy/page.tsx`** — title "Privacy Policy", canonical
`https://parseforge.gg/privacy`. Sections:

1. **Who we are** — ParseForge (parseforge.gg) is a free WoW Classic / TBC raid-log
   analyzer operated by an individual. Privacy contact: `info@lootlistplus.com`.
2. **What ParseForge processes** — the Warcraft Logs report URL you paste, and the
   public report data fetched from Warcraft Logs' API on your behalf. That data is
   cached temporarily on our servers (Upstash Redis; roughly 5–10 minutes per cached
   result) so repeat views are fast. Public report codes are also kept in a
   `pf:recent_reports` list used to build our sitemap and the "recent reports" links.
   No user accounts, no passwords, no payment data — ParseForge has no login.
3. **Analytics** — PostHog records pageviews and autocaptured interactions (clicks,
   form submits) and is proxied through our own `/ingest` path. Session replay never
   starts automatically: it runs only after an explicit full opt-in, with all form
   inputs masked and browser console logs not captured. For EEA/UK visitors the Google
   consent dialog governs this — rejecting means PostHog runs memory-only and sets no
   cookies. Visitors outside the EEA/UK are opted in by default. Separately, Vercel
   Analytics and Vercel Speed Insights collect aggregate traffic and Web Vitals
   performance data.
4. **Advertising and your consent choices** — Google Privacy & Messaging is our consent
   management platform (IAB TCF v2.2). ParseForge does not currently show ads; Google
   AdSense may serve ads on the site in future, and your consent choices apply to it.
   You can re-open the consent dialog at any time to change your choices.
5. **Third parties** — a short list, each with one line on what it receives:
   Warcraft Logs (RPGLogs) — the report data source; Google — consent management and
   potential future AdSense; PostHog — product analytics; Vercel — hosting, traffic and
   performance analytics; Upstash — the Redis cache holding report data; Wowhead
   (`wow.zamimg.com`) — item tooltips and icons, which means your browser makes a
   request directly to Wowhead's servers when you view a report.
6. **Your rights** — GDPR / UK GDPR: access, rectification, erasure, restriction,
   portability, objection, and withdrawal of consent. California (CCPA/CPRA): we do not
   sell personal information, and we do not share it for cross-context behavioral
   advertising, as of this policy; you have the right to know and the right to delete.
   Exercise any of these by emailing `info@lootlistplus.com`.
7. **Children** — ParseForge is not directed to children under 13 and we do not
   knowingly collect their personal information.
8. **Changes to this policy** — changes are posted on this page with an updated date.
9. **Related** — link to `/terms`.

---
**`app/terms/page.tsx`** — title "Terms of Service", canonical
`https://parseforge.gg/terms`. Short and plain-language. Sections:

1. **The service** — ParseForge is a free tool operated by an individual, provided
   **"as is"** and without any service-level commitment; it may change or go away.
2. **Not affiliated with Blizzard or Warcraft Logs** — ParseForge is not affiliated
   with, endorsed by, or sponsored by Blizzard Entertainment or Warcraft Logs (RPGLogs).
   World of Warcraft and related marks are trademarks of Blizzard Entertainment.
3. **Analysis is informational** — the DPS/HPS comparisons, gear and consumable audits,
   and suggestions are informational only. We make no warranty that they are accurate,
   complete, or right for your character. Use them at your own risk.
4. **Acceptable use** — no scraping, no automated bulk querying, no circumventing rate
   limits, and no using the site to disrupt or abuse the service or the upstream
   Warcraft Logs API. Report data is Warcraft Logs' public data and remains subject to
   Warcraft Logs' own terms.
5. **Limitation of liability** — to the maximum extent permitted by law, the operator is
   not liable for any damages arising out of your use of ParseForge.
6. **Governing law** — the laws of the State of California, USA.
7. **Changes to these terms** — changes are posted on this page with an updated date.
8. **Contact** — `info@lootlistplus.com`.
9. **Related** — link to `/privacy`.

---
Escape apostrophes in JSX text as `&apos;` (the repo's eslint config enforces
`react/no-unescaped-entities`) — or phrase around them.
  </action>
  <verify>
    <automated>
export PATH="$HOME/.local/node20/bin:$PATH" && npx tsc --noEmit || exit 1
npx next dev -p 3987 > /tmp/pf-dev-3987.log 2>&1 &
DEV_PID=$!
for i in $(seq 1 90); do C=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3987/privacy" || true); [ "$C" != "000" ] && break; sleep 1; done
curl -s -o /dev/null -w "privacy=%{http_code}\n" http://127.0.0.1:3987/privacy
curl -s -o /dev/null -w "terms=%{http_code}\n" http://127.0.0.1:3987/terms
kill $DEV_PID 2>/dev/null; wait $DEV_PID 2>/dev/null; true
    </automated>
    <automated>export PATH="$HOME/.local/node20/bin:$PATH" && grep -c 'parseforge.gg/privacy' app/privacy/page.tsx && grep -c 'parseforge.gg/terms' app/terms/page.tsx && grep -c 'BreadcrumbList' app/privacy/page.tsx app/terms/page.tsx && grep -c 'info@lootlistplus.com' app/privacy/page.tsx app/terms/page.tsx && grep -c '2026-09-06' app/privacy/page.tsx app/terms/page.tsx</automated>
  </verify>
  <done>
`npx tsc --noEmit` is clean. The dev-server check prints `privacy=200` and
`terms=200`. Each page has a `Metadata` export with a param-free absolute canonical,
a `BreadcrumbList` JSON-LD script, a `Last updated: 2026-09-06` line, a
`mailto:info@lootlistplus.com` contact, a link to the other page, and no `robots`
noindex directive. The privacy page covers all nine outlined sections and the terms
page all nine, with prose written (not placeholder text).
  </done>
</task>

<task type="auto">
  <name>Task 2: Link both pages from the footer and add them to the sitemap</name>
  <files>app/components/LandingHero.tsx, app/sitemap.ts</files>
  <action>
**`app/components/LandingHero.tsx`** — add "Privacy" and "Terms" links to the existing
`<footer className="text-xs text-muted-foreground space-y-1">` block at the bottom of
the component (the one currently ending with the GitHub link). Add one `<p>` containing
both links separated by a visual divider (e.g. a muted middle dot), using `next/link`
(`import Link from "next/link"`) rather than a bare `<a>`, and matching the footer's
existing link styling `className="text-gold-from hover:underline"`. Inherit the
footer's `text-xs text-muted-foreground` sizing — add no new size or color classes.
Keep the GitHub link where it is.

**`app/sitemap.ts`** — add exactly two entries to the `STATIC_ROUTES` array:
`{ url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 }` and the same for
`/terms`. Put them after the `/guides/*` entries and before the demo-report entry with
its explanatory comment. Change nothing else in the file: the `getRecentReports`
call, the `DEMO_REPORT` filter, `revalidate`, and the `lastModified` mapper are
SEO-invariant code paths and must be left byte-identical.
  </action>
  <verify>
    <automated>export PATH="$HOME/.local/node20/bin:$PATH" && npx tsc --noEmit && grep -c 'href="/privacy"' app/components/LandingHero.tsx && grep -c 'href="/terms"' app/components/LandingHero.tsx && grep -c 'from "next/link"' app/components/LandingHero.tsx</automated>
    <automated>export PATH="$HOME/.local/node20/bin:$PATH" && grep -c '${BASE}/privacy' app/sitemap.ts && grep -c '${BASE}/terms' app/sitemap.ts && grep -c 'getRecentReports(10_000)' app/sitemap.ts && grep -c 'r.code !== DEMO_REPORT.code' app/sitemap.ts</automated>
    <automated>export PATH="$HOME/.local/node20/bin:$PATH" && npm run lint 2>&1 | tee /tmp/pf-lint.txt; echo "new-findings=$(grep -E 'app/(privacy|terms)/page.tsx|app/components/LandingHero.tsx|app/sitemap.ts' /tmp/pf-lint.txt | grep -cE 'error|warning')"</automated>
    <automated>export PATH="$HOME/.local/node20/bin:$PATH" && npm test</automated>
  </verify>
  <done>
`npx tsc --noEmit` clean. The footer renders "Privacy" and "Terms" as `next/link`
links in the existing `<footer>`, styled `text-gold-from hover:underline` inside the
footer's `text-xs text-muted-foreground` block. `app/sitemap.ts` `STATIC_ROUTES`
contains `${BASE}/privacy` and `${BASE}/terms`, each with
`changeFrequency: "yearly"` and `priority: 0.3`, and the `getRecentReports` /
`DEMO_REPORT` block below is unchanged. `npm run lint` reports `new-findings=0` for
the four touched files (pre-existing debt in `components/ui/meteors.tsx` and
`lib/analysis-engine.ts` is expected and untouched). `npm test` passes.
  </done>
</task>

<task type="auto">
  <name>Task 3: Close out the privacy-policy-page todo</name>
  <files>.planning/todos/pending/privacy-policy-page.md, .planning/todos/completed/privacy-policy-page.md</files>
  <action>
Create the `.planning/todos/completed/` directory (it does not exist yet) and
`git mv .planning/todos/pending/privacy-policy-page.md .planning/todos/completed/privacy-policy-page.md`.

Then append a `resolved: 260906-kzw` line to the moved file's YAML frontmatter (the
block already has `created`, `source`, `resolves_phase` — add `resolved` as a new key
inside the same `---` fences, leaving the existing keys as they are). Leave the body
prose untouched; it is the historical record of why the page was needed.

Note in the commit body that item 2 of the todo — pasting the `/privacy` URL into
AdSense -> Privacy & messaging -> European regulations -> message -> site settings —
is a Google-dashboard action the user must do manually after the next production
deploy, and is deliberately not part of this change.
  </action>
  <verify>
    <automated>test -f .planning/todos/completed/privacy-policy-page.md && grep -c 'resolved: 260906-kzw' .planning/todos/completed/privacy-policy-page.md && test ! -e .planning/todos/pending/privacy-policy-page.md && echo "todo-closed=ok"</automated>
  </verify>
  <done>
`.planning/todos/completed/privacy-policy-page.md` exists with `resolved: 260906-kzw`
in its frontmatter, no file remains at `.planning/todos/pending/privacy-policy-page.md`,
and the move is recorded in git as a rename.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| visitor browser -> parseforge.gg static pages | These two routes take no input: no params, no forms, no query-string reads. |
| parseforge.gg page -> third-party CDNs | The root layout already loads Wowhead tooltips and the Google CMP on every route, including these two. This change adds no new script. |
| repo -> published legal text | The policy is a public factual claim about our data handling; a wrong claim is a compliance liability, not just a typo. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-kzw-01 | Information Disclosure | `app/privacy/page.tsx`, `app/terms/page.tsx` prose | medium | mitigate | Prose names only public-facing service names (Upstash, PostHog, Vercel, Google, Wowhead, Warcraft Logs). No env var names, no Redis key values beyond the already-public `pf:recent_reports`, no credentials, no infrastructure identifiers. Task 1's accuracy rule constrains claims to the `<facts_established_from_code>` block. |
| T-kzw-02 | Repudiation | published policy vs. actual behavior | high | mitigate | Every claim in the privacy page is derived from `lib/consent.ts`, `app/components/PostHogProvider.tsx`, `app/layout.tsx`, and `lib/kv-cache.ts` read during planning — not from boilerplate. The `must_haves.key_links` records the prose/code coupling so a future consent change is known to invalidate the page. |
| T-kzw-03 | Tampering | `app/sitemap.ts` SEO-invariant pipeline | high | mitigate | Task 2 restricts the edit to two array literals and verifies `getRecentReports(10_000)` and the `DEMO_REPORT` filter are still present byte-identical via grep gates. |
| T-kzw-04 | Elevation of Privilege | new routes | low | accept | Both routes are static server components with no params, no dynamic segment, no API access, and no user input. There is no privilege to elevate. |
| T-kzw-SC | Tampering | npm/pip/cargo installs | n/a | accept | This plan installs zero packages — `next/link`, `next` `Metadata`, and React are already dependencies. The package-legitimacy gate is therefore not applicable; if execution discovers a new dependency is needed, stop and re-plan. |
</threat_model>

<verification>
Run from the repo root, node on PATH first:

```bash
export PATH="$HOME/.local/node20/bin:$PATH"
npx tsc --noEmit          # must be clean
npm run lint              # no NEW findings in the four touched files
npm test                  # vitest run — must pass
```

Live-route check (no build, no deploy):

```bash
export PATH="$HOME/.local/node20/bin:$PATH"
npx next dev -p 3987 > /tmp/pf-dev-3987.log 2>&1 &
DEV_PID=$!
for i in $(seq 1 90); do C=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3987/privacy || true); [ "$C" != "000" ] && break; sleep 1; done
curl -s -o /dev/null -w "privacy=%{http_code}\n" http://127.0.0.1:3987/privacy
curl -s -o /dev/null -w "terms=%{http_code}\n"   http://127.0.0.1:3987/terms
kill $DEV_PID 2>/dev/null; wait $DEV_PID 2>/dev/null
```

Both must print `200`. Kill the dev server before finishing — leaving a stray
process on 3987 counts as unclean.

**Explicitly out of scope for verification:** `npm run build` (it prerenders `/` and
`/sitemap.xml`, which need prod WCL + Redis env) and any `vercel deploy`. Do not run
either. The user deploys manually when ready.
</verification>

<commit_guidance>
Three atomic commits, one per task, on a branch off `main` (e.g. `growth/privacy-terms`).
Every commit message must end with these two trailer lines verbatim:

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FeRkPoQDHb1UFVM3zrRsjs
```

Suggested subjects:
1. `feat(privacy): add /privacy and /terms static pages`
2. `feat(privacy): link privacy and terms in footer, add to sitemap`
3. `docs(todo): close privacy-policy-page todo (resolved 260906-kzw)`
</commit_guidance>

<success_criteria>
- [ ] `app/privacy/page.tsx` and `app/terms/page.tsx` exist as static server components, both returning 200 from `next dev`.
- [ ] Both have a `Metadata` export with a param-free absolute canonical, `openGraph` fields, and no `robots` noindex — they are indexable.
- [ ] Both carry `BreadcrumbList` JSON-LD, a `Last updated: 2026-09-06` line, a `mailto:info@lootlistplus.com` contact, and a link to the other page.
- [ ] Privacy prose matches the code: PostHog pageview + autocapture, replay only on full opt-in with inputs masked and console capture off, EEA/UK governed by the Google TCF v2.2 dialog with reject = cookieless, non-EEA/UK opted in by default, Vercel Analytics + Speed Insights, Upstash caching + `pf:recent_reports`, no accounts/passwords/payments. Third parties named: Warcraft Logs (RPGLogs), Google, PostHog, Vercel, Upstash, Wowhead.
- [ ] Terms prose covers: individual operator, "as is", Blizzard/Warcraft Logs non-affiliation, informational-only with no accuracy warranty, acceptable use, limitation of liability, California governing law, change notice, contact.
- [ ] Landing-page footer links to `/privacy` and `/terms` via `next/link`, matching existing `text-xs` muted styling.
- [ ] `app/sitemap.ts` `STATIC_ROUTES` has both URLs at `changeFrequency: "yearly"`, `priority: 0.3`; the `getRecentReports` / `DEMO_REPORT` pipeline is unchanged.
- [ ] `npx tsc --noEmit` clean, `npm run lint` with no new findings in touched files, `npm test` passing.
- [ ] Todo moved to `.planning/todos/completed/privacy-policy-page.md` with `resolved: 260906-kzw`.
- [ ] Three commits, each ending with the required trailer lines. No build, no deploy.
- [ ] Follow-up surfaced to the user: after the next prod deploy, paste `https://parseforge.gg/privacy` into AdSense -> Privacy & messaging -> European regulations -> message -> site settings to clear the "missing privacy policy" warning.
</success_criteria>

<out_of_scope>
Do not add any of these — they were explicitly ruled out:
- A ParseForge-built cookie banner (the Google CMP *is* the banner).
- A global site-wide footer component (that is Phase 7's call; footer links go in `LandingHero.tsx` only).
- A CCPA "Do Not Sell or Share My Personal Information" link (no sale/share occurs).
- Any ad code or AdSense script.
- Any change to SEO-invariant paths: report-page indexing rules, canonical construction, `recordRecentReport` / `getRecentReports` / `usingSharedCache`.
- `npm run build` or any `vercel deploy`.
</out_of_scope>

<output>
Create `.planning/quick/260906-kzw-add-privacy-and-terms-pages-footer-links/260906-kzw-SUMMARY.md` when done.
</output>