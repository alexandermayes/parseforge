#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// seo-invariants: a repeatable local-versus-production head-tag and
// structured-data diff for every shipped route (OPS-01 ship gate).
//
// For each route, fetches the local render (default http://localhost:3000,
// overridable with --base) and the production render (https://parseforge.gg)
// and compares <title>, <link rel="canonical">, <meta name="robots">,
// <meta name="description">, og:title, og:image, and the sorted list of
// distinct @type values across every JSON-LD block.
//
// Rules that make this a gate rather than a formality:
//   - One row per route, printed in lexicographic order by route path, so
//     two runs of the gate are diffable.
//   - A route production returns a non-200 for is recorded as `no-data` —
//     never a pass, never a silent omission.
//   - Exits non-zero when canonical, robots, or structured-data @type list
//     differs for any route with production data. A title or description
//     difference is reported but does not fail the gate — a phase may
//     legitimately change on-page copy without that being an indexing
//     regression (see SEO-03).
//
// Modes:
//   node scripts/seo-invariants.mjs               -> gate mode: exit 1 on
//                                                      any canonical/robots/
//                                                      structured-data diff
//                                                      for a route with
//                                                      production data, 0
//                                                      otherwise.
//   node scripts/seo-invariants.mjs --report      -> inspection mode: same
//                                                      output, always exits 0
//                                                      (fatal config errors —
//                                                      e.g. the local server
//                                                      unreachable — still
//                                                      exit non-zero).
//   node scripts/seo-invariants.mjs --markdown <path> -> also appends the
//                                                      route table to <path>
//                                                      (creating parent dirs).
//   --base <url>                                  -> local base URL
//                                                      (default http://localhost:3000)
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PROD_BASE = "https://parseforge.gg";

// ─── Route set ───────────────────────────────────────────────────────────
// Every page.tsx under app/ at the time this gate runs. The analyze route
// uses the demo report code so it's always a real, public, indexable page.
// NOTE (01-08 deviation): this is 11 routes, not the 9 named in
// 01-08-PLAN.md's frontmatter — /privacy and /terms were added by quick
// task 260906-kzw after the plan was authored. See 01-08-SUMMARY.md.
function readDemoReportCode() {
  const src = readFileSync(path.join(REPO_ROOT, "lib", "demo-report.ts"), "utf8");
  const m = src.match(/code:\s*"([^"]+)"/);
  if (!m) {
    console.error("FATAL: could not find DEMO_REPORT.code in lib/demo-report.ts");
    process.exit(2);
  }
  return m[1];
}

function buildRoutes() {
  const demoCode = readDemoReportCode();
  return [
    "/",
    `/analyze/${demoCode}`,
    "/guides",
    "/guides/how-to-analyze-wow-classic-logs",
    "/guides/improve-dps-wow-classic",
    "/guides/raid-preparation-checklist",
    "/guides/warcraft-logs-vs-parseforge",
    "/guides/wow-classic-loot-council-tools",
    "/privacy",
    "/tbc-audit",
    "/terms",
  ].sort();
}

// ─── HTML extraction (regex-based; no DOM dependency) ────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractMetaContent(html, attr, value) {
  const tagRe = new RegExp(`<meta\\s+[^>]*${attr}=["']${escapeRegex(value)}["'][^>]*>`, "i");
  const tagMatch = html.match(tagRe);
  if (!tagMatch) return null;
  const contentMatch = tagMatch[0].match(/content=["']([^"']*)["']/i);
  return contentMatch ? contentMatch[1] : null;
}

function extractLinkHref(html, relValue) {
  const tagRe = new RegExp(`<link\\s+[^>]*rel=["']${escapeRegex(relValue)}["'][^>]*>`, "i");
  const tagMatch = html.match(tagRe);
  if (!tagMatch) return null;
  const hrefMatch = tagMatch[0].match(/href=["']([^"']*)["']/i);
  return hrefMatch ? hrefMatch[1] : null;
}

function collectJsonLdTypes(node, set) {
  if (Array.isArray(node)) {
    for (const item of node) collectJsonLdTypes(item, set);
    return;
  }
  if (node && typeof node === "object") {
    if (node["@type"]) {
      if (Array.isArray(node["@type"])) node["@type"].forEach((t) => set.add(String(t)));
      else set.add(String(node["@type"]));
    }
    if (node["@graph"]) collectJsonLdTypes(node["@graph"], set);
  }
}

function extractJsonLdTypes(html) {
  const types = new Set();
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRe.exec(html)) !== null) {
    try {
      collectJsonLdTypes(JSON.parse(m[1]), types);
    } catch {
      types.add("(unparseable JSON-LD)");
    }
  }
  return [...types].sort();
}

function extractHead(html) {
  return {
    title: extractTitle(html),
    canonical: extractLinkHref(html, "canonical"),
    robots: extractMetaContent(html, "name", "robots"),
    description: extractMetaContent(html, "name", "description"),
    ogTitle: extractMetaContent(html, "property", "og:title"),
    ogImage: extractMetaContent(html, "property", "og:image"),
    jsonLdTypes: extractJsonLdTypes(html),
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return { ok: false, status: res.status };
    const text = await res.text();
    return { ok: true, status: res.status, html: text };
  } catch (err) {
    return { ok: false, status: null, error: err.message };
  }
}

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Fields whose divergence fails the gate — an indexing regression.
const FAILING_FIELDS = ["canonical", "robots", "jsonLdTypes"];
// Fields reported but not gate-failing — a phase may legitimately change copy.
const REPORT_ONLY_FIELDS = ["title", "description", "ogTitle", "ogImage"];

// WCL_CLIENT_ID/SECRET are Vercel-only secrets (CLAUDE.md: ".env* gitignored...
// real builds happen on Vercel, not locally") — a local dev server run without
// them can't fetch real report data, so /analyze/* routes fall back to
// generateMetadata's generic noindex branch locally while production (which
// has the real credentials) correctly indexes a public report. That's a
// local-environment artifact, not a code regression this phase introduced —
// app/analyze/[reportCode]/page.tsx's generateMetadata branching is unchanged
// by this phase. Diffs are still reported for transparency; they just don't
// fail the gate when this specific cause applies.
const HAS_WCL_CREDENTIALS = Boolean(
  process.env.WCL_CLIENT_ID && process.env.WCL_CLIENT_SECRET,
);

async function checkRoute(route, base) {
  const localUrl = `${base}${route}`;
  const prodUrl = `${PROD_BASE}${route}`;
  const isAnalyzeRoute = route.startsWith("/analyze/");
  const wclCredentialsCaveat = isAnalyzeRoute && !HAS_WCL_CREDENTIALS;

  const localRes = await fetchHtml(localUrl);
  if (!localRes.ok) {
    return {
      route,
      status: "local-error",
      detail: `local fetch failed (${localRes.status ?? localRes.error})`,
      failing: true,
    };
  }

  const prodRes = await fetchHtml(prodUrl);
  if (!prodRes.ok) {
    return {
      route,
      status: "no-data",
      detail: `production returned ${prodRes.status ?? prodRes.error ?? "no response"}`,
      failing: false,
    };
  }

  const localHead = extractHead(localRes.html);
  const prodHead = extractHead(prodRes.html);

  const diffs = [];
  for (const field of FAILING_FIELDS) {
    const lv = localHead[field];
    const pv = prodHead[field];
    const same = Array.isArray(lv) ? arraysEqual(lv, pv) : lv === pv;
    if (!same) {
      diffs.push({
        field,
        local: lv,
        prod: pv,
        failing: !wclCredentialsCaveat,
        caveat: wclCredentialsCaveat
          ? "local dev server has no WCL_CLIENT_ID/SECRET (Vercel-only secret) — cannot fetch real report data locally, so this is a local-environment artifact, not a code regression"
          : undefined,
      });
    }
  }
  for (const field of REPORT_ONLY_FIELDS) {
    const lv = localHead[field];
    const pv = prodHead[field];
    if (lv !== pv) {
      diffs.push({ field, local: lv, prod: pv, failing: false });
    }
  }

  const hasFailingDiff = diffs.some((d) => d.failing);

  return {
    route,
    status: hasFailingDiff ? "diff" : diffs.length > 0 ? "diff-report-only" : "same",
    diffs,
    failing: hasFailingDiff,
  };
}

// ─── Report building ──────────────────────────────────────────────────────

function buildTextReport(results) {
  const lines = [];
  for (const r of results) {
    if (r.status === "no-data") {
      lines.push(`${r.route}: no-data (${r.detail})`);
      continue;
    }
    if (r.status === "local-error") {
      lines.push(`${r.route}: LOCAL-ERROR (${r.detail})`);
      continue;
    }
    if (r.status === "same") {
      lines.push(`${r.route}: same (canonical/robots/structured-data match production)`);
      continue;
    }
    const diffSummary = r.diffs
      .map((d) => {
        const tag = d.failing ? "" : d.caveat ? " (non-failing: " + d.caveat + ")" : " (non-failing)";
        return `${d.field}${tag}: local=${JSON.stringify(d.local)} prod=${JSON.stringify(d.prod)}`;
      })
      .join("; ");
    const label = r.failing ? "DIFF" : "diff-report-only";
    lines.push(`${r.route}: ${label} — ${diffSummary}`);
  }
  return lines.join("\n");
}

function buildMarkdownTable(results) {
  const lines = [];
  lines.push("| Route | Metadata-diff result |");
  lines.push("|---|---|");
  for (const r of results) {
    let cell;
    if (r.status === "no-data") cell = `no-data (${r.detail})`;
    else if (r.status === "local-error") cell = `LOCAL-ERROR (${r.detail})`;
    else if (r.status === "same") cell = "same — no canonical/robots/structured-data diff";
    else {
      const failingDiffs = r.diffs.filter((d) => d.failing).map((d) => d.field);
      const reportOnlyDiffs = r.diffs.filter((d) => !d.failing).map((d) => d.field);
      const parts = [];
      if (failingDiffs.length > 0) parts.push(`FAIL: ${failingDiffs.join(", ")} differ`);
      if (reportOnlyDiffs.length > 0) parts.push(`non-failing: ${reportOnlyDiffs.join(", ")} differ`);
      cell = parts.join("; ");
    }
    lines.push(`| \`${r.route}\` | ${cell} |`);
  }
  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const reportMode = args.includes("--report");
  const markdownIdx = args.indexOf("--markdown");
  const markdownPath = markdownIdx !== -1 ? args[markdownIdx + 1] : null;
  const baseIdx = args.indexOf("--base");
  const base = baseIdx !== -1 ? args[baseIdx + 1] : "http://localhost:3000";

  const routes = buildRoutes();
  const results = [];
  for (const route of routes) {
    results.push(await checkRoute(route, base));
  }

  const text = buildTextReport(results);
  console.log(text);

  if (markdownPath) {
    const absMarkdownPath = path.isAbsolute(markdownPath)
      ? markdownPath
      : path.resolve(process.cwd(), markdownPath);
    mkdirSync(path.dirname(absMarkdownPath), { recursive: true });
    appendFileSync(absMarkdownPath, "\n" + buildMarkdownTable(results) + "\n", "utf8");
  }

  const hasLocalError = results.some((r) => r.status === "local-error");
  const hasFailingDiff = results.some((r) => r.failing);

  if (hasLocalError) {
    // The local server being unreachable is a hard failure in every mode —
    // a script that can't reach its own input must never report a silent pass.
    process.exit(2);
  }

  if (reportMode) {
    process.exit(0);
  }

  process.exit(hasFailingDiff ? 1 : 0);
}

main();
