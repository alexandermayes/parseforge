import { NextRequest, NextResponse } from "next/server";
import { isConsentRegionCode } from "@/lib/geo";
import { logEvent } from "@/lib/observability";

// The single server surface that reads a Vercel geolocation request header
// (D-02) — no layout, page, or client component may read one directly, so
// the boolean this route returns is the ONLY way that information reaches
// the browser. `force-dynamic` documents per-request intent explicitly;
// since Next.js 15, Route Handler GET functions are not cached by default,
// so this always executes fresh regardless.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country");
  const normalized = country?.trim();

  if (!normalized && process.env.VERCEL) {
    // Countable in Vercel logs (D-03) — lets us see how often the header is
    // missing OR blank/whitespace-only on real traffic without blocking or
    // slowing the response. `isConsentRegionCode` already treats both cases
    // identically (fail closed); this condition mirrors that so the blank
    // case isn't under-counted relative to the outright-missing case.
    logEvent("geo_header_missing", { route: "api-geo" });
  }

  // Fail closed: unknown/missing header ⇒ consent region (D-03).
  const isConsentRegion = isConsentRegionCode(country);

  return NextResponse.json(
    { isConsentRegion },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
