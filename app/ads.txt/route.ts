import { NextResponse } from "next/server";

/**
 * The AdSense publisher declaration (the `ads.txt` spec). A Route Handler is
 * chosen over a static `public/ads.txt` file so the declaration is
 * verifiable from the running app and can fail closed on a missing
 * publisher id — an `ads.txt` naming an empty publisher is worse than none,
 * because AdSense reads it as an authorization failure
 * (04-RESEARCH.md Pattern 3 / Assumption A2). Statically cacheable: this
 * reads only a build-time env var, so it is never marked `force-dynamic`.
 */
export async function GET(): Promise<NextResponse> {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? "";
  if (pubId === "") {
    return new NextResponse(null, { status: 404 });
  }

  const body = `google.com, pub-${pubId}, DIRECT, f08c47fec0942fa0\n`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
