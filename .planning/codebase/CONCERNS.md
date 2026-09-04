# Codebase Concerns

**Analysis Date:** 2026-09-04

## Open Follow-Ups (from Production Hardening)

### Content-Security-Policy: Still in Report-Only Mode

**Issue:** CSP is currently non-enforcing (`Content-Security-Policy-Report-Only` in `next.config.ts:44`). It was shipped in report-only mode to verify completeness against real traffic before enforcement.

**Files:** `next.config.ts:10–44`

**Impact:** CSP violations are logged to the browser console but not blocked. The policy is incomplete and silent failures may occur when promoted to enforcing mode without re-testing.

**Action:** After a full prod deploy, verify zero CSP violations in the console on a **fully-rendered report page** (with Wowhead icons loaded, PostHog session replay active). Then flip line 44 from `Content-Security-Policy-Report-Only` → `Content-Security-Policy` (one-line change).

**Priority:** Medium — no security gap if traffic-tested before promotion.

### Session Replay: Missing EU Consent Banner

**Issue:** PostHog session replay is enabled without explicit user consent. EU visitors (GDPR) should have the option to opt-out before recording starts.

**Files:** `app/components/PostHogProvider.tsx:46` (TODO comment present)

**Impact:** Possible GDPR violation if EU users' sessions are recorded without consent.

**Current state:** `disable_session_recording: false` and `maskAllInputs: true` (privacy safe), but needs consent flow.

**Action:** This is a product decision, not a code bug. If the site serves EU traffic, add a pre-init consent banner before PostHog loads, or disable recording by default and only enable on consent.

**Priority:** High if serving EU traffic; Medium if not.

---

## Test Coverage Gaps

### Business Logic Untested

**Issue:** The core analysis engines—`lib/cla-engine.ts` (587 lines), `lib/raid-overview-engine.ts` (394 lines), `lib/wcl-client.ts` (282 lines)—have no unit tests. Only `lib/analysis-engine.ts` has partial coverage (analyzeDps only tested).

**Files:**
- `lib/cla-engine.ts` — consumable/buff audit logic
- `lib/raid-overview-engine.ts` — raid-wide stats aggregation
- `lib/wcl-client.ts` — token caching, retry logic, error classification

**Impact:** Bugs in these functions are caught only in manual testing or production. The `cla-engine.ts` fix for game-data IDs (PR #11) happened to be caught by user reports, not tests.

**Coverage:** 5 test files, 34 tests total. Covers: url-parser, async-pool, api-utils/parseBody, cla-constants verification, and analyzeDps. Missing: CLA full suite, healer/healing path, raid-overview aggregation, token refresh logic.

**Action:** Priority order (from PRODUCTION_HARDENING.md):
1. Extend engine tests with high-value cases (empty rankings, healer vs DPS path, missing enchant/gem detection).
2. Add WCL client tests for token refresh on 401 and error classification.
3. Raid-overview aggregation tests (stat sum-to-zero edge cases).

**Priority:** High — these functions ship the product's value.

---

## Type Safety & Assertions

### Loose Type Casting in Data Access

**Issue:** Some functions use `as unknown as Record<string, unknown>` to drill into nested WCL structures, bypassing type safety for performance/convenience.

**Files:**
- `lib/cla-engine.ts:364` — casting combatantInfo to access `.auras`
- `lib/raid-overview-engine.ts:90` — same pattern
- `lib/wcl-helpers.ts:23` — casting `rawSpec` to access `.spec`

**Impact:** These casts mask type errors until runtime. If WCL changes the structure, parsing fails silently or crashes.

**Mitigation:** Already in place for the critical path: `flattenPlayerDetails` (in `wcl-helpers.ts`) validates the WCL structure and returns a typed object. The loose casts are read-only, not mutations.

**Action:** Not urgent. If these paths become a hot-spot for bugs, refactor to use typed guards or upstream validation.

**Priority:** Low.

---

## Missing Features / Incomplete Logic

### Gem Detection: Missing Socket Info

**Issue:** `lib/analysis-engine.ts:198–200` detects missing enchants but gem detection is incomplete. It notes that gem socket info is not available, so missing gems can't be reliably flagged.

```typescript
// Could count as missing gems, but we'd need socket info
```

**Files:** `lib/analysis-engine.ts:197–200`

**Impact:** Player UI shows `missingGems: 0` always (hardcoded). Player may have empty sockets but the report won't flag it.

**Why:** WCL's CombatantInfo.gear[].gems returns the gems present, but not socket count or socket type. Flagging "missing gems" without socket info produces false positives.

**Action:** Ask WCL API support if socket count is available in playerDetails or elsewhere. If so, implement the detection. Otherwise, consider removing the `missingGems` field from the response to avoid confusion.

**Priority:** Low — harmless gap, users can see empty sockets visually on Wowhead.

---

## Performance & Scalability

### In-Memory Cache Eviction: FIFO, Not LRU

**Issue:** The fallback cache in `lib/kv-cache.ts:41–44` evicts the oldest entry (FIFO) when full, not the least-recently-used (LRU). Under heavy local/offline use, a large report cached first might evict even if unused, while a recent small report stays.

```typescript
if (mem.size >= MEM_MAX_SIZE) {
  const oldest = mem.keys().next().value;
  if (oldest !== undefined) mem.delete(oldest);
}
```

**Files:** `lib/kv-cache.ts:40–46` (MEM_MAX_SIZE = 200)

**Impact:** Cache hit rate drops under sustained load without shared Redis. Local dev and offline deployments are affected. With Redis (prod) this is not an issue.

**Action:** If local testing shows cache thrashing, replace with an LRU eviction policy (e.g., a `Map` + separate `Set` for access order) or increase MEM_MAX_SIZE.

**Priority:** Low — prod uses Redis; local dev can clear cache as needed.

---

## Fragile Areas

### Single-Flight Lock: Timeout Fallthrough Creates Duplicate Work

**Issue:** In `lib/api-utils.ts:121–128`, if a lock holder takes >15s to compute and then returns an error, the waiter falls through and computes itself. This creates duplicate WCL queries during the same 20s lock TTL window.

```typescript
const waited = await waitForCache<T>(cacheKey);
if (waited) {
  // cache filled — great
  return NextResponse.json(waited);
}
// Lock holder never filled cache (slow, errored, or returned early 404).
// Compute ourselves rather than dead-ending the user.
return runAndCache();
```

**Files:** `lib/api-utils.ts:121–128`

**Impact:** A request that times out (>15s) causes cascading duplicates. Under high concurrency on a slow WCL API, this amplifies load instead of shielding it.

**Scenario:**
1. 50 people open the same uncached report.
2. Lock holder fansout to WCL, takes 17s, then errors (network timeout).
3. 49 waiters give up after 15s and compute themselves.
4. Net: ~50 WCL fan-outs instead of ~1.

**Mitigation:** Retry timeout could be increased, or the lock holder could write a "failed" sentinel to the cache to signal waiters to give up faster (instead of waiting 15s).

**Action:** Monitor rate-limit logs (`logEvent("rate_limited", ...)`) and analyze perf during peak load. If lock-holder timeouts are common, implement a failure sentinel or adaptive backoff.

**Priority:** Medium — only impacts under sustained peak load with slow WCL responses.

---

### Rate Limit: Unknown Buckets Default to 30 req/60s

**Issue:** In `lib/rate-limit.ts:38`, new buckets not in `RATE_LIMITS` default to 30 requests per 60 seconds. This is conservative but might be wrong for future routes.

```typescript
const limit = RATE_LIMITS[bucket] ?? 30; // conservative default
```

**Files:** `lib/rate-limit.ts:35–46`, `lib/constants.ts` (RATE_LIMITS definition)

**Impact:** If a new API route is added without updating `RATE_LIMITS`, it silently gets the default. Easy to forget, hard to notice until traffic patterns change.

**Action:** Make the default a named constant in `lib/constants.ts` with a comment explaining why. Consider making unknown buckets fail-open with a warning log instead of silently defaulting.

**Priority:** Low — affects future development, not current code.

---

## Architecture & Deployment

### Discord Bot Deployment Is Manual, Separate from Web

**Issue:** The web app deploys on Vercel automatically (manual CLI), but the Discord bot in `/bot` deploys separately. Changes to `bot/src/index.ts` merged to `main` don't take effect until the bot's host is manually redeployed.

**Files:** `/bot` (root-level sibling to `app/`, `lib/`)

**Impact:** A fix in the bot code can be merged and forgotten, live in `main` but not running in prod. E.g., Phase 1.4 (cooldowns, crash-hardening) and Phase 3 (URL parser unification) changes are in main but the bot hosts need manual restart.

**Mitigation:** The bot build is included in CI (`.github/workflows/ci.yml`), so broken bot code is caught. Merge/deployment process should require a note/checklist for bot redeploys.

**Action:** Document the bot deployment process in CLAUDE.md or create a post-merge checklist. Consider automating the bot redeploy (e.g., a separate GitHub Actions trigger or a webhook to the bot host).

**Priority:** Medium — low-friction fix that prevents future surprises.

---

## Legacy Code / Future Cleanup

### Old Domain Redirects Still Active

**Issue:** `next.config.ts:62–100` redirects traffic from four old domains (getlootlist.com, lootlistplus.com/.dev) to parseforge.gg. These domains have been consolidated but the redirects remain in production config.

**Files:** `next.config.ts:61–100` (6 redirect rules)

**Impact:** Minimal — redirects work fine and consolidate SEO authority. But if the old domains are no longer used, the rules are dead weight.

**Action:** Keep them as long as old domain traffic is possible (users with bookmarks, backlinks, search results). Revisit after parseforge.gg dominates organic search (1–2 months of zero traffic to old domains).

**Priority:** Low — cosmetic cleanup, no functional issue.

---

## Food Buff Names: Display-Only Risk

**Issue:** Per `lib/game-data-id-verification.md`, WotLK/Cata per-food buff names are **all generically "Well Fed"** in the game client data. ParseForge's friendly labels for food buffs (IDs 57325–57373 / 87545–87557) are community-standard, not verified against WCL data or client dumps.

**Files:** `lib/cla-constants.ts` (food buff ID→name map), `lib/constants.ts` (FOOD_BUFF_IDS)

**Impact:** Food names in the CLA report (showing what buff was active) may be wrong for WotLK/Cata. Display-only; doesn't affect detection or uptime flagging. TBC food names are verified.

**Action:** Not urgent. If a user reports wrong food labels in WotLK, cross-check against `findBestBuff` (in `cla-engine.ts`) which falls back to WCL's buff name if CONSUMABLE_DB misses.

**Priority:** Low — display-only, TBC verified, WotLK is less common.

---

## Security Considerations

### REPORT_CODE_RE: Validation Works but Regex Is Permissive

**Issue:** `lib/api-utils.ts:50` validates report codes as `/^[a-zA-Z0-9]{10,20}$/` — strict length + charset, which is correct. But the regex doesn't encode WCL's actual constraints (e.g., case-insensitive, specific format). Not a bug, just worth noting.

```typescript
export const REPORT_CODE_RE = /^[a-zA-Z0-9]{10,20}$/;
```

**Files:** `lib/api-utils.ts:50–52`

**Impact:** None currently. WCL report codes always match this pattern. But if WCL changes their format, the route might reject valid codes.

**Action:** Add a comment linking to WCL's URL structure documentation. No change needed.

**Priority:** Low.

---

## Lint & Code Quality

### Pre-existing Lint Debt Marked as "Intentional"

**Issue:** PRODUCTION_HARDENING.md notes 12 non-failing lint warnings remain (unused-vars, exhaustive-deps). Three react-hooks/react-compiler errors are suppressed with justifications (intentional client-only patterns). Lint is now blocking in CI, but pre-existing warnings are grandfathered.

**Files:** Various (noted in `npm run lint` output)

**Impact:** Warnings are suppressed, so they don't block CI. But dead code or missing dependencies can still hide. The justifications are in comments; revisit if behavior changes.

**Action:** Document the warnings in a central file (e.g., `.eslintignore` or a comment in `.eslintrc.json`) so future maintainers understand they're intentional, not oversights.

**Priority:** Very low — lint is already non-blocking and justified.

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Open follow-ups | 2 | Medium |
| Test coverage gaps | 1 (major gap) | High |
| Type safety | 1 | Low |
| Incomplete logic | 1 | Low |
| Performance | 1 | Low |
| Fragile areas | 2 | Medium |
| Architecture/Deployment | 2 | Medium |
| Legacy cleanup | 1 | Low |
| Display-only risks | 1 | Low |
| Security notes | 1 | Low |

**Immediate actions:**
- Promote CSP from Report-Only to enforcing (after traffic test).
- Expand test coverage for cla-engine, raid-overview-engine, wcl-client.
- Document bot deployment process to prevent forgotten redeploys.

---

*Concerns audit: 2026-09-04*
