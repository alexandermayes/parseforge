/**
 * The single source of truth for every URL this phase copies to a clipboard,
 * and for the `ref` allowlist. No share surface should ever read the
 * browser's current URL again (D-09) — every caller passes an explicit
 * `origin` so the caller decides between production and a preview host, and
 * a test can pin the exact output. Pure module: no browser globals, no
 * runtime imports.
 */

/** The three allowed inbound-attribution values (D-16). */
export type ShareRefKind = "share" | "parse" | "awards";

export const SHARE_REF_KINDS: readonly ShareRefKind[] = ["share", "parse", "awards"] as const;

/**
 * Validates an untrusted `ref` query-string value against the fixed
 * allowlist. Returns the matching kind only on an exact, case-sensitive
 * match; everything else (including an unknown word, a case variant, or a
 * URL/script-tag payload) returns null rather than being passed through to a
 * PostHog event property (RESEARCH Pitfall 5, ASVS V5).
 */
export function parseShareRef(raw: string | null | undefined): ShareRefKind | null {
  if (raw == null) return null;
  return (SHARE_REF_KINDS as readonly string[]).includes(raw) ? (raw as ShareRefKind) : null;
}

/**
 * Report-level permalink: `/analyze/{code}?fight={id}&ref=share`. Appends
 * `fight` only when `fightId` is a number; never appends `source` or `tab`.
 */
export function buildReportShareUrl(
  origin: string,
  { reportCode, fightId }: { reportCode: string; fightId: number | null },
): string {
  const params = new URLSearchParams();
  if (typeof fightId === "number") params.set("fight", String(fightId));
  params.set("ref", "share");
  return `${origin}/analyze/${reportCode}?${params.toString()}`;
}

/**
 * Player-level permalink: `/analyze/{code}?fight={id}&source={id}&ref=parse`.
 * `source` is always present; never appends `tab`.
 */
export function buildPlayerShareUrl(
  origin: string,
  { reportCode, fightId, sourceId }: { reportCode: string; fightId: number; sourceId: number },
): string {
  const params = new URLSearchParams();
  params.set("fight", String(fightId));
  params.set("source", String(sourceId));
  params.set("ref", "parse");
  return `${origin}/analyze/${reportCode}?${params.toString()}`;
}

/**
 * Awards permalink: `/analyze/{code}?fight={id}&view=awards&ref=awards`.
 * Never appends `source` or `tab`.
 */
export function buildAwardsShareUrl(
  origin: string,
  { reportCode, fightId }: { reportCode: string; fightId: number },
): string {
  const params = new URLSearchParams();
  params.set("fight", String(fightId));
  params.set("view", "awards");
  params.set("ref", "awards");
  return `${origin}/analyze/${reportCode}?${params.toString()}`;
}

/**
 * Relative `/og` path for the awards card's in-app preview `<img>` (plan
 * 03-04). Carries `report`, `fight` and `view=awards`; no `ref` — the OG
 * route ignores it.
 */
export function buildAwardsOgPath({
  reportCode,
  fightId,
}: {
  reportCode: string;
  fightId: number;
}): string {
  const params = new URLSearchParams();
  params.set("report", reportCode);
  params.set("fight", String(fightId));
  params.set("view", "awards");
  return `/og?${params.toString()}`;
}
