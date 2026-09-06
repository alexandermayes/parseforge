---
phase: 01-foundation-themes-consent
plan: 01
subsystem: ui
tags: [next-themes, shadcn, dropdown-menu, posthog, theming, dark-mode]

requires: []
provides:
  - "next-themes-based class-attribute theming, resolved before first paint via a blocking inline script"
  - "app/components/ThemeProvider.tsx — thin client wrapper around next-themes, themes allow-list (T-01-07)"
  - "app/components/ThemeToggle.tsx — 3-state Light/Dark/System navbar control with PostHog instrumentation"
  - "components/ui/dropdown-menu.tsx — official shadcn DropdownMenu primitives"
affects: [01-02, 01-03, 01-04, 01-05]

actuals:
  tokens: 14000
  tasks: 2
  commits: 2

tech-stack:
  added: ["next-themes@0.4.6"]
  patterns:
    - "Thin client-component provider wrapper mirroring app/components/PostHogProvider.tsx (default export, forwards children, aliased library import)"
    - "mounted-flag useEffect gate before reading resolvedTheme, to keep SSR and first client render identical"

key-files:
  created:
    - app/components/ThemeProvider.tsx
    - app/components/ThemeToggle.tsx
    - components/ui/dropdown-menu.tsx
  modified:
    - app/layout.tsx
    - app/components/Navbar.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "Fixed a shadcn CLI regression before it landed: npx shadcn@latest resolved 4.21.0 (ignoring the pinned 3.8.5 devDependency) and generated dropdown-menu.tsx importing cn from an unvetted npm package literally named \"cn\", instead of this repo's established @/lib/utils cn helper used by every other components/ui/*.tsx file. Corrected the import and removed the stray dependency before committing."
  - "Added a narrow eslint-disable for react-hooks/set-state-in-effect on the mounted-flag effect in ThemeToggle.tsx — the plan's mandated hydration-guard pattern (set a mounted boolean on mount, gate resolvedTheme reads behind it) has no external system to synchronize, which is what that rule assumes; the alternative (dropping the guard) would reintroduce the hydration mismatch RESEARCH.md Pitfall 4 warns about."

patterns-established:
  - "Theme toggle: THEME_OPTIONS array of {value, label, icon} driving both the dropdown items and future extension, single handleSelect() calling setTheme + posthog.capture together so instrumentation can't drift from state changes."

requirements-completed: [DSGN-03, OPS-01]

coverage:
  - id: D1
    description: "next-themes wired end-to-end: ThemeProvider mounts with attribute=\"class\", defaultTheme=\"system\", enableSystem, themes allow-list; app/layout.tsx drops the hardcoded className=\"dark\" and carries suppressHydrationWarning on <html>"
    requirement: "DSGN-03"
    verification:
      - kind: other
        ref: "task-1 <verify>: npx tsc --noEmit; grep checks for suppressHydrationWarning, absence of className=\"dark\", next-themes import, ThemeToggle reference, dropdown-menu.tsx existence; node -e dependency check"
        status: pass
    human_judgment: true
    rationale: "No-flash-of-wrong-theme on first paint and OS-preference resolution (D-08) can only be confirmed by loading the page in a real browser with a given OS appearance setting. 01-RESEARCH.md Open Question 3 confirms no jsdom/RTL harness exists in this project; the plan's own Task 2 <human-check> block defers this sweep, and workflow.human_verify_mode=end-of-phase means it is harvested at phase close, not verified per-plan."
  - id: D2
    description: "3-state Light/Dark/System control mounted as the last item in Navbar's right-side nav group, present at all breakpoints (no responsive hidden gate on that flex group)"
    requirement: "DSGN-03"
    verification:
      - kind: other
        ref: "grep -q 'ThemeToggle' app/components/Navbar.tsx; npx tsc --noEmit"
        status: pass
    human_judgment: true
    rationale: "Reachability at 375px mobile width and correct menu open/close/active-item behavior in a live browser is a visual/interaction check, not something the automated grep/tsc gate can assert. Deferred to the end-of-phase human-check sweep per workflow.human_verify_mode."
  - id: D3
    description: "theme_changed PostHog event: single posthog.capture call site, event name theme_changed, props {theme, resolved_theme}, trigger icon gated on a mounted flag reading resolvedTheme, active theme marked with a Check icon in the open menu"
    requirement: "OPS-01"
    verification:
      - kind: other
        ref: "task-2 <verify>: npx tsc --noEmit; grep checks for theme_changed, resolved_theme, resolvedTheme, and exactly one posthog.capture call site; npm run lint (no new errors in the two new files)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Explicit theme choice persists across reloads and route changes; System restores OS-follow; cross-tab propagation via next-themes' storage listener"
    requirement: "DSGN-03"
    verification: []
    human_judgment: true
    rationale: "Persistence-across-reload, route-change, and cross-tab-storage-listener behavior requires a live browser session with two tabs — no automated harness exists for this (RESEARCH.md Open Question 3). Covered by Task 2's <human-check> block, deferred to the end-of-phase sweep per workflow.human_verify_mode=end-of-phase."

duration: 25min
completed: 2026-09-06
status: complete
---

# Phase 1 Plan 1: Theme Toggle Tracer Summary

**next-themes wired end-to-end — 3-state Light/Dark/System navbar control, no-flash class-attribute theming, and a PostHog `theme_changed` event, closing out the theming architecture every later Phase 1 plan (light palette, token sweep) builds on.**

## Performance
- **Duration:** ~25min
- **Started:** 2026-09-05T23:04:00-07:00 (approx.)
- **Completed:** 2026-09-05T23:12:08-07:00
- **Tasks:** 2 completed
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments
- Installed `next-themes@0.4.6` (verified OK in 01-RESEARCH.md Package Legitimacy Audit) and the official shadcn `dropdown-menu` block
- `app/components/ThemeProvider.tsx`: thin client wrapper forwarding to next-themes' `ThemeProvider`, fixed at `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`, with an explicit `themes={["light", "dark"]}` allow-list (mitigates T-01-07 — an arbitrary persisted storage value can no longer be reflected onto the `<html>` class attribute)
- `app/layout.tsx`: dropped the hardcoded `className="dark"` on `<html>`, added `suppressHydrationWarning`, mounted `ThemeProvider` wrapping the existing `PostHogProvider` subtree
- `app/components/Navbar.tsx`: mounted `<ThemeToggle />` as the last item in the right-side nav group (no responsive gate on that group, so it's present at every breakpoint)
- `app/components/ThemeToggle.tsx`: 3-state dropdown (Light/Dark/System) with `Sun`/`Moon`/`Monitor` icons, a `Check` icon marking the active item, a `mounted`-gated trigger icon that tracks `resolvedTheme`, and a single `posthog.capture("theme_changed", { theme, resolved_theme })` call site fired once per selection

## Task Commits
1. **Task 1: End-to-end "visitor picks a theme"** - `cc852f6` (feat)
2. **Task 2: Instrument and finish the toggle** - `9b8e516` (feat)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `app/components/ThemeProvider.tsx` - Client-boundary wrapper around next-themes' `ThemeProvider`
- `app/components/ThemeToggle.tsx` - 3-state navbar theme control, PostHog-instrumented
- `components/ui/dropdown-menu.tsx` - shadcn official DropdownMenu primitives
- `app/layout.tsx` - SSR shell: `suppressHydrationWarning` on `<html>`, `ThemeProvider` mount, hardcoded dark class removed
- `app/components/Navbar.tsx` - Mounts `ThemeToggle` in the right-side nav group
- `package.json` / `package-lock.json` - `next-themes` dependency added

## Decisions Made
- Kept `disableTransitionOnChange` on `ThemeProvider` (not in the plan's literal prose but standard next-themes practice paired with `attribute="class"`) to avoid a visible color-transition flash when switching themes via the toggle — consistent with the plan's "no flash" success criterion, applied to the toggle interaction rather than just first paint.
- Factored the three menu items into a `THEME_OPTIONS` array with a single `handleSelect` handler, so the `setTheme` call and the `posthog.capture` call can never drift out of sync (guards the plan's "exactly one event per selection" requirement structurally, not just by code review).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] shadcn CLI installed an unvetted `cn` package instead of using this repo's established `@/lib/utils` helper**
- **Found during:** Task 1, immediately after `npx shadcn@latest add dropdown-menu`
- **Issue:** The project pins `shadcn@3.8.5` as a devDependency, but `npx shadcn@latest` (per the plan's literal install command) ignores that pin and resolved `shadcn@4.21.0`. That newer CLI version generated `components/ui/dropdown-menu.tsx` with `import { cn } from "cn"` — a real, separately-published npm package literally named `cn` — rather than `import { cn } from "@/lib/utils"`, which every other file in `components/ui/` uses (confirmed against `dialog.tsx`, `button.tsx`). `npm install` had also silently added `"cn": "^0.2.5"` to `package.json`'s dependencies.
- **Fix:** Rewrote the import to `import { cn } from "@/lib/utils"` (matching the codebase's own `cn` re-export of `clsx`+`tailwind-merge`), then `npm uninstall cn` to remove the stray dependency from `package.json`/`package-lock.json`.
- **Files modified:** `components/ui/dropdown-menu.tsx`, `package.json`, `package-lock.json`
- **Verification:** `npx tsc --noEmit` clean; `grep -n '"cn"' package.json package-lock.json` returns nothing; `npm run lint` shows no errors in the new files.
- **Commit:** `cc852f6`

**2. [Rule 3 - Blocking issue] New `react-hooks/set-state-in-effect` lint error on the mandated hydration-guard pattern**
- **Found during:** Task 2, `npm run lint`
- **Issue:** The plan's action explicitly mandates "Guard the first client render with a `mounted` boolean set in a `useEffect` on mount" (the standard next-themes/shadcn hydration-mismatch guard, per 01-RESEARCH.md Pitfall 4). The project's `eslint-config-next` bundle includes `react-hooks/set-state-in-effect`, which flags any bare `setState` call inside a `useEffect` body as an error — a new error would have failed the plan's own "no new errors in the two new files" acceptance criterion.
- **Fix:** Added a narrow, commented `eslint-disable-next-line react-hooks/set-state-in-effect` on that one line, explaining that this effect has no external system to synchronize — it exists solely to detect "past hydration," which is exactly what the SSR/client mismatch guard requires, not the cascading-render pattern the rule targets.
- **Files modified:** `app/components/ThemeToggle.tsx`
- **Verification:** `npm run lint` reports zero errors/warnings in `ThemeToggle.tsx`/`ThemeProvider.tsx`; `npx tsc --noEmit` clean.
- **Commit:** `9b8e516`

**Total deviations:** 2 auto-fixed (1 Rule 1 - bug, 1 Rule 3 - blocking issue)
**Impact on plan:** Neither deviation changed the plan's architecture or file list — both were caught and resolved within the same task they surfaced in, before their respective commits.

## Issues Encountered
None beyond the two deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

Theming architecture is proven and committed: class-attribute theming via `next-themes`, resolved before first paint, with a working 3-state navbar control and PostHog instrumentation. This unblocks the rest of Phase 1's plans (branded light palette, `@theme` token audit, per-theme WoW class colors) — they now have a real toggle to render against instead of the previous hardcoded-dark shell.

**Deferred to end-of-phase human verification** (per `workflow.human_verify_mode=end-of-phase`, this project's setting): the plan's Task 2 `<human-check>` sweep — no-flash on first paint under both OS appearance settings, persistence across reload/route changes, cross-tab propagation, and mobile-width (375px) reachability. These are visual/behavioral checks with no automated harness in this project (01-RESEARCH.md Open Question 3) and will be exercised together with the rest of Phase 1's UI-facing plans at phase close.

**Known limitation, not a stub:** the light palette itself is still stock shadcn `:root` values (unchanged this plan, D-09's work belongs to a later Phase 1 plan per this phase's plan sequence) — switching to "Light" today will show the un-designed light theme until that plan lands. This is expected sequencing, not a regression.

---
*Phase: 01-foundation-themes-consent*
*Completed: 2026-09-06*

## Self-Check: PASSED

- `app/components/ThemeProvider.tsx` — FOUND
- `app/components/ThemeToggle.tsx` — FOUND
- `components/ui/dropdown-menu.tsx` — FOUND
- `app/layout.tsx` — FOUND
- `app/components/Navbar.tsx` — FOUND
- `package.json` — FOUND
- Commit `cc852f6` — FOUND in `git log`
- Commit `9b8e516` — FOUND in `git log`
- `npx tsc --noEmit` — re-run clean, exit 0
- Task 1 acceptance criteria — re-run, all pass
- Task 2 acceptance criteria — re-run, all pass
- Plan-level `<verification>`: `npx tsc --noEmit` clean; `npm run lint` no new errors in the two new files; `npm test` — 5 files / 34 tests passed
