# Phase 1 — Deferred Items (out of scope, not fixed)

Logged per the executor's scope-boundary rule: issues discovered during execution that are
unrelated to the current task's files are recorded here, not auto-fixed.

## `npm run lint` reports ~1101 pre-existing errors in `.codex/` and other untracked scaffolding

**Found during:** 01-04 Task 2 verification (`npm run lint`)

**Detail:** `eslint.config.mjs`'s `globalIgnores([...])` call overrides (rather than extends)
`eslint-config-next`'s default ignore list, so ESLint also lints untracked GSD-scaffolding
directories such as `.codex/hooks/**` (require()-style imports flagged by
`@typescript-eslint/no-require-imports`). These files are not part of the application, were not
touched by this plan (`scripts/theme-parity.mjs`, `app/globals.css`, `package.json`), and predate
this plan's execution — confirmed via `git status` (`.codex/` listed as untracked before any 01-04
work began).

**Scoped check performed instead:** `npx eslint scripts/theme-parity.mjs` — exit 0, no findings.

**Not fixed because:** out of scope per the scope-boundary rule ("only auto-fix issues DIRECTLY
caused by the current task's changes"). Fixing would mean either broadening `globalIgnores` to
also ignore `.codex/**` (an ignore-list architecture change unrelated to design tokens) or editing
GSD tooling files outside this plan's file list — both out of scope for a token-audit plan.

**Suggested follow-up:** A future phase (or a standalone `/gsd-quick`) should decide whether
`.codex/`, `.gsd/`, `.impeccable/` etc. belong in `.gitignore`/ESLint ignores, or should be
committed and linted normally.
