import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { CLASS_COLORS } from "@/lib/constants";
import { isValidReportCode } from "@/lib/api-utils";
import type { AnalysisResult, ReportMeta } from "@/lib/wcl-types";

// Dynamic Open Graph image for shared analyze links. Only hit by link unfurlers
// (Discord/Reddit/etc.), so the analysis fetch here is fine — it reuses the
// shared result cache, so a freshly-viewed report is warm.

const BG = "#0c0c0f";
const GOLD = "#D4A843";
const MUTED = "#a1a1aa";
const FAINT = "#52525b";

// Hex equivalents of GRADE_COLORS (Tailwind -400 shades) for the canvas.
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

function PlayerCard({ data }: { data: AnalysisResult }) {
  const classColor = CLASS_COLORS[data.playerClass] ?? "#FFFFFF";
  const grade = data.metricPercentiles?.overallGrade ?? "—";
  const gradeColor = GRADE_HEX[grade] ?? MUTED;
  const score = data.metricPercentiles?.overallScore ?? 0;
  const pct = Math.round(data.dps?.percentile ?? 0);
  const dps = data.dps?.playerDps ?? 0;
  const unit = data.playerRole === "healer" ? "HPS" : "DPS";

  return (
    <Shell>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", gap: "40px" }}>
        {/* Left: identity + stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "680px" }}>
          <span style={{ fontSize: "22px", color: MUTED }}>{data.encounterName}</span>
          <span style={{ fontSize: "76px", fontWeight: 800, color: classColor, lineHeight: 1.05 }}>
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

    // Player scorecard only when fight + source are valid non-negative integers.
    const fightId = fightRaw != null ? Number.parseInt(fightRaw, 10) : NaN;
    const sourceId = sourceRaw != null ? Number.parseInt(sourceRaw, 10) : NaN;
    if (
      Number.isInteger(fightId) && fightId >= 0 &&
      Number.isInteger(sourceId) && sourceId >= 0
    ) {
      const data = await fetchJson<AnalysisResult>(`${origin}/api/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportCode, fightId, sourceId }),
      });
      if (data?.playerName) {
        return new ImageResponse(<PlayerCard data={data} />, { ...size, headers });
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
