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
        // Terminal: once refused, ignore any later re-confirmation for this
        // mount. Collapsing is safe only for a collapsible slot (nothing
        // below it in document order, per AD_SLOTS); a non-collapsible slot
        // keeps its reserved box empty forever instead.
        refusedTerminally = true;
        if (spec.collapsible) setStatus("collapsed");
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
  }, [status, id, pathname, spec.route]);

  if (!boxReserved || status === "collapsed") return null;

  return (
    <div
      data-ad-slot={id}
      className={cn("mx-auto", spec.boxClass, className)}
      style={{ width: spec.base.width, height: spec.base.height }}
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
    </div>
  );
}
