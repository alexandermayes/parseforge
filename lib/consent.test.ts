import { describe, it, expect, afterEach, vi } from "vitest";
import {
  deriveConsentAction,
  startConsentListener,
  getConsentState,
} from "./consent";

type TcfCallback = (tcData: unknown, success: boolean) => void;

/** Minimal stand-in for the browser global; deleted after each test. */
function stubWindow(tcfapi?: (cmd: string, version: 2, cb: TcfCallback) => void) {
  (globalThis as { window?: unknown }).window = tcfapi ? { __tcfapi: tcfapi } : {};
}

describe("deriveConsentAction", () => {
  it("opts in immediately for non-EEA/UK visitors, regardless of event status", () => {
    expect(
      deriveConsentAction({ gdprApplies: false, eventStatus: "tcloaded" }),
    ).toBe("opt-in-non-eea");
  });

  it("resolves to opt-in-full when an EEA/UK visitor completes the dialog and accepts purpose 1", () => {
    expect(
      deriveConsentAction({
        gdprApplies: true,
        eventStatus: "useractioncomplete",
        purpose: { consents: { 1: true } },
      }),
    ).toBe("opt-in-full");
  });

  it("resolves to cookieless when an EEA/UK visitor completes the dialog and rejects purpose 1", () => {
    expect(
      deriveConsentAction({
        gdprApplies: true,
        eventStatus: "useractioncomplete",
        purpose: { consents: { 1: false } },
      }),
    ).toBe("cookieless");
  });

  it("resolves to pending while the EEA/UK dialog is still showing", () => {
    expect(
      deriveConsentAction({ gdprApplies: true, eventStatus: "cmpuishown" }),
    ).toBe("pending");
  });

  it("resolves to pending on a nullish payload (fail closed on unknown region)", () => {
    expect(deriveConsentAction(null)).toBe("pending");
    expect(deriveConsentAction(undefined)).toBe("pending");
  });

  it("resolves to pending when gdprApplies is absent from the payload", () => {
    expect(deriveConsentAction({ eventStatus: "tcloaded" })).toBe("pending");
  });

  it("reads purpose 1 consent tolerantly under a string key", () => {
    expect(
      deriveConsentAction({
        gdprApplies: true,
        eventStatus: "useractioncomplete",
        purpose: { consents: { "1": true } },
      }),
    ).toBe("opt-in-full");
  });
});

describe("getConsentState", () => {
  it("starts pending and unresolved before any signal arrives", () => {
    expect(getConsentState()).toEqual(
      expect.objectContaining({ action: "pending", gdprApplies: null, resolvedAt: null }),
    );
  });
});

describe("startConsentListener", () => {
  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as { window?: unknown }).window;
  });

  it("invokes the callback with opt-in-non-eea as soon as the CMP reports GDPR does not apply", () => {
    let tcfCallback: TcfCallback | undefined;
    stubWindow((_cmd, _v, cb) => {
      tcfCallback = cb;
    });

    const onResolve = vi.fn();
    const dispose = startConsentListener(onResolve);
    tcfCallback?.({ gdprApplies: false, eventStatus: "tcloaded" }, true);

    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith(
      "opt-in-non-eea",
      expect.objectContaining({ action: "opt-in-non-eea" }),
    );
    dispose();
  });

  it("invokes the callback with pending exactly once after CMP_TIMEOUT_MS with no TCF event", () => {
    vi.useFakeTimers();
    stubWindow(); // no __tcfapi at all — simulates a blocked/absent CMP

    const onResolve = vi.fn();
    const dispose = startConsentListener(onResolve, { timeoutMs: 1000 });

    vi.advanceTimersByTime(1000);
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith(
      "pending",
      expect.objectContaining({ action: "pending", timedOut: true }),
    );

    // A later tick must not re-trigger the timeout branch.
    vi.advanceTimersByTime(10_000);
    expect(onResolve).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("updates getConsentState() on a late TCF event after a timeout, without re-emitting the timeout path", () => {
    vi.useFakeTimers();
    let tcfCallback: TcfCallback | undefined;
    stubWindow((_cmd, _v, cb) => {
      tcfCallback = cb;
    });

    const onResolve = vi.fn();
    const dispose = startConsentListener(onResolve, { timeoutMs: 1000 });

    vi.advanceTimersByTime(1000);
    expect(onResolve).toHaveBeenCalledTimes(1);

    tcfCallback?.(
      {
        gdprApplies: true,
        eventStatus: "useractioncomplete",
        purpose: { consents: { 1: true } },
      },
      true,
    );

    expect(onResolve).toHaveBeenCalledTimes(2);
    expect(onResolve).toHaveBeenLastCalledWith(
      "opt-in-full",
      expect.objectContaining({ action: "opt-in-full", gdprApplies: true }),
    );
    expect(getConsentState()).toEqual(
      expect.objectContaining({ action: "opt-in-full", gdprApplies: true }),
    );
    dispose();
  });
});
