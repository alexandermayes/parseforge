import { ChatInputCommandInteraction } from "discord.js";
import { parseWCLUrl } from "../util/parse-url.js";
import { fetchReportMeta, fetchRaidOverview, fetchAnalysis, describeApiError } from "../api.js";
import { buildAnalyzeEmbed } from "../embeds/analyze-embed.js";
import { buildRaidEmbed } from "../embeds/raid-embed.js";

export async function handleAnalyze(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply();

  const url = interaction.options.getString("url", true);
  const parsed = parseWCLUrl(url);

  if (!parsed) {
    await interaction.editReply(
      "Invalid WarcraftLogs URL. Paste a link like `https://classic.warcraftlogs.com/reports/ABC123#fight=5&source=12`",
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

    // If we have a sourceId, do full player analysis
    if (parsed.sourceId !== undefined) {
      const result = await fetchAnalysis(
        parsed.code,
        fightId,
        parsed.sourceId,
      );
      const reply = buildAnalyzeEmbed(
        result,
        parsed.code,
        fightId,
        parsed.sourceId,
      );
      await interaction.editReply(reply);
      return;
    }

    // No sourceId — fall back to raid overview
    const result = await fetchRaidOverview(parsed.code, fightId);
    const reply = buildRaidEmbed(result, parsed.code, fightId);
    await interaction.editReply({
      content:
        "*No player source specified in URL — showing raid overview instead. Add `#fight=X&source=Y` to the URL for player analysis.*",
      ...reply,
    });
  } catch (err) {
    await interaction.editReply(describeApiError(err));
  }
}
