import { describe, it, expect } from "vitest";
import { parseBody, isValidReportCode } from "./api-utils";

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("isValidReportCode", () => {
  it("accepts 10–20 char alphanumeric codes", () => {
    expect(isValidReportCode("aBcD1234EfGh5678")).toBe(true);
    expect(isValidReportCode("aBcD123456")).toBe(true); // exactly 10
  });

  it("rejects wrong length, non-alphanumeric, and non-strings", () => {
    expect(isValidReportCode("short")).toBe(false); // < 10
    expect(isValidReportCode("a".repeat(21))).toBe(false); // > 20
    expect(isValidReportCode("aB_cD1234EfGh")).toBe(false); // underscore
    expect(isValidReportCode("../etc/passwd")).toBe(false);
    expect(isValidReportCode(123)).toBe(false);
    expect(isValidReportCode(null)).toBe(false);
    expect(isValidReportCode(undefined)).toBe(false);
  });
});

describe("parseBody", () => {
  it("returns the parsed body when required fields are present", async () => {
    const result = await parseBody<{ reportCode: string; fightId: number; sourceId: number }>(
      jsonReq({ reportCode: "aBcD1234EfGh5678", fightId: 5, sourceId: 12 }),
      ["reportCode", "fightId", "sourceId"],
    );
    expect("body" in result).toBe(true);
    if ("body" in result) {
      expect(result.body).toEqual({ reportCode: "aBcD1234EfGh5678", fightId: 5, sourceId: 12 });
    }
  });

  it("treats 0 as present (fight/source slots are 0-indexed)", async () => {
    const result = await parseBody<{ reportCode: string; fightId: number; sourceId: number }>(
      jsonReq({ reportCode: "aBcD1234EfGh5678", fightId: 0, sourceId: 0 }),
      ["reportCode", "fightId", "sourceId"],
    );
    expect("body" in result).toBe(true);
  });

  it("400s when a required field is missing, null, or empty string", async () => {
    const missing = await parseBody<{ reportCode: string; fightId: number }>(
      jsonReq({ fightId: 5 }),
      ["reportCode", "fightId"],
    );
    expect("error" in missing).toBe(true);
    if ("error" in missing) expect(missing.error.status).toBe(400);

    const empty = await parseBody<{ reportCode: string; fightId: number }>(
      jsonReq({ reportCode: "", fightId: 5 }),
      ["reportCode", "fightId"],
    );
    expect("error" in empty).toBe(true);
  });

  it("400s on invalid JSON", async () => {
    const badReq = new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const result = await parseBody(badReq, []);
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(400);
  });
});
