import { ParsedWCLUrl } from "./wcl-types";

/**
 * Parse a Warcraft Logs URL into its components.
 * Supports:
 *   https://classic.warcraftlogs.com/reports/ABC123#fight=5&source=12
 *   https://www.warcraftlogs.com/reports/ABC123#fight=5&source=12
 *   https://www.warcraftlogs.com/reports/ABC123
 *   ABC123 (just the report code)
 */
export function parseWCLUrl(input: string): ParsedWCLUrl | null {
  const trimmed = input.trim();

  // Try as a plain report code (alphanumeric, 16 chars typical)
  if (/^[a-zA-Z0-9]{10,20}$/.test(trimmed)) {
    return { code: trimmed };
  }

  // Try as a URL
  try {
    // Handle fragment params
    const urlStr = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const url = new URL(urlStr);

    const pathMatch = url.pathname.match(/\/reports\/([a-zA-Z0-9]+)/);
    if (!pathMatch) return null;

    const code = pathMatch[1];
    const result: ParsedWCLUrl = { code };

    // Parse fragment params (#fight=5&source=12)
    if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.slice(1));
      const fight = hashParams.get("fight");
      const source = hashParams.get("source");

      if (fight && fight !== "last") {
        result.fightId = parseInt(fight, 10);
      }
      if (source) {
        result.sourceId = parseInt(source, 10);
      }
    }

    return result;
  } catch {
    return null;
  }
}

export function buildWCLUrl(code: string, fightId?: number, sourceId?: number): string {
  let url = `https://classic.warcraftlogs.com/reports/${code}`;
  const parts: string[] = [];
  if (fightId !== undefined) parts.push(`fight=${fightId}`);
  if (sourceId !== undefined) parts.push(`source=${sourceId}`);
  if (parts.length > 0) url += `#${parts.join("&")}`;
  return url;
}
