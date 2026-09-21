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

/**
 * The path that admitted an event to PostHog (02.1-CONTEXT.md D-07). Deliberately
 * NOT the same union as `ConsentAction` above, even though both have four members:
 * `ConsentAction` is the raw TCF signal, this is the *gate* that decided whether to
 * capture at all, and the two don't map 1:1 (`opt-in-non-eea` collapses into
 * `tcf-accept` here; `cookieless` and `pending` become `tcf-reject` / `tcf-timeout`).
 * Registered as the `consent_gate_path` super property before any capture.
 */
export type ConsentGatePath =
  | "geo-non-consent-region"
  | "tcf-accept"
  | "tcf-reject"
  | "tcf-timeout";

/**
 * The single decision a consent gate outcome resolves to: which gate path admitted
 * the visitor, which SDK calls to make, and (optionally) which event to fire to
 * make that decision visible in PostHog itself.
 */
export interface ConsentGateOutcome {
  gatePath: ConsentGatePath;
  optIn: boolean;
  startReplay: boolean;
  event: "consent_resolved" | "consent_unavailable" | null;
  eventProps: Record<string, string | boolean>;
}

/**
 * The pure merge of the server-side geo decision and the client-side TCF action
 * into the SDK calls `PostHogProvider` should make (D-06). The provider becomes a
 * thin executor of this function's result; every branch here maps 1:1 to a
 * pre-existing SDK call site, so behaviour does not change — only who decides.
 *
 * A non-consent-region visitor (`isConsentRegion === false`) ignores `tcfAction`
 * entirely, whatever its value or arrival order: there is no `__tcfapi` listener
 * on that path at all (D-04), and geo is the sole authority for it. A TCF action
 * can only be non-null here if some future caller wires up a listener it was never
 * supposed to have — even then, the geo decision must win, because reintroducing
 * a CMP dependency on this path is exactly the bug this hotfix removes.
 *
 * A consent-region visitor (`isConsentRegion === true`) reproduces today's SDK
 * calls exactly rather than improving them (D-05): `opt-in-full` opts in and
 * starts replay, `cookieless` does neither (memory-only persistence and no replay
 * are already the `cookieless_mode`/`disable_session_recording` defaults), and
 * `pending` (reached only via `CMP_TIMEOUT_MS`'s fail-closed timeout) does neither
 * either. Making pre-choice EEA/UK capture cookieless instead of dropped is
 * Phase 1 D-06's stated intent that the SDK never actually honoured — explicitly
 * deferred here, not fixed (`02.1-CONTEXT.md` `<deferred>`). `tcfAction === null`
 * means the TCF listener hasn't resolved yet, so there is nothing to apply — the
 * caller keeps waiting rather than acting on an absent signal.
 *
 * `opt-in-non-eea` reached with `isConsentRegion` true is a region-list-versus-CMP
 * mismatch: our server-side geo classification said "not a consent region" is
 * false (so we started the TCF listener), yet the CMP itself told us
 * `gdprApplies: false`. That disagreement is worth surfacing rather than silently
 * absorbing — it resolves to `tcf-accept` with `gdpr_applies: false` in its event
 * props, additive observability only; the SDK calls made are identical to the
 * `opt-in-full` case, so this backstop does not change what capture happens, only
 * whether the mismatch is countable.
 */
export function deriveConsentGateOutcome(
  isConsentRegion: boolean,
  tcfAction: ConsentAction | null,
): ConsentGateOutcome | null {
  if (!isConsentRegion) {
    return {
      gatePath: "geo-non-consent-region",
      optIn: true,
      startReplay: true,
      event: null,
      eventProps: {},
    };
  }

  if (tcfAction === null) return null;

  switch (tcfAction) {
    case "opt-in-full":
      return {
        gatePath: "tcf-accept",
        optIn: true,
        startReplay: true,
        event: "consent_resolved",
        eventProps: { accepted: true, gdpr_applies: true },
      };
    case "cookieless":
      return {
        gatePath: "tcf-reject",
        optIn: false,
        startReplay: false,
        event: "consent_resolved",
        eventProps: { accepted: false, gdpr_applies: true },
      };
    case "opt-in-non-eea":
      return {
        gatePath: "tcf-accept",
        optIn: true,
        startReplay: true,
        event: "consent_resolved",
        eventProps: { accepted: true, gdpr_applies: false },
      };
    case "pending":
      return {
        gatePath: "tcf-timeout",
        optIn: false,
        startReplay: false,
        event: "consent_unavailable",
        eventProps: { reason: "tcfapi_timeout" },
      };
  }
}

let publishedGatePath: ConsentGatePath | null = null;
const gatePathSubscribers = new Set<(path: ConsentGatePath) => void>();

/**
 * Publishes the single resolved consent gate path (04-CONTEXT.md D-07, the
 * 04-03 "promote" decision): `PostHogProvider` calls this once it resolves
 * an outcome; any future consumer (the ad gate today, others later)
 * subscribes via `subscribeConsentGatePath` below rather than deriving its
 * own. A re-publish of the already-published value is a no-op — only a
 * genuine decision change (e.g. a CMP re-confirmation flow) notifies.
 */
export function publishConsentGatePath(path: ConsentGatePath): void {
  if (publishedGatePath === path) return;
  publishedGatePath = path;
  for (const callback of gatePathSubscribers) callback(path);
}

/** The last published consent gate path, or `null` if none has published yet. */
export function getConsentGatePath(): ConsentGatePath | null {
  return publishedGatePath;
}

/**
 * Subscribes to the published consent gate path. If a path has already been
 * published, `callback` fires synchronously with it immediately (a late
 * mount must not miss the decision); it then fires again on every
 * subsequent change. Returns a disposer that removes the subscription.
 */
export function subscribeConsentGatePath(
  callback: (path: ConsentGatePath) => void,
): () => void {
  gatePathSubscribers.add(callback);
  if (publishedGatePath !== null) callback(publishedGatePath);
  return () => {
    gatePathSubscribers.delete(callback);
  };
}
