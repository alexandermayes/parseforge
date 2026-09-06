---
phase: quick-260906-kzw
plan: 01
subsystem: ui
tags: [nextjs, seo, legal, privacy, gdpr, sitemap]

requires:
  - phase: 01-foundation-themes-consent
    provides: lib/consent.ts TCF v2.2 consent decision module, PostHogProvider.tsx consent gating, Google CMP script in app/layout.tsx
provides:
  - "/privacy static page describing ParseForge's actual data handling"
  - "/terms static page with individual-operator, California-law terms of service"
  - Footer links to both from the landing page
  - Sitemap entries for both routes
  - Closed-out privacy-policy-page todo
affects: [phase-04-monetization-adsense]

actuals:
  tokens: 5519
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Static legal pages follow the app/guides/*/page.tsx pattern: Metadata export with param-free canonical, BreadcrumbList JSON-LD, prose-custom article layout"

key-files:
  created:
    - app/privacy/page.tsx
    - app/terms/page.tsx
  modified:
    - app/components/LandingHero.tsx
    - app/sitemap.ts
    - .planning/todos/completed/privacy-policy-page.md

key-decisions:
  - "Ran the plan directly on main (per orchestrator's sequential_execution instructions), not a growth/* branch, since this session has no worktree isolation and the harness explicitly scoped work to branch main"
  - "Privacy policy prose sourced entirely from lib/consent.ts, PostHogProvider.tsx, and app/layout.tsx (read during planning) rather than boilerplate — every third-party name and behavior claim traces to a real code path"

requirements-completed: [TODO-privacy-policy-page]

coverage:
  - id: D1
    description: "/privacy loads and accurately documents WCL processing, Upstash caching, PostHog consent gating, Google CMP/AdSense, Vercel, Wowhead"
    requirement: "TODO-privacy-policy-page"
    verification:
      - kind: other
        ref: "curl http://127.0.0.1:3987/privacy (dev server)"
        status: pass
    human_judgment: true
    rationale: "Automated checks confirm the page renders 200 and contains required structural markers (BreadcrumbList, canonical, contact, date), but whether the prose is accurate and readable is a judgment call the plan's accuracy rule assigns to a human reviewer familiar with the actual consent/caching code."
  - id: D2
    description: "/terms loads with plain-language ToS naming individual operator and California governing law"
    requirement: "TODO-privacy-policy-page"
    verification:
      - kind: other
        ref: "curl http://127.0.0.1:3987/terms (dev server)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Landing-page footer links both pages via next/link"
    verification:
      - kind: other
        ref: "grep -c 'href=\"/privacy\"' app/components/LandingHero.tsx; grep -c 'href=\"/terms\"' app/components/LandingHero.tsx"
        status: pass
    human_judgment: false
  - id: D4
    description: "Sitemap includes both routes without disturbing the getRecentReports/DEMO_REPORT pipeline"
    verification:
      - kind: other
        ref: "grep -F -c '${BASE}/privacy' app/sitemap.ts; grep -c 'getRecentReports(10_000)' app/sitemap.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Todo moved to completed with resolved marker"
    verification:
      - kind: other
        ref: "test -f .planning/todos/completed/privacy-policy-page.md && grep -c 'resolved: 260906-kzw' ..."
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-09-06
status: complete
---

# Phase quick-260906-kzw Plan 01: Privacy & Terms Pages Summary

**Shipped `/privacy` and `/terms` static pages whose prose traces directly to `lib/consent.ts`/`PostHogProvider.tsx`/`app/layout.tsx`, linked them from the landing footer, added both to the sitemap, and closed the pending privacy-policy-page todo.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-06T15:05:00Z (approx)
- **Completed:** 2026-09-06T15:30:00Z (approx)
- **Tasks:** 3
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- `/privacy` — nine-section privacy policy covering who operates ParseForge, what data is processed (WCL report data, Upstash caching, `pf:recent_reports`), PostHog analytics with TCF v2.2 consent gating, Google CMP/future AdSense, named third parties (Warcraft Logs, Google, PostHog, Vercel, Upstash, Wowhead), GDPR/CCPA rights, children's privacy, and a change-notice section.
- `/terms` — nine-section terms of service covering the free/"as is" service, Blizzard/Warcraft Logs non-affiliation, informational-only analysis with no accuracy warranty, acceptable use, limitation of liability, California governing law, and contact.
- Landing-page footer (`LandingHero.tsx`) now links `/privacy` and `/terms` via `next/link`, styled to match the existing muted footer.
- `app/sitemap.ts` `STATIC_ROUTES` gained both URLs at `changeFrequency: "yearly"`, `priority: 0.3`, placed after the guides entries and before the demo-report entry; the `getRecentReports`/`DEMO_REPORT` pipeline is byte-identical.
- The pending `.planning/todos/pending/privacy-policy-page.md` todo is now `.planning/todos/completed/privacy-policy-page.md` with `resolved: 260906-kzw` in its frontmatter, recorded as a git rename.

## Task Commits

Each task was committed atomically on `main`:

1. **Task 1: Create the /privacy and /terms static pages** - `36c003c` (feat)
2. **Task 2: Link both pages from the footer and add them to the sitemap** - `bb816bb` (feat)
3. **Task 3: Close out the privacy-policy-page todo** - `2402303` (docs)
4. **Fix-up: stage missed `resolved` frontmatter line** - `8dc7673` (fix, see Deviations)

## Files Created/Modified

- `app/privacy/page.tsx` - New static server component; privacy policy prose, `Metadata`/canonical, `BreadcrumbList` JSON-LD
- `app/terms/page.tsx` - New static server component; terms of service prose, `Metadata`/canonical, `BreadcrumbList` JSON-LD
- `app/components/LandingHero.tsx` - Added `next/link` imports and two footer links (Privacy · Terms)
- `app/sitemap.ts` - Added two `STATIC_ROUTES` entries for `/privacy` and `/terms`
- `.planning/todos/completed/privacy-policy-page.md` - Moved from `pending/`, added `resolved: 260906-kzw`

## Decisions Made

- Executed directly on `main` rather than a `growth/*` feature branch: the orchestrator's `sequential_execution` instructions for this session explicitly scoped work to "the main working tree (branch `main`)" with no worktree isolation, which supersedes the plan's generic `commit_guidance` suggestion of a feature branch.
- Kept every factual claim in the privacy policy traceable to the plan's `<facts_established_from_code>` block and the three referenced source files — no invented cookie categories, retention schedules, or DPO language.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 3 commit landed the todo rename without the `resolved` frontmatter line**
- **Found during:** Post-commit self-check (comparing `git show HEAD:<file>` against the working-tree file)
- **Issue:** `git add` for the completed todo ran after the in-place `Edit` that appended `resolved: 260906-kzw`, but the resulting commit (`2402303`) captured only the pending→completed rename — the frontmatter addition wasn't staged. Root cause not fully diagnosed; treated as a staging-order slip rather than an Edit-tool failure, since the working tree had the correct content both before and after the commit.
- **Fix:** Re-staged the file and created a new commit (`8dc7673`) adding the missing line. Verified via `git show HEAD:<file>` that the committed blob now matches the working tree.
- **Files modified:** `.planning/todos/completed/privacy-policy-page.md`
- **Verification:** `git show HEAD:.planning/todos/completed/privacy-policy-page.md | grep resolved` returns the line; `git status --short` shows no pending diff on the file.
- **Committed in:** `8dc7673`

---

**Total deviations:** 1 auto-fixed (1 blocking — commit didn't match intended state)
**Impact on plan:** No scope creep; corrects an execution-process slip, not a code defect. All plan acceptance criteria for Task 3 now hold against the committed state, not just the working tree.

## Issues Encountered

- The plan's own `<verify>` grep patterns for `app/sitemap.ts` (e.g. `grep -c '${BASE}/privacy' app/sitemap.ts`) return `0` under this environment's default (non-`-F`) `grep` due to a BRE quirk with the `${...}` literal — re-running the identical check with `grep -F` confirms both lines are present (count 1 each). This is a pre-existing quirk in how the verify command was phrased, not a defect in the implementation; documenting here so a future run of the same command isn't mistaken for a regression.

## User Setup Required

None - no external service configuration required. One manual follow-up remains for the user (not part of this change, not a code/config task): after the next production deploy, paste `https://parseforge.gg/privacy` into AdSense → Privacy & messaging → European regulations → message → site settings to clear the "missing privacy policy" warning.

## Next Phase Readiness

- `/privacy` and `/terms` are live, indexable, and linked — the AdSense CMP privacy-policy-URL blocker for Phase 4 monetization is now unblockable (pending the manual AdSense dashboard step above).
- No blockers for continuing Phase 01 execution (currently at plan 4 of 9 per STATE.md).

---
*Phase: quick-260906-kzw*
*Completed: 2026-09-06*

## Self-Check: PASSED

All created/modified files confirmed present on disk; all four commit hashes (36c003c, bb816bb, 2402303, 8dc7673) confirmed in git log; `git show HEAD:.planning/todos/completed/privacy-policy-page.md` confirmed to contain `resolved: 260906-kzw`.
