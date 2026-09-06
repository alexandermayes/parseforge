// Pure TCF v2.2 consent decision logic, in the style of lib/url-parser.ts:
// typed input, narrow return, no throwing. `window.__tcfapi` is a third-party
// global this project doesn't control, so every field on the payload it hands
// us is optional and we resolve unknowns to "pending" rather than guessing.

declare global {
  interface Window {
    __tcfapi?: (
      command: "addEventListener" | "removeEventListener",
      version: 2,
      callback: (tcData: TcfConsentData, success: boolean) => void,
      listenerId?: number,
    ) => void;
  }
}

/**
 * The four consent outcomes this app acts on. `"opt-in-full"` and
 * `"opt-in-non-eea"` both opt PostHog in and start session replay; they stay
 * distinct so callers/analytics can tell an EEA/UK acceptance apart from a
 * visitor the CMP never needed to ask.
 */
export type ConsentAction =
  | "opt-in-full"
  | "cookieless"
  | "opt-in-non-eea"
  | "pending";

/**
 * Structural type for the `__tcfapi` callback payload (IAB TCF v2.2 shape).
 * Every field is optional — this comes from a hosted Google script this
 * project does not control the internals of.
 */
export interface TcfConsentData {
  gdprApplies?: boolean;
  eventStatus?: string;
  purpose?: {
    consents?: Record<string | number, boolean>;
  };
  /** Per the TCF v2.2 spec, echoed back by the CMP so a listener can later be
   *  removed via `__tcfapi("removeEventListener", 2, cb, listenerId)`. */
  listenerId?: number;
}

/** How long to wait for a TCF event before failing closed to "pending". */
export const CMP_TIMEOUT_MS = 3000;

const RESOLVED_EVENT_STATUSES = new Set(["tcloaded", "useractioncomplete"]);

/**
 * Derive the PostHog consent action from a resolved TCF `tcData` payload.
 *
 * Non-EEA/UK visitors (`gdprApplies === false`) resolve to `"opt-in-non-eea"`
 * immediately and unconditionally, before any event-status check — leaving
 * them in `"pending"` under a global `cookieless_mode: "on_reject"` would
 * silently cookie-block visitors the consent gate was never meant to reach
 * (01-RESEARCH.md Pitfall 1).
 *
 * A nullish payload or one missing `gdprApplies` resolves to `"pending"`:
 * fail closed on an unknown region rather than assume either branch.
 */
export function deriveConsentAction(
  tcData: TcfConsentData | null | undefined,
): ConsentAction {
  if (!tcData || tcData.gdprApplies === undefined) return "pending";
  if (tcData.gdprApplies === false) return "opt-in-non-eea";

  if (!tcData.eventStatus || !RESOLVED_EVENT_STATUSES.has(tcData.eventStatus)) {
    return "pending";
  }

  // TCF purpose 1 ("store and/or access information on a device") decides
  // full opt-in vs. cookieless. Read tolerantly under both the numeric `1`
  // and string `"1"` key since the payload's key type isn't guaranteed.
  const purpose1 =
    tcData.purpose?.consents?.[1] ?? tcData.purpose?.consents?.["1"];

  return purpose1 === true ? "opt-in-full" : "cookieless";
}

/**
 * The readable consent signal other code (including Phase 4's future ad
 * loader) consults. Kept as a plain module getter rather than a React hook
 * or context — 01-RESEARCH.md Open Question 2 says build the minimal
 * surface this phase needs rather than guess at a not-yet-researched
 * consumer's shape.
 */
export interface ConsentState {
  action: ConsentAction;
  gdprApplies: boolean | null;
  resolvedAt: number | null;
  /** True only when "pending" was reached via the CMP_TIMEOUT_MS fail-closed
   *  path (blocked/absent CMP), never for a live in-progress TCF event. */
  timedOut: boolean;
}

let consentState: ConsentState = {
  action: "pending",
  gdprApplies: null,
  resolvedAt: null,
  timedOut: false,
};

/** Returns a copy of the current consent state. */
export function getConsentState(): ConsentState {
  return { ...consentState };
}

/**
 * Registers a `__tcfapi` listener that translates every *resolved* TCF
 * payload into a `ConsentAction` via `deriveConsentAction`, and arms a
 * `CMP_TIMEOUT_MS` fail-closed timer in case the CMP script is blocked or
 * never loads (CSP block, ad-blocker). `onResolve` fires:
 *   - immediately, for a non-EEA/UK visitor (`"opt-in-non-eea"`)
 *   - once the visitor accepts or rejects (`"opt-in-full"` / `"cookieless"`)
 *   - once, after the timeout, if no TCF event arrived at all (`"pending"`,
 *     `state.timedOut === true`)
 *
 * A live intermediate event (e.g. the dialog is merely showing) updates
 * `getConsentState()`'s `gdprApplies` field but does not itself invoke
 * `onResolve` — there's no decision to act on yet, and treating it as a
 * resolution would fire a false-positive "CMP unavailable" signal for the
 * ordinary in-progress consent flow every EEA/UK visitor goes through.
 *
 * Returns a disposer that clears the timeout and removes the listener.
 */
export function startConsentListener(
  onResolve: (action: ConsentAction, state: ConsentState) => void,
  opts?: { timeoutMs?: number },
): () => void {
  if (typeof window === "undefined") return () => {};

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let hasResolved = false;
  let tcfListenerId: number | undefined;

  const resolve = (action: ConsentAction, gdprApplies: boolean | null, timedOut: boolean) => {
    hasResolved = true;
    consentState = {
      action,
      gdprApplies,
      resolvedAt: timedOut ? null : Date.now(),
      timedOut,
    };
    onResolve(action, getConsentState());
  };

  timeoutId = setTimeout(() => {
    timeoutId = null;
    if (hasResolved) return;
    resolve("pending", consentState.gdprApplies, true);
  }, opts?.timeoutMs ?? CMP_TIMEOUT_MS);

  if (window.__tcfapi) {
    window.__tcfapi("addEventListener", 2, (tcData, success) => {
      if (!success) return;
      if (typeof tcData.listenerId === "number") tcfListenerId = tcData.listenerId;
      const action = deriveConsentAction(tcData);
      if (action === "pending") {
        // Intermediate event (e.g. "cmpuishown") — reflect what we now know
        // about the region without treating it as a resolution.
        consentState = { ...consentState, gdprApplies: tcData.gdprApplies ?? consentState.gdprApplies };
        return;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      resolve(action, tcData.gdprApplies ?? null, false);
    });
  }

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (window.__tcfapi && tcfListenerId !== undefined) {
      window.__tcfapi("removeEventListener", 2, () => {}, tcfListenerId);
    }
  };
}
