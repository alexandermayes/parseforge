# ParseForge — Production Hardening Plan

> **How to use this file:** Drop it in the repo root and tell Claude Code:
> *"Read PRODUCTION_HARDENING.md and work through the phases in order. Complete one task at a time, run `npm run build` and `npx tsc --noEmit` after each task, and check the box before moving on."*

---

## Context (read this first)

ParseForge is a **stateless Next.js (App Router) app on Vercel** plus a **Discord bot** in `/bot`. It has:

- **No database, no auth, no user accounts.** All data comes from the Warcraft Logs (WCL) GraphQL API v2, fetched server-side with OAuth client-credentials from `WCL_CLIENT_ID` / `WCL_CLIENT_SECRET`.
- **A shared Redis cache** (Upstash via Vercel Marketplace) in `lib/kv-cache.ts`, with an in-memory Map fallback. `usingSharedCache` tells you if Redis is configured.
- **Three expensive POST routes** — `/api/analyze`, `/api/cla`, `/api/raid-overview` — each of which fans out into multiple WCL GraphQL calls (`/api/cla` can fire 20+ for a full raid clear).
- **One critical shared resource:** the WCL API has a **daily points budget per client ID**. Every request from every user spends from the same budget. If it's exhausted, the whole site is down for everyone until it resets.

**The core problem this plan fixes:** the API routes are unauthenticated with **no rate limiting**, no cap on request fan-out, and no protection against many simultaneous requests for the same report (cache stampede). Any script — or just a popular log shared on a busy raid night — can drain the WCL budget and take the site down.

Key files:

| File | Role |
|---|---|
| `lib/wcl-client.ts` | WCL GraphQL client: OAuth token cache, retries, timeouts, in-memory query cache |
| `lib/kv-cache.ts` | Shared Redis result cache + in-memory fallback + recent-reports sorted set |
| `lib/api-utils.ts` | `cachedApiHandler` (cache-check → run → cache-set), `errorResponse`, `parseBody` |
| `lib/wcl-queries.ts` | GraphQL query strings, incl. `buildCLABuffUptimeQuery` (string-built query) |
| `app/api/analyze/route.ts` | Player analysis (POST) |
| `app/api/cla/route.ts` | Consumables/buff audit across many fights (POST) — biggest fan-out |
| `app/api/raid-overview/route.ts` | Raid board (POST) |
| `app/og/route.tsx` | OG image; makes server-side fetches to own API with query-param inputs |
| `bot/src/index.ts` | Discord bot; auto-replies to any pasted WCL link, calls the public API |
| `next.config.ts` | Rewrites + redirects; currently **no `headers()` block** |

**Ground rules for every task:**

- Don't change response shapes of existing API routes — the Discord bot in `/bot` consumes them.
- Keep everything working **without** Redis configured (local dev). `usingSharedCache === false` must degrade gracefully, exactly like the existing cache code does.
- Match the existing code style: typed errors, heavy explanatory comments on "why", no new heavyweight dependencies unless listed below.
- After each task: `npm run build` and `npx tsc --noEmit` must pass. There are no tests yet (Phase 4 adds them).

---

## Phase 1 — Stop the bleeding (protects the WCL budget)

### Task 1.1 — IP rate limiting on all API routes 🔴

**Goal:** No single IP can hammer the expensive routes.

- Add dependency: `npm install @upstash/ratelimit @upstash/redis`
- Create `lib/rate-limit.ts`:
  - Use `Ratelimit.slidingWindow` backed by Redis (`Redis.fromEnv()` supports both `KV_REST_API_*` and `UPSTASH_REDIS_REST_*` names — verify against how `lib/kv-cache.ts` resolves env vars and keep them consistent; if `Redis.fromEnv()` doesn't pick up the `KV_REST_API_*` names, construct the client manually from the same env resolution used in `kv-cache.ts`).
  - **When Redis is not configured (local dev): rate limiting is a no-op that always allows.** Reuse/mirror the `usingSharedCache` pattern.
  - Export a helper like `checkRateLimit(request: Request, bucket: string): Promise<NextResponse | null>` that returns a 429 `NextResponse` when limited, or `null` when allowed. Derive the client key from `x-forwarded-for` (first entry) falling back to `"anon"`.
  - Suggested limits (make them constants in `lib/constants.ts` so they're easy to tune):
    - `/api/analyze`: 30 requests / 60s per IP
    - `/api/raid-overview`: 30 / 60s
    - `/api/cla`: 10 / 60s (it's the most expensive)
    - `/api/report/[code]` and `/api/report/[code]/players`: 60 / 60s
  - 429 body: `{ error: "Too many requests — please wait a moment and try again." }` with a `Retry-After` header.
- Wire the helper into **all five** route handlers as the first thing after body/param parsing.
- Log rate-limit hits through the existing `logEvent` in `lib/observability.ts` (e.g. `logEvent("rate_limited", { route })`) so they're visible in Vercel logs.
- Frontend: the SWR hooks in `app/analyze/[reportCode]/hooks/` should surface a friendly message on 429 — check how they currently render `error` and make sure the 429 message reads well (it likely already flows through since routes return `{ error }`).

**Acceptance:** With Redis configured, a loop of 40 rapid POSTs to `/api/analyze` from one IP gets 429s after ~30. Without Redis env vars, everything behaves exactly as today.

### Task 1.2 — Cap fan-out on `/api/cla` 🔴

**Goal:** One request can't trigger unbounded WCL calls.

In `app/api/cla/route.ts`, after `parseBody`:

- Validate `fightIds` is an array of finite integers (currently `fightIds.length` is read without checking it's an array — a non-array body causes an unhandled throw → 500).
- Reject with 400 if `fightIds.length > 15`: `{ error: "Too many fights selected — please select 15 or fewer." }`
- Deduplicate the IDs before building the cache key and querying.

Also in `app/api/analyze/route.ts` and `app/api/raid-overview/route.ts`: validate that `fightId` / `sourceId` are finite integers (`Number.isInteger`) and that `reportCode` matches `/^[a-zA-Z0-9]{10,20}$/` (the GET routes already validate the code; the POST routes don't). Return 400 on failure. This also prevents weird values from polluting cache keys like `analyze-${reportCode}-${fightId}-${sourceId}`.

Consider extending `parseBody` in `lib/api-utils.ts` with an optional per-field validator instead of repeating checks — your call, keep it simple.

**Acceptance:** `fightIds: "abc"`, `fightIds: [1,2,"x"]`, 50 fight IDs, and `reportCode: "../etc"` all return clean 400s. Valid requests unchanged.

### Task 1.3 — Single-flight lock to kill cache stampedes 🔴

**Goal:** When 50 people open the same freshly-shared report at once, only **one** request fans out to WCL; the rest wait for the cache.

In `lib/api-utils.ts` → `cachedApiHandler`:

- After a cache miss, attempt to acquire a Redis lock: `SET lock:{cacheKey} 1 NX EX 20` (add a small `cacheLock`/`cacheUnlock` pair to `lib/kv-cache.ts` using the existing `redisCmd` helper — `SET` with `NX` returns `null` result when not acquired).
- **Lock acquired:** run the handler, `setCache`, release the lock (`DEL`), return.
- **Lock not acquired (someone else is computing):** poll `getCached` every ~500ms for up to ~15s. If the cache fills, return it (log as `cache: "wait_hit"` in the existing `logEvent` call so hit-rate metrics stay meaningful). If it times out, fall through and run the handler yourself (never dead-end the user).
- **Without Redis:** skip locking entirely — behave exactly as today.
- Always release the lock in a `finally`, and rely on the `EX 20` TTL as the safety net if the instance dies mid-computation.

**Acceptance:** Fire 10 concurrent identical `/api/analyze` requests against an uncached report (script it with `Promise.all` of fetches): Vercel logs show ~1 `cache: "miss"` doing real work and ~9 `wait_hit`s. Without Redis, behavior is unchanged.

### Task 1.4 — Discord bot cooldowns 🔴

**Goal:** The bot can't amplify traffic into the API.

In `bot/src/index.ts`:

- **Passive link detection (`messageCreate`):** add a per-channel cooldown (in-memory `Map<channelId, timestamp>`, e.g. one auto-reply per channel per 30s), and only respond when the link includes fight/source info (`parsed.fightId !== undefined`) — a bare report link pasted in chat shouldn't trigger a reply. Note this path only posts a button (no API call), so the cooldown is about spam, not cost.
- **Slash commands (`/raid`, `/analyze`):** add a per-user cooldown (e.g. one command per user per 10s) with an ephemeral "give it a few seconds" reply when throttled.
- Wrap the `message.reply` and command handlers so a rejected promise (e.g. missing channel permissions) is caught and logged instead of becoming an unhandled rejection — **on Node 20 an unhandled rejection crashes the process**, which currently kills the bot.
- Handle 429 responses from the ParseForge API (Task 1.1) with a friendly message instead of dumping `API 429: {...}` into chat. While in `bot/src/api.ts`, stop echoing raw upstream response bodies into Discord — surface only the `error` field if the body parses as JSON, else a generic message.
- Fix the stale activity string `"getlootlist.com"` → `"parseforge.gg"`.

**Acceptance:** Bot builds (`cd bot && npm run build`). Pasting a bare report link gets no reply; a link with `#fight=&source=` gets the button, at most once per 30s per channel. A permissions error on reply logs a warning and the bot stays up.

---

## Phase 2 — Hardening (same week)

### Task 2.1 — Security headers 🟠

In `next.config.ts`, add a `headers()` block applying to `/(.*)`:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Content-Security-Policy in Report-Only mode first** (`Content-Security-Policy-Report-Only`). It must allow: `'self'`; the inline Wowhead config script in `app/layout.tsx` (either add a nonce or, pragmatically, `'unsafe-inline'` for scripts to start); `https://wow.zamimg.com` (Wowhead tooltips.js + images); the PostHog reverse-proxy path `/ingest` is same-origin, but PostHog session replay may need `'unsafe-eval'`/worker allowances — **verify in the browser console before promoting to enforcing mode**, and leave it report-only in this task.

**Do not** apply frame-blocking headers to `/og` (link unfurlers fetch it; images are fine, but double-check nothing breaks Discord/Twitter unfurls after deploy).

**Acceptance:** `npm run build` passes; local dev shows the headers on responses; site renders with zero CSP violations in the console on the landing page and an analyze page (report-only mode).

### Task 2.2 — Tighten `/og` route inputs 🟠

In `app/og/route.tsx`:

- Validate `report` against `/^[a-zA-Z0-9]{10,20}$/`; if invalid, render the generic `ReportCard` (never fetch).
- Only take the analysis path when `fight` and `source` parse via `Number.parseInt` to finite integers ≥ 0.
- Replace the request-derived `origin` with a constant: use `https://parseforge.gg` in production and fall back to the request origin only in development (`process.env.NODE_ENV`). Keep the existing "never fail an unfurl" catch-all.

**Acceptance:** `/og?report=<junk>` returns the branded fallback card without hitting the API; the demo report's OG URL (see `lib/demo-report.ts` comment) still renders the player card.

### Task 2.3 — Integer-coerce IDs in the built GraphQL query 🟠

In `lib/wcl-queries.ts` → `buildCLABuffUptimeQuery`: the query is built by string interpolation of `sourceIds`. They currently come from WCL's own actor list (safe), but this is the only place data could reach a query body as a raw string. Coerce each with `Number(id)` and skip any that fail `Number.isInteger` / are negative. One-line insurance against future refactors.

### Task 2.4 — PostHog session-replay privacy 🟠

In `app/components/PostHogProvider.tsx`:

- Set `enable_recording_console_log: false` (console capture can hoover up anything logged client-side).
- Set `maskAllInputs: true` and remove the custom `maskInputFn` un-masking (the report-URL input being masked in replays is an acceptable trade for the privacy default).
- Leave a `// TODO` noting that serving EU users with session replay ultimately needs a consent banner — that's a product decision, not part of this task.

### Task 2.5 — Share the OAuth token across instances 🟠

In `lib/wcl-client.ts`, `getAccessToken` caches the WCL token in module scope — per serverless instance. Store it in Redis too:

- On cache check: module-scope token first (fastest), then Redis (`GET wcl:token` holding `{ token, expiresAt }`), then fetch from WCL and write back to both (`SET ... EX <expires_in - buffer>`).
- Reuse `cacheGet`/`cacheSet` from `lib/kv-cache.ts`. Without Redis: exactly today's behavior.
- Keep the existing 401-refresh path working: on 401 it must clear **both** module and Redis copies before refetching.

**Acceptance:** Type-checks; local dev without Redis still authenticates; the 401 retry path in `wclQuery` still clears state correctly.

---

## Phase 3 — Ops hygiene 🟡

### Task 3.1 — CI

Add `.github/workflows/ci.yml`: on PR and push to main, Node 20, `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Second job for the bot: `cd bot && npm ci && npm run build`. No deploy steps (Vercel handles deploys).

### Task 3.2 — Bot Dockerfile

In `bot/Dockerfile`: add `USER node` before `CMD`, and `ENV NODE_ENV=production`. Note in a comment that the runtime should set a restart policy (`restart: unless-stopped` or equivalent) since the bot exits on fatal errors.

### Task 3.3 — Unify the duplicated URL parser

`lib/url-parser.ts` and `bot/src/util/parse-url.ts` are two drifting copies of `parseWCLUrl`. The web version is more robust (loose text scan, bounded code length). Port the web version's logic into the bot's copy so behavior matches (they're separate packages, so duplication stays — just make them identical and add a comment in each pointing at the other).

---

## Phase 4 — Tests for the engines 🟡

The product **is** the numbers produced by `lib/analysis-engine.ts` (~1,300 lines), `lib/cla-engine.ts` (~600), and `lib/raid-overview-engine.ts` (~400). They're pure functions of their inputs — ideal for unit tests, and currently untested.

- Add `vitest` as a dev dependency, `"test": "vitest run"` script, and include it in CI.
- Priority order:
  1. `lib/url-parser.ts` — table-driven tests for every documented format (bare code, hash params, query params, `fight=last`, text with embedded URL, junk input).
  2. `lib/async-pool.ts` — order preservation, concurrency cap, empty input.
  3. `lib/api-utils.ts` → `parseBody` — including the "0 is a valid fightId/sourceId" case called out in its comment, plus the new validators from Task 1.2.
  4. `lib/analysis-engine.ts` / `lib/cla-engine.ts` — build small fixture inputs (hand-written, minimal WCL-shaped objects) and assert grades/percentiles/flags. Start with a few high-value cases (empty rankings, healer vs dps path, missing enchant detection) rather than aiming for coverage.
- Rate-limit and single-flight logic (Tasks 1.1/1.3): test the pure parts (key derivation, allow/deny decisions) with a mocked Redis; don't build integration infra.

---

## Explicitly out of scope (don't do these)

- No auth/login system — the app is intentionally public.
- No database — localStorage history stays as-is.
- No queue/background-job infrastructure.
- No CSP enforcing mode in this pass (report-only first, promote manually after checking real traffic).
- No changes to the analysis math/output values — tests characterize current behavior; they don't "fix" it.

## Definition of done

- [ ] All Phase 1 tasks complete — this is the launch-blocking set
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Phase 4: parser/pool/parseBody tests exist and run in CI; engine tests started
- [ ] `npm run build`, `npx tsc --noEmit`, `npm run lint`, and `npm test` all pass; bot builds
- [ ] Verified locally **without** Redis env vars that everything still works (rate limiting no-ops, cache falls back to memory)
