---
phase: 01-foundation-themes-consent
plan: 09
subsystem: infra
tags: [deploy, vercel, ops-01, search-console, posthog, consent, ship-gate]

requires:
  - "01-08: docs/OPS-01-SHIP-GATE.md pre-deploy evidence + seo-invariants gate"
  - "01-02: NEXT_PUBLIC_GOOGLE_CMP_PUB_ID in Vercel production env (dormant until this deploy)"
  - "260906-kzw: /privacy and /terms pages (first shipped by this deploy)"
provides:
  - "Phase 1 live on parseforge.gg — theme toggle, light palette, token system, consent layer, /privacy + /terms"
  - "docs/OPS-01-SHIP-GATE.md closed for Phase 1 with dated sign-off; reusable template for every later phase"
affects: [phase-02, phase-04]

actuals:
  tokens: 45000
  tasks: 3
  commits: 1
  duration: "~40 min (incl. two OAuth attempts)"

tech-stack:
  added: []
  patterns:
    - "Preview-before-prod: `vercel deploy` (non-prod, SSO-protected) offered for a visual pass before `vercel deploy --prod`; explicit `deploy-now` recorded"
    - "Orchestrator-executed post-deploy checks: GSC MCP tools are not available to gsd-executor, so Tasks 2–3 ran inline in the orchestrator"

key-files:
  created: []
  modified:
    - docs/OPS-01-SHIP-GATE.md

key-decisions:
  - "Offered a Vercel preview deployment before production because no plan in this phase had a real-browser light-mode pass (every executor deferred it to end-of-phase UAT). Developer chose preview-first, then deploy-now."
  - "PostHog event definitions recorded as `no-data` with reason: developer completed PostHog OAuth twice, but the MCP server disconnected after the handshake without exposing tools. Per plan Task 3, an unavailable connection is recorded honestly, never substituted with an assumption."
  - "Search Console verdicts recorded as PASS-with-caveat: all nine pre-existing routes are 'Submitted and indexed' but every last_crawled date precedes the deploy (newest 2026-09-05), so they prove the routes entered the deploy indexed, not Google's view of the new build. Re-inspect at the Phase 2 gate."

patterns-established:
  - "Ship-gate row extension: post-deploy results were added as two new columns (Live / Search Console) on the existing 11 route rows — one route, one row — matching the gate's recording rules."

requirements-completed: [OPS-01, MONY-01 (live half — CMP script confirmed in production HTML)]

coverage:
  - id: D1
    description: "Production deploy only after explicit developer approval; deployment URL recorded"
    requirement: "OPS-01"
    verification:
      - kind: other
        ref: "01-09 Task 1 checkpoint: preview deploy offered, developer replied deploy-now; `vercel deploy --prod --scope loot-list-plus --yes` → parseforge-424ibrxax-loot-list-plus.vercel.app, aliased parseforge.gg, readyState READY"
        status: pass
  - id: D2
    description: "All routes + sitemap + robots return 200 on the live domain; CMP script host present in production HTML; sitemap pipeline intact"
    requirement: "MONY-01"
    verification:
      - kind: command
        ref: "curl over 13 paths — all 200; `fundingchoicesmessages.google.com` found in / HTML; sitemap.xml 4837 <loc> (4827 /analyze/), /privacy + /terms listed; homepage renders 5 recent-report links"
        status: pass
  - id: D3
    description: "Search Console URL inspection for every route, recorded per route (pass or no-data)"
    requirement: "OPS-01"
    verification:
      - kind: command
        ref: "gscServer batch_url_inspection (9 + 2 URLs, property sc-domain:parseforge.gg): 9× PASS 'Submitted and indexed' (pre-deploy crawls), /privacy + /terms NEUTRAL 'unknown to Google' → no-data"
        status: pass
  - id: D4
    description: "PostHog event definitions for theme_changed / consent_resolved / consent_unavailable recorded (present or no-data with timestamp)"
    requirement: "OPS-01"
    verification:
      - kind: other
        ref: "no-data ×3 at 2026-09-06 ~21:45 PDT — PostHog MCP disconnected after OAuth; recorded in docs/OPS-01-SHIP-GATE.md with reason"
        status: pass
    human_judgment: true
    rationale: "The plan defines an unavailable connection as a legitimate no-data outcome. The value is honest, not a pass."
  - id: D5
    description: "Gate document closed: unique, lexicographically ordered route rows, no blank cells, no Pending section, dated sign-off"
    requirement: "OPS-01"
    verification:
      - kind: command
        ref: "node structural check adapted to 11 routes (plan said 9; two routes added by quick task 260906-kzw): 11 rows, unique, ordered, no 'Pending post-deploy'; vocabulary grep (no-data/theme_changed/consent_resolved) pass"
        status: pass

deviations:
  - "Route count is 11, not the plan's 9 — /privacy and /terms shipped by quick task 260906-kzw after the plan was authored. The Task 3 automated check was run with the count adapted; everything else about it (uniqueness, ordering, no pending section) applied unchanged. Same deviation already recorded in 01-08-SUMMARY.md."
  - "Tasks 2 and 3 were executed by the orchestrator inline rather than by a spawned gsd-executor: the executor agent's tool list does not include the gscServer MCP tools the Search Console pass requires."
  - "Task 3's <human-check> (live theme control, EEA/UK dialog via VPN, US no-dialog, phone light-mode spot check) is deferred to the end-of-phase UAT sweep with the rest of the phase's browser checks (workflow.human_verify_mode=end-of-phase). Rollback path if that sweep finds a problem: `vercel rollback` to the previous production deployment."

notes:
  - "Build log emitted `[kv-cache] getRecentReports failed: Dynamic server usage` during static prerender of / and /sitemap.xml. Pre-existing (lib/kv-cache.ts untouched this phase; `cache: \"no-store\"` dates from a4aaf75) and harmless at runtime — the live sitemap and homepage carry recent-report data. Worth a small follow-up in a later phase to silence the prerender noise."
  - "Manual follow-up outside this gate: paste https://parseforge.gg/privacy into AdSense → Privacy & messaging → European regulations → message → site settings (page is live now)."
  - "`main` is ahead of origin/main by the whole phase; pushing it will restore parallel worktree execution for later phases (#683 base-check degrade)."
---

# 01-09 Summary — Ship Phase 1, close the OPS-01 gate

Phase 1 is live on parseforge.gg. After a preview deployment was offered for a visual pass
(none of the phase's plans could do a real-browser light-mode sweep), the developer replied
`deploy-now`; `vercel deploy --prod` produced `parseforge-424ibrxax`, aliased to the
production domain. Every route, the sitemap and robots return 200; the Google Privacy &
Messaging script host is present in the production HTML, which proves the publisher ID from
01-02 reached this build — the consent layer (MONY-01) is now active for EEA/UK visitors.
The sitemap still self-populates (4,827 report URLs) and lists the new `/privacy` and
`/terms` pages.

Search Console shows all nine pre-existing routes indexed with rich results unchanged, but on
pre-deploy crawls; the two new pages are unknown to Google yet. PostHog event definitions
could not be queried (MCP disconnected after OAuth) and are recorded as `no-data` with the
reason and time. `docs/OPS-01-SHIP-GATE.md` now carries the full Phase 1 evidence and a dated
sign-off, and is the template every later phase re-runs. The remaining human step is the
end-of-phase UAT sweep: theme toggle, EEA vs. US consent behaviour, light mode on a phone.
