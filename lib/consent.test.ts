import { describe, it, expect } from "vitest";
import { deriveConsentAction } from "./consent";

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
