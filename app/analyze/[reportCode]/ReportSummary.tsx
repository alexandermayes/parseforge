import { CLASS_COLORS } from "@/lib/constants";
import type { ReportMeta } from "@/lib/wcl-types";

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-lg px-4 py-2.5 min-w-[92px]">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

// Server-rendered summary of a public report. This is the crawlable content
// that makes analyze pages indexable — real boss/player/zone entities in the
// HTML rather than a fully client-rendered shell. Rendered below the
// interactive app (see page.tsx); the client experience is unchanged.
export default function ReportSummary({
  meta,
  reportCode,
}: {
  meta: ReportMeta;
  reportCode: string;
}) {
  const bosses = meta.fights;
  const kills = bosses.filter((f) => f.kill).length;
  const combatMs = bosses.reduce((sum, f) => sum + (f.duration || 0), 0);
  const rawTitle = meta.title?.trim();
  const hasTitle = !!rawTitle && !/^[?\s.]+$/.test(rawTitle);
  const headline = hasTitle ? rawTitle! : meta.zone;

  return (
    <section
      aria-label="Report summary"
      className="mt-12 border-t border-white/[0.06] pt-8 space-y-6 text-sm"
    >
      <div className="space-y-2">
        <h2 className="text-heading-sm text-foreground">
          {headline} — WoW Classic raid analysis
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Performance analysis of{" "}
          <span className="text-foreground">{headline}</span> in {meta.zone},
          logged by {meta.owner}. This report covers {bosses.length}{" "}
          {bosses.length === 1 ? "encounter" : "encounters"}
          {bosses.length > 0 && <> ({kills} killed)</>} and {meta.players.length}{" "}
          {meta.players.length === 1 ? "raider" : "raiders"}. ParseForge compares
          each player&apos;s DPS, HPS, gear, enchants, and consumable usage
          against the top-ranked parses and generates specific improvement
          suggestions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Stat label="Encounters" value={String(bosses.length)} />
        <Stat label="Kills" value={`${kills}/${bosses.length}`} />
        <Stat label="Raiders" value={String(meta.players.length)} />
        {combatMs > 0 && <Stat label="Combat" value={formatDuration(combatMs)} />}
      </div>

      {bosses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-heading-sm text-muted-foreground">Encounters</h3>
          <ul className="flex flex-wrap gap-2">
            {bosses.map((f) => (
              <li
                key={f.id}
                className="surface-card rounded-lg px-3 py-1.5 text-xs"
              >
                <span className="text-foreground">{f.name}</span>
                <span
                  className={`ml-2 ${f.kill ? "text-status-good" : "text-muted-foreground"}`}
                >
                  {f.kill ? "Kill" : "Wipe"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {meta.players.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-heading-sm text-muted-foreground">Roster</h3>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {meta.players.map((p) => (
              <li key={p.id} style={{ color: CLASS_COLORS[p.type] ?? undefined }}>
                {p.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Source:{" "}
        <a
          href={`https://classic.warcraftlogs.com/reports/${reportCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-from hover:underline"
        >
          Warcraft Logs report {reportCode}
        </a>
      </p>
    </section>
  );
}
