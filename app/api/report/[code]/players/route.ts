import { NextRequest, NextResponse } from "next/server";
import { wclQuery } from "@/lib/wcl-client";
import type { WCLPlayerDetails } from "@/lib/wcl-types";

interface PlayerDetailsResponse {
  reportData: {
    report: {
      playerDetails: {
        data: {
          playerDetails: Record<string, WCLPlayerDetails[]>;
        };
      };
    };
  };
}

const QUERY = `
  query FightPlayers($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIDs)
      }
    }
  }
`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const fightId = request.nextUrl.searchParams.get("fightId");

  if (!code || !/^[a-zA-Z0-9]{10,20}$/.test(code)) {
    return NextResponse.json({ error: "Invalid report code" }, { status: 400 });
  }
  if (!fightId) {
    return NextResponse.json({ error: "Missing fightId" }, { status: 400 });
  }

  try {
    const data = await wclQuery<PlayerDetailsResponse>(QUERY, {
      code,
      fightIDs: [parseInt(fightId, 10)],
    });

    const allPlayers = Object.values(
      data.reportData.report.playerDetails.data.playerDetails
    ).flat();

    const players = allPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      icon: p.icon,
    }));

    return NextResponse.json({ players });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
