// Ad-slot gate, slot table and SDK loader (04-CONTEXT.md D-01..D-08), in the
// style of lib/consent.ts: typed input, narrow return, no throwing. This
// module owns the numeric source of truth for every reserved ad box
// (`AD_SLOTS`) and the one function (`shouldLoadAds`) that decides whether a
// resolved consent decision may load ads — a second, independent
// derivation of that decision is exactly the bug the assumption-delta test
// in lib/ads.test.ts exists to catch.

import type { ConsentGatePath } from "@/lib/consent";

/**
 * Slot ids this phase declares — the 04-03 tracer slot (`tbc-audit-end`)
 * plus the three 04-05 adds to complete the D-02 placement map:
 * `tbc-audit-mid`, `analyze-mid`, `analyze-end`.
 */
export type AdSlotId = "tbc-audit-end" | "tbc-audit-mid" | "analyze-mid" | "analyze-end";

export interface AdSlotSpec {
  /** The route this slot renders on (informational only). */
  route: string;
  /** Reserved box below the `md` breakpoint. */
  base: { width: number; height: number };
  /** Reserved box at/above the `md` breakpoint. */
  md: { width: number; height: number };
  /**
   * Static Tailwind size literals encoding `base`/`md` above, as a single
   * whole literal string — never built by string concatenation, so
   * Tailwind's class scanner can see it.
   */
  boxClass: string;
  /** AdSense unit id, or `UNCONFIGURED_UNIT` until an account-side unit exists. */
  unit: string;
  /**
   * True only for a slot with nothing below it in document order — the one
   * case where collapsing a refused slot to nothing shifts no content.
   */
  collapsible: boolean;
}

/** Placeholder unit id. `adsConfigured` treats this as "not yet wired". */
export const UNCONFIGURED_UNIT = "PENDING";

export const AD_SLOTS: Record<AdSlotId, AdSlotSpec> = {
  "tbc-audit-end": {
    route: "/tbc-audit",
    base: { width: 300, height: 250 },
    md: { width: 336, height: 280 },
    boxClass: "w-[300px] h-[250px] md:w-[336px] md:h-[280px] max-w-full",
    unit: "7875533232",
    collapsible: true,
  },
  "tbc-audit-mid": {
    route: "/tbc-audit",
    base: { width: 300, height: 250 },
    md: { width: 728, height: 90 },
    boxClass: "w-[300px] h-[250px] md:w-[728px] md:h-[90px] max-w-full",
    unit: "8721711041",
    collapsible: false,
  },
  "analyze-mid": {
    route: "/analyze/[reportCode]",
    base: { width: 300, height: 250 },
    md: { width: 728, height: 90 },
    boxClass: "w-[300px] h-[250px] md:w-[728px] md:h-[90px] max-w-full",
    unit: "7746259468",
    collapsible: false,
  },
  "analyze-end": {
    route: "/analyze/[reportCode]",
    base: { width: 300, height: 250 },
    md: { width: 336, height: 280 },
    boxClass: "w-[300px] h-[250px] md:w-[336px] md:h-[280px] max-w-full",
    unit: "6900170941",
    collapsible: true,
  },
};

/** The two D-07 gate paths ads are ever allowed to load for. */
const ADMITTED_GATE_PATHS: ReadonlySet<ConsentGatePath> = new Set([
  "geo-non-consent-region",
  "tcf-accept",
]);

/**
 * Whether a resolved consent gate path may load ads (D-07). `null` (no
 * decision yet) fails closed to `false` — an unresolved decision is a
 * refusal, never a wait-and-see — the same discipline as
 * `deriveConsentAction`'s unknown-input guard in lib/consent.ts.
 */
export function shouldLoadAds(gatePath: ConsentGatePath | null): boolean {
  if (gatePath === null) return false;
  return ADMITTED_GATE_PATHS.has(gatePath);
}

/**
 * Whether the ads feature is switched on for this build/deploy at all —
 * the env-level gate, independent of any single slot's unit-id wiring.
 * `AdSlot` uses this alone to decide whether to reserve a slot's box, so a
 * build with `NEXT_PUBLIC_ADS_ENABLED` unset stays byte-identical in layout
 * to the pre-ad build (D-08) even before any slot has a real unit id.
 */
export function adsEnabled(): boolean {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "1";
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? "";
  return enabled && pubId !== "";
}

/**
 * Whether a slot is ready to actually request an ad: `adsEnabled()` is
 * true AND the slot's own unit id has been wired (not the placeholder).
 * `AdSlot` reserves a box whenever `adsEnabled()` is true, but only
 * proceeds to load the SDK and push the unit when this is also true — so
 * an unwired slot (like `tbc-audit-end` today) reserves its exact box
 * without ever requesting an ad.
 */
export function adsConfigured(slotId: AdSlotId): boolean {
  return adsEnabled() && AD_SLOTS[slotId].unit !== UNCONFIGURED_UNIT;
}

const ANALYZE_ROUTE_RE = /^\/analyze\/[^/?]+/;

/**
 * Normalizes a pathname to the literal route pattern any ad event may
 * carry — a report code, fight id, or source id must never reach an
 * analytics property. Strips the query string first, then folds any
 * `/analyze/{code}` path to the fixed pattern `/analyze/[reportCode]`.
 */
export function normalizeRoute(pathname: string): string {
  const withoutQuery = pathname.split("?")[0];
  return ANALYZE_ROUTE_RE.test(withoutQuery) ? "/analyze/[reportCode]" : withoutQuery;
}

let adSenseScriptPromise: Promise<boolean> | null = null;

/**
 * Injects the AdSense SDK script tag into `document.body` (never `<head>`,
 * never `next/script` — D-06 forbids loading it for every visitor) and
 * resolves once it loads or errors. Idempotent: every call after the first
 * returns the same promise. A `false` resolution is how an ad blocker is
 * detected.
 */
export function loadAdSenseScript(): Promise<boolean> {
  if (adSenseScriptPromise) return adSenseScriptPromise;
  adSenseScriptPromise = new Promise<boolean>((resolve) => {
    const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? "";
    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${pubId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return adSenseScriptPromise;
}
