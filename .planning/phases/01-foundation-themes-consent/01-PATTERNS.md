# Phase 1: Foundation — Themes & Consent - Pattern Map

**Mapped:** 2026-09-05
**Files analyzed:** 10
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/layout.tsx` | config/provider-mount | request-response (SSR shell) | `app/layout.tsx` (self, edited in place) | exact |
| `app/components/ThemeProvider.tsx` (new) | provider | event-driven (client state) | `app/components/PostHogProvider.tsx` | role-match (thin client provider wrapper) |
| `app/components/PostHogProvider.tsx` (edited) | provider | event-driven (consent listener → SDK calls) | itself (existing `useEffect` init block) | exact |
| `app/components/Navbar.tsx` (edited) | component | request-response (UI toggle) | itself (existing `Dialog`/`Button` trigger pattern) | exact |
| `lib/consent.ts` (new) | utility | transform (pure function, `tcData` → decision) | `lib/url-parser.ts` | exact (pure function module, no I/O, single responsibility) |
| `lib/consent.test.ts` (new) | test | transform | `lib/url-parser.test.ts` | exact (vitest, `describe`/`it`/`expect`, table-style cases) |
| `app/globals.css` (edited) | config | transform (CSS tokens) | itself (existing `@theme inline` / `:root` / `.dark` blocks) | exact |
| `lib/constants.ts` (edited) | config/utility | transform (color/token lookup) | itself (`CLASS_COLORS`, `GRADE_COLORS`, `percentileColor`/`percentileBg`) | exact |
| `next.config.ts` (edited) | config | request-response (headers) | itself (existing `CSP_REPORT_ONLY` array) | exact |
| Consumers of `CLASS_COLORS`/`ROLE_COLORS` (edited, e.g. `RaidOverview.tsx`) | component | transform (inline `style` color resolution) | `app/components/RaidOverview.tsx` lines 244-394 | exact |

## Pattern Assignments

### `app/layout.tsx` (config, request-response — SSR shell)

**Analog:** itself, current state

**Imports pattern** (lines 1-8):
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import PostHogProvider from "./components/PostHogProvider";
```
Add `import ThemeProvider from "./components/ThemeProvider";` alongside these — same flat, non-barrel import convention.

**Current shell to replace** (lines 90-113):
```tsx
<html lang="en" className="dark">
  <head>
    <Script id="wowhead-config" strategy="beforeInteractive">
      {`const whTooltips = {...};`}
    </Script>
    <Script src="https://wow.zamimg.com/js/tooltips.js" strategy="afterInteractive" />
  </head>
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background bg-noise`}>
    <PostHogProvider>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16">{children}</div>
    </PostHogProvider>
    <Analytics />
    <SpeedInsights />
  </body>
</html>
```
Per RESEARCH.md Pattern 2 and Pitfall 4: replace `className="dark"` with `suppressHydrationWarning` on `<html>`, wrap `PostHogProvider`'s children in `ThemeProvider` (or vice versa — either nesting order works since they don't depend on each other), and add the Google CMP `<Script>` tag in `<head>` next to the existing Wowhead scripts (same `next/script` component, same `strategy` prop convention already used for `wowhead-config`/tooltips).

**Error handling:** N/A — server component, no try/catch needed; errors-as-data pattern doesn't apply here (this file has no branching failure states).

---

### `app/components/ThemeProvider.tsx` (new — provider, event-driven)

**Analog:** `app/components/PostHogProvider.tsx` (thin client-component provider wrapper pattern)

**Imports pattern** (from analog lines 1-6):
```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";
```

**Core pattern** — mirror the analog's "thin re-export wrapper" shape (`PostHogProvider` wraps `PHProvider` from the library and forwards `children`):
```tsx
export default function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}
```
Match the analog's convention: default export for the wrapper component, named import aliasing for the underlying library provider (same style as `PHProvider` alias for `PostHogProvider` from `posthog-js/react`).

---

### `app/components/PostHogProvider.tsx` (edited — provider, event-driven)

**Analog:** itself — extend the existing `useEffect` init block, don't restructure the file

**Current init pattern to extend** (lines 26-54):
```tsx
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    posthog.init(POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: "https://us.i.posthog.com",
      person_profiles: "always",
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: false,
      session_recording: { maskAllInputs: true },
      enable_recording_console_log: false,
      autocapture: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    });
  }, []);
  ...
```
Per RESEARCH.md Code Examples block: add `cookieless_mode: "on_reject"`, flip `disable_session_recording` to `true` (replay starts explicitly, not by default), and inside `loaded`, register the `__tcfapi` listener that calls the new `lib/consent.ts` decision function and then `ph.opt_in_capturing()` / `ph.startSessionRecording()` / nothing, per the derived action. Keep `maskAllInputs: true` untouched (RESEARCH.md Security Domain: must not regress).

**TODO comment being resolved** (line 46-47): `// TODO: serving EU users with session replay ultimately needs a consent banner` — remove this comment once the listener is wired; it documents exactly the gap this file's edit closes.

**Event capture pattern to reuse** — no existing `posthog.capture()` call site with custom props exists in this file yet (`PostHogPageView` only calls `ph.capture("$pageview", { $current_url: url })` at line 20); follow that same two-arg shape (`event name string`, flat props object) for new `posthog.capture("consent_resolved", { accepted, region })` and theme-toggle events, keeping snake_case event names per CONTEXT.md's discretion note.

---

### `app/components/Navbar.tsx` (edited — component, request-response)

**Analog:** itself — existing `Dialog`/`Button`/`useState` pattern for the "How It Works" trigger (lines 112-118, 56-59)

**Imports to add** (existing block, lines 1-15, extend with):
```tsx
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react"; // matches existing lucide-react icon imports (line 7)
```

**State pattern to mirror** (line 59): `const [open, setOpen] = useState(false);` — same local-`useState` convention for a 3-state toggle (e.g. cycling `theme` via `setTheme`).

**Placement convention** (lines 74-117): new toggle icon slots into the existing `<div className="flex items-center gap-4">` right-side nav group, alongside the `Dialog`/`Button` trigger — same flat sibling-element style, no new wrapper needed. Must render on the same breakpoint as everything else in that div (CONTEXT.md D-10: "Visible on every route including mobile" — this div has no `hidden sm:flex` gating today, so no extra responsive work needed unless the icon needs its own compact mobile treatment).

**Styling convention**: reuse `text-xs text-muted-foreground hover:text-foreground transition-interactive` (line 78) or `hover:text-gold-from` (line 91) for hover states — matches sibling nav links.

---

### `lib/consent.ts` (new — utility, transform)

**Analog:** `lib/url-parser.ts` (pure function module: typed input → typed output, no I/O, JSDoc above each exported function, `null`/undefined narrow returns instead of throwing)

**Imports pattern** (analog line 4, adapted):
```typescript
// No imports needed if types are colocated; otherwise:
// import type { TCData } from "./consent-types"; // only if a types file is warranted
```
Analog has zero external imports (pure logic) — `lib/consent.ts` should follow the same: type the `__tcfapi` global inline (per RESEARCH.md Pattern 1's `declare global` block) rather than importing a heavy TCF types package.

**Core transform pattern** (mirrors analog's `parseWCLUrl` — single exported function, internal helper, comment above explaining the domain quirk):
```typescript
/**
 * Derive the PostHog consent action from a resolved TCF `tcData` payload.
 * Non-EEA/UK visitors (`gdprApplies === false`) must resolve to "opt-in-non-eea"
 * immediately — never left pending — to avoid cookieless_mode silently
 * degrading their analytics (see RESEARCH.md Pitfall 1).
 */
export function deriveConsentAction(tcData: {
  gdprApplies: boolean;
  eventStatus: string;
}): "opt-in-full" | "cookieless" | "opt-in-non-eea" | "pending" {
  if (!tcData.gdprApplies) return "opt-in-non-eea";
  if (tcData.eventStatus !== "tcloaded" && tcData.eventStatus !== "useractioncomplete") {
    return "pending";
  }
  // ...derive accepted/rejected from tcData purpose-consent fields (Open Question 1)
  return "cookieless";
}
```
**Error handling:** analog returns `null` on unparseable input rather than throwing (line 78: `return null;`); `consent.ts` should follow the same discriminated-return convention (`"pending"` as the "couldn't resolve yet" case) rather than throwing.

---

### `lib/consent.test.ts` (new — test, transform)

**Analog:** `lib/url-parser.test.ts`

**Full structural pattern** (lines 1-9):
```typescript
import { describe, it, expect } from "vitest";
import { deriveConsentAction } from "./consent";

describe("deriveConsentAction", () => {
  it("opts in immediately for non-EEA/UK visitors", () => {
    expect(deriveConsentAction({ gdprApplies: false, eventStatus: "tcloaded" })).toBe(
      "opt-in-non-eea",
    );
  });
  // ...one `it()` per case: EEA-accept, EEA-reject, EEA-pending, non-EEA — matches
  // analog's one-scenario-per-case style (bare report code, hash-style, query-style, etc.)
});
```
Run via `npx vitest run lib/consent.test.ts` per RESEARCH.md Validation Architecture table.

---

### `app/globals.css` (edited — config, transform)

**Analog:** itself — extend the existing `@theme inline` block (lines 7-111) and redesign the existing `:root` block (lines 113-162)

**Token category pattern to add** (per RESEARCH.md Code Examples, matching existing token-naming convention `--color-*`/`--radius-*` at lines 8-47):
```css
@theme inline {
  /* ...existing tokens unchanged... */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 350ms;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-card: 0 1px 3px oklch(0 0 0 / 12%), 0 1px 2px oklch(0 0 0 / 8%);
  --shadow-elevated: 0 4px 6px oklch(0 0 0 / 15%), 0 2px 4px oklch(0 0 0 / 10%);
}
```
**De-duplication note:** `.surface-card`/`.surface-card-elevated` classes (lines 333-347, not shown above but confirmed in RESEARCH.md) already hand-write these exact shadow values — migrate those literal declarations to reference the new `--shadow-*` tokens instead of introducing a parallel value.

**`:root` redesign** (lines 113-162): every value here is unmodified stock shadcn oklch (e.g. `--background: oklch(1 0 0)`, `--foreground: oklch(0.145 0 0)`) — D-09 requires replacing these with a branded light palette, following the same oklch-with-comment-conventions style already used in the `.dark` block (lines 164-212) which pairs each brand token (`--gold-from`, `--surface-0`, `--status-good`, etc.) across both blocks identically. New light values must keep the same key set as `.dark` (no missing/extra custom properties between the two blocks).

**Class-color tokenization (D-12)** — new pattern, no direct existing analog for per-theme raw-hex tokens; extend `:root`/`.dark` with `--class-*` paired custom properties following the exact same block-pairing convention as `--gold-from` etc.:
```css
:root {
  /* ... */
  --class-priest: oklch(0.3 0.01 270); /* tuned for legibility on light bg, D-12 */
}
.dark {
  /* ... */
  --class-priest: oklch(0.98 0 0); /* unchanged from current CLASS_COLORS.Priest = #FFFFFF */
}
```

---

### `lib/constants.ts` (edited — config/utility, transform)

**Analog:** itself — `CLASS_COLORS` (lines 1-13), `ROLE_COLORS` (lines 201-206), `GRADE_COLORS`/`percentileColor`/`percentileBg` (lines 322-344+)

**Current raw-hex pattern to replace** (lines 1-13):
```typescript
export const CLASS_COLORS: Record<string, string> = {
  Warrior: "#C79C6E",
  Paladin: "#F58CBA",
  // ...
};
```
Per RESEARCH.md Anti-Patterns: these are consumed via inline `style={{ color: ... }}`, not `className` — migrate to `var(--class-*)` string values (CSS custom properties resolved by the active theme scope), not Tailwind utility classes:
```typescript
export const CLASS_COLORS: Record<string, string> = {
  Warrior: "var(--class-warrior)",
  Paladin: "var(--class-paladin)",
  // ...
};
```
Same treatment for `ROLE_COLORS` (lines 201-206, same `Record<X, string>` hex-map shape).

**Current class-returning-function pattern to replace** (lines 322-344):
```typescript
export const GRADE_COLORS: Record<PerformanceGrade, string> = {
  S: "text-amber-400 bg-amber-400/20 border-amber-400/30",
  // ...
};
export function percentileColor(p: number): string {
  if (p >= 99) return "text-amber-400";
  // ...
}
```
Unlike `CLASS_COLORS`, these return Tailwind class-name strings consumed via `className` — migrate to semantic-token class names (e.g. `text-status-good`, per the existing `--color-status-good` token already defined in `globals.css` line 62-65) rather than CSS vars, following the discriminated remediation split RESEARCH.md Pitfall 3 specifies: raw-hex-via-`style` → CSS var; Tailwind-class-via-`className` → semantic token class.

**Exception to preserve, do not touch:** `app/og/route.tsx`'s own hardcoded hex mirror of `GRADE_COLORS` — RESEARCH.md confirms this is a documented, legitimate exception (Satori/`next/og` can't resolve CSS vars); leave its inline comment and hex values as-is.

---

### Consumers of `CLASS_COLORS`/`ROLE_COLORS` (edited — component, transform)

**Analog:** `app/components/RaidOverview.tsx` lines 244-394 (representative; same lookup pattern repeats in `CLABuffComparison.tsx`, `PlayerSelector.tsx`, `PlayerAccordionRow.tsx`, `CLABuffTable.tsx`, `RoleBadge.tsx`, `AnalysisView.tsx`, `PlayerQuickGrid.tsx`, `ReportSummary.tsx` — 9 files total per RESEARCH.md)

**Current lookup pattern** (lines 246, 361, 393):
```tsx
const classColor = CLASS_COLORS[h.className] ?? "#FFFFFF";
```
No change needed to this call site itself once `CLASS_COLORS` values become `var(--class-*)` strings — the lookup + `style={{ color: classColor }}` consumption pattern (wherever it appears downstream of these lines) is unaffected; the CSS var resolves at paint time per the active `.dark`/`:root` scope. Confirm the `?? "#FFFFFF"` fallback literal is either also replaced with a `var(--class-*)` default or documented as an intentional fallback exception (Priest's `CLASS_COLORS` value maps to the same white in both themes today, so this is likely fine to leave as a literal fallback, not a regression).

## Shared Patterns

### PostHog consent gating (single init point)
**Source:** `app/components/PostHogProvider.tsx` (existing `useEffect`/`posthog.init` block, lines 27-54)
**Apply to:** All consent-related wiring — do not create a second `posthog.init()` call anywhere else; the "single PostHog init point" convention (per RESEARCH.md Architectural Responsibility Map) means the `__tcfapi` listener, `lib/consent.ts` calls, and `opt_in_capturing`/`startSessionRecording` calls all live inside this one file's `loaded` callback.

### Discriminated-union / errors-as-data
**Source:** `lib/url-parser.ts` (`parseWCLUrl` returns `ParsedWCLUrl | null`, no throws)
**Apply to:** `lib/consent.ts`'s `deriveConsentAction` — return a narrow string-literal union (`"opt-in-full" | "cookieless" | "opt-in-non-eea" | "pending"`) instead of throwing or returning `undefined`; matches the project-wide convention (also seen in `lib/report-meta.ts`'s `status: "ok" | "not_found" | "private" | "error"` per CLAUDE.md).

### `@theme` token extension, not replacement
**Source:** `app/globals.css` existing `@theme inline` block (lines 7-111)
**Apply to:** All new spacing/motion/elevation tokens — append inside the same block using the same `--category-name: value;` naming convention already established for `--color-*`/`--radius-*`, never a second `@theme` block or a separate CSS file.

### snake_case PostHog event naming
**Source:** `app/components/PostHogProvider.tsx` line 20 (`ph.capture("$pageview", { $current_url: url })`)
**Apply to:** New `consent_resolved`, `theme_changed` (or similar) events — flat props object, snake_case keys, per CONTEXT.md's explicit instruction to follow existing conventions.

## No Analog Found

None — every file in scope has at least a role-match analog in the existing codebase. The one genuinely new pattern (`--class-*` CSS-custom-property pairing for D-12) has no direct precedent but follows the same paired-block convention `--gold-from`/`--surface-0`/`--status-good` already establish across `:root`/`.dark`.

## Metadata

**Analog search scope:** `app/`, `app/components/`, `lib/`, `app/analyze/[reportCode]/`, `app/og/`, root config files (`next.config.ts`, `app/globals.css`)
**Files scanned:** `app/layout.tsx`, `app/components/PostHogProvider.tsx`, `app/components/Navbar.tsx`, `app/globals.css`, `lib/constants.ts`, `next.config.ts`, `lib/url-parser.ts`, `lib/url-parser.test.ts`, plus a grep across 9 `CLASS_COLORS`/`ROLE_COLORS` consumer components
**Pattern extraction date:** 2026-09-05
