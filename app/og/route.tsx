import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { CLASS_COLORS_HEX } from "@/lib/constants";
import { isValidReportCode } from "@/lib/api-utils";
import { formatFightTime } from "@/lib/utils";
import type { AnalysisResult, ReportMeta, RaidOverviewResult, AwardsResult } from "@/lib/wcl-types";
import { computeAwards, MIN_AWARDS_FOR_CARD } from "@/lib/awards-engine";

/** The fight outcome the player branch resolves from ReportMeta — null when the meta fetch failed or no fight matched. */
type PlayerCardOutcome = { kill: boolean; bossPercentage: number } | null;

// Dynamic Open Graph image for shared analyze links. Only hit by link unfurlers
// (Discord/Reddit/etc.), so the analysis fetch here is fine — it reuses the
// shared result cache, so a freshly-viewed report is warm.

const BG = "#0c0c0f";
const GOLD = "#D4A843";
const MUTED = "#a1a1aa";
const FAINT = "#52525b";

// Hex equivalents of GRADE_COLORS (Tailwind -400 shades) for the canvas.
// Same documented Satori exception as CLASS_COLORS_HEX above: this renderer
// has no CSS engine, so it can't resolve a custom property either.
const GRADE_HEX: Record<string, string> = {
  S: "#fbbf24",
  A: "#a78bfa",
  B: "#60a5fa",
  C: "#4ade80",
  D: "#9ca3af",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.round(n).toString();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: BG,
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        padding: "64px 72px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #D4A843, #F59E0B, #D4A843)",
        }}
      />
      {/* Brand row */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://parseforge.gg/logo.png" width={40} height={40} alt="" />
        <span
          style={{
            fontSize: "30px",
            fontWeight: 800,
            background: "linear-gradient(135deg, #D4A843, #F59E0B)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          ParseForge
        </span>
      </div>
      {children}
      <span
        style={{ position: "absolute", bottom: "32px", left: "72px", fontSize: "18px", color: FAINT, fontWeight: 500 }}
      >
        parseforge.gg
      </span>
    </div>
  );
}

function PlayerCard({ data, outcome }: { data: AnalysisResult; outcome: PlayerCardOutcome }) {
  const classColor = CLASS_COLORS_HEX[data.playerClass] ?? "#FFFFFF";
  const grade = data.metricPercentiles?.overallGrade ?? "—";
  const gradeColor = GRADE_HEX[grade] ?? MUTED;
  const score = data.metricPercentiles?.overallScore ?? 0;
  const pct = Math.round(data.dps?.percentile ?? 0);
  const dps = data.dps?.playerDps ?? 0;
  const unit = data.playerRole === "healer" ? "HPS" : "DPS";

  // D-10 receipts: the comparison label, worded exactly as the Discord
  // scorecard already words it.
  const compLabel =
    data.topPlayersCount > 1
      ? `vs top ${data.topPlayersCount} ${data.playerSpec} ${data.playerClass}s`
      : `vs #1 ${data.topPlayerName}`;

  // The one proof line. Reads only data.healer (already computed by
  // lib/healer-metrics.ts) or the shared metricPercentiles entry — never a
  // second calculation of either number (Phase 2 D-08 lineage).
  let proofLine: string | null;
  if (data.playerRole === "healer") {
    proofLine = data.healer?.hasHealing
      ? `${formatNumber(data.healer.effectiveHps)} effective HPS · ${Math.round(data.healer.overhealPercent)}% overheal`
      : "—";
  } else {
    const activeTime = data.metricPercentiles?.metrics?.find((m) => m.metric === "activeTime");
    proofLine = activeTime
      ? `Active Time ${activeTime.percentile}% · ${activeTime.playerValue} CPM`
      : null;
  }

  return (
    <Shell>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", gap: "40px" }}>
        {/* Left: identity + stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "660px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "22px", color: MUTED }}>{data.encounterName}</span>
            {outcome != null && (
              outcome.kill ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: "18px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    color: "#4ade80",
                    background: "#4ade801a",
                  }}
                >
                  KILL
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    fontSize: "18px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    color: "#f87171",
                    background: "#f871711a",
                  }}
                >
                  {`WIPE ${Math.round(outcome.bossPercentage / 100)}%`}
                </div>
              )
            )}
            <span style={{ fontSize: "22px", color: FAINT }}>
              {"· "}{formatFightTime(data.fightDuration)}
            </span>
          </div>
          <span style={{ fontSize: "68px", fontWeight: 800, color: classColor, lineHeight: 1.05 }}>
            {data.playerName}
          </span>
          <span style={{ fontSize: "26px", color: MUTED }}>{data.playerSpec} {data.playerClass}</span>
          <div style={{ display: "flex", gap: "48px", marginTop: "28px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", color: FAINT }}>{unit}</span>
              <span style={{ fontSize: "48px", fontWeight: 700, color: "#fafafa" }}>{formatNumber(dps)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", color: FAINT }}>Percentile</span>
              <span style={{ fontSize: "48px", fontWeight: 700, color: gradeColor }}>{pct}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "28px", marginTop: "20px", fontSize: "22px", color: MUTED, whiteSpace: "nowrap" }}>
            <span
              style={{
                display: "flex",
                maxWidth: "380px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {compLabel}
            </span>
            {proofLine != null && (
              <span
                style={{
                  display: "flex",
                  maxWidth: "320px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {proofLine}
              </span>
            )}
          </div>
        </div>
        {/* Right: grade badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "260px",
            height: "260px",
            borderRadius: "32px",
            border: `4px solid ${gradeColor}`,
            background: `${gradeColor}1a`,
          }}
        >
          <span style={{ fontSize: "150px", fontWeight: 800, color: gradeColor, lineHeight: 1 }}>{grade}</span>
          <span style={{ fontSize: "28px", color: MUTED, marginTop: "8px" }}>{score}% overall</span>
        </div>
      </div>
    </Shell>
  );
}

function AwardsCard({ awards }: { awards: AwardsResult }) {
  const outcome = awards.outcome;
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", marginTop: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span
            style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "#fafafa",
              maxWidth: "780px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {awards.encounterName}
          </span>
          {outcome != null && (
            outcome.kill ? (
              <div
                style={{
                  display: "flex",
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#4ade80",
                  background: "#4ade801a",
                  border: "2px solid #4ade8066",
                }}
              >
                KILL
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#f87171",
                  background: "#f871711a",
                  border: "2px solid #f8717166",
                }}
              >
                {`WIPE ${(outcome.bossPercentage / 100).toFixed(1)}%`}
              </div>
            )
          )}
        </div>
        <span style={{ fontSize: "20px", color: GOLD, fontWeight: 600, letterSpacing: "1px" }}>
          RAID AWARDS
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "8px", marginTop: "20px" }}>
        {awards.awards.map((award) => (
          <div key={award.id} style={{ display: "flex", alignItems: "center", height: "52px", gap: "18px" }}>
            <span style={{ display: "flex", width: "40px", fontSize: "30px" }}>{award.icon}</span>
            <span
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#fafafa",
                width: "300px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {award.title}
            </span>
            <div
              style={{
                display: "flex",
                flex: 1,
                maxWidth: "430px",
                gap: "6px",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {award.winners.map((w, i) => (
                <span
                  key={w.sourceId}
                  style={{ fontSize: "26px", fontWeight: 600, color: CLASS_COLORS_HEX[w.className] ?? "#FFFFFF" }}
                >
                  {w.name}
                  {i < award.winners.length - 1 ? ", " : ""}
                </span>
              ))}
              {award.extraWinnerCount > 0 && (
                <span style={{ fontSize: "26px", fontWeight: 600, color: MUTED }}>+{award.extraWinnerCount}</span>
              )}
            </div>
            <span style={{ fontSize: "22px", color: MUTED, marginLeft: "auto", whiteSpace: "nowrap" }}>
              {award.stat}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function ReportCard({ meta, reportCode }: { meta: ReportMeta | null; reportCode: string }) {
  // WCL report titles are user-supplied and often junk ("??", blank). Fall back
  // to the zone, then a generic label, so the card never shows noise.
  const rawTitle = meta?.title?.trim();
  const hasTitle = !!rawTitle && !/^[?\s.]+$/.test(rawTitle);
  const headline =
    hasTitle ? rawTitle! : meta?.zone?.trim() || (reportCode ? `Report ${reportCode}` : "WoW Classic Raid Log");
  const subtitle = hasTitle ? meta?.zone?.trim() : undefined;
  return (
    <Shell>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: "16px" }}>
        <span style={{ fontSize: "26px", color: GOLD, fontWeight: 600 }}>Raid Analysis</span>
        <span style={{ fontSize: "64px", fontWeight: 800, color: "#fafafa", lineHeight: 1.1, maxWidth: "900px" }}>
          {headline}
        </span>
        {subtitle && <span style={{ fontSize: "28px", color: MUTED }}>{subtitle}</span>}
        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          {["DPS Percentiles", "Gear Audit", "Buff Tracking", "Improvement Tips"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 18px",
                borderRadius: "9999px",
                border: "1px solid rgba(212, 168, 67, 0.3)",
                color: GOLD,
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export async function GET(request: NextRequest) {
  const size = { width: 1200, height: 630 };
  const headers = { "cache-control": "public, max-age=600, s-maxage=600, stale-while-revalidate=86400" };

  try {
    const { searchParams } = new URL(request.url);
    const reportCode = searchParams.get("report");
    const fightRaw = searchParams.get("fight");
    const sourceRaw = searchParams.get("source");
    const view = searchParams.get("view");
    // Fetch our own API by an absolute origin. Pin to the canonical host in
    // production (an attacker can't steer us via a spoofed Host/origin), and
    // only fall back to the request origin in local dev.
    const origin =
      process.env.NODE_ENV === "production"
        ? "https://parseforge.gg"
        : new URL(request.url).origin;

    // Invalid/absent code → branded fallback, never fetch.
    if (!isValidReportCode(reportCode)) {
      return new ImageResponse(<ReportCard meta={null} reportCode="" />, { ...size, headers });
    }

    const fightId = fightRaw != null ? Number.parseInt(fightRaw, 10) : NaN;
    const sourceId = sourceRaw != null ? Number.parseInt(sourceRaw, 10) : NaN;

    // Awards card: an exact-literal check on `view`, before any fetch (ASVS
    // V5 — an unrecognised value falls through to the branches below rather
    // than reaching a network call).
    if (view === "awards" && Number.isInteger(fightId) && fightId >= 0) {
      const [overview, meta] = await Promise.all([
        fetchJson<RaidOverviewResult>(`${origin}/api/raid-overview`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reportCode, fightId }),
        }),
        fetchJson<ReportMeta>(`${origin}/api/report/${reportCode}`),
      ]);
      const fightMeta = meta?.fights.find((f) => f.id === fightId);
      const outcome = fightMeta ? { kill: fightMeta.kill, bossPercentage: fightMeta.bossPercentage } : null;
      const encounterName = fightMeta?.name ?? overview?.encounterName ?? "";
      const awards = computeAwards(overview, { name: encounterName, outcome });
      if (overview && awards.awards.length >= MIN_AWARDS_FOR_CARD) {
        return new ImageResponse(<AwardsCard awards={awards} />, { ...size, headers });
      }
      // Falls through to the existing ReportCard branch below — the awards
      // card never fails the unfurl, it just isn't ready yet.
    }

    // Player scorecard only when fight + source are valid non-negative integers.
    if (
      Number.isInteger(fightId) && fightId >= 0 &&
      Number.isInteger(sourceId) && sourceId >= 0
    ) {
      // Two fetches in parallel: the player analysis, and report meta to
      // resolve the fight outcome for the D-10 Kill/Wipe receipt. A failed
      // meta fetch (or no matching fight) degrades to `outcome: null` — it
      // never turns into a thrown error or a changed branch (RESEARCH Pitfall 3).
      const [data, meta] = await Promise.all([
        fetchJson<AnalysisResult>(`${origin}/api/analyze`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reportCode, fightId, sourceId }),
        }),
        fetchJson<ReportMeta>(`${origin}/api/report/${reportCode}`),
      ]);
      if (data?.playerName) {
        const fightMeta = meta?.fights.find((f) => f.id === fightId);
        const outcome: PlayerCardOutcome = fightMeta
          ? { kill: fightMeta.kill, bossPercentage: fightMeta.bossPercentage }
          : null;
        return new ImageResponse(<PlayerCard data={data} outcome={outcome} />, { ...size, headers });
      }
    }

    // Otherwise (raid/cla view, or analysis unavailable): report-level card.
    const meta = await fetchJson<ReportMeta>(`${origin}/api/report/${reportCode}`);
    return new ImageResponse(<ReportCard meta={meta} reportCode={reportCode} />, { ...size, headers });
  } catch {
    // Never fail an unfurl — fall back to a branded report card.
    return new ImageResponse(<ReportCard meta={null} reportCode="" />, { ...size, headers });
  }
}
