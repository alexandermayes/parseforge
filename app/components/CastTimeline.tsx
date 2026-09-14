"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UIEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CastTimelineResult, TimelineRow } from "@/lib/wcl-types";
import { formatFightTime } from "@/lib/utils";
import { Pause, Skull } from "lucide-react";
import SpellLink from "./SpellLink";
import { useWowheadTooltips } from "@/lib/use-wowhead";

const ICON_BASE_URL = "https://wow.zamimg.com/images/wow/icons/medium/";

// Fixed row height every row kind shares (cast, idle, death, truncation
// notice) — the windowing math below depends on this being uniform.
const ROW_HEIGHT = 40;
// Rows rendered above/below the viewport so a fast scroll never shows a
// blank flash between paint frames.
const OVERSCAN = 10;

// Chip style mirrors AnalyzeClient.tsx's tab-switcher idiom exactly. Selected
// state is the neutral bg-surface-3 treatment, never gold — chips are a
// multi-select control, unlike the single-select main tab bar.
const CHIP_BASE = "px-2 py-1 rounded-md text-xs font-medium transition-colors border";
const CHIP_SELECTED = "bg-surface-3 text-foreground border-border";
const CHIP_UNSELECTED =
  "text-muted-foreground hover:text-foreground hover:bg-surface-3 border-transparent";

const EMPTY_MESSAGE = "No casts recorded for this player in this fight.";

function AbilityIcon({ icon, name }: { icon?: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!icon || failed) {
    return (
      <div className="w-6 h-6 shrink-0 rounded-[3px] bg-surface-2" aria-hidden="true" />
    );
  }
  return (
    <img
      src={`${ICON_BASE_URL}${icon}`}
      alt={name}
      loading="lazy"
      className="w-6 h-6 shrink-0 rounded-[3px] border border-border/50 bg-surface-2 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function renderRow(row: TimelineRow, key: string, wowheadDomain: string) {
  if (row.kind === "idle") {
    return (
      <div
        key={key}
        className="h-10 flex items-center justify-center border-t border-dashed border-status-warn/40"
      >
        <span className="flex items-center gap-1.5 text-caption text-status-warn">
          <Pause className="size-3" />
          Idle {((row.idleMs ?? 0) / 1000).toFixed(1)}s
        </span>
      </div>
    );
  }

  if (row.kind === "death") {
    return (
      <div key={key} className="h-10 flex items-center justify-center gap-1.5 badge-bad">
        <Skull className="size-3.5 text-status-bad" />
        <span className="text-caption font-medium">Died</span>
      </div>
    );
  }

  return (
    <div key={key} className="flex items-center gap-2 h-10 hover:bg-surface-2">
      <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground">
        {formatFightTime(row.fightTimeMs)}
      </span>
      <AbilityIcon icon={row.abilityIcon} name={row.abilityName ?? ""} />
      <span className="flex-1 min-w-0 truncate text-body-sm">
        <SpellLink
          name={row.abilityName ?? ""}
          guid={row.abilityGameID ?? 0}
          domain={wowheadDomain}
        />
      </span>
      <span className="w-24 shrink-0 truncate text-right text-caption text-muted-foreground">
        {row.targetName ?? "—"}
      </span>
    </div>
  );
}

interface CastTimelineProps {
  result: CastTimelineResult | null;
  loading: boolean;
  error: string | null;
  wowheadDomain?: string;
  /** Fired once per chip interaction (including the All reset). */
  onFilterToggle?: (abilityCount: number, hiddenCount: number) => void;
}

export default function CastTimeline({
  result,
  loading,
  error,
  wowheadDomain = "tbc",
  onFilterToggle,
}: CastTimelineProps) {
  useWowheadTooltips([result]);

  // Hidden-ability filter — empty set means every chip reads as selected and
  // every non-junk cast is visible, matching D-04's "nothing hidden by
  // default". Resets whenever a new fetch result arrives (new fight/player).
  // React's documented "adjusting state when a prop changes" pattern (calling
  // setState directly in the render body, gated on a ref/state comparison)
  // rather than useEffect — an effect that only calls setState synchronously
  // is exactly what react-hooks/set-state-in-effect flags; this bails out
  // and re-renders before paint, so there is no visible intermediate frame.
  const [hiddenAbilityIds, setHiddenAbilityIds] = useState<Set<number>>(new Set());
  const [prevResult, setPrevResult] = useState(result);
  if (prevResult !== result) {
    setPrevResult(result);
    setHiddenAbilityIds(new Set());
  }

  const toggleAbility = useCallback(
    (id: number) => {
      // The onFilterToggle side effect (fires the timeline_filter_used
      // PostHog event) must not live inside the setState updater — React
      // Strict Mode invokes updater functions twice specifically to surface
      // impurities like this, which would double-fire the event on every
      // click (WR-02). Compute `next` from current state up front instead,
      // mirroring resetAbilities below.
      const next = new Set(hiddenAbilityIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setHiddenAbilityIds(next);
      onFilterToggle?.(result?.abilityCounts.length ?? 0, next.size);
    },
    [hiddenAbilityIds, onFilterToggle, result]
  );

  const resetAbilities = useCallback(() => {
    setHiddenAbilityIds(new Set());
    onFilterToggle?.(result?.abilityCounts.length ?? 0, 0);
  }, [onFilterToggle, result]);

  // Hand-rolled fixed-row-height windowing (RESEARCH.md "Don't Hand-Roll" —
  // no virtualisation dependency for a single fixed-height list). The DOM
  // node lives in a plain ref (imperative access, e.g. resetting scrollTop),
  // never in useState — a callback ref attaches/detaches the ResizeObserver
  // as the scroll container mounts/unmounts (e.g. every ability filtered
  // out, then re-shown).
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    containerElRef.current = node;
    if (!node) {
      setViewportHeight(0);
      return;
    }
    setViewportHeight(node.clientHeight);
    const observer = new ResizeObserver(() => setViewportHeight(node.clientHeight));
    observer.observe(node);
    resizeObserverRef.current = observer;
  }, []);

  // Recompute (reset to top) whenever the filter selection changes, since
  // filtering changes the row count and therefore the spacer height. Same
  // during-render pattern as the hiddenAbilityIds reset above.
  const [prevHiddenAbilityIds, setPrevHiddenAbilityIds] = useState(hiddenAbilityIds);
  if (prevHiddenAbilityIds !== hiddenAbilityIds) {
    setPrevHiddenAbilityIds(hiddenAbilityIds);
    setScrollTop(0);
  }

  // Imperatively sync the DOM scroll position to match — a legitimate
  // effect (no setState call here at all), since resetting scrollTop is
  // synchronizing React with an external system (the DOM), not deriving
  // React state.
  useEffect(() => {
    if (containerElRef.current) {
      containerElRef.current.scrollTop = 0;
    }
  }, [hiddenAbilityIds]);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const filteredRows = useMemo<TimelineRow[]>(() => {
    if (!result) return [];
    // Idle/death rows are structural markers, not abilities — they are
    // never hidden by the ability filter.
    return result.rows.filter(
      (row) => row.kind !== "cast" || !hiddenAbilityIds.has(row.abilityGameID ?? -1)
    );
  }, [result, hiddenAbilityIds]);

  const visibleCastCount = useMemo(
    () => filteredRows.filter((row) => row.kind === "cast").length,
    [filteredRows]
  );

  const totalHeight = filteredRows.length * ROW_HEIGHT;
  const startIndex =
    viewportHeight > 0 ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0;
  const endIndex =
    viewportHeight > 0
      ? Math.min(
          filteredRows.length,
          Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN
        )
      : filteredRows.length;
  const visibleRows = filteredRows.slice(startIndex, endIndex);
  const topSpacer = startIndex * ROW_HEIGHT;
  const bottomSpacer = Math.max(0, totalHeight - endIndex * ROW_HEIGHT);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Cast Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!loading && error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && result && result.castCount === 0 && (
          <p className="text-sm text-muted-foreground">{EMPTY_MESSAGE}</p>
        )}

        {!loading && !error && result && result.castCount > 0 && (
          <div className="space-y-3">
            {result.abilityCounts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={resetAbilities}
                  className={`${CHIP_BASE} ${hiddenAbilityIds.size === 0 ? CHIP_SELECTED : CHIP_UNSELECTED}`}
                >All</button>
                {result.abilityCounts.map((ability) => (
                  <button
                    key={ability.abilityGameID}
                    type="button"
                    onClick={() => toggleAbility(ability.abilityGameID)}
                    className={`${CHIP_BASE} ${
                      !hiddenAbilityIds.has(ability.abilityGameID) ? CHIP_SELECTED : CHIP_UNSELECTED
                    }`}
                  >
                    {ability.abilityName} ({ability.count ?? 0})
                  </button>
                ))}
              </div>
            )}

            {visibleCastCount === 0 ? (
              <p className="text-sm text-muted-foreground">{EMPTY_MESSAGE}</p>
            ) : (
              // Bounded height + vertical-only scroll so a long log scrolls
              // inside the card instead of stretching the page.
              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="max-h-[400px] overflow-y-auto overflow-x-hidden"
              >
                <div style={{ height: topSpacer }} />
                {visibleRows.map((row, i) =>
                  renderRow(row, `${row.kind}-${row.fightTimeMs}-${startIndex + i}`, wowheadDomain)
                )}
                <div style={{ height: bottomSpacer }} />

                {result.truncated && (
                  <div className="h-10 flex items-center justify-center text-caption text-status-warn">
                    Log truncated — showing first {result.castCount} casts
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
