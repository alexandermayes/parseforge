import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Drives the real `wclQuery` through scripted `fetch` responses — vitest's own
// `vi` is the entire mocking surface (D-15): no MSW, no new dependency, and
// no change to anything lib/wcl-client.ts exports. `fetch` is stubbed before
// any call ever leaves the machine; the token cache module is mocked so no
// Redis environment is needed; WCL_CLIENT_ID/SECRET are obvious placeholder
// strings restored in afterEach — no real credential is ever read or written
// here (T-02-24).
//
// wcl-client.ts caches the OAuth token AND every successful query result at
// module scope, so each `it()` below resets the module registry
// (`vi.resetModules()`) and re-imports "./wcl-client" fresh — otherwise a
// later test would silently reuse an earlier test's cached token/result
// without ever calling the stubbed fetch. Every scenario also uses a
// distinct query string, belt-and-suspenders against the same query-cache
// hazard.

vi.mock("./kv-cache", () => ({
  cacheGet: vi.fn().mockResolvedValue(undefined),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDelete: vi.fn().mockResolvedValue(undefined),
}));

const ORIGINAL_ENV = { ...process.env };

interface MockFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

function mockResponse(overrides: Partial<MockFetchResponse> = {}): MockFetchResponse {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => "",
    ...overrides,
  };
}

function tokenResponse(token = "test-access-token"): MockFetchResponse {
  return mockResponse({ json: async () => ({ access_token: token, expires_in: 3600 }) });
}

function graphqlSuccess(data: unknown): MockFetchResponse {
  return mockResponse({ json: async () => ({ data }) });
}

function graphqlErrors(messages: string[]): MockFetchResponse {
  return mockResponse({ json: async () => ({ errors: messages.map((message) => ({ message })) }) });
}

beforeEach(() => {
  vi.resetModules();
  process.env.WCL_CLIENT_ID = "test-client-id";
  process.env.WCL_CLIENT_SECRET = "test-client-secret";
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe("wclQuery", () => {
  it("Test 1: mints a token, issues the GraphQL request, and resolves to the response's data field", async () => {
    const { wclQuery } = await import("./wcl-client");
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(graphqlSuccess({ hello: "world" }));

    const result = await wclQuery("query Test1 { hello }");
    expect(result).toEqual({ hello: "world" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("Test 2: a 401 on the GraphQL request clears the cached token, mints a fresh one, and the retried attempt's 200 resolves", async () => {
    const { wclQuery } = await import("./wcl-client");
    const { cacheDelete } = await import("./kv-cache");
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch
      .mockResolvedValueOnce(tokenResponse("token-1"))
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 401 }))
      .mockResolvedValueOnce(tokenResponse("token-2"))
      .mockResolvedValueOnce(graphqlSuccess({ refreshed: true }));

    const result = await wclQuery("query Test2 { retryAfter401 }");
    expect(result).toEqual({ refreshed: true });
    // 2 token mints + 2 GraphQL attempts proves the refresh-and-retry path
    // actually ran, not merely that the call eventually succeeded.
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(cacheDelete).toHaveBeenCalledWith("wcl:token");
  });

  it("Test 3: a 429 on every attempt throws a WCLError whose kind is rate_limited and whose status is 429", async () => {
    vi.useFakeTimers();
    const { wclQuery } = await import("./wcl-client");
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 429, text: async () => "rate limited" }))
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 429, text: async () => "rate limited" }))
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 429, text: async () => "rate limited" }));

    const pending = wclQuery("query Test3 { retryExhausted429 }").catch((err) => err);
    await vi.runAllTimersAsync();
    const err = await pending;

    expect(err).toMatchObject({ kind: "rate_limited", status: 429 });
    // 1 token mint + 3 exhausted GraphQL attempts (MAX_RETRIES = 3).
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("Test 4: a 500 on every attempt throws a WCLError whose kind is upstream", async () => {
    vi.useFakeTimers();
    const { wclQuery } = await import("./wcl-client");
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 500, text: async () => "server error" }))
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 500, text: async () => "server error" }))
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 500, text: async () => "server error" }));

    const pending = wclQuery("query Test4 { retryExhausted500 }").catch((err) => err);
    await vi.runAllTimersAsync();
    const err = await pending;

    expect(err).toMatchObject({ kind: "upstream" });
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("Test 5: an aborted request on every attempt throws a WCLError whose kind is timeout", async () => {
    vi.useFakeTimers();
    const { wclQuery } = await import("./wcl-client");
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    mockFetch
      .mockResolvedValueOnce(tokenResponse())
      .mockRejectedValueOnce(abortError)
      .mockRejectedValueOnce(abortError)
      .mockRejectedValueOnce(abortError);

    const pending = wclQuery("query Test5 { retryExhaustedTimeout }").catch((err) => err);
    await vi.runAllTimersAsync();
    const err = await pending;

    expect(err).toMatchObject({ kind: "timeout" });
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("Test 6: a GraphQL error saying a report does not exist throws kind not_found", async () => {
    const { wclQuery } = await import("./wcl-client");
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(graphqlErrors(["Report does not exist"]));

    await expect(wclQuery("query Test6 { notFound }")).rejects.toMatchObject({
      kind: "not_found",
    });
  });

  it("Test 7: a GraphQL error mentioning permission throws kind private", async () => {
    const { wclQuery } = await import("./wcl-client");
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(graphqlErrors(["You do not have permission to view this report"]));

    await expect(wclQuery("query Test7 { private }")).rejects.toMatchObject({
      kind: "private",
    });
  });

  it("Test 8: a GraphQL error with unrecognised text throws kind upstream", async () => {
    const { wclQuery } = await import("./wcl-client");
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(graphqlErrors(["Internal server hiccup"]));

    await expect(wclQuery("query Test8 { unrecognised }")).rejects.toMatchObject({
      kind: "upstream",
    });
  });

  it("Test 9: every thrown WCLError exposes a non-empty userMessage that does not carry the raw upstream detail", async () => {
    const { wclQuery } = await import("./wcl-client");
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    const rawDetail = "Database connection to shard 7 refused unexpectedly";
    mockFetch
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(graphqlErrors([rawDetail]));

    let caught: unknown;
    try {
      await wclQuery("query Test9 { userMessageBoundary }");
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(Error);
    const err = caught as { userMessage: string };
    expect(typeof err.userMessage).toBe("string");
    expect(err.userMessage.length).toBeGreaterThan(0);
    expect(err.userMessage).not.toContain(rawDetail);
  });

  it("Test 10: with either credential absent, the call rejects with a message naming both environment variable names", async () => {
    delete process.env.WCL_CLIENT_ID;
    const { wclQuery: wclQueryNoId } = await import("./wcl-client");
    await expect(wclQueryNoId("query Test10a { missingId }")).rejects.toThrow(
      /WCL_CLIENT_ID.*WCL_CLIENT_SECRET|WCL_CLIENT_SECRET.*WCL_CLIENT_ID/,
    );

    vi.resetModules();
    process.env.WCL_CLIENT_ID = "test-client-id";
    delete process.env.WCL_CLIENT_SECRET;
    const { wclQuery: wclQueryNoSecret } = await import("./wcl-client");
    await expect(wclQueryNoSecret("query Test10b { missingSecret }")).rejects.toThrow(
      /WCL_CLIENT_ID.*WCL_CLIENT_SECRET|WCL_CLIENT_SECRET.*WCL_CLIENT_ID/,
    );
  });
});
