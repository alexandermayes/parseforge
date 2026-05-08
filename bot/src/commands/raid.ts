import { ChatInputCommandInteraction } from "discord.js";
import { parseWCLUrl } from "../util/parse-url.js";
import { fetchReportMeta, fetchRaidOverview } from "../api.js";
import { buildRaidEmbed } from "../embeds/raid-embed.js";

export async function handleRaid(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply();

  const url = interaction.options.getString("url", true);
  const parsed = parseWCLUrl(url);

  if (!parsed) {
    await interaction.editReply(
      "Invalid WarcraftLogs URL. Paste a link like `https://classic.warcraftlogs.com/reports/ABC123#fight=5`",
    );
    return;
  }

  try {
    let fightId = parsed.fightId;

    if (fightId === undefined) {
      const meta = await fetchReportMeta(parsed.code);
      if (meta.fights.length === 0) {
        await interaction.editReply("No boss encounters found in this report.");
        return;
      }
      fightId = meta.fights[0].id;
    }

    const result = await fetchRaidOverview(parsed.code, fightId);
    const reply = buildRaidEmbed(result, parsed.code, fightId);
    await interaction.editReply(reply);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await interaction.editReply(`Failed to fetch raid data: ${message}`);
  }
}
