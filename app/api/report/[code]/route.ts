import { NextRequest, NextResponse } from "next/server";
import { wclQuery } from "@/lib/wcl-client";
import { REPORT_META_QUERY } from "@/lib/wcl-queries";
import { WCLReportData, ReportMeta } from "@/lib/wcl-types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || !/^[a-zA-Z0-9]{10,20}$/.test(code)) {
    return NextResponse.json({ error: "Invalid report code" }, { status: 400 });
  }

  try {
    const data = await wclQuery<{ reportData: { report: WCLReportData } }>(
      REPORT_META_QUERY,
      { code }
    );

    const report = data.reportData.report;
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const meta: ReportMeta = {
      title: report.title,
      owner: report.owner?.name ?? "Unknown",
      zone: report.zone?.name ?? "Unknown",
      fights: report.fights
        .filter((f) => f.encounterID > 0)
        .map((f) => ({
          id: f.id,
          name: f.name,
          kill: f.kill,
          difficulty: f.difficulty,
          bossPercentage: f.bossPercentage,
          duration: f.endTime - f.startTime,
        })),
      players: report.masterData.actors
        .filter((a) => a.type === "Player")
        .map((a) => ({
          id: a.id,
          name: a.name,
          type: a.subType,
          subType: a.subType,
          icon: a.icon ?? a.subType,
        })),
    };

    return NextResponse.json(meta);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Report fetch error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
