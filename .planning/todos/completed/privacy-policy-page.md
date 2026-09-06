---
created: 2026-09-06
source: phase-01 plan 01-02 (AdSense CMP setup)
resolves_phase:
resolved: 260906-kzw
---

# Ship a /privacy page and link it in the AdSense CMP message

During the 01-02 AdSense Privacy & messaging setup, the GDPR consent message was
published WITHOUT a privacy policy URL — parseforge.gg has no /privacy page
(checked 2026-09-06: /privacy, /privacy-policy, /legal/privacy all 404).

Needed:
1. Create a /privacy page (PostHog analytics disclosure, Google CMP/AdSense
   disclosure, cookie usage, data-subject rights contact).
2. Add its URL in AdSense -> Privacy & messaging -> European regulations ->
   message -> site settings (currently blank; AdSense shows a "missing privacy
   policy" warning on the message).
3. Keep it noindex-irrelevant: static page, linked in the footer.

GDPR-wise the consent dialog should link a privacy policy; this was deferred to
unblock Phase 1 consent wiring, not skipped permanently.
