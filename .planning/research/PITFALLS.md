# Pitfalls Research

**Domain:** Monetization, redesign, programmatic SEO, viral loop, and community additions to an established, organic-search-dependent web tool (ParseForge, ~1k GSC clicks/mo and growing)
**Researched:** 2026-09-04
**Confidence:** MEDIUM (web-search-sourced patterns are broadly corroborated across independent industry sources, but not first-party/curated docs; project-specific constraints below are HIGH confidence — sourced directly from `.planning/PROJECT.md` and prior incidents in this codebase)

## Critical Pitfalls

### Pitfall 1: Ads Degrade Core Web Vitals and Quietly Tank the Rankings They're Meant to Monetize

**What goes wrong:**
Ad slots inject layout shift (CLS) and consume the main thread at the worst possible moments (LCP/INP), because ad scripts are third-party code competing for the same rendering budget as the page content. On a site whose #1 acquisition channel is organic search, a CWV regression is not a cosmetic issue — it can directly suppress the ranking signal that ads were supposed to monetize. This is a doubly dangerous trap on ParseForge specifically: `/analyze/[reportCode]` pages are SSR and already carry real computational weight (WCL fetch + analysis engine), and the homepage/guides are the crawled, ranked surface — these are exactly the pages an ad network will want to place units on.

**Why it happens:**
Ad network setup wizards (AdSense auto-ads, network tags) default to maximum-fill placements without reserved space, async-loaded-late scripts, or throttled bid timeouts. Teams treat "add ad tag" as a copy-paste task rather than a performance-budget decision, and only discover CWV regressions in a later Search Console dip — by which point rankings have already softened.

**How to avoid:**
- Reserve exact width/height (or aspect-ratio CSS) for every ad slot before the ad script loads — never let an ad "pop in."
- Lazy-load ad units below the fold; never let ad JS block the main analysis render (report tables, gear grids) that's the actual reason users are on the page.
- Cap ad-bidding timeout budgets and load ad scripts `async`/`defer`, never render-blocking.
- Measure CWV (PageSpeed Insights / CrUX / Vercel Speed Insights) on `/`, a representative `/analyze/[code]`, and `/tbc-audit` *before* adding ads, then re-measure after — treat any INP/CLS regression as a launch blocker, not a follow-up.
- Do not place ads inside or adjacent to the report-analysis UI itself (tables, tooltips) where layout is already dynamic — this is where CLS from ads compounds with the app's own dynamic content.

**Warning signs:**
- GSC "Core Web Vitals" report shows pages moving from "Good" to "Needs improvement" after ad rollout.
- PostHog session-replay or Vercel Speed Insights shows INP spikes correlated with ad-render timing.
- Any manual Lighthouse run post-launch shows CLS > 0.1 on pages that were previously clean.

**Phase to address:** Monetization phase — CWV baseline measurement must be a gate *before* ad code ships, not a cleanup task after.

---

### Pitfall 2: Monetizing Too Early Yields Pennies While Creating Real, Compounding Costs

**What goes wrong:**
At ParseForge's current scale (~1k organic clicks/mo, likely tens of thousands of monthly pageviews from the `/analyze/*` long tail), AdSense-tier RPMs ($2–6) translate to genuinely trivial revenue — a few tens of dollars a month at best — while the CWV risk (Pitfall 1), the GDPR/consent burden (Pitfall 8), and the UX tax of ad placement are all real and ongoing. Teams under-price the "cost" side of this trade because the dollar amount on the benefit side is so small it feels safe to "just try it."

**Why it happens:**
"Ads are the easiest low-effort monetization" is true relative to building a paid product, but "easiest" gets conflated with "safe" or "worth it at any scale." There's no natural stopping point once the ad tag is live — it just sits there depressing CWV and complicating consent for marginal money.

**How to avoid:**
- Before committing, model expected revenue using this site's actual monthly pageviews × a realistic RPM ($2–6 general content; WoW/gaming niche typically sits mid-pack, not premium-CPM territory like finance/legal). If the number is under ~$50–100/mo, weigh it explicitly against the CWV/consent/UX cost — this is exactly the "evaluate low-effort alternatives" instruction already in PROJECT.md.
- Consider that premium ad networks (e.g., Raptive-tier, Mediavine's lower "Journey" tier) have real minimum-pageview thresholds; if ParseForge doesn't clear them, only lower-quality/lower-RPM networks (raw AdSense) are available anyway — worth knowing before promising a monetization outcome to stakeholders.
- Treat "ship ads" as a reversible experiment: gate behind a flag, measure GSC + PostHog for 2–4 weeks, and have a rollback criterion (e.g., CWV regression, bounce-rate increase, share-rate drop) defined *before* launch, not after seeing the dashboard move.

**Warning signs:**
- Revenue after first full month is in single/low-double digits and the CWV/PostHog dashboards show any negative movement — that's a net-negative trade, not a "give it more time" situation.
- Ad viewability is low (ads placed below where most users scroll) — a sign the effort produced no benefit at all.

**Phase to address:** Monetization phase — do the revenue-vs-cost model and set rollback criteria *before* writing ad-integration code.

---

### Pitfall 3: A "De-bloat" Redesign Silently Deletes the SEO Content and Internal Links the Site Depends On

**What goes wrong:**
This is the single highest-blast-radius pitfall for this milestone. PROJECT.md explicitly plans a "full-page UX audit: de-bloat pages that accumulated SEO content" alongside a "site-wide design overhaul." Real-world redesign post-mortems show the common failure pattern precisely: a team redesigns for aesthetics/UX, and in the process changes URLs, collapses or removes heading structure, deletes "bloated" copy that was actually the ranking content, or drops internal links (e.g., the homepage's guides/FeaturedReports links) that crawlers relied on to discover deep pages. Recovery from a bad migration commonly takes 500+ days industry-wide, and some sites documented in case studies never fully recovered. For ParseForge, `/analyze/[code]` pages are indexed on the long tail with unusually strong CTR (17–100%) — that traffic is highly sensitive to exactly this kind of "cleanup."

**Why it happens:**
Design and SEO are usually owned by different mental models: a redesign optimizes for "looks clean, reads well to a human visiting today," while SEO value is stored in accumulated signals (indexed URLs, internal link graph, heading hierarchy, historical content depth) that aren't visible in a Figma mock or a "looks messy" gut check. "De-bloat" is exactly the phrase that precedes accidentally deleting ranking copy, because bloat and SEO-necessary content look identical to a visual designer.

**How to avoid:**
- Freeze URL structure for every currently-indexed route (`/`, `/analyze/[reportCode]`, `/tbc-audit`, `/guides/*`) through the redesign. If a URL must change, it requires an explicit 301 redirect map reviewed *before* launch — never "we'll add redirects after," which is the exact mistake in two of the case studies found (8-week gap; IT simplifying the redirect map).
- Before removing any copy/section from a page as part of "de-bloating," check whether it's the actual ranking content (compare against GSC queries landing on that URL) — cosmetic bloat (visual clutter, redundant CTAs) is safe to cut; textual/structural SEO content is not, unless it's being *replaced* with equivalent or better on the same URL.
- Preserve heading hierarchy (one H1, logical H2/H3 nesting) through any visual redesign — a new design system can restyle headings but must not flatten them into styled `<div>`s or reorder them for visual reasons.
- Preserve every crawlable internal link (homepage → guides, homepage → FeaturedReports, navbar → tools) as real `<a href>` elements, not JS-only click handlers — this is explicitly called out as load-bearing in PROJECT.md.
- Canonical tags must stay param-free through the redesign exactly as today — don't let a new component library reintroduce query-string variants.
- Treat this as a phase-gate: run the redesign behind a preview deploy, diff the rendered HTML (headings, links, canonical, meta) of every indexed template against production before promoting, and only then go live.

**Warning signs:**
- GSC coverage report shows pages moving from "Indexed" to "Discovered — not indexed" or "Crawled — not indexed" in the weeks after redesign launch.
- Click/impression drop in GSC on previously-earning URLs (especially the `/analyze/*` long tail) within 1–2 weeks of the redesign shipping.
- A visual diff shows a page's word count dropped sharply with no equivalent new content added.

**Phase to address:** Design/UX overhaul phase — needs an explicit "SEO preservation checklist" gate before promoting the redesign to production, not a post-launch fix.

---

### Pitfall 4: Programmatic Landing Pages Trigger Google's Scaled Content Abuse Policy

**What goes wrong:**
PROJECT.md's plan ("per-class / per-raid / per-tool pages like `/tbc-audit`") is directionally correct (grounded in real product features, which is the right instinct) but the failure mode is well documented since Google's March 2024 spam update: pages that read as the same template with a noun swapped (e.g., "Warrior Buff Audit" / "Mage Buff Audit" / "Priest Buff Audit" pages that only differ by class name in a few slots), with no unique data or experience per page, get algorithmically identified and suppressed — even though each individual page is "real" in the sense of mapping to an actual feature. The policy is explicitly method-agnostic: it doesn't matter that the pages are hand-coded rather than AI-generated, or that they're not literally doorway pages — what triggers enforcement is scale + low marginal uniqueness per page.

**Why it happens:**
Teams reasonably want to templatize page generation once one instance ranks well ("`/tbc-audit` works, let's do this for every class/raid combination"), but reuse the same paragraph structure and only substitute the entity name, mistaking "grounded in a real feature" for "automatically not scaled-content-abuse" — the policy applies regardless of whether the underlying tool is real.

**How to avoid:**
- Every programmatic page must carry genuinely unique, non-templated value per instance: real computed data specific to that class/raid/tool combination (e.g., actual aggregate stats pulled from the WCL/Redis data this site already has — top-consumed items for that class, common mistakes seen in real logs), not just the same three paragraphs with the class name swapped.
- Cap initial rollout to a handful of high-confidence combinations (validated by keyword-intent segmentation, per the existing "hard-won SEO lesson" already in PROJECT.md) rather than generating the full cross-product of classes × raids × tools on day one — publishing velocity that outpaces what a human could plausibly have written per-page is itself a signal Google's policy explicitly names.
- Before each new page ships, run the same intent-segmentation check already established for `wow log analyzer` — confirm the query is tool-intent, not navigational, and confirm no existing page already targets the same intent (see Pitfall 5).
- Keep each page mapped 1:1 to an actual, working feature end-to-end (this project's own "Key Decisions" table already validates this principle) — never publish a landing page for a capability that doesn't exist yet just to claim the URL.

**Warning signs:**
- A batch of newly published pages shows flat or declining impressions in GSC 4–6 weeks after publishing (the update's algorithmic detection is not instant, so a burst of "impressions then silence" is the classic pattern).
- Manual side-by-side read of two "sibling" pages (e.g., two class-specific audit pages) is indistinguishable except for the class name.
- Total indexed programmatic pages grows faster than the rate at which real, differentiated data can be verified/curated for each (tying back to this project's existing accuracy incident — see Pitfall 6).

**Phase to address:** Programmatic SEO phase — the uniqueness bar (real per-page data, not templated copy) must be a page-template requirement from the first page shipped, and rollout should be staged/measured rather than batch-published.

---

### Pitfall 5: New Programmatic Pages Cannibalize Existing Rankings Instead of Adding Net-New Traffic

**What goes wrong:**
Multiple pages targeting the same keyword/intent split ranking signals between them — Google may pick the "wrong" one to rank, both may underperform a single consolidated page would have, and in the worst case one variant goes permanently unindexed while diluting the other's authority. This is a specific risk for ParseForge because the existing `/tbc-audit` page and any new `/tools/*` or `/guides/*` pages could easily end up competing for the same "audit"/"analyzer" tool-intent queries the site has already identified as its highest-value cluster.

**Why it happens:**
Programmatic page generation is usually planned around a template × entity matrix (class × raid × feature) without first building a keyword map that assigns one primary keyword/intent per URL — so overlap is discovered only after publishing, via a GSC "which page ranks" surprise.

**How to avoid:**
- Before generating any batch of programmatic pages, build an explicit keyword-to-URL map: one primary keyword + intent per URL, checked against every existing indexed URL (including `/tbc-audit`, `/`, and all `/guides/*`).
- Apply the project's own existing intent-segmentation rule (navigational vs. tool-intent) per candidate page *and* check for overlap with sibling programmatic pages, not just with existing pages.
- If two pages do end up targeting overlapping intent, consolidate (merge content, 301 the weaker URL) rather than letting both compete indefinitely.

**Warning signs:**
- GSC shows two of the site's own URLs both appearing (and both under-performing) for the same query in "Performance → Queries" drill-down.
- A new page's impressions come at the expense of an existing page's impressions on the same query, with no net increase in total site clicks for that keyword cluster.

**Phase to address:** Programmatic SEO phase — build the keyword map before generating pages, and re-check it as each new batch is proposed.

---

### Pitfall 6: Accuracy Regressions in Programmatic/Feature Expansion Erode Trust Faster Than SEO Can Rebuild It

**What goes wrong:**
This project has already suffered a real incident: game-data ID maps (enchant/gem/consumable) were shifted/hallucinated, producing wrong recommendations, fixed only via a wago.tools regeneration workflow (per MEMORY.md and PROJECT.md's "Core Value" statement: "a wrong recommendation is worse than no recommendation"). Expanding tool capabilities and adding programmatic pages that surface class/raid-specific "top consumables" or "common mistakes" data multiplies the surface area where a stale or hand-typed ID/ranking mapping can quietly reintroduce the same class of bug — and unlike a UI bug, a wrong DPS/gear recommendation is invisible until a user (or a Discord post) calls it out, by which point organic-search users have already acted on bad advice.

**Why it happens:**
Feature and content expansion naturally pulls in new game-data surfaces (new classes' consumables, new raid tiers' encounter rankings) faster than the verification workflow is applied, especially under growth-milestone time pressure — the same pressure that produced the original shifted-ID incident.

**How to avoid:**
- Any new game-data ID map (items, enchants, gems, spells, encounters) added during this milestone must go through the existing wago.tools regeneration workflow — no hand-typed ID maps, per the constraint already codified in PROJECT.md.
- Any new "top players" or "recommended gear" comparison surfaced on a new programmatic page must reuse the existing, already-fixed rankings-partition-scoping logic (PR #12) rather than a new bespoke query — don't let content-generation code paths bypass the analysis engine's validated logic.
- Add a lightweight sanity check/spot-audit step to any new content-generation script: for a sample of generated pages, manually cross-check the displayed "top consumable" or "top item" against wowhead/wago.tools before publishing at scale.

**Warning signs:**
- A new page or feature displays a recommendation that a raid officer/community member flags as wrong (the same discovery path that surfaced the original ID-shift bug).
- Newly added game-data tables were populated by hand-editing rather than regenerating from wago.tools.

**Phase to address:** Any phase touching game-data or rankings (programmatic SEO content generation, product-quality/accuracy phase) — verification workflow is a hard gate, not optional cleanup.

---

### Pitfall 7: Ads/Redesign Cannibalize the Viral Share Loop Instead of Coexisting With It

**What goes wrong:**
PROJECT.md flags share rate is already weak (~2.8%) and is an active growth target. Ad placement decisions made independently of the share-flow redesign risk directly working against each other: ad units placed near/above share buttons increase visual competition and can suppress click-through on the share action (the classic "ad accidentally looks more prominent than the CTA" outcome), and if the redesign changes the report page layout without deliberately protecting the share/copy-link/OG-preview flow, regressions can slip in unnoticed (e.g., a redesigned card component that no longer renders the right OG image dimensions, or a new layout that pushes the share button below the fold).

**Why it happens:**
Monetization, redesign, and viral-loop work are being planned as separate roadmap tracks in this milestone, but they touch the same pixels (the report page). Without an explicit checklist connecting them, it's easy to ship each in isolation and only discover the interaction (ad crowding out share CTA, redesign breaking OG image) after the fact.

**How to avoid:**
- Treat the share button/CTA as a protected UI element during both the redesign and ad-placement work: it must remain above the fold, visually distinct from ad units, and untouched by ad-slot reflow.
- Any redesign of the report page must re-verify the OG image/unfurl pipeline (this project already depends on Discord unfurl + demo report working) — screenshot-test the Discord embed after any layout or metadata-generation change, not just the on-site UI.
- Sequence work so viral-loop UX changes and the redesign are validated together rather than as two independent, unsynchronized workstreams touching the same page.

**Warning signs:**
- PostHog share-rate metric drops after either the redesign or ad rollout ships (even if each was tested "in isolation" via preview deploy).
- A pasted report link's Discord embed shows missing image/title/description after a redesign deploy — check immediately after any change to `opengraph-image.tsx`, `report-meta.ts`, or the analyze page layout.

**Phase to address:** Design/UX overhaul phase and Viral-loop phase — should be sequenced/reviewed together, with a shared "protected elements" checklist.

---

### Pitfall 8: Ad Consent (GDPR/CMP) Gets Bolted On Wrong, Either Killing Revenue or Breaking Compliance

**What goes wrong:**
CONCERNS.md already flags that PostHog session replay lacks an EU consent flow — meaning this project is already carrying unresolved consent debt *before* ads are added. Layering ads on top without fixing this compounds the problem two ways: (a) serving personalized ads to EEA/UK/Swiss users without a Google-certified, IAB TCF-compliant CMP is a compliance violation with real enforcement risk, and (b) even a technically-compliant-but-misconfigured CMP can silently suppress EEA ad revenue by double digits (making the already-marginal ad revenue from Pitfall 2 even smaller) — while going with zero CMP entirely tanks CPM/fill rate even further (~43%/~34% drops observed industry-wide).

**Why it happens:**
Consent management is treated as an ads-team problem bolted on at ad-integration time, disconnected from the site's existing (already-incomplete) analytics consent posture — so the same gap gets shipped twice instead of fixed once.

**How to avoid:**
- Fix the PostHog EU consent gap and the ad-consent requirement together, as one consent-management layer, not two separate bolt-ons — a single CMP decision (banner, granular per-purpose toggles, easy withdrawal) should govern both analytics and ads.
- Use a Google-certified CMP if serving Google-network ads to EEA/UK/CH traffic; verify it actually passes IAB TCF signals correctly (test with the ad network's own validator) rather than assuming "we added a cookie banner" is sufficient.
- Budget for the revenue-suppression side explicitly: expect EEA RPM to be lower under proper consent than the blended global RPM used in the revenue model from Pitfall 2 — don't plan finances on non-EEA numbers.

**Warning signs:**
- Ads go live with only a generic cookie banner and no verified TCF consent-string passthrough to the ad network.
- EEA-traffic RPM is dramatically lower than non-EEA RPM post-launch with no one having modeled that gap beforehand.

**Phase to address:** Monetization phase — should explicitly include fixing the existing PostHog consent gap as an in-scope prerequisite, not a separate future task.

---

### Pitfall 9: A New Discord Launches to Silence and Then Withers, Undermining the "Better Feedback Channel" Goal

**What goes wrong:**
PROJECT.md's stated motivation is real (feedback currently lands in the owner's personal Discord, which is uncomfortable) but a freshly launched community/feedback Discord commonly fails for a predictable reason: too much scaffolding (many channels) before there are enough members to populate them, so new visitors see a wall of dead channels and conclude the community is inactive — which then becomes self-fulfilling. If this happens, the milestone's community goal (a proper, non-awkward feedback channel) isn't achieved; it just creates a second dead channel alongside the personal DMs.

**Why it happens:**
Server setup is done all at once, with channel structure designed for the community's aspirational future size rather than its actual day-one size, and there's no dedicated plan for who posts the first weeks of activity before organic members arrive.

**How to avoid:**
- Launch with a minimal channel set (e.g., #welcome, #feedback, #general, #bug-reports) — not a fully scaffolded server with a dozen empty channels — and only add channels once existing ones show sustained activity.
- Seed initial activity deliberately: the owner (or team) posts real "working on X" updates, responds visibly and promptly to early feedback, and treats the first weeks as active community management, not a "build it and they will come" launch.
- Cross-promote via the existing LootList+ relationship (already planned per PROJECT.md) to get an initial member base rather than launching to zero.
- Decide up front whether this is a dedicated ParseForge Discord or a channel within the shared LootList+ server — a shared server with existing activity avoids the empty-room problem entirely and may better match the "low-effort, high-signal feedback channel" goal than a brand-new server.
- Assign moderation responsibility explicitly once the server passes ~50 members (per community best practice) — don't leave it solely with the owner, since that recreates the "personal Discord" discomfort this effort is meant to fix.

**Warning signs:**
- Server has zero or near-zero messages per day 2–3 weeks after launch, despite being linked from the site.
- Feedback keeps arriving via the owner's personal Discord/DMs even after the new server exists (a sign the new channel isn't discoverable or isn't perceived as "the" place).

**Phase to address:** Community phase — decide dedicated-vs-shared server and seed a minimal-channel launch plan before promoting the Discord link site-wide.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Shipping AdSense auto-ads with default placement (no manual CWV tuning) | Fast to ship, no custom layout code | CLS/INP regression risks organic rankings — the site's only acquisition channel | Never at this project's traffic level; only after CWV is measured pass/fail |
| Generating programmatic pages from one shared template with minimal per-page unique data | Fast to scale page count | Triggers scaled-content-abuse detection; wastes crawl budget; risks the whole cluster getting suppressed, not just weak pages | Only for a small, hand-verified pilot batch (a handful of pages) before deciding whether to template further |
| Redesigning visual layer and copy/structure in the same pass ("while we're in there, let's also rewrite this") | One redesign effort instead of two | Conflates cosmetic changes with SEO-load-bearing content changes, making it hard to isolate what caused a ranking drop | Never for pages carrying real indexed traffic — separate visual redesign from content/copy changes so each can be verified independently |
| Launching Discord with a large pre-built channel structure "so it looks established" | Feels more professional at launch | Empty channels read as a dead community, suppressing exactly the engagement it was meant to create | Never — start minimal, expand with evidence of activity |
| Reusing hand-typed or copy-pasted game-data values for a new class/raid page instead of running the wago.tools regeneration | Faster to publish new programmatic content | Reintroduces the exact ID-shift/hallucination bug already fixed once in this codebase | Never — this is an explicit project constraint |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Ad network (AdSense/similar) | Accepting default ad-slot behavior without reserving layout space or throttling script load | Reserve exact dimensions per slot, lazy-load below-fold units, async/defer scripts, re-measure CWV after each placement change |
| Google-certified CMP (for EEA/UK/CH ad consent) | Treating "a cookie banner exists" as sufficient without verifying TCF signal passthrough | Validate the CMP against the ad network's own consent-string checker; make consent granular and revocable |
| Discord (OG unfurl) | Relying on client-side/JS-rendered meta tags, or forgetting Discord's aggressive embed cache after a metadata change | Ensure OG tags are present in server-rendered HTML (already true for this SSR app); after changing `opengraph-image.tsx`/`report-meta.ts`, force-refresh by re-pasting the link with a cache-busting query param or deleting/re-posting in Discord to verify |
| Google Search Console (structured data / sitemap) | Assuming a redesign "looks fine" without re-validating FAQPage/structured data and sitemap health post-launch | Re-run the same GSC checks already in the project's standing invariant (structured data, sitemap, indexing) immediately after any redesign or programmatic-page batch ships — this is already a stated operational requirement, extend it explicitly to redesign/SEO work |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Ad scripts loaded synchronously in `<head>` or above analysis content | LCP/INP regression on `/analyze/[code]` and homepage | Async/defer + lazy-load below fold; measure before/after with Lighthouse/CrUX | Immediately on first ad-network integration, regardless of traffic level |
| Programmatic page generation without incremental static regeneration or caching strategy | Server load / build time balloons as class×raid×tool matrix grows | Reuse the existing ISR pattern (`revalidate=3600` on homepage) and the Redis shared-cache pattern already used for recent reports; don't build a bespoke fetch path per programmatic page | Once programmatic page count reaches dozens and each triggers uncached WCL/Redis calls on every crawl |
| Redesign introduces heavier client bundles (new UI kit, animation libraries) without checking impact on already-marginal CWV budget | INP regression on interactive report views | Budget bundle-size impact before adopting the reference design; measure CWV on a preview deploy before promoting | As soon as the redesign ships to production if not checked beforehand |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Shipping ad tags or third-party CMP scripts without updating the existing report-only CSP | Third-party ad/CMP scripts get silently blocked once CSP moves to enforcing mode (already a known open concern per CONCERNS.md), or conversely the CSP is left permissive indefinitely to avoid breaking ads | Explicitly add ad-network and CMP script sources to the CSP policy as part of the monetization phase, and treat "move CSP from report-only to enforcing" as a task that must account for whatever ads/CMP requires |
| Adding a Discord bot or webhook without scoping its permissions/secrets | Overprivileged bot token could be used to alter server settings or leak into a public repo | Scope bot permissions to the minimum needed (posting/moderation only); store any bot token as a secret, never in the repo, per this project's existing "never commit secrets" convention |
| Assuming session-replay (PostHog) consent gap "doesn't matter yet" while adding ad tracking on top | Compounds an existing unresolved EU consent violation with a second one (ad tracking) | Treat fixing the PostHog EU consent flow as an in-scope prerequisite of the monetization phase, not a separately-deferred item |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Ad placed directly above/beside the share button or analysis results | Users mistake ad for content, or share CTA gets visually crowded out, further suppressing the already-weak 2.8% share rate | Keep ad units visually distinct (labeled, bordered) and physically separated from the share CTA and from the core analysis table |
| Redesign changes report-page information hierarchy without user testing against the actual "why is my parse low" task | Users take longer to find the answer they came for, even if the page "looks better" | Validate the redesign against the Core Value task (find the reason for a low parse) before/independent of aesthetic review |
| Programmatic pages that read as thin/generic to a human visitor (not just to Google) | Users bounce immediately, increasing bounce rate and reinforcing the page's low quality signal to Google | Apply the same "would a real user find this genuinely useful" bar as the anti-scaled-content-abuse bar — they're the same test |
| Community Discord promoted site-wide before it has any real activity | New visitors see a dead server and form a negative impression of the whole product | Seed activity first (see Pitfall 9), then promote broadly once there's daily activity to show |

## "Looks Done But Isn't" Checklist

- [ ] **Ad integration:** Often missing a CWV re-measurement — verify PageSpeed/CrUX scores on `/`, `/analyze/[code]`, and `/tbc-audit` are unchanged or improved post-launch, not just "ads render."
- [ ] **Redesign:** Often missing a redirect map and structured-data re-check — verify every previously indexed URL still 200s (or has a deliberate 301), headings/canonical/FAQPage structured data still validate in GSC's URL Inspection tool, and internal links (guides, FeaturedReports) are still real crawlable `<a>` tags.
- [ ] **Programmatic pages:** Often missing genuine per-page uniqueness — verify by reading two "sibling" pages side by side and confirming they'd read as distinct, useful pages to a human, not just to a template diff.
- [ ] **Viral loop / OG unfurl:** Often missing a live Discord-embed check after any change to the analyze page or `opengraph-image.tsx` — verify by actually pasting a report link into a Discord channel post-deploy, not just checking the meta tags in devtools.
- [ ] **Ad consent (CMP):** Often missing verified TCF signal passthrough — verify with the ad network's own consent-string validator, not just "a banner appears."
- [ ] **Discord community:** Often missing seeded activity before promotion — verify there's been organic daily activity for at least 1–2 weeks before linking it prominently site-wide.
- [ ] **Game-data-backed content (new programmatic pages/features):** Often missing the wago.tools regeneration step — verify no new ID/ranking map was hand-typed or copy-pasted from an old source.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| CWV regression after ad launch | LOW–MEDIUM | Roll back ad placement/script loading strategy immediately (reserve space, defer load, reduce unit count); re-measure; this is fast to reverse if caught within days |
| Redesign breaks URL structure / removes indexed content | HIGH | Add missing 301 redirects immediately, restore removed content or its equivalent, resubmit affected URLs via GSC URL Inspection; recovery typically takes weeks to months (industry case studies show 500+ day average recovery for severe cases) — strong incentive to prevent rather than recover |
| Programmatic page batch flagged/suppressed under scaled-content-abuse | HIGH | Noindex or remove the low-value pages, consolidate into fewer higher-quality pages, and wait for the next crawl/policy re-evaluation cycle — there's no fast appeal path for algorithmic (non-manual-action) suppression |
| Keyword cannibalization between own pages | LOW–MEDIUM | Pick the stronger-performing URL (via GSC data), 301-redirect the weaker one, and consolidate unique content onto the surviving page |
| Discord launches and goes quiet | LOW | Pause broad promotion, seed activity manually (owner posts, direct-invite a few active community members), then re-promote once daily activity is visible |
| GDPR/CMP misconfiguration discovered post-launch | MEDIUM | Fix CMP configuration/TCF passthrough immediately; this is primarily a compliance and revenue-leak issue rather than a ranking issue, so recovery doesn't carry the same multi-month tail as SEO mistakes |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Ads degrade CWV (Pitfall 1) | Monetization phase | Before/after CWV measurement on key templates; GSC Core Web Vitals report stays "Good" |
| Monetizing too early for the revenue (Pitfall 2) | Monetization phase | Revenue model reviewed against actual pageviews before commit; rollback criteria defined pre-launch |
| Redesign deletes SEO content/links (Pitfall 3) | Design/UX overhaul phase | Preview-deploy HTML diff (headings, canonical, internal links) against production before promoting; GSC coverage report stable post-launch |
| Programmatic pages trigger scaled-content-abuse (Pitfall 4) | Programmatic SEO phase | Staged rollout with per-page uniqueness review; GSC impressions monitored 4–6 weeks post-publish per batch |
| Programmatic pages cannibalize existing rankings (Pitfall 5) | Programmatic SEO phase | Keyword-to-URL map reviewed before each batch; GSC query-level overlap check |
| Accuracy regressions in new game-data surfaces (Pitfall 6) | Programmatic SEO / product-quality phase | wago.tools regeneration workflow run for any new ID map; spot-audit sample of generated recommendations |
| Ads/redesign cannibalize share loop (Pitfall 7) | Design/UX overhaul + Viral-loop phases (sequenced together) | Share-rate PostHog metric monitored through both changes; Discord embed manually verified post-deploy |
| Ad consent/GDPR mistakes (Pitfall 8) | Monetization phase | CMP TCF validator check; PostHog EU consent gap closed as part of same phase |
| Discord launches empty (Pitfall 9) | Community phase | Minimal-channel launch, seeded activity confirmed for 1–2 weeks before site-wide promotion |

## Sources

- [MonetizePros — How Ads Impact Core Web Vitals and SEO](https://monetizepros.com/ad-implementation/how-ads-impact-core-web-vitals-seo/) (web, LOW confidence per source-hierarchy classification, corroborated across multiple industry sources)
- [Publift — Core Web Vitals Optimisation Playbook for Publishers](https://www.publift.com/blog/ultimate-guide-to-core-web-vitals-for-publishers)
- [BlogPros — How Much Traffic Do You Need to Earn on AdSense](https://blogpros.com/much-traffic-need-earn-adsense/)
- [AdSense Audit — Is AdSense Worth It for Low Traffic Sites](https://adsenseaudit.net/guides/is-adsense-worth-it-for-low-traffic-sites)
- [New or Media — Best AdSense Alternatives 2026 (traffic tiers)](https://newormedia.com/blog/best-adsense-alternatives/)
- [Digital Applied — Scaled Content Abuse: Google's March Update Guide](https://www.digitalapplied.com/blog/scaled-content-abuse-google-march-update-ai-pages-decimated)
- [Patrick Stox — Scaled Content Abuse (programmatic SEO risk reference)](https://patrickstox.com/programmatic-seo/risks/scaled-content-abuse/)
- [Growth Engineer — Will Programmatic SEO Get You Penalized?](https://growthengineer.ai/blog/programmatic-seo-google-penalty)
- [Search Engine Land — How to avoid an SEO disaster during a website redesign](https://searchengineland.com/website-redesign-avoid-seo-disaster-440169)
- [MadX Digital — Three Clients Revamped Websites, It Tanked Their Traffic](https://www.madx.digital/learn/website-revamp)
- [Numen Technology — Website Migration SEO: Avoid 50% Traffic Loss](https://www.numentechnology.co.uk/blog/website-migration-seo-strategy)
- [Expert SEO Consulting — The URL Mistake That Kills Organic Traffic](https://expertseoconsulting.com/safe-url-change-checklist-case-study/)
- [Search Engine Journal — How To Identify & Eliminate Keyword Cannibalization](https://www.searchenginejournal.com/on-page-seo/keyword-cannibalization/)
- [FlyRank — How to Handle Keyword Cannibalization for Landing Pages](https://www.flyrank.com/blogs/seo-hub/how-to-handle-keyword-cannibalization-for-landing-pages)
- [WildandFree Tools — Discord Embed Not Showing: How to Fix OG Tags](https://wildandfreetools.com/blog/discord-embed-not-showing-og-tags/)
- [OpenGraphPlus — Discord Embed & Open Graph Tags Guide](https://opengraphplus.com/consumers/discord)
- [Discord — Best Practices for Starting a Great Community on Discord](https://discord.com/blog/best-practices-for-starting-a-great-community-on-discord)
- [Mava — Discord Server Best Practices: 15 Tips](https://www.mava.app/blog/discord-server-best-practices)
- [MonetizeMore — Consent Management Platforms FAQ for GDPR, CCPA](https://www.monetizemore.com/blog/frequently-asked-questions-gdpr-and-eprivacy-directive/)
- [AdNimation — Your CMP Is Compliant But Quietly Killing EEA CPMs](https://www.adnimation.com/your-cmp-is-compliant-but-quietly-killing-eea-cpms/)
- Project-internal (HIGH confidence): `/Users/alexander.mayes/Code/parseforge/.planning/PROJECT.md` (hard-won SEO lessons, CONCERNS.md summary, prior game-data ID incident, share-rate/CWV/CSP status)

---
*Pitfalls research for: ParseForge monetization/redesign/programmatic-SEO/community milestone*
*Researched: 2026-09-04*
