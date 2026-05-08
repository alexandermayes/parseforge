import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import type { RaidOverviewResult, RaidPlayerMetrics, RaidRole } from "../types.js";
import { PARSEFORGE_GOLD, ROLE_EMOJI } from "../util/constants.js";
import { formatNumber, formatDuration } from "../util/format.js";
import { buildWCLUrl } from "../util/parse-url.js";

const MAX_PLAYERS_PER_ROLE = 10;

function buildRoleGroup(
  role: RaidRole,
  players: RaidPlayerMetrics[],
): string {
  const emoji = ROLE_EMOJI[role];
  const isHealer = role === "Healer";
  const metricLabel = isHealer ? "HPS" : "DPS";

  const lines = players.slice(0, MAX_PLAYERS_PER_ROLE).map((p) => {
    return `\`${p.name}\` — ${formatNumber(p.throughput)} ${metricLabel}`;
  });

  const remaining = players.length - MAX_PLAYERS_PER_ROLE;
  if (remaining > 0) {
    lines.push(`*...and ${remaining} more*`);
  }

  return `${emoji} **${role}** (${players.length})\n${lines.join("\n")}`;
}

export function buildRaidEmbed(
  result: RaidOverviewResult,
  reportCode: string,
  fightId: number,
): { embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] } {
  const { encounterName, fightDuration, players } = result;

  const roleOrder: RaidRole[] = ["Tank", "Healer", "Caster", "Physical"];
  const grouped = new Map<RaidRole, RaidPlayerMetrics[]>();
  for (const role of roleOrder) grouped.set(role, []);
  for (const p of players) grouped.get(p.role)?.push(p);

  const roleFields = roleOrder
    .filter((role) => (grouped.get(role)?.length ?? 0) > 0)
    .map((role) => buildRoleGroup(role, grouped.get(role)!));

  const totalDeaths = players.reduce((sum, p) => sum + p.deaths, 0);
  const avgIlvl =
    players.length > 0
      ? (players.reduce((sum, p) => sum + p.avgItemLevel, 0) / players.length).toFixed(1)
      : "N/A";

  const flaskCount = players.filter((p) => p.consumables.flask).length;
  const foodCount = players.filter((p) => p.consumables.food).length;
  const wepCount = players.filter((p) => p.consumables.weaponEnhancement).length;
  const total = players.length;

  const embed = new EmbedBuilder()
    .setTitle(`${encounterName}`)
    .setDescription(
      [
        `**Duration:** ${formatDuration(fightDuration)} | **Players:** ${total} | **Deaths:** ${totalDeaths} | **Avg iLvl:** ${avgIlvl}`,
        "",
        `**Consumables:** Flask ${flaskCount}/${total} | Food ${foodCount}/${total} | Wep Enh ${wepCount}/${total}`,
        "",
        ...roleFields,
      ].join("\n"),
    )
    .setColor(PARSEFORGE_GOLD)
    .setFooter({ text: "ParseForge" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("View Full Analysis")
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://parseforge.gg/analyze/${reportCode}?fight=${fightId}`,
      ),
    new ButtonBuilder()
      .setLabel("View on WarcraftLogs")
      .setStyle(ButtonStyle.Link)
      .setURL(buildWCLUrl(reportCode, fightId)),
  );

  return { embeds: [embed], components: [row] };
}
