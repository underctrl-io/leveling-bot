import {
  type CommandData,
  type ChatInputCommand,
  type MessageCommand,
  useEnvironment,
  Logger,
} from 'commandkit';
import { cacheTag } from '@commandkit/cache';
import { LevelingModule } from '../../../modules/leveling-module';
import {
  ImageSource,
  LeaderboardBuilder,
  LeaderboardVariants,
} from 'canvacord';
import { AttachmentBuilder } from 'discord.js';

export const command: CommandData = {
  name: 'leaderboard',
  description: 'leaderboard command',
};

async function fetchLeaderboard(guildId: string) {
  'use cache';

  cacheTag(`leaderboard:${guildId}`);

  const { client } = useEnvironment().commandkit;

  const leaderboard = await LevelingModule.computeLeaderboard(guildId);
  const total = await LevelingModule.countEntries(guildId);

  const players: {
    displayName: string;
    username: string;
    level: number;
    xp: number;
    rank: number;
    avatar: ImageSource;
  }[] = [];

  let rank = 1;

  for (const entry of leaderboard) {
    const user = await client.users.fetch(entry.id).catch(() => null);

    if (!user) {
      players.push({
        displayName: `Unknown User ${rank}`,
        username: 'unknown-user',
        level: entry.level,
        xp: entry.xp,
        rank: rank++,
        avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
      });

      continue;
    }

    players.push({
      displayName: user.username,
      username: user.username,
      level: entry.level,
      xp: entry.xp,
      rank: rank++,
      avatar: user.displayAvatarURL({
        forceStatic: true,
        extension: 'png',
        size: 512,
      }),
    });
  }

  return { players, total };
}

async function createLeaderboardCard(data: {
  leaderboard: Awaited<ReturnType<typeof fetchLeaderboard>>;
  guildName: string;
  guildIcon: string | null;
}) {
  const card = new LeaderboardBuilder()
    .setVariant(LeaderboardVariants.Horizontal)
    .setHeader({
      image: data.guildIcon ?? 'https://cdn.discordapp.com/embed/avatars/0.png',
      subtitle: `Total ${data.leaderboard.total} players`,
      title: data.guildName,
    })
    .setPlayers(data.leaderboard.players);

  const image = await card.build({
    format: 'webp',
  });

  const attachment = new AttachmentBuilder(image, {
    name: `leaderboard-${data.guildName}.webp`,
    description: `Leaderboard for ${data.guildName}`,
  });

  return attachment;
}

export const chatInput: ChatInputCommand = async (ctx) => {
  const guildId = ctx.interaction.guildId!;

  await ctx.interaction.deferReply();

  const start = performance.now();
  const leaderboard = await fetchLeaderboard(guildId);
  const end = performance.now() - start;

  Logger.info(`Level data fetched in ${end.toFixed(2)}ms`);

  if (!leaderboard.players.length) {
    await ctx.interaction.editReply({
      content: 'No players found in the leaderboard.',
    });

    return;
  }

  const card = await createLeaderboardCard({
    leaderboard,
    guildName: ctx.interaction.guild!.name,
    guildIcon: ctx.interaction.guild!.iconURL({
      forceStatic: true,
      extension: 'png',
      size: 512,
    }),
  });

  await ctx.interaction.editReply({
    content: 'Leaderboard 🏆',
    files: [card],
  });
};

export const message: MessageCommand = async (ctx) => {
  const guildId = ctx.message.guildId!;
  const leaderboard = await fetchLeaderboard(guildId);

  if (!leaderboard.players.length) {
    await ctx.message.reply({
      content: 'No players found in the leaderboard.',
    });

    return;
  }

  const card = await createLeaderboardCard({
    leaderboard,
    guildName: ctx.message.guild!.name,
    guildIcon: ctx.message.guild!.iconURL({
      forceStatic: true,
      extension: 'png',
      size: 512,
    }),
  });

  await ctx.message.reply({
    content: 'Leaderboard 🏆',
    files: [card],
  });
};
