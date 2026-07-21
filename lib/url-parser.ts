// Deliberate duplicate: the Discord bot keeps a byte-for-byte-identical copy at
// `bot/src/util/parse-url.ts` (separate package, can't import from here). Port
// any change to both.
import { ParsedWCLUrl } from "./wcl-types";

/**
 * Pull fight/source out of a raw fragment/query blob. Handles both the
 * hash style (`#fight=5&source=12`) and the query style (`?fight=5&source=12`)
 * that Warcraft Logs uses interchangeably.
 */
function extractFightSource(...parts: string[]): {
  fightId?: number;
  sourceId?: number;
} {
  const blob = parts.filter(Boolean).join("&");
  const out: { fightId?: number; sourceId?: number } = {};

  const fight = blob.match(/(?:^|[#&?])fight=([^&\s]+)/);
  if (fight && fight[1] !== "last") {
    const n = parseInt(fight[1], 10);
    if (!Number.isNaN(n)) out.fightId = n;
  }

  const source = blob.match(/(?:^|[#&?])source=(\d+)/);
  if (source) {
    const n = parseInt(source[1], 10);
    if (!Number.isNaN(n)) out.sourceId = n;
  }

  return out;
}

/**
 * Parse a Warcraft Logs URL into its components.
 * Supports:
 *   https://classic.warcraftlogs.com/reports/ABC123#fight=5&source=12
 *   https://www.warcraftlogs.com/reports/ABC123?fight=5&source=12
 *   https://www.warcraftlogs.com/reports/ABC123
 *   ABC123 (just the report code)
 *   Pasted text with a report URL somewhere inside it (e.g. shared from a
 *   phone or Discord: "check this out https://.../reports/ABC123 gg")
 */
export function parseWCLUrl(input: string): ParsedWCLUrl | null {
  const trimmed = input.trim();

  // Try as a plain report code (alphanumeric, 16 chars typical)
  if (/^[a-zA-Z0-9]{10,20}$/.test(trimmed)) {
    return { code: trimmed };
  }

  // Try as a well-formed URL first — most reliable for fragment/query params.
  try {
    const urlStr = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const url = new URL(urlStr);

    const pathMatch = url.pathname.match(/\/reports\/([a-zA-Z0-9]{10,20})/);
    if (pathMatch) {
      return {
        code: pathMatch[1],
        ...extractFightSource(url.hash, url.search),
      };
    }
  } catch {
    // Not a parseable URL on its own — fall through to a loose scan.
  }

  // Loose fallback: extract a /reports/<code> from text that may include
  // surrounding words (common when sharing from a mobile app or Discord),
  // where the input isn't a bare URL and `new URL()` above fails.
  const loose = trimmed.match(/\/reports\/([a-zA-Z0-9]{10,20})/);
  if (loose) {
    const rest = trimmed.slice(
      trimmed.indexOf(loose[0]) + loose[0].length
    );
    return { code: loose[1], ...extractFightSource(rest) };
  }

  return null;
}

export function buildWCLUrl(code: string, fightId?: number, sourceId?: number): string {
  let url = `https://classic.warcraftlogs.com/reports/${code}`;
  const parts: string[] = [];
  if (fightId !== undefined) parts.push(`fight=${fightId}`);
  if (sourceId !== undefined) parts.push(`source=${sourceId}`);
  if (parts.length > 0) url += `#${parts.join("&")}`;
  return url;
}
