---
phase: 01-foundation-themes-consent
plan: 02
subsystem: infra
tags: [adsense, cmp, gdpr, consent, google-privacy-messaging, env]

requires:
  - "01-01: none technically — wave-1 sibling"
provides:
  - "Google AdSense account for parseforge.gg (hosts the certified TCF v2.2 CMP — no ad units, no ad code)"
  - "Published Google Privacy & Messaging GDPR consent message, geo-targeted EEA + UK only, full-screen dialog format"
  - "NEXT_PUBLIC_GOOGLE_CMP_PUB_ID in Vercel production env + documented placeholder in .env.example"
affects: [01-03, 01-08, phase-04]

actuals:
  tokens: 12000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Public-but-env-scoped identifier: real value lives only in Vercel env; .env.example carries a placeholder with a comment stating it is public, not secret"

key-files:
  created: []
  modified:
    - .env.example

key-decisions:
  - "Consent message published WITHOUT a privacy policy URL — parseforge.gg has no /privacy page (verified: /privacy, /privacy-policy, /legal/privacy all 404). Deferred rather than blocked: captured as todo privacy-policy-page.md (commit 6e205ed) so Phase 1 consent wiring stays unblocked. AdSense shows a 'missing privacy policy' warning on the message until resolved."
  - "Sign-up only, per D-02/MONY-01: no ad unit, ad slot, or ad script exists anywhere in the repository (grep for adsbygoogle/pagead2 clean). Site-approval review runs in the background (days-to-weeks) and does not gate Phase 1."

patterns-established: []

requirements-completed: [MONY-01 (human-side half; 01-03 wires the consent signal)]

coverage:
  - id: D1
    description: "AdSense account exists for parseforge.gg; publisher ID available to the application as NEXT_PUBLIC_GOOGLE_CMP_PUB_ID"
    requirement: "MONY-01"
    verification:
      - kind: command
        ref: "vercel env ls production --scope loot-list-plus | grep NEXT_PUBLIC_GOOGLE_CMP_PUB_ID"
        status: pass
      - kind: command
        ref: "grep '^NEXT_PUBLIC_GOOGLE_CMP_PUB_ID=' .env.example && ! grep -E 'pub-[0-9]{16}' placeholder check"
        status: pass
  - id: D2
    description: "GDPR consent message created and published, EEA/UK-only targeting (D-03), Google standard full-screen dialog format (D-04), no US-state privacy message"
    requirement: "MONY-01"
    verification:
      - kind: other
        ref: "Developer confirmed at the Task-1 human checkpoint (prior session) — dashboard-only configuration, no API surface to verify programmatically"
        status: pass
    human_judgment: true
    rationale: "Privacy & Messaging has no read API; the checkpoint instructions stated regions, format, and reject-parity explicitly and the developer confirmed against them (T-01-09 mitigation)."

deviations:
  - "Privacy policy URL absent from the published consent message — captured as pending todo privacy-policy-page.md, not silently skipped. Needs a /privacy page + AdSense message site-settings update."

notes:
  - "Env-var changes take effect only on a NEW deploy — plan 01-08 performs the deploy that makes NEXT_PUBLIC_GOOGLE_CMP_PUB_ID available to the client bundle."
  - "The prohibition check (reject path at same prominence as accept, nothing pre-selected) was confirmed by the developer at the checkpoint; Google's standard EEA/UK message template offers Consent / Do not consent / Manage options at equal prominence."
---

# 01-02 Summary — AdSense account + EEA/UK GDPR consent message (CMP host)

Stood up the human-only half of MONY-01. The AdSense account for parseforge.gg now
exists solely to host Google Privacy & Messaging (the certified TCF v2.2 CMP, D-01):
a GDPR consent message is published, geo-targeted to EEA + UK only, in the
full-screen dialog format. US visitors and US-IP Googlebot never see an
interstitial (no US-state message configured).

The publisher ID reached the application through `NEXT_PUBLIC_GOOGLE_CMP_PUB_ID`:
set in Vercel production via `vercel env add` (never printed or committed) and
documented in `.env.example` with a placeholder. Plan 01-03 reads this key to mount
the CMP script and wire the consent signal into PostHog; plan 01-08's deploy makes
it live.

One deliberate deferral: the consent message links no privacy policy because the
site has none. Tracked in `.planning/todos/pending/privacy-policy-page.md` — ship
`/privacy`, then add its URL in AdSense → Privacy & messaging → message site
settings.
