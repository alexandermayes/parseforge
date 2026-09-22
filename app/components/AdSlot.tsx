"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";
import {
  AD_SLOTS,
  adsEnabled,
  adsConfigured,
  shouldLoadAds,
  isTerminalRefusal,
  normalizeRoute,
  loadAdSenseScript,
  type AdSlotId,
} from "@/lib/ads";
import { subscribeConsentGatePath, getConsentGatePath } from "@/lib/consent";

// AdSense's push queue is the one browser global this file needs beyond what
// TypeScript's lib.dom.d.ts already types — requestIdleCallback and
// cancelIdleCallback are both declared there, in the style lib/consent.ts
// uses for the CMP global (`window.__tcfapi`).
declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? "";
const IDLE_TIMEOUT_MS = 2000;
const OBSERVE_CEILING_MS = 10_000;

type SlotStatus = "reserved" | "collapsed" | "admitted" | "loaded";

/**
 * Renders one reserved, consent-gated AdSense unit (04-CONTEXT.md D-04,
 * D-06, D-07). Never fetches `/api/geo` and never registers a `__tcfapi`
 * listener itself — it consumes the single published consent decision via
 * `subscribeConsentGatePath` (lib/consent.ts), the same decision
 * `PostHogProvider` already resolved.
 *
 * The box renders whenever `adsEnabled()` is true (the env-level switch,
 * D-08) so a build can be tested end-to-end before every slot has a real
 * AdSense unit id; the SDK is only ever loaded and the unit only ever
 * requested when `adsConfigured(id)` is also true (the slot's own unit is
 * wired). An unwired slot therefore reserves its exact box and never
 * requests an ad.
 */
export default function AdSlot({ id, className }: { id: AdSlotId; className?: string }) {
  const pathname = usePathname();
  const spec = AD_SLOTS[id];
  const [status, setStatus] = useState<SlotStatus>("reserved");
  // Google's adsbygoogle.js mounts a blank iframe inside the <ins> the
  // instant it starts processing a pushed unit — long before `data-ad-status`
  // resolves to "filled" or "unfilled". That blank iframe paints white in
  // both themes (the defect a developer caught on the Phase 4 preview: a
  // visible white rectangle while the account was still in AdSense review).
  // The reserved wrapper div always keeps its declared box size (zero layout
  // shift, D-04); this flag controls only whether the occluding cover below
  // is present. It starts hidden-behind-cover and is revealed ONLY on a
  // confirmed "filled" status backed by an actually-rendered iframe (see the
  // MutationObserver below) — an "unfilled" status, or the observe ceiling
  // passing with no resolution at all, both leave it covered.
  const [filled, setFilled] = useState(false);
  const insRef = useRef<HTMLModElement>(null);

  const boxReserved = adsEnabled();
  const readyToRequest = adsConfigured(id);

  // Consent subscription -> idle-scheduled admission. Only runs when the
  // slot is actually ready to request an ad; an unwired slot never
  // subscribes at all, since it will never load ads regardless of consent.
  useEffect(() => {
    if (!boxReserved || !readyToRequest) return;
    let cancelled = false;
    let refusedTerminally = false;
    let idleHandle: number | ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeConsentGatePath((path) => {
      if (cancelled || refusedTerminally) return;

      if (!shouldLoadAds(path)) {
        // `path` here is always "tcf-reject" or "tcf-timeout" — the other
        // two ConsentGatePath values both satisfy shouldLoadAds and take the
        // admission branch below instead. Only "tcf-reject" is a genuine,
        // deliberate decline; "tcf-timeout" is a PROVISIONAL fail-closed
        // state (lib/consent.ts's own doc comment on ConsentGatePath /
        // deriveConsentGateOutcome) that a later real TCF resolution can
        // legitimately supersede — startConsentListener's __tcfapi listener
        // has no re-entry guard specifically so that late resolution still
        // republishes. Latching `refusedTerminally` (and collapsing a
        // collapsible slot) on a mere timeout would permanently drop that
        // later legitimate "tcf-accept" for this mount — a real
        // consent/revenue-eligibility bug, not just a missed optimization:
        // a legitimately-consenting visitor whose CMP resolved slowly would
        // silently lose ad eligibility for the rest of the page view even
        // though PostHogProvider correctly treats them as opted in.
        //
        // So: terminal (and collapse, if collapsible) only for the genuine
        // refusal. For "tcf-timeout", do nothing terminal — keep the
        // subscription live and keep waiting for a possible late
        // resolution. Tradeoff, documented rather than left ambiguous: if
        // the CMP never fires a further event at all (permanently blocked,
        // not merely slow), this effect now waits indefinitely — nothing
        // else in this file bounds it (IDLE_TIMEOUT_MS only governs the
        // idle-scheduled step AFTER admission, and OBSERVE_CEILING_MS only
        // bounds the fill-status MutationObserver AFTER a push — neither
        // applies pre-admission). A collapsible slot in that permanently-
        // stuck case keeps its box reserved-but-empty for the rest of the
        // page view instead of collapsing, matching how a non-collapsible
        // slot already behaves on a genuine refusal (see below) — accepted
        // as consistent with "never guess a decision that hasn't actually
        // been made," not treated as an oversight.
        if (isTerminalRefusal(path)) {
          // Terminal: once genuinely refused, ignore any later
          // re-confirmation for this mount. Collapsing is safe only for a
          // collapsible slot (nothing below it in document order, per
          // AD_SLOTS); a non-collapsible slot keeps its reserved box empty
          // forever instead.
          refusedTerminally = true;
          if (spec.collapsible) setStatus("collapsed");
        }
        return;
      }

      const scheduleIdle =
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback
          : (callback: IdleRequestCallback) => setTimeout(callback as () => void, 0);
      idleHandle = scheduleIdle(() => {
        if (!cancelled) setStatus("admitted");
      }, { timeout: IDLE_TIMEOUT_MS });
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (idleHandle !== null) {
        if (typeof idleHandle === "number" && typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(idleHandle);
        } else {
          clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
        }
      }
    };
  }, [boxReserved, readyToRequest, spec.collapsible]);

  // Admission -> load the SDK itself (never in <head>, never next/script — D-06).
  useEffect(() => {
    if (status !== "admitted") return;
    let cancelled = false;

    loadAdSenseScript().then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        posthog.capture("ad_slot_blocked", {
          route: normalizeRoute(pathname ?? spec.route),
          slot_id: id,
          consent_gate_path: getConsentGatePath(),
        });
        return;
      }
      setStatus("loaded");
    });

    return () => {
      cancelled = true;
    };
  }, [status, id, pathname, spec.route]);

  // SDK loaded and <ins> mounted -> push the unit once, observe its fill status.
  useEffect(() => {
    if (status !== "loaded") return;
    const el = insRef.current;
    if (!el) return;

    const eventProps = {
      route: normalizeRoute(pathname ?? spec.route),
      slot_id: id,
      consent_gate_path: getConsentGatePath(),
    };

    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
    posthog.capture("ad_slot_requested", eventProps);

    let captured = false;
    const observer = new MutationObserver(() => {
      if (captured) return;
      const adStatus = el.getAttribute("data-ad-status");
      if (adStatus === "filled" || adStatus === "unfilled") {
        captured = true;
        // Don't trust "filled" alone (round-3 defect fix): also require an
        // actually-rendered iframe with non-zero size before lifting the
        // cover. A "filled" status arriving a tick before Google swaps the
        // iframe in would otherwise reveal nothing (or a stale blank frame)
        // for one paint. This cannot detect a *filled-but-blank* creative
        // (cross-origin — its document is unreadable), which is why the
        // occluding cover, not this check alone, is what protects the
        // account's AdSense-review period; see the deployment note this
        // fix's SUMMARY records.
        const renderedIframe = el.querySelector("iframe");
        const hasRenderedFrame =
          adStatus === "filled" &&
          !!renderedIframe &&
          renderedIframe.offsetWidth > 0 &&
          renderedIframe.offsetHeight > 0;
        setFilled(hasRenderedFrame);
        posthog.capture(adStatus === "filled" ? "ad_slot_filled" : "ad_slot_empty", eventProps);
        observer.disconnect();
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] });
    const ceiling = setTimeout(() => observer.disconnect(), OBSERVE_CEILING_MS);

    return () => {
      observer.disconnect();
      clearTimeout(ceiling);
    };
    // `pathname`/`spec.route` are intentionally excluded. This component
    // instance is not remounted on client-side report-to-report navigation
    // (no `key` change upstream — see AnalyzeClient's own guard), so
    // `pathname` changing on navigation would otherwise re-run this effect
    // while `status` is still "loaded" from the previous report, pushing the
    // same already-loaded `<ins>` node to `adsbygoogle` a second time —
    // Google's documented "already have ads in them" duplicate-request
    // failure mode. `pathname`/`spec.route` are still read via closure for
    // `eventProps.route` below, so the PostHog events correctly capture the
    // route this unit was actually first requested on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id]);

  if (!boxReserved || status === "collapsed") return null;

  return (
    <div
      data-ad-slot={id}
      className={cn("relative mx-auto overflow-hidden", spec.boxClass, className)}
    >
      {status === "loaded" && (
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: "100%" }}
          data-ad-client={`ca-pub-${PUB_ID}`}
          data-ad-slot={spec.unit}
        />
      )}
      {/*
        Occluding cover, not a visibility toggle (round-3 defect fix; the
        `bg-noise` grain match below is round-4). `visibility: hidden` on
        the <ins> (tried in round 2) is defeated the moment adsbygoogle.js
        processes the pushed unit: it inserts a child div
        (`#aswift_N_host`) INSIDE the <ins> with its own explicit
        `visibility: visible` inline style, well before `data-ad-status`
        resolves — CSS lets any descendant re-assert visibility regardless
        of how many ancestor levels up it was set hidden, so the blank
        iframe inside that div painted through the hidden ancestor in both
        themes (confirmed live via CDP: `data-ad-status` was still null/
        "unfilled" while the injected host div's computed visibility read
        "visible"). This cover is a LATER SIBLING of the <ins>, not
        something Google's script can reach, and paints on top of the
        <ins>'s entire subtree by document order — Google never sets a
        z-index on anything it injects, so tree order alone already decides
        paint order here; the explicit z-10 is additional insurance.
        Removed only once a confirmed "filled" status is backed by an
        actually-rendered iframe (see the MutationObserver above) — never on
        `data-ad-status` alone.

        Round 4: the flat `bg-background` fill alone (round 3's only
        treatment) was a real, if subtle, defect — the page's own
        `.bg-noise::before` (app/globals.css, `<body>`) paints a faint 3%
        grain texture everywhere the page is otherwise transparent, but an
        opaque cover necessarily occludes that fixed layer, leaving a
        flat, textureless rectangle in an otherwise-grainy page. A developer
        screenshot of the third preview caught this as a subtly
        different-shade box; pixel-sampled CDP screenshots confirmed it
        numerically (an UNCLIPPED, full-viewport capture — a `clip`-scoped
        one silently failed to see the fixed noise layer under headless
        Chrome + software rendering, a false-negative this round also
        diagnosed): the cover read flat at stddev 0 while an adjacent
        page-background control read a small but real stddev (~0.5-0.8) and
        a ~1-3 RGB-level warmer mean, in both themes, at both a desktop and
        a phone viewport. `ad-cover-noise` (app/globals.css) adds the same
        SVG turbulence tile at the same 0.03 opacity via a local (`position:
        absolute`, not `fixed`) pseudo-element scoped to this cover, so the
        occluded rectangle carries the same texture as the page around it
        instead of standing out as a flat patch.
      */}
      {!filled && (
        <div
          aria-hidden="true"
          className="ad-cover-noise pointer-events-none absolute inset-0 z-10 bg-background"
        />
      )}
    </div>
  );
}
