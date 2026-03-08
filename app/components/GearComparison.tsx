"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GearAnalysis, GearPopularityAnalysis } from "@/lib/wcl-types";
import { useWowheadTooltips } from "@/lib/use-wowhead";

function wowheadItemUrl(itemId: number, domain: string): string {
  return `https://www.wowhead.com/${domain}/item=${itemId}`;
}

function itemLabel(item: { id: number; name?: string; itemLevel?: number }): string {
  if (item.name) return item.name;
  return `Item #${item.id}`;
}

function GearPopularity({
  data,
  domain,
}: {
  data: GearPopularityAnalysis;
  domain: string;
}) {
  if (data.sampleSize === 0 || data.slots.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Gear Popularity</CardTitle>
          <Badge variant="outline">
            {data.popularMatchCount}/{data.totalSlots} popular items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Most used items across {data.sampleSize} top players
        </p>
        <div className="space-y-3">
          {data.slots.map((slot) => (
            <div key={slot.slot} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-label w-20 shrink-0">
                  {slot.slotName}
                </span>
                {slot.playerUsesPopular && (
                  <span className="text-[10px] text-status-good">{"\u2713"} popular</span>
                )}
              </div>
              <div className="pl-1 space-y-0.5">
                {slot.items.slice(0, 3).map((item) => {
                  const isPlayerItem = slot.playerItemId === item.id;
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <div className="w-8 bar-xs rounded-full bg-surface-2 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-gold-from/60"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-muted-foreground w-8 text-right shrink-0">
                        {item.percentage}%
                      </span>
                      <a
                        href={wowheadItemUrl(item.id, domain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:underline truncate ${
                          isPlayerItem ? "text-blue-400" : "text-muted-foreground"
                        }`}
                        data-wowhead={`item=${item.id}&domain=${domain}`}
                      >
                        {item.name || `Item #${item.id}`}
                        {isPlayerItem && " (yours)"}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function GearComparison({
  data,
  popularity,
}: {
  data: GearAnalysis;
  popularity?: GearPopularityAnalysis;
}) {
  useWowheadTooltips([data, popularity]);
  const domain = data.wowheadDomain || "tbc";
  const interestingSlots = data.slots.filter(
    (s) => s.playerItem || s.topItem
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Gear Comparison</CardTitle>
            <div className="flex gap-2">
              {data.playerAvgIlvl > 0 && (
                <Badge variant="outline">
                  Avg ilvl: {data.playerAvgIlvl}
                </Badge>
              )}
              {data.missingEnchants > 0 && (
                <Badge variant="destructive">
                  {data.missingEnchants} missing enchant{data.missingEnchants > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-[90px_1fr_1fr] gap-2 text-label border-b border-border/50 pb-2">
              <span>Slot</span>
              <span>Your Item</span>
              <span>Top Player</span>
            </div>
            {interestingSlots.map((slot) => (
              <div
                key={slot.slot}
                className={`grid grid-cols-[90px_1fr_1fr] gap-2 text-sm py-1.5 border-b border-border/50 last:border-0 ${
                  slot.missingEnchant ? "bg-status-bad/10 rounded px-1" : ""
                } ${slot.isSame ? "opacity-60" : ""}`}
              >
                <span className="text-muted-foreground text-xs pt-0.5">
                  {slot.slotName}
                </span>
                <div className="min-w-0">
                  {slot.playerItem ? (
                    <div>
                      <a
                        href={wowheadItemUrl(slot.playerItem.id, domain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate block text-blue-400"
                        data-wowhead={`item=${slot.playerItem.id}&domain=${domain}`}
                      >
                        {itemLabel(slot.playerItem)}
                      </a>
                      <div className="flex gap-2 flex-wrap">
                        {slot.playerItem.itemLevel && (
                          <span className="text-xs text-muted-foreground">
                            ilvl {slot.playerItem.itemLevel}
                          </span>
                        )}
                        {slot.playerEnchant && (
                          <span className="text-xs text-status-good">
                            {slot.playerEnchant}
                          </span>
                        )}
                        {slot.playerItem.gems && slot.playerItem.gems.length > 0 && (
                          <span className="text-xs text-purple-400">
                            {slot.playerItem.gems.length} gem{slot.playerItem.gems.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {slot.missingEnchant && (
                          <span className="text-xs text-destructive font-medium">
                            No enchant
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Empty</span>
                  )}
                </div>
                <div className="min-w-0">
                  {slot.topItem ? (
                    <div>
                      <a
                        href={wowheadItemUrl(slot.topItem.id, domain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:underline truncate block ${
                          slot.isSame ? "text-muted-foreground" : "text-gold-from"
                        }`}
                        data-wowhead={`item=${slot.topItem.id}&domain=${domain}`}
                      >
                        {itemLabel(slot.topItem)}
                        {slot.isSame && " (same)"}
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gear Popularity */}
      {popularity && <GearPopularity data={popularity} domain={domain} />}
    </div>
  );
}
