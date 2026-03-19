import type { WCLPlayerDetails } from "./wcl-types";

/**
 * Flatten the nested playerDetails response from WCL into a flat array.
 * Handles both the direct `{ playerDetails: Record<string, WCLPlayerDetails[]> }`
 * format and the full response wrapper.
 */
export function flattenPlayerDetails(
  raw: { data?: { playerDetails?: Record<string, WCLPlayerDetails[]> } } | undefined
): WCLPlayerDetails[] {
  return Object.values(raw?.data?.playerDetails ?? {}).flat();
}

/**
 * Parse the player spec from WCL playerDetails, handling three formats:
 * - Object with `spec` key: `{ spec: "Guardian", count: 1 }`
 * - Plain string: `"Guardian"`
 * - Fallback: extract from icon string `"Druid-Guardian"` → `"Guardian"`
 */
export function parsePlayerSpec(player: WCLPlayerDetails): string {
  const rawSpec = player.specs?.[0];
  return typeof rawSpec === "object" && rawSpec !== null && "spec" in rawSpec
    ? (rawSpec as unknown as { spec: string }).spec
    : typeof rawSpec === "string"
      ? rawSpec
      : player.icon?.split("-")[1] ?? "";
}
