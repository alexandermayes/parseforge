# Protected Elements

This is the checklist of share-loop surfaces that a later phase must not cover, displace, or
delete without a deliberate, recorded decision. It exists because two phases already on the
roadmap will touch every route this file names:

- **Phase 4 (Ads Live)** — the ad-placement whitelist must be checked against this file before any
  slot is added near the analyze page. An ad must never cover, push down, or delay a row listed
  here.
- **Phase 7 (Redesign, De-bloat & Hardening)** — the per-route SEO/UX gate must confirm the
  redesign has not removed any element listed here. A redesign may move or restyle a protected
  element; it may not delete it.

This file is both a human document and the input `scripts/protected-elements.mjs` parses
mechanically — the `## DOM attributes` table below is read row-by-row by that script, so its
structure (four columns, one row per attribute) is load-bearing, not just documentation style.

## DOM attributes

Every shipped `data-protected` attribute, drawn from what plans 03-03 and 03-04 actually wrote
(verified by grep against each owner file before this row was recorded):

| Attribute | Owner file | Element | Why protected |
|---|---|---|---|
| `share-header` | `app/analyze/[reportCode]/AnalyzeClient.tsx` | Header "Share" button (report-level permalink) | The one persistent share action on every analyze page — D-13's "header Share stays as the report-level link" |
| `share-player` | `app/components/ComparisonSummary.tsx` | "Share my parse" primary button on the player scorecard | The primary share CTA for SHARE-02 — must stay above the fold and must not be demoted or covered |
| `share-discord` | `app/components/ComparisonSummary.tsx` | "Copy for Discord" secondary button on the player scorecard | The secondary share action D-11 keeps working for guilds pasting inline recap text |
| `awards-panel` | `app/components/RaidOverview.tsx` | Raid tab awards panel (fired award rows) | The SHARE-01 awards surface — D-06's "Raid tab gets an awards panel," first interactive element under the tab header |
| `awards-preview` | `app/components/RaidOverview.tsx` | Inline `<img>` rendering the real `/og?view=awards` preview | D-06's "users see exactly what will unfurl before they paste" — must stay the same image Discord shows, never a separate render |
| `share-awards` | `app/components/RaidOverview.tsx` | "Copy awards link" button beside the awards preview | The SHARE-01 awards share action — D-13 requires it reachable without scrolling past the raid table on mobile |

## Ad slot placements

Every declared `AdSlotId` from `lib/ads.ts` (`AD_SLOTS`), one row per slot. "Owner file" is the file
that *mounts* the slot with this id — for `tbc-audit-end` that's the page, not `AdSlot.tsx` itself
(which only defines the component every slot mounts through):

| Slot id | Owner file | Position | Box (base) | Box (md) |
|---|---|---|---|---|
| `tbc-audit-end` | `app/tbc-audit/page.tsx` | Last child of `<main>`, after the final `<section>` | 300×250 | 336×280 |

1. A slot may only appear in the owner file its row names above — `checkAdSlotOwner` fails if that
   file doesn't mount it exactly once; `checkNoStraySlots` fails if any *other* file mounts it at
   all, which is what catches a slot drifting onto a route this table doesn't name.
2. No slot may appear in a file that owns a `data-protected` element, nor inside a table, nor
   between a share control and the thing it shares. `checkAdSlotContainment` enforces the
   `data-protected` half mechanically (the owner file itself, and a 15-line proximity scan across
   `app/`); the table/share-adjacency half is a human review rule recorded here, not something the
   script can see structurally.
3. A slot's reserved box dimensions in this table are the same numbers `lib/ads.ts`'s `AD_SLOTS`
   declares for that slot id. `checkAdSlotDeclared` treats a disagreement as a gate failure, not a
   documentation nit.

## Route and URL contracts

- The `/og` route (`app/og/route.tsx`) accepts four query params — `report`, `fight`, `source`,
  `view` — and produces three card branches from them: the awards card (`view=awards` with a
  valid `fight`), the player scorecard (`fight` and `source` both valid non-negative integers),
  and the report-level card (every other case, including an invalid or missing `report`). `/og`
  never returns a non-image response — an invalid code, a failed upstream fetch, or a thin award
  set all fall back to the branded `ReportCard`, never an error page or an empty body.
- `lib/share-links.ts` emits exactly three permalink shapes, all param-free of `tab`: the
  report-level link `/analyze/{code}?fight={id}&ref=share` (`buildReportShareUrl`), the
  player-level link `/analyze/{code}?fight={id}&source={id}&ref=parse` (`buildPlayerShareUrl`),
  and the awards link `/analyze/{code}?fight={id}&view=awards&ref=awards`
  (`buildAwardsShareUrl`).
- The analyze page's canonical (`app/analyze/[reportCode]/page.tsx`, `generateMetadata`) carries
  no query string — always the bare `https://parseforge.gg/analyze/{code}` — so every
  `?fight=&source=&view=&ref=` permutation folds into one indexable URL. This is the existing SEO
  invariant this file adds no exception to.
- `generateMetadata` forwards exactly `fight`, `source`, and `view` from the incoming search
  params into the `/og` URL it builds for `openGraph.images`/`twitter.images`, and nothing else —
  `ref` is deliberately never forwarded into the OG URL.

## How this is enforced

`npm run protected-elements` reads the `## DOM attributes` table above and, for each row, checks
that the exact `data-protected="{attribute}"` string is present in the named owner file. It
separately fetches the live route contracts against a base URL (production by default, overridable
with `--base`): the awards, player, and bare report `/og` URLs for the demo report each return a
2xx image response, and the demo report's analyze page canonical is present and carries no `?`.

A third half reads the `## Ad slot placements` table above and enforces it against `lib/ads.ts` and
the component tree: `checkAdSlotDeclared` (the doc row's slot id and box dimensions agree with
`AD_SLOTS`), `checkAdSlotOwner` (the named owner file mounts the slot exactly once),
`checkAdSlotContainment` (the owner file owns no `data-protected` element, and no slot mount sits
within 15 lines of one anywhere under `app/`), and `checkNoStraySlots` (no file outside the table's
owner files mounts a slot at all). It then fetches the raid-audit route and the demo report's
analyze route live and confirms every `data-ad-slot="…"` marker present is one this table names — a
page with none is a pass (ads may be switched off on the base being checked), a page with an unknown
marker is a failure.

This file goes stale in exactly two ways, and both make the gate fail — which is the intended
behaviour, not a bug to work around:

1. An attribute is renamed or removed in code without updating this table — the gate reports that
   row as a failure.
2. A row is added here naming an attribute no file actually carries — the gate reports that row as
   a failure too, so this document can never claim protection it doesn't have.

A missing or empty checklist, or an unreachable base URL, is a fatal error (exit 2) — the gate
never reports a pass when it cannot see its subject.

## Change procedure

Changing or removing a row in the `## DOM attributes` table requires updating three things in the
same change: this file, the component that owns the attribute, and the consuming phase's note in
`.planning/ROADMAP.md` (the Phase 4 and Phase 7 entries that name this file). A row change that
touches only one of the three is incomplete.

Adding or moving a row in the `## Ad slot placements` table requires updating three things together:
this table, `lib/ads.ts`'s `AD_SLOTS` entry for that slot id, and the owner component that mounts it.
A change that touches only one or two of the three is incomplete — `checkAdSlotDeclared` and
`checkAdSlotOwner` exist specifically to catch a change that drifted apart.
