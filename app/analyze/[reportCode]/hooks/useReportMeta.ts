import { useEffect, useCallback } from "react";
import useSWR from "swr";
import type { ReportMeta } from "@/lib/wcl-types";
import { saveRecentReport } from "@/lib/recent-reports";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
};

export function useReportMeta(
  reportCode: string,
  selectedFight: number | null,
  setSelectedFight: (id: number) => void,
  updateUrlParam: (key: string, value: string | null) => void,
) {
  const {
    data: report,
    error: reportError,
    isLoading: reportLoading,
  } = useSWR<ReportMeta>(`/api/report/${reportCode}`, fetcher);

  // Save to recent reports
  useEffect(() => {
    if (report) {
      saveRecentReport({
        code: reportCode,
        title: report.title,
        owner: report.owner,
        zone: report.zone,
        viewedAt: Date.now(),
      });
    }
  }, [report, reportCode]);

  // Auto-select first fight if none selected
  useEffect(() => {
    if (report && !selectedFight && report.fights.length > 0) {
      const id = report.fights.find((f) => f.kill)?.id ?? report.fights[0].id;
      setSelectedFight(id);
      updateUrlParam("fight", String(id));
    }
  }, [report, selectedFight, setSelectedFight, updateUrlParam]);

  return { report, reportError, reportLoading };
}

export function useFightPlayers(reportCode: string, selectedFight: number | null) {
  const { data: fightPlayers } = useSWR<{
    players: { id: number; name: string; type: string; icon: string }[];
  }>(
    selectedFight ? `/api/report/${reportCode}/players?fightId=${selectedFight}` : null,
    fetcher
  );

  return { players: fightPlayers?.players };
}
