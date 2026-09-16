#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// protected-elements: a machine check over docs/PROTECTED-ELEMENTS.md — the
// share-loop checklist Phase 4's ad-placement whitelist and Phase 7's
// per-route SEO gate both consume (D-15).
//
// The checklist doc is the source of truth; this script is the enforcement.
// Half one reads the doc's `## DOM attributes` table and confirms every
// listed `data-protected="…"` attribute is still present in its named owner
// file. Half two fetches the live `/og` route contracts (awards, player, and
// bare report cards for the demo report) and the demo analyze page's
// canonical, against a resolved base URL.
//
// A gate that greens when it cannot see its subject is worse than no gate:
// a missing/empty checklist, an owner file that no longer exists, and an
// unreachable base URL are all FATAL (exit 2) — never reported as a passing
// or failing check.
//
// Modes:
//   node scripts/protected-elements.mjs               -> gate mode: exit 1 on
//                                                      any failed check, 0
//                                                      otherwise.
//   node scripts/protected-elements.mjs --report      -> inspection mode: same
//                                                      output, always exits 0
//                                                      for check failures
//                                                      (fatal config errors —
//                                                      missing checklist,
//                                                      unreachable base —
//                                                      still exit 2).
//   node scripts/protected-elements.mjs --base <url>  -> base URL for the
//                                                      live route checks
//                                                      (default:
//                                                      https://parseforge.gg,
//                                                      so the gate runs with
//                                                      no local server).
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PROD_BASE = "https://parseforge.gg";
const CHECKLIST_PATH = path.join(REPO_ROOT, "docs", "PROTECTED-ELEMENTS.md");

function fatal(message) {
  console.error(`FATAL: ${message}`);
  process.exit(2);
}

// ─── Demo report ────────────────────────────────────────────────────────────

function readDemoReport() {
  const demoPath = path.join(REPO_ROOT, "lib", "demo-report.ts");
  if (!existsSync(demoPath)) {
    fatal(`could not find ${demoPath}`);
  }
  const src = readFileSync(demoPath, "utf8");
  const code = src.match(/code:\s*"([^"]+)"/);
  const fight = src.match(/fight:\s*(\d+)/);
  const source = src.match(/source:\s*(\d+)/);
  if (!code || !fight || !source) {
    fatal("could not parse DEMO_REPORT.code/fight/source in lib/demo-report.ts");
  }
  return { code: code[1], fight: fight[1], source: source[1] };
}

// ─── Checklist parsing (docs/PROTECTED-ELEMENTS.md is the source of truth) ─

function parseChecklistRows() {
  if (!existsSync(CHECKLIST_PATH)) {
    fatal(`checklist not found at ${CHECKLIST_PATH} — an absent checklist is never a pass`);
  }
  const src = readFileSync(CHECKLIST_PATH, "utf8");
  // Table rows whose first cell is a backticked token; the header separator
  // row (`|---|---|...`) has no backticks and is naturally excluded.
  const rowRe = /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm;
  const rows = [];
  let m;
  while ((m = rowRe.exec(src)) !== null) {
    rows.push({ attribute: m[1], ownerFile: m[2] });
  }
  if (rows.length === 0) {
    fatal(`${CHECKLIST_PATH} yielded zero parseable attribute rows — an empty checklist is never a pass`);
  }
  return rows;
}

function checkAttribute(row) {
  const ownerPath = path.isAbsolute(row.ownerFile)
    ? row.ownerFile
    : path.join(REPO_ROOT, row.ownerFile);
  if (!existsSync(ownerPath)) {
    return {
      id: `attr:${row.attribute}`,
      fatal: true,
      detail: `owner file ${row.ownerFile} does not exist`,
    };
  }
  const src = readFileSync(ownerPath, "utf8");
  const needle = `data-protected="${row.attribute}"`;
  const pass = src.includes(needle);
  return {
    id: `attr:${row.attribute}`,
    pass,
    detail: pass ? `found in ${row.ownerFile}` : `MISSING from ${row.ownerFile}`,
  };
}

// ─── Live route contracts ───────────────────────────────────────────────────

async function fetchRoute(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    return { ok: true, status: res.status, contentType: res.headers.get("content-type") || "", res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function extractLinkHref(html, relValue) {
  const tagRe = new RegExp(`<link\\s+[^>]*rel=["']${relValue}["'][^>]*>`, "i");
  const tagMatch = html.match(tagRe);
  if (!tagMatch) return null;
  const hrefMatch = tagMatch[0].match(/href=["']([^"']*)["']/i);
  return hrefMatch ? hrefMatch[1] : null;
}

async function checkImageRoute(id, url) {
  const res = await fetchRoute(url);
  if (!res.ok) {
    return { id, fatal: true, detail: `unreachable: ${res.error}` };
  }
  const pass = res.status >= 200 && res.status < 300 && res.contentType.includes("image");
  return {
    id,
    pass,
    detail: pass ? `${res.status} ${res.contentType}` : `${res.status} ${res.contentType || "(no content-type)"}`,
  };
}

async function checkCanonicalRoute(id, url) {
  const res = await fetchRoute(url);
  if (!res.ok) {
    return { id, fatal: true, detail: `unreachable: ${res.error}` };
  }
  if (res.status < 200 || res.status >= 300) {
    return { id, pass: false, detail: `status ${res.status}` };
  }
  const html = await res.res.text();
  const canonical = extractLinkHref(html, "canonical");
  const pass = Boolean(canonical) && !canonical.includes("?");
  return { id, pass, detail: canonical ? `canonical=${canonical}` : "no canonical link found" };
}

// ─── Reporting ───────────────────────────────────────────────────────────────

function printResults(results) {
  const sorted = [...results].sort((a, b) => a.id.localeCompare(b.id));
  let passCount = 0;
  let failCount = 0;
  for (const r of sorted) {
    const label = r.pass ? "PASS" : "FAIL";
    console.log(`${label}  ${r.id}  ${r.detail}`);
    if (r.pass) passCount++;
    else failCount++;
  }
  console.log(`\n${passCount} passed, ${failCount} failed`);
  return failCount;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const reportMode = args.includes("--report");
  const baseIdx = args.indexOf("--base");
  const base = baseIdx !== -1 ? args[baseIdx + 1] : PROD_BASE;

  const rows = parseChecklistRows();
  const demo = readDemoReport();

  const attrResults = rows.map(checkAttribute);
  const fatalAttr = attrResults.find((r) => r.fatal);
  if (fatalAttr) {
    fatal(`attribute check ${fatalAttr.id}: ${fatalAttr.detail}`);
  }

  const routeResults = await Promise.all([
    checkImageRoute("route:og-awards", `${base}/og?report=${demo.code}&fight=${demo.fight}&view=awards`),
    checkImageRoute("route:og-player", `${base}/og?report=${demo.code}&fight=${demo.fight}&source=${demo.source}`),
    checkImageRoute("route:og-report", `${base}/og?report=${demo.code}`),
    checkCanonicalRoute("route:analyze-canonical", `${base}/analyze/${demo.code}`),
  ]);

  const fatalRoute = routeResults.find((r) => r.fatal);
  if (fatalRoute) {
    fatal(`route check ${fatalRoute.id}: ${fatalRoute.detail} — base ${base} is unreachable, not merely failing`);
  }

  const results = [...attrResults, ...routeResults];
  const failCount = printResults(results);

  if (reportMode) {
    process.exit(0);
  }
  process.exit(failCount > 0 ? 1 : 0);
}

main();
