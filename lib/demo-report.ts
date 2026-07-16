// The report featured by the landing-page "See a live example" button.
//
// This must always point at a PUBLIC Warcraft Logs report so the button never
// dead-ends a first-time visitor. To feature a different parse, swap the values
// below and confirm it loads publicly (e.g. open /og?report=<code>&fight=<f>&source=<s>
// and check it returns an image).
export const DEMO_REPORT = {
  code: "ZjKgNYxVcAqR8pGJ",
  fight: 23,
  source: 12,
} as const;

/** Deep link to the featured player scorecard for the demo report. */
export function demoReportPath(): string {
  const { code, fight, source } = DEMO_REPORT;
  return `/analyze/${code}?fight=${fight}&source=${source}&tab=player`;
}
