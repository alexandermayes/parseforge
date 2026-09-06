#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// token-audit: a standing gate over app/, components/ and lib/.
//
// Enumerates two kinds of hardcoded colour usage that a design-token system
// (Tailwind v4 `@theme`) should never need:
//
//   - `palette-class`  — a Tailwind palette utility (e.g. `text-amber-400`)
//     naming a built-in colour family + numeric shade directly, instead of
//     a semantic token-backed class (`text-tier-artifact`).
//   - `raw-hex`        — a six-digit hex colour literal in source.
//
// A curated, reasoned allowlist exists for the one deliberate exception this
// codebase carries: Satori (`next/og`'s `ImageResponse`) is a static image
// renderer with no CSS engine, so `app/og/route.tsx` and the `_HEX`-suffixed
// maps in `lib/constants.ts` must keep raw hex literals. Every allowlist
// entry must carry a non-empty `reason` — an entry without one is a FATAL
// script-configuration error, independent of mode, because an unexplained
// exception is exactly the silent omission this gate exists to prevent.
//
// The script also inventories `app/globals.css`'s `@theme` categories
// (colour / radius / font / spacing / motion / elevation) — DSGN-01
// requires colour, spacing, motion and elevation to all be present.
//
// Modes:
//   node scripts/token-audit.mjs                  -> gate mode: exit 1 on
//                                                      any non-allowlisted
//                                                      finding or absent
//                                                      required @theme
//                                                      category, 0 otherwise.
//   node scripts/token-audit.mjs --report          -> inspection mode: same
//                                                      output, always exits 0
//                                                      (fatal config errors
//                                                      still exit non-zero).
//   node scripts/token-audit.mjs --markdown <path> -> also writes a markdown
//                                                      report to <path>
//                                                      (creating parent dirs);
//                                                      exit code follows the
//                                                      gate/report rule above.
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const GLOBALS_CSS_PATH = path.join(REPO_ROOT, "app", "globals.css");
const SCAN_DIRS = ["app", "components", "lib"];

// ─── Palette-class detection ────────────────────────────────────────────

const UTILITY_PREFIXES = [
  "text", "bg", "border", "from", "to", "via", "ring", "fill", "stroke",
  "decoration", "outline", "divide", "placeholder",
];

const PALETTE_FAMILIES = [
  "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber",
  "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue",
  "indigo", "violet", "purple", "fuchsia", "pink", "rose",
];

const PALETTE_CLASS_RE = new RegExp(
  `\\b(?:${UTILITY_PREFIXES.join("|")})-(?:${PALETTE_FAMILIES.join("|")})-[0-9]{2,3}\\b`,
  "g",
);

const RAW_HEX_RE = /#[0-9a-fA-F]{6}\b/g;

// ─── Allowlist ───────────────────────────────────────────────────────────
// Every entry MUST carry a non-empty `reason`. Validated at startup below.

// Vendored magicui-style effect components (not pulled from a live registry
// this phase — see 01-UI-SPEC.md "Registry Safety"). Every call site in this
// codebase that renders one of these overrides its color-valued default
// props explicitly (LandingHero.tsx, DpsComparison.tsx, ReportUrlForm.tsx,
// ComparisonSummary.tsx, AnalyzeClient.tsx) — the hex literals below are
// unreachable fallback values, left as shipped to avoid touching third-party-
// sourced files, matching the meteors.tsx precedent (CLAUDE.md).
const VENDORED_EFFECT_FILES = new Set([
  "components/ui/border-beam.tsx",
  "components/ui/magic-card.tsx",
  "components/ui/particles.tsx",
  "components/ui/shimmer-button.tsx",
  "components/ui/shine-border.tsx",
  "components/ui/sparkles-text.tsx",
]);

const ALLOWLIST = [
  {
    id: "og-route-whole-file",
    appliesTo: (relPath) => relPath === "app/og/route.tsx",
    label: "app/og/route.tsx (whole file)",
    reason:
      "Satori (next/og's ImageResponse) is a static image renderer with no CSS " +
      "engine and cannot resolve a CSS custom property; this exception is " +
      "already documented in the file.",
  },
  {
    id: "constants-hex-maps",
    appliesTo: (relPath, declName) =>
      relPath === "lib/constants.ts" && !!declName && declName.endsWith("_HEX"),
    label: "lib/constants.ts declarations ending in _HEX (CLASS_COLORS_HEX, ROLE_COLORS_HEX)",
    reason:
      "Satori-only raw-hex mirrors of the token-backed maps, introduced so " +
      "app/og/route.tsx (which cannot resolve custom properties) has a value " +
      "to read — same reason as the og-route-whole-file exception.",
  },
  {
    id: "opengraph-image-whole-file",
    appliesTo: (relPath) => relPath === "app/opengraph-image.tsx",
    label: "app/opengraph-image.tsx (whole file)",
    reason:
      "Satori (next/og's ImageResponse) is a static image renderer with no CSS " +
      "engine and cannot resolve a CSS custom property — same reason as the " +
      "og-route-whole-file exception.",
  },
  {
    id: "manifest-whole-file",
    appliesTo: (relPath) => relPath === "app/manifest.ts",
    label: "app/manifest.ts (whole file)",
    reason:
      "The Web App Manifest spec's background_color/theme_color fields are " +
      "read by the browser directly from the manifest JSON before any " +
      "stylesheet loads — there is no CSS engine or custom-property cascade " +
      "available at manifest-parse time.",
  },
  {
    id: "vendored-effect-component-defaults",
    appliesTo: (relPath) => VENDORED_EFFECT_FILES.has(relPath),
    label:
      "components/ui/{border-beam,magic-card,particles,shimmer-button,shine-border,sparkles-text}.tsx " +
      "(default prop values)",
    reason:
      "Vendored magicui-style effect components; their hex-valued default " +
      "parameters are unreachable fallback values — every call site in this " +
      "codebase supplies an explicit color/gradient override (see " +
      "app/components/LandingHero.tsx, DpsComparison.tsx, ReportUrlForm.tsx, " +
      "ComparisonSummary.tsx, and AnalyzeClient.tsx). Left as shipped, " +
      "matching the meteors.tsx precedent (CLAUDE.md) of not touching " +
      "vendored effect-component internals beyond what a call site needs. " +
      "Particles additionally requires a literal hex string for its own " +
      "hexToRgb() canvas-color parsing — a canvas 2D context fillStyle cannot " +
      "resolve a CSS custom property.",
  },
  {
    id: "landing-hero-particles-color",
    appliesTo: (relPath, _declName, lineText) =>
      relPath === "app/components/LandingHero.tsx" &&
      /\bcolor="#[0-9a-fA-F]{6}"/.test(lineText ?? ""),
    label: "app/components/LandingHero.tsx (Particles color prop)",
    reason:
      "Particles renders to a <canvas> 2D context and parses this prop via " +
      "hexToRgb() for per-frame alpha compositing — canvas fillStyle cannot " +
      "resolve a CSS custom property (var()), so this one call site must pass " +
      "a literal hex value. See the vendored-effect-component-defaults entry " +
      "for the same constraint inside particles.tsx itself.",
  },
];

function validateAllowlist() {
  const bad = ALLOWLIST.filter((entry) => !entry.reason || !entry.reason.trim());
  if (bad.length > 0) {
    console.error(
      `FATAL: allowlist entr${bad.length === 1 ? "y" : "ies"} with an empty or missing reason: ` +
        bad.map((e) => e.id).join(", ") +
        " — an unexplained exception is a silent omission, not an allowlist.",
    );
    process.exit(2);
  }
}

// ─── File walk ───────────────────────────────────────────────────────────

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      walk(full, out);
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      out.push(full);
    }
  }
  return out;
}

function listSourceFiles() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    walk(path.join(REPO_ROOT, dir), files);
  }
  return files.sort();
}

// Track the current top-level declaration name per line, so allowlist rules
// that key off an identifier (e.g. "any *_HEX declaration") can be applied.
// A top-level declaration line has no leading whitespace and starts with
// `export const|let|var|function` or `const|let|var|function`.
const DECL_RE = /^(?:export\s+)?(?:const|let|var|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/;

function scanFile(absPath) {
  const relPath = path.relative(REPO_ROOT, absPath).split(path.sep).join("/");
  const content = readFileSync(absPath, "utf8");
  const lines = content.split("\n");

  const findings = [];
  let currentDecl = null;

  lines.forEach((line, idx) => {
    const declMatch = line.match(DECL_RE);
    if (declMatch) currentDecl = declMatch[1];

    let match;
    PALETTE_CLASS_RE.lastIndex = 0;
    while ((match = PALETTE_CLASS_RE.exec(line)) !== null) {
      findings.push(makeFinding(relPath, idx + 1, "palette-class", match[0], currentDecl, line));
    }
    RAW_HEX_RE.lastIndex = 0;
    while ((match = RAW_HEX_RE.exec(line)) !== null) {
      findings.push(makeFinding(relPath, idx + 1, "raw-hex", match[0], currentDecl, line));
    }
  });

  return findings;
}

function makeFinding(relPath, line, kind, text, declName, lineText) {
  const allowlistEntry = ALLOWLIST.find((entry) => entry.appliesTo(relPath, declName, lineText));
  return {
    relPath,
    line,
    kind,
    text,
    allowlisted: !!allowlistEntry,
    allowlistEntry,
  };
}

// ─── @theme category inventory ──────────────────────────────────────────

const THEME_CATEGORIES = [
  { key: "colour", re: /--color-[a-zA-Z0-9-]+\s*:/ },
  { key: "radius", re: /--radius-[a-zA-Z0-9-]+\s*:/ },
  { key: "font", re: /--font-[a-zA-Z0-9-]+\s*:/ },
  { key: "spacing", re: /--spacing(?:-[a-zA-Z0-9-]+)?\s*:/ },
  { key: "motion", re: /(?:--duration-[a-zA-Z0-9-]+|--ease-[a-zA-Z0-9-]+)\s*:/ },
  { key: "elevation", re: /--shadow-[a-zA-Z0-9-]+\s*:/ },
];

// DSGN-01 requires these four categories to exist; radius/font are tracked
// for completeness but are not a DSGN-01 gate requirement.
const REQUIRED_CATEGORIES = new Set(["colour", "spacing", "motion", "elevation"]);

function inventoryThemeCategories() {
  let css;
  try {
    css = readFileSync(GLOBALS_CSS_PATH, "utf8");
  } catch (err) {
    console.error(`FATAL: could not read ${GLOBALS_CSS_PATH}: ${err.message}`);
    process.exit(2);
  }
  return THEME_CATEGORIES.map(({ key, re }) => ({ key, present: re.test(css) }));
}

// ─── Report building ─────────────────────────────────────────────────────

function buildReport(findings, categories) {
  const lines = [];
  const nonAllowlisted = findings.filter((f) => !f.allowlisted);
  const allowlistedFindings = findings.filter((f) => f.allowlisted);
  const missingCategories = categories.filter((c) => !c.present && REQUIRED_CATEGORIES.has(c.key));

  lines.push("# token-audit report");
  lines.push("");
  lines.push("## Findings");
  lines.push("");
  if (findings.length === 0) {
    lines.push("(none)");
  } else {
    for (const f of findings) {
      const suffix = f.allowlisted
        ? ` [ALLOWLISTED: ${f.allowlistEntry.reason}]`
        : "";
      lines.push(`${f.relPath}:${f.line}: ${f.kind}: ${f.text}${suffix}`);
    }
  }
  lines.push("");
  lines.push("## Allowlist");
  lines.push("");
  for (const entry of ALLOWLIST) {
    lines.push(`- ${entry.label} — reason: ${entry.reason}`);
  }
  lines.push("");
  lines.push("## @theme category inventory");
  lines.push("");
  for (const c of categories) {
    const required = REQUIRED_CATEGORIES.has(c.key) ? " (required)" : "";
    lines.push(`- ${c.key}${required}: ${c.present ? "present" : "ABSENT"}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total findings: ${findings.length}`);
  lines.push(`- Allowlisted: ${allowlistedFindings.length}`);
  lines.push(`- Non-allowlisted (gate-relevant): ${nonAllowlisted.length}`);
  lines.push(`- Palette-class findings: ${findings.filter((f) => f.kind === "palette-class").length}`);
  lines.push(`- Raw-hex findings: ${findings.filter((f) => f.kind === "raw-hex").length}`);
  lines.push(`- Missing required @theme categories: ${missingCategories.length > 0 ? missingCategories.map((c) => c.key).join(", ") : "none"}`);

  const violationCount = nonAllowlisted.length + missingCategories.length;
  return { text: lines.join("\n"), violationCount };
}

// ─── Main ─────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const reportMode = args.includes("--report");
  const markdownIdx = args.indexOf("--markdown");
  const markdownPath = markdownIdx !== -1 ? args[markdownIdx + 1] : null;

  validateAllowlist();

  const files = listSourceFiles();
  const findings = files.flatMap(scanFile);
  const categories = inventoryThemeCategories();

  const { text, violationCount } = buildReport(findings, categories);

  console.log(text);

  if (markdownPath) {
    const absMarkdownPath = path.isAbsolute(markdownPath)
      ? markdownPath
      : path.resolve(process.cwd(), markdownPath);
    mkdirSync(path.dirname(absMarkdownPath), { recursive: true });
    writeFileSync(absMarkdownPath, text + "\n", "utf8");
  }

  if (reportMode) {
    process.exit(0);
  }
  process.exit(violationCount > 0 ? 1 : 0);
}

main();
