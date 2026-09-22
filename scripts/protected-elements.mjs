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
// canonical, against a resolved base URL. Half three (04-03) reads the doc's
// `## Ad slot placements` table and enforces it against `lib/ads.ts` and the
// component tree — slot declaration, ownership, containment away from
// protected elements, dimension agreement, no stray mounts — then fetches
// the raid-audit and demo analyze routes live and confirms every ad-slot
// marker present is one the table names.
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

import { readFileSync, existsSync, readdirSync } from "node:fs";
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

/**
 * Returns the text of a `## Heading` section (up to but excluding the next
 * `## ` heading, or EOF), or `null` if the heading never appears as an
 * actual heading line. Anchored to line-start (`^...$`, multiline) rather
 * than a bare substring search — this doc's own prose refers to section
 * headings inline in backticks (e.g. "the `## DOM attributes` table
 * below"), and a plain `indexOf` would match that earlier prose mention
 * instead of the real heading, slicing out an empty section.
 */
function findSection(src, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingRe = new RegExp(`^${escaped}\\s*$`, "m");
  const headingMatch = headingRe.exec(src);
  if (!headingMatch) return null;
  const rest = src.slice(headingMatch.index + headingMatch[0].length);
  const nextHeadingIdx = rest.search(/\n## /);
  return nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx);
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

const DOM_ATTR_HEADING = "## DOM attributes";

function parseChecklistRows() {
  if (!existsSync(CHECKLIST_PATH)) {
    fatal(`checklist not found at ${CHECKLIST_PATH} — an absent checklist is never a pass`);
  }
  const src = readFileSync(CHECKLIST_PATH, "utf8");
  // Scoped to this section only (04-03): the doc gained a second
  // backtick-pair table (`## Ad slot placements`) and an unscoped regex
  // would otherwise parse that table's rows as DOM attributes too.
  const section = findSection(src, DOM_ATTR_HEADING);
  if (section === null) {
    fatal(`${DOM_ATTR_HEADING} section not found in ${CHECKLIST_PATH} — an absent checklist is never a pass`);
  }
  // Table rows whose first cell is a backticked token; the header separator
  // row (`|---|---|...`) has no backticks and is naturally excluded.
  const rowRe = /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm;
  const rows = [];
  let m;
  while ((m = rowRe.exec(section)) !== null) {
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

// ─── Ad slot placements (04-03) ─────────────────────────────────────────────

const AD_SLOT_HEADING = "## Ad slot placements";
const ADS_TS_PATH = path.join(REPO_ROOT, "lib", "ads.ts");

/**
 * Reads `lib/ads.ts` as text and extracts every declared slot's id plus its
 * base/md pixel dimensions. Parsed rather than imported: this script runs
 * under plain node with no build step, exactly as it already does for
 * `lib/demo-report.ts` above.
 */
function readDeclaredSlots() {
  if (!existsSync(ADS_TS_PATH)) {
    fatal(`could not find ${ADS_TS_PATH}`);
  }
  const src = readFileSync(ADS_TS_PATH, "utf8");
  const slots = {};
  // Each slot entry's closing brace is the first `},` that starts a line
  // after the opening `"slot-id": {` — the inline `base: { ... }` / `md: {
  // ... }` object literals never start a line with their own closing brace,
  // so this non-greedy match captures exactly one slot's body at a time.
  const slotBlockRe = /"([a-z0-9-]+)":\s*\{([\s\S]*?)\n\s*\},/g;
  let m;
  while ((m = slotBlockRe.exec(src)) !== null) {
    const [, slotId, block] = m;
    const baseMatch = block.match(/base:\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+)\s*\}/);
    const mdMatch = block.match(/md:\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+)\s*\}/);
    if (!baseMatch || !mdMatch) continue;
    slots[slotId] = {
      base: { width: Number(baseMatch[1]), height: Number(baseMatch[2]) },
      md: { width: Number(mdMatch[1]), height: Number(mdMatch[2]) },
    };
  }
  return slots;
}

/** Parses a "NNNxNNN"/"NNN×NNN" cell into `{ width, height }`, or `null`. */
function extractDims(text) {
  const m = text.match(/(\d+)\s*[x×]\s*(\d+)/i);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

/**
 * Parses the `## Ad slot placements` table the same way `parseChecklistRows`
 * parses `## DOM attributes` — first two backticked cells are the slot id
 * and owner file; the remaining three plain-text cells are position and the
 * two box-dimension columns. An absent or empty section is FATAL only when
 * `lib/ads.ts` declares at least one slot — an unreadable subject is never a
 * pass, but a project with zero ad slots owes this table nothing.
 */
function parseAdSlotRows(declaredSlots) {
  if (!existsSync(CHECKLIST_PATH)) {
    fatal(`checklist not found at ${CHECKLIST_PATH} — an absent checklist is never a pass`);
  }
  const src = readFileSync(CHECKLIST_PATH, "utf8");
  const declaredCount = Object.keys(declaredSlots).length;
  const section = findSection(src, AD_SLOT_HEADING);

  if (section === null) {
    if (declaredCount > 0) {
      fatal(
        `${AD_SLOT_HEADING} section not found in ${CHECKLIST_PATH} but lib/ads.ts declares ${declaredCount} slot(s) — an absent section is never a pass when there is something to document`,
      );
    }
    return [];
  }

  const rowRe = /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|([^|]*)\|([^|]*)\|([^|]*)\|\s*$/gm;
  const rows = [];
  let m;
  while ((m = rowRe.exec(section)) !== null) {
    rows.push({
      slotId: m[1],
      ownerFile: m[2],
      position: m[3].trim(),
      boxBase: m[4].trim(),
      boxMd: m[5].trim(),
    });
  }
  if (rows.length === 0 && declaredCount > 0) {
    fatal(
      `${AD_SLOT_HEADING} yielded zero parseable rows but lib/ads.ts declares ${declaredCount} slot(s) — an empty table is never a pass when there is something to document`,
    );
  }
  return rows;
}

/** The doc row's slot id exists in AD_SLOTS, and its box numbers agree. */
function checkAdSlotDeclared(row, declaredSlots) {
  const id = `adslot:${row.slotId}:declared`;
  const spec = declaredSlots[row.slotId];
  if (!spec) {
    return { id, pass: false, detail: `lib/ads.ts declares no slot named ${row.slotId}` };
  }
  const base = extractDims(row.boxBase);
  const md = extractDims(row.boxMd);
  const pass =
    Boolean(base) &&
    Boolean(md) &&
    base.width === spec.base.width &&
    base.height === spec.base.height &&
    md.width === spec.md.width &&
    md.height === spec.md.height;
  const specText = `${spec.base.width}x${spec.base.height} / ${spec.md.width}x${spec.md.height}`;
  return {
    id,
    pass,
    detail: pass
      ? `doc box (${row.boxBase} / ${row.boxMd}) matches lib/ads.ts (${specText})`
      : `doc box (${row.boxBase} / ${row.boxMd}) does not match lib/ads.ts (${specText})`,
  };
}

/** Finds every `.ts`/`.tsx` file under `app/` (mirrors the demo-report parse discipline). */
function listComponentFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.tsx?$/.test(entry.name)) {
        files.push(full);
      }
    }
  };
  walk(path.join(REPO_ROOT, "app"));
  return files;
}

function slotMountRegex(slotId) {
  return new RegExp(`<AdSlot\\s+id=["']${slotId}["']`);
}

/** The owner file exists (fatal if not) and mounts the slot exactly once. */
function checkAdSlotOwner(row) {
  const id = `adslot:${row.slotId}:owner`;
  const ownerPath = path.isAbsolute(row.ownerFile) ? row.ownerFile : path.join(REPO_ROOT, row.ownerFile);
  if (!existsSync(ownerPath)) {
    return { id, fatal: true, detail: `owner file ${row.ownerFile} does not exist` };
  }
  const src = readFileSync(ownerPath, "utf8");
  const count = (src.match(new RegExp(slotMountRegex(row.slotId), "g")) || []).length;
  return {
    id,
    pass: count === 1,
    detail: count === 1 ? `exactly one mount in ${row.ownerFile}` : `found ${count} mount(s) of ${row.slotId} in ${row.ownerFile}`,
  };
}

/**
 * No mount of this slot sits within 15 lines of a `data-protected` element
 * anywhere under `app/` — including the owner file itself. A blanket
 * "owner file may never also own a data-protected element" rule would be
 * wrong from 04-05 onward: `AnalyzeClient.tsx` legitimately owns both
 * `share-header` (line ~200) and the `analyze-mid`/`analyze-end` mounts
 * (150+ lines away) — proximity, not mere file co-membership, is what
 * actually threatens a protected element (D-02).
 */
function checkAdSlotContainment(row) {
  const id = `adslot:${row.slotId}:containment`;
  const ownerPath = path.isAbsolute(row.ownerFile) ? row.ownerFile : path.join(REPO_ROOT, row.ownerFile);
  if (!existsSync(ownerPath)) {
    return { id, fatal: true, detail: `owner file ${row.ownerFile} does not exist` };
  }

  const mountRe = slotMountRegex(row.slotId);
  for (const file of listComponentFiles()) {
    const lines = readFileSync(file, "utf8").split("\n");
    const protectedLines = [];
    const mountLines = [];
    lines.forEach((line, i) => {
      if (line.includes("data-protected=")) protectedLines.push(i);
      if (mountRe.test(line)) mountLines.push(i);
    });
    for (const mLine of mountLines) {
      for (const pLine of protectedLines) {
        if (Math.abs(mLine - pLine) <= 15) {
          return { id, pass: false, detail: `${row.slotId} mounted within 15 lines of a data-protected element in ${path.relative(REPO_ROOT, file)}` };
        }
      }
    }
  }
  return { id, pass: true, detail: `no data-protected element within 15 lines of ${row.slotId} in any scanned file` };
}

/** No file outside the table's owner files mounts an ad slot at all. */
function checkNoStraySlots(rows) {
  const id = "adslot:no-stray-slots";
  const allowedFiles = new Set(
    rows.map((r) => path.resolve(path.isAbsolute(r.ownerFile) ? r.ownerFile : path.join(REPO_ROOT, r.ownerFile))),
  );
  const strays = [];
  for (const file of listComponentFiles()) {
    const src = readFileSync(file, "utf8");
    if (/<AdSlot\s+id=/.test(src) && !allowedFiles.has(path.resolve(file))) {
      strays.push(path.relative(REPO_ROOT, file));
    }
  }
  return {
    id,
    pass: strays.length === 0,
    detail: strays.length === 0 ? "no AdSlot mounts outside doc-named owner files" : `stray AdSlot mount(s) in: ${strays.join(", ")}`,
  };
}

/**
 * Fetches a route live and confirms every `data-ad-slot="…"` marker present
 * is one the doc table names. A page with none is a pass (ads may be
 * switched off on the base being checked); a page with an unknown one is a
 * failure.
 */
async function checkAdSlotLive(id, url, allowedSlotIds) {
  const res = await fetchRoute(url);
  if (!res.ok) {
    return { id, fatal: true, detail: `unreachable: ${res.error}` };
  }
  if (res.status < 200 || res.status >= 300) {
    return { id, fatal: true, detail: `status ${res.status} fetching ${url} — base is unreachable, not merely failing` };
  }
  const html = await res.res.text();
  const found = new Set();
  const markerRe = /data-ad-slot="([^"]+)"/g;
  let m;
  while ((m = markerRe.exec(html)) !== null) found.add(m[1]);
  const unknown = [...found].filter((slotId) => !allowedSlotIds.has(slotId));
  return {
    id,
    pass: unknown.length === 0,
    detail:
      found.size === 0
        ? "no ad slot markers present (ads may be switched off on this base)"
        : unknown.length === 0
          ? `slot marker(s) present and all doc-named: ${[...found].join(", ")}`
          : `unknown slot marker(s) not in the doc table: ${unknown.join(", ")}`,
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

  const declaredSlots = readDeclaredSlots();
  const adSlotRows = parseAdSlotRows(declaredSlots);
  const allowedSlotIds = new Set(adSlotRows.map((r) => r.slotId));

  const adSlotDeclaredResults = adSlotRows.map((r) => checkAdSlotDeclared(r, declaredSlots));
  const adSlotOwnerResults = adSlotRows.map(checkAdSlotOwner);
  const fatalOwner = adSlotOwnerResults.find((r) => r.fatal);
  if (fatalOwner) {
    fatal(`ad slot owner check ${fatalOwner.id}: ${fatalOwner.detail}`);
  }
  const adSlotContainmentResults = adSlotRows.map(checkAdSlotContainment);
  const fatalContainment = adSlotContainmentResults.find((r) => r.fatal);
  if (fatalContainment) {
    fatal(`ad slot containment check ${fatalContainment.id}: ${fatalContainment.detail}`);
  }
  const adSlotStrayResult = checkNoStraySlots(adSlotRows);

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

  const adSlotLiveResults = await Promise.all([
    checkAdSlotLive("adslot:live-tbc-audit", `${base}/tbc-audit`, allowedSlotIds),
    checkAdSlotLive("adslot:live-analyze-demo", `${base}/analyze/${demo.code}`, allowedSlotIds),
  ]);
  const fatalAdSlotLive = adSlotLiveResults.find((r) => r.fatal);
  if (fatalAdSlotLive) {
    fatal(`ad slot live check ${fatalAdSlotLive.id}: ${fatalAdSlotLive.detail}`);
  }

  const results = [
    ...attrResults,
    ...routeResults,
    ...adSlotDeclaredResults,
    ...adSlotOwnerResults,
    ...adSlotContainmentResults,
    adSlotStrayResult,
    ...adSlotLiveResults,
  ];
  const failCount = printResults(results);

  if (reportMode) {
    process.exit(0);
  }
  process.exit(failCount > 0 ? 1 : 0);
}

main();
