#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// theme-parity: a standing gate over app/globals.css.
//
// Parses the top-level `:root { ... }` and `.dark { ... }` custom-property
// blocks and asserts two things:
//
//   1. Parity  — every custom property declared in `.dark` is also declared
//      in `:root`. A theme with a token missing from one side silently
//      falls back to the browser's initial value, which is never intended.
//   2. Divergence — a curated allow-list of theme-divergent tokens (colors
//      that MUST differ between light and dark) actually hold different
//      values in the two blocks. A token that is byte-identical in both
//      blocks means light mode silently inherited the dark value.
//
// Modes:
//   node scripts/theme-parity.mjs             -> gate mode: exit 1 on any
//                                                 violation, 0 otherwise.
//   node scripts/theme-parity.mjs --report     -> inspection mode: prints
//                                                 the same findings (each
//                                                 divergence violation
//                                                 prefixed "SAME IN BOTH: "),
//                                                 always exits 0.
//
// An unparseable stylesheet (missing :root or .dark block) is a hard
// failure in EITHER mode — a script that can't find its input must never
// report a silent pass.
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GLOBALS_CSS_PATH = path.resolve(__dirname, "..", "app", "globals.css");

// Tokens that MUST hold a genuinely different value between `:root` (light)
// and `.dark`. Seeded per 01-04-PLAN.md Task 1.
const THEME_DIVERGENT = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-accent",
  "--sidebar-border",
  "--sidebar-ring",
  "--gold-from",
  "--gold-to",
  "--arcane-from",
  "--arcane-to",
  "--glow-gold",
  "--glow-arcane",
  "--surface-0",
  "--surface-1",
  "--surface-2",
  "--surface-3",
  "--status-good",
  "--status-warn",
  "--status-bad",
  "--status-info",
  // D-12 — WoW class/role colors. Only the tokens whose dark value is
  // demonstrably unusable on light are required to diverge (01-05-PLAN.md
  // Task 1); the remaining class tokens legitimately read well in both
  // themes and are intentionally left off this list.
  "--role-tank",
  "--role-healer",
  "--role-caster",
  "--role-physical",
  "--class-priest",
  "--class-rogue",
  "--class-paladin",
  "--class-hunter",
  "--class-monk",
  "--class-default",
];

/**
 * Parse the top-level blocks of a CSS stylesheet into `{ selector, body }`
 * pairs. "Top-level" means depth 0 — nested braces inside a block (e.g.
 * `@theme inline { @keyframes foo { ... } }`) are consumed as part of that
 * block's body via local brace-depth counting, not treated as siblings.
 */
function parseTopLevelBlocks(css) {
  const blocks = [];
  let selectorStart = 0;
  let i = 0;
  while (i < css.length) {
    if (css[i] === "{") {
      const selector = css.slice(selectorStart, i).trim();
      let depth = 1;
      let j = i + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === "{") depth++;
        else if (css[j] === "}") depth--;
        j++;
      }
      const body = css.slice(i + 1, j - 1);
      blocks.push({ selector, body });
      i = j;
      selectorStart = i;
      continue;
    }
    i++;
  }
  return blocks;
}

/** Extract `--custom-property: value;` declarations from a block body into a Map. */
function extractCustomProperties(body) {
  const props = new Map();
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = re.exec(body)) !== null) {
    props.set(match[1], match[2].trim());
  }
  return props;
}

function findBlock(blocks, selector) {
  return blocks.find((b) => b.selector === selector);
}

function main() {
  const reportMode = process.argv.includes("--report");

  let css;
  try {
    css = readFileSync(GLOBALS_CSS_PATH, "utf8");
  } catch (err) {
    console.error(`FATAL: could not read ${GLOBALS_CSS_PATH}: ${err.message}`);
    process.exit(2);
  }

  const blocks = parseTopLevelBlocks(css);
  const rootBlock = findBlock(blocks, ":root");
  const darkBlock = findBlock(blocks, ".dark");

  if (!rootBlock) {
    console.error(
      "FATAL: could not locate a top-level `:root { ... }` block in app/globals.css — stylesheet is unparseable.",
    );
    process.exit(2);
  }
  if (!darkBlock) {
    console.error(
      "FATAL: could not locate a top-level `.dark { ... }` block in app/globals.css — stylesheet is unparseable.",
    );
    process.exit(2);
  }

  const rootProps = extractCustomProperties(rootBlock.body);
  const darkProps = extractCustomProperties(darkBlock.body);

  const parityViolations = [];
  for (const [name] of darkProps) {
    if (!rootProps.has(name)) {
      parityViolations.push(`MISSING IN :root: ${name}`);
    }
  }

  const divergenceViolations = [];
  for (const name of THEME_DIVERGENT) {
    const inRoot = rootProps.has(name);
    const inDark = darkProps.has(name);
    if (!inRoot) {
      // Already reported by the parity loop above if darkProps has it too;
      // if darkProps also lacks it, that's a distinct gap worth its own line.
      if (!inDark) {
        parityViolations.push(`MISSING IN BOTH: ${name} (theme-divergent token declared nowhere)`);
      }
      continue;
    }
    if (!inDark) {
      parityViolations.push(`MISSING IN .dark: ${name}`);
      continue;
    }
    const rootValue = rootProps.get(name);
    const darkValue = darkProps.get(name);
    if (rootValue === darkValue) {
      divergenceViolations.push({ name, value: rootValue });
    }
  }

  const violationCount = parityViolations.length + divergenceViolations.length;

  for (const line of parityViolations) {
    console.log(line);
  }
  for (const { name, value } of divergenceViolations) {
    const prefix = reportMode ? "SAME IN BOTH: " : "DIVERGENCE VIOLATION: ";
    console.log(`${prefix}${name} = ${value}`);
  }

  if (violationCount === 0) {
    console.log(
      reportMode
        ? "theme-parity --report: no parity or divergence issues found."
        : "theme-parity: PASS — no parity or divergence issues found.",
    );
  }

  if (reportMode) {
    process.exit(0);
  }

  process.exit(violationCount > 0 ? 1 : 0);
}

main();
