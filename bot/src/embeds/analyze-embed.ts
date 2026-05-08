import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import type { AnalysisResult } from "../types.js";
import { CLASS_COLORS, PARSEFORGE_GOLD } from "../util/constants.js";
import { formatNumber, formatDuration, formatPercentile } from "../util/format.js";
import { buildWCLUrl } from "../util/parse-url.js";

const PRIORITY_EMOJI: Record<string, string> = {
  high: "\u{1F534}",
  medium: "\u{1F7E1}",
  low: "\u{1F7E2}",
};

export function buildAnalyzeEmbed(
  result: AnalysisResult,
  reportCode: string,
  fightId: number,
  sourceId: number,
): { embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] } {
  const {
    playerName,
    playerClass,
    playerSpec,
    playerRole,
    encounterName,
    fightDuration,
    dps,
    gear,
    consumables,
    suggestions,
    metricPercentiles,
  } = result;

  const color = CLASS_COLORS[playerClass] ?? PARSEFORGE_GOLD;
  const isHealer = playerRole === "healer";
  const metricLabel = isHealer ? "HPS" : "DPS";

  const consumableList = [
    consumables.flask ? "Flask" : "~~Flask~~",
    consumables.food ? "Food" : "~~Food~~",
    consumables.weaponEnhancement ? "Wep Enh" : "~~Wep Enh~~",
  ].join(" | ");

  const topSuggestions = suggestions.slice(0, 3).map((s) => {
    const emoji = PRIORITY_EMOJI[s.priority] ?? "";
    return `${emoji} **${s.title}**\n${s.description}`;
  });

  const gradeDisplay = metricPercentiles
    ? `**Overall:** ${metricPercentiles.overallGrade} (${metricPercentiles.overallScore}/100)`
    : "";

  const embed = new EmbedBuilder()
    .setTitle(`${playerName} — ${playerSpec} ${playerClass}`)
    .setDescription(
      [
        `**${encounterName}** | ${formatDuration(fightDuration)}`,
        "",
        `**${metricLabel}:** ${formatNumber(dps.playerDps)} | Percentile: ${formatPercentile(dps.percentile)}`,
        `Median: ${formatNumber(dps.medianDps)} (${dps.gapToMedian > 0 ? `-${dps.gapToMedian.toFixed(1)}%` : "above"}) | Top: ${formatNumber(dps.topDps)} (${dps.gapToTop > 0 ? `-${dps.gapToTop.toFixed(1)}%` : "above"})`,
        "",
        `**Gear:** iLvl ${gear.playerAvgIlvl.toFixed(0)} | Missing Enchants: ${gear.missingEnchants} | Missing Gems: ${gear.missingGems}`,
        `**Consumables:** ${consumableList}`,
        gradeDisplay ? `\n${gradeDisplay}` : "",
        topSuggestions.length > 0
          ? `\n**Top Improvements:**\n${topSuggestions.join("\n\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .setColor(color)
    .setFooter({ text: "ParseForge" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("View Full Analysis")
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://parseforge.gg/analyze/${reportCode}?fight=${fightId}&source=${sourceId}`,
      ),
    new ButtonBuilder()
      .setLabel("View on WarcraftLogs")
      .setStyle(ButtonStyle.Link)
      .setURL(buildWCLUrl(reportCode, fightId, sourceId)),
  );

  return { embeds: [embed], components: [row] };
}
