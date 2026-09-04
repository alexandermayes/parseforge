# Testing Patterns

**Analysis Date:** 2026-09-04

## Test Framework

**Runner:**
- Vitest v4.1.10
- Config: `vitest.config.ts`
- Environment: Node.js (not DOM)

**Run Commands:**
```bash
npm test                 # Run all tests once (vitest run)
npm run test:watch      # Watch mode (not defined in package.json but standard)
npx vitest run          # Explicit one-shot run
npx vitest watch        # Watch mode via npx
```

**Test Configuration:**
```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: { "@": root.replace(/\/$/, "") },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
  },
});
```

**Assertion Library:**
- Vitest's built-in `expect()` (compatible with Jest)
- No additional assertion libraries

## Test File Organization

**Location:**
- Colocated in same directory as source file
- Example: `lib/url-parser.ts` → `lib/url-parser.test.ts`
- Example: `lib/api-utils.ts` → `lib/api-utils.test.ts`

**Naming:**
- `{module-name}.test.ts` suffix
- Vitest discovers files matching `lib/**/*.test.ts` and `app/**/*.test.ts`

**Structure:**
```
lib/
├── url-parser.ts
├── url-parser.test.ts
├── api-utils.ts
├── api-utils.test.ts
├── async-pool.ts
├── async-pool.test.ts
├── analysis-engine.ts
├── analysis-engine.test.ts
└── cla-constants.ts
    └── cla-constants.test.ts
```

## Test Structure

**Test Suite Organization:**
```typescript
import { describe, it, expect } from "vitest";
import { parseWCLUrl, buildWCLUrl } from "./url-parser";

describe("parseWCLUrl", () => {
  it("parses a bare report code", () => {
    expect(parseWCLUrl(CODE)).toEqual({ code: CODE });
  });

  it("parses hash-style fight/source", () => {
    expect(
      parseWCLUrl(`https://classic.warcraftlogs.com/reports/${CODE}#fight=5&source=12`),
    ).toEqual({ code: CODE, fightId: 5, sourceId: 12 });
  });

  it("returns null for junk / non-report input", () => {
    expect(parseWCLUrl("not a url")).toBeNull();
  });
});

describe("buildWCLUrl", () => {
  it("builds a bare report URL", () => {
    expect(buildWCLUrl(CODE)).toBe(`https://classic.warcraftlogs.com/reports/${CODE}`);
  });
});
```

**Patterns:**
- One `describe()` block per public function or logical unit
- `it()` blocks test single behavior (happy path + one edge case per test)
- Test names read as sentences: "parses a bare report code", "returns null for junk input"
- No `beforeEach()` or `afterEach()` — tests are independent and isolated
- Helper functions defined inline: `const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))`

## Test Types

**Unit Tests:**
- Test single functions in isolation
- Example: `parseWCLUrl()` tests validate URL parsing logic with various input formats
- Example: `isValidReportCode()` tests validation with boundary cases (length, characters)
- No mocking or stubbing observed; tests verify actual behavior

**Edge Case Testing:**
- Zero-indexed handling: `expect(out).toEqual([0, 1, 2, 3, 4])` — proves indices match input order
- Empty collections: `expect(out).toEqual([])` when given empty array
- Boundary conditions: `expect(isValidReportCode("aBcD123456")).toBe(true)` — exactly 10 chars (minimum)
- Special values: `expect(peak).toBeGreaterThan(1)` — concurrency actually ran parallel

**Error/Invalid Input Testing:**
```typescript
it("rejects wrong length, non-alphanumeric, and non-strings", () => {
  expect(isValidReportCode("short")).toBe(false);          // < 10 chars
  expect(isValidReportCode("a".repeat(21))).toBe(false);   // > 20 chars
  expect(isValidReportCode("aB_cD1234EfGh")).toBe(false);  // underscore
  expect(isValidReportCode("../etc/passwd")).toBe(false);  // path traversal
  expect(isValidReportCode(123)).toBe(false);              // wrong type
  expect(isValidReportCode(null)).toBe(false);             // null
  expect(isValidReportCode(undefined)).toBe(false);        // undefined
});
```

## Mocking

**Framework:** No explicit mocking library used (Vitest provides mocking via `vi`)

**Current Approach:**
- No mocks detected in examined test files (`url-parser.test.ts`, `api-utils.test.ts`, `async-pool.test.ts`)
- Tests call actual functions and verify outputs directly
- Example: `parseWCLUrl()` tests parse real URL strings and validate parsed results

**What NOT to Mock:**
- Pure utility functions (URL parsing, validation) — test them directly
- Data transformation pipelines — verify actual transformations

**When to Mock (if needed in future):**
- Async I/O like API calls (would use `vi.mock()` or `vi.spyOn()`)
- File system access (would stub `fs` module)
- Date/time (would mock `Date.now()`)
- This is handled in integration tests, not covered in current unit test suite

## Test Data & Fixtures

**Inline Fixtures:**
```typescript
// url-parser.test.ts
const CODE = "aBcD1234EfGh5678"; // 16 chars, valid

describe("parseWCLUrl", () => {
  it("parses a bare report code", () => {
    expect(parseWCLUrl(CODE)).toEqual({ code: CODE });
  });
});
```

**Helper Functions:**
```typescript
// api-utils.test.ts
function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("parseBody", () => {
  it("returns the parsed body when required fields are present", async () => {
    const result = await parseBody<{ reportCode: string }>(
      jsonReq({ reportCode: "aBcD1234EfGh5678" }),
      ["reportCode"],
    );
  });
});
```

**Inline Sleep Helper:**
```typescript
// async-pool.test.ts
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("mapPool", () => {
  it("preserves input order regardless of completion order", async () => {
    const delays = [30, 5, 20, 1, 15];
    const out = await mapPool(delays, 2, async (ms, i) => {
      await sleep(ms);
      return i;
    });
  });
});
```

**No Factories or Dedicated Fixtures:**
- Test data is simple and inline (strings, numbers, arrays)
- Complex objects (WCL responses) not tested in unit tests; would be integration tests
- Database seeding not applicable to this codebase

## Async Testing Pattern

**Pattern: Async Test Functions**
```typescript
it("returns the parsed body when required fields are present", async () => {
  const result = await parseBody<{ reportCode: string; fightId: number }>(
    jsonReq({ reportCode: "aBcD1234EfGh5678", fightId: 5 }),
    ["reportCode", "fightId"],
  );
  expect("body" in result).toBe(true);
  if ("body" in result) {
    expect(result.body).toEqual({ reportCode: "aBcD1234EfGh5678", fightId: 5 });
  }
});
```

**Pattern: Awaiting Promises**
- Async test functions use `await` directly
- Vitest automatically waits for promise resolution
- No callback-based done() pattern

## Error/Exception Testing

**Pattern: Discriminated Union Results**
```typescript
it("400s when a required field is missing", async () => {
  const missing = await parseBody<{ reportCode: string; fightId: number }>(
    jsonReq({ fightId: 5 }),
    ["reportCode", "fightId"],
  );
  expect("error" in missing).toBe(true);
  if ("error" in missing) {
    expect(missing.error.status).toBe(400);
  }
});
```

**Pattern: Type Guards with Narrowing**
- Use discriminated unions to distinguish success from error
- Test `"error" in result` to check for error branch
- TypeScript narrows type after guard so `result.body` or `result.error` are safely accessible

## Coverage

**Requirements:** None enforced; no coverage threshold configured

**View Coverage (if desired):**
```bash
npx vitest run --coverage
```

**Current Test Suite:**
- `lib/url-parser.test.ts` — URL parsing and building (5 tests for parseWCLUrl, 3 for buildWCLUrl)
- `lib/api-utils.test.ts` — Validation and body parsing (2 tests for isValidReportCode, 3 for parseBody)
- `lib/async-pool.test.ts` — Concurrent work pooling (4 tests covering order, concurrency, edge cases)
- `lib/cla-constants.test.ts` — Game data ID database verification (3 tests for enchants, consumables)
- `lib/analysis-engine.test.ts` — Core analysis logic (not examined; listed as having lint debt)

## Best Practices Observed

1. **Clear test names** — Tests read as documentation of expected behavior
2. **One assertion per test** (or tightly related assertions in one test)
3. **Arrange-Act-Assert** — Each test follows this pattern implicitly
4. **Edge case coverage** — Boundary conditions and invalid inputs tested
5. **No test interdependence** — Each test is independent; order doesn't matter
6. **Inline helpers** — Small test utilities defined at top of file, not shared across files
7. **Type safety** — Tests use generics and explicit types (`parseBody<{ reportCode: string }>`)

## Common Testing Patterns by Module

**URL/Input Parsing (`url-parser.test.ts`):**
- Happy path test for standard input format
- Variant tests for alternative formats (hash vs query, with/without params)
- Invalid input tests (wrong length, non-alphanumeric)
- "Embedded in text" test (URL discovered in surrounding text)

**Validation (`api-utils.test.ts`):**
- Boundary tests for length/character constraints
- Type tests (wrong type → false)
- Edge case tests (0-indexed values are valid)
- Request parsing with valid and invalid JSON

**Async Work (`async-pool.test.ts`):**
- Order preservation test (async results map to input order)
- Parameter passing test (item and index both passed correctly)
- Concurrency cap test (never exceeds pool size)
- Empty input test

---

*Testing analysis: 2026-09-04*
