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
