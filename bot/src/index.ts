import "dotenv/config";
import {
  ActivityType,
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Interaction,
  type Message,
} from "discord.js";
import { handleRaid } from "./commands/raid.js";
import { handleAnalyze } from "./commands/analyze.js";
import { parseWCLUrl } from "./util/parse-url.js";
import { PARSEFORGE_GOLD } from "./util/constants.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("raid")
    .setDescription("Show a raid overview from WarcraftLogs")
    .addStringOption((opt) =>
      opt
        .setName("url")
        .setDescription("WarcraftLogs report URL or code")
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("analyze")
    .setDescription("Analyze a player from WarcraftLogs")
    .addStringOption((opt) =>
      opt
        .setName("url")
        .setDescription(
          "WarcraftLogs URL with #fight=X&source=Y for player analysis",
        )
        .setRequired(true),
    ),
];

async function registerCommands(): Promise<void> {
  const rest = new REST().setToken(token!);
  const guildId = process.env.DISCORD_GUILD_ID;

  const route = guildId
    ? Routes.applicationGuildCommands(clientId!, guildId)
    : Routes.applicationCommands(clientId!);

  const data = await rest.put(route, {
    body: commands.map((c) => c.toJSON()),
  });

  const count = Array.isArray(data) ? data.length : 0;
  console.log(
    `Registered ${count} commands${guildId ? ` in guild ${guildId}` : " globally"}`,
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  c.user.setActivity("getlootlist.com", { type: ActivityType.Playing });
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case "raid":
      await handleRaid(interaction);
      break;
    case "analyze":
      await handleAnalyze(interaction);
      break;
    default:
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply("Unknown command.");
      } else {
        await interaction.reply({ content: "Unknown command.", ephemeral: true });
      }
  }
});

// Passive WCL URL detection — when someone pastes a WarcraftLogs link in chat,
// offer a one-click "Analyze on ParseForge" button
const WCL_URL_REGEX =
  /https?:\/\/(?:classic\.)?warcraftlogs\.com\/reports\/[a-zA-Z0-9]+/;

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;

  const match = message.content.match(WCL_URL_REGEX);
  if (!match) return;

  const parsed = parseWCLUrl(match[0]);
  if (!parsed) return;

  const pfUrl = new URL(`https://parseforge.gg/analyze/${parsed.code}`);
  if (parsed.fightId !== undefined) pfUrl.searchParams.set("fight", String(parsed.fightId));
  if (parsed.sourceId !== undefined) pfUrl.searchParams.set("source", String(parsed.sourceId));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Analyze on ParseForge")
      .setStyle(ButtonStyle.Link)
      .setURL(pfUrl.toString()),
  );

  await message.reply({
    components: [row],
    allowedMentions: { repliedUser: false },
  });
});

async function main(): Promise<void> {
  await registerCommands();
  await client.login(token);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
