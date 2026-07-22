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
  c.user.setActivity("parseforge.gg", { type: ActivityType.Playing });
});

// ─── Cooldowns (in-memory, best-effort) ──────────────────────────────
// These blunt spam/amplification, not authoritative rate limits — a bot restart
// resets them, which is fine. Per-channel for passive link replies; per-user for
// slash commands so one user can't hammer the API through /raid or /analyze.
const CHANNEL_COOLDOWN_MS = 30_000;
const USER_COMMAND_COOLDOWN_MS = 10_000;
const channelCooldowns = new Map<string, number>();
const userCooldowns = new Map<string, number>();

/** True if `key` is still cooling down; otherwise stamps `now` and returns false. */
function onCooldown(map: Map<string, number>, key: string, windowMs: number): boolean {
  const now = Date.now();
  const last = map.get(key);
  if (last !== undefined && now - last < windowMs) return true;
  map.set(key, now);
  return false;
}

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Per-user cooldown — a single user can't hammer the API through commands.
  if (onCooldown(userCooldowns, interaction.user.id, USER_COMMAND_COOLDOWN_MS)) {
    await interaction
      .reply({ content: "Give it a few seconds between commands and try again.", ephemeral: true })
      .catch(() => {});
    return;
  }

  // A handler that rejects (e.g. a Discord permission/API error) would otherwise
  // surface as an unhandled rejection and crash the process on Node 20.
  try {
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
  } catch (err) {
    console.error(`Command "${interaction.commandName}" failed:`, err);
    const msg = "Something went wrong handling that command.";
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(msg).catch(() => {});
    } else {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
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

  // Only auto-reply to links that point at a specific fight — a bare report link
  // pasted in chat shouldn't trigger the bot.
  if (parsed.fightId === undefined) return;

  // Per-channel cooldown so a flurry of pasted links doesn't spam a channel.
  if (onCooldown(channelCooldowns, message.channelId, CHANNEL_COOLDOWN_MS)) return;

  const pfUrl = new URL(`https://parseforge.gg/analyze/${parsed.code}`);
  pfUrl.searchParams.set("fight", String(parsed.fightId));
  if (parsed.sourceId !== undefined) pfUrl.searchParams.set("source", String(parsed.sourceId));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Analyze on ParseForge")
      .setStyle(ButtonStyle.Link)
      .setURL(pfUrl.toString()),
  );

  // Catch reply failures (e.g. missing Send Messages permission) so they don't
  // bubble up as an unhandled rejection and crash the bot on Node 20.
  try {
    await message.reply({
      components: [row],
      allowedMentions: { repliedUser: false },
    });
  } catch (err) {
    console.warn(`Failed to reply in channel ${message.channelId}:`, err);
  }
});

async function main(): Promise<void> {
  await registerCommands();
  await client.login(token);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
