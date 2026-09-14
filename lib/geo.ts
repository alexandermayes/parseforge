// Server-side consent-region classification, in the style of lib/consent.ts:
// typed input, narrow return, no throwing. The source of truth is Google's own
// AdSense support page ("the European Economic Area (EEA), the UK, and
// Switzerland" — https://support.google.com/adsense/answer/10961068), NOT a
// hand-typed memory of "EU countries" — EEA adds Iceland, Liechtenstein and
// Norway, which "EU" does not include. A country present here without a real
// CMP dialog would be dropped forever (today's outage in miniature); a
// country with a dialog but absent here would be captured before consent.
// Unknown, missing, or blank input fails CLOSED to "this is a consent
// region" (D-03) — this project never assumes a visitor is safe to capture
// without consent just because we couldn't classify them.

/**
 * The exact set of ISO 3166-1 alpha-2 country codes Google Privacy &
 * Messaging's GDPR message targets: the 27 EU member states, the three
 * non-EU EEA states (Iceland, Liechtenstein, Norway), the UK, and
 * Switzerland. Deliberately EXCLUDES Gibraltar (GI), Isle of Man (IM),
 * Jersey (JE) and Guernsey (GG) — Google's support page does not enumerate
 * them, and Task 2 of 02.1-01-PLAN.md records the developer's decision to
 * leave them out pending further evidence.
 */
export const CONSENT_REGIONS: ReadonlySet<string> = new Set([
  // 27 EU member states
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  // Non-EU EEA states
  "IS", "LI", "NO",
  // UK + Switzerland
  "GB", "CH",
]);

/**
 * Classifies a country code as inside or outside the consent-region set.
 * Trims and upper-cases before comparison so a lower-case or padded header
 * value classifies identically to its canonical upper-case form. A nullish
 * or blank value fails CLOSED to `true` (consent region) — an unknown
 * visitor is never treated as safe to capture without consent (D-03).
 */
export function isConsentRegionCode(code: string | null | undefined): boolean {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return true;
  return CONSENT_REGIONS.has(normalized);
}
