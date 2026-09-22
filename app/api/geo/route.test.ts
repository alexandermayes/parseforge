import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function makeRequest(headers?: Record<string, string>) {
  return new NextRequest("http://localhost/api/geo", { headers });
}

describe("GET /api/geo", () => {
  const originalVercel = process.env.VERCEL;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = originalVercel;
    }
  });

  it("resolves isConsentRegion true for a consent-region country header", async () => {
    const res = await GET(makeRequest({ "x-vercel-ip-country": "DE" }));
    expect(await res.json()).toEqual({ isConsentRegion: true });
  });

  it("resolves isConsentRegion false for a non-consent-region country header", async () => {
    const res = await GET(makeRequest({ "x-vercel-ip-country": "US" }));
    expect(await res.json()).toEqual({ isConsentRegion: false });
  });

  it("resolves isConsentRegion true when no country header is present (fail closed)", async () => {
    const res = await GET(makeRequest());
    expect(await res.json()).toEqual({ isConsentRegion: true });
  });

  it("resolves isConsentRegion false for a lower-case country header", async () => {
    const res = await GET(makeRequest({ "x-vercel-ip-country": "us" }));
    expect(await res.json()).toEqual({ isConsentRegion: false });
  });

  it("sets Cache-Control to private, no-store on every response", async () => {
    const res = await GET(makeRequest({ "x-vercel-ip-country": "DE" }));
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("never sets a Set-Cookie header", async () => {
    const res = await GET(makeRequest({ "x-vercel-ip-country": "DE" }));
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });

  it("logs exactly one geo_header_missing line when the header is absent and process.env.VERCEL is set", async () => {
    process.env.VERCEL = "1";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await GET(makeRequest());

    const missingLogs = logSpy.mock.calls.filter(([line]) =>
      typeof line === "string" && line.includes("geo_header_missing"),
    );
    expect(missingLogs).toHaveLength(1);
  });

  it("does not log geo_header_missing when the header is present", async () => {
    process.env.VERCEL = "1";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await GET(makeRequest({ "x-vercel-ip-country": "DE" }));

    const missingLogs = logSpy.mock.calls.filter(([line]) =>
      typeof line === "string" && line.includes("geo_header_missing"),
    );
    expect(missingLogs).toHaveLength(0);
  });

  it("logs exactly one geo_header_missing line when the header is whitespace-only", async () => {
    process.env.VERCEL = "1";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const res = await GET(makeRequest({ "x-vercel-ip-country": "   " }));

    const missingLogs = logSpy.mock.calls.filter(([line]) =>
      typeof line === "string" && line.includes("geo_header_missing"),
    );
    expect(missingLogs).toHaveLength(1);
    // Still fails closed (consent region) exactly like a missing header.
    expect(await res.json()).toEqual({ isConsentRegion: true });
  });
});
