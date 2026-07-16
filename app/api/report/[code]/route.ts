import { NextRequest, NextResponse } from "next/server";
import { wclQuery, WCLError } from "@/lib/wcl-client";
import { REPORT_META_QUERY } from "@/lib/wcl-queries";
import { errorResponse } from "@/lib/api-utils";
import { mapReportMeta } from "@/lib/report-meta";
import { WCLReportData } from "@/lib/wcl-types";

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
      // Defensive: WCL normally returns a GraphQL error (thrown in wclQuery)
      // rather than a null report, but handle it cleanly just in case.
      throw new WCLError("not_found");
    }

    return NextResponse.json(mapReportMeta(report));
  } catch (error) {
    return errorResponse(error, `report-${code}`);
  }
}
