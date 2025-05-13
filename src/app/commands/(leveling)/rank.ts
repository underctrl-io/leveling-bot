import {
  type CommandData,
  type ChatInputCommand,
  type MessageCommand,
  type UserContextMenuCommand,
  Logger,
} from 'commandkit';
import { LevelingModule } from '../../../modules/leveling-module';
import { cacheLife, cacheTag } from '@commandkit/cache';
import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  type User,
} from 'discord.js';
import { BuiltInGraphemeProvider, RankCardBuilder } from 'canvacord';

export const command: CommandData = {
  name: 'rank',
  description: 'rank command',
  options: [
    {
      name: 'user',
      description: 'user to get rank for',
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],
};

async function fetchLevel(guildId: string, userId: string) {
  'use cache';

  cacheTag(`xp:${guildId}:${userId}`);
  cacheLife('1h');

  const level = await LevelingModule.getLevel(guildId, userId);

  if (!level) return null;

  const rank = (await LevelingModule.getRank(guildId, userId)) ?? 0;

  return { level, rank };
}

async function createRankCard(
  levelingData: {
    level: { xp: number; level: number };
    rank: number;
  },
  target: User
) {
  const { level, rank } = levelingData;

  const card = new RankCardBuilder()
    .setAvatar(
      target.displayAvatarURL({
        forceStatic: true,
        extension: 'png',
        size: 512,
      })
    )
    .setCurrentXP(level.xp)
    .setRequiredXP(LevelingModule.calculateLevelXP(level.level))
    .setLevel(level.level)
    .setRank(rank)
    .setUsername(target.globalName ?? target.username)
    .setDisplayName(target.globalName ?? target.username)
    .setStatus('none')
    .setGraphemeProvider(BuiltInGraphemeProvider.Twemoji);

  const image = await card.build({
    format: 'webp',
  });

  const attachment = new AttachmentBuilder(image, {
    name: `rank-${target.id}.webp`,
    description: `Rank card for ${target.username}`,
  });

  return attachment;
}

export const userContextMenu: UserContextMenuCommand = async (ctx) => {
  const guildId = ctx.interaction.guildId!;
  const target = ctx.interaction.targetUser;

  if (target.bot) {
    await ctx.interaction.reply({
      content: 'You cannot check the rank of a bot.',
      ephemeral: true,
    });
    return;
  }

  await ctx.interaction.deferReply();

  const levelingData = await fetchLevel(guildId, target.id);

  if (!levelingData) {
    await ctx.interaction.editReply({
      content: `${target.username} is not ranked yet. Tell them to send a message in the server to get ranked!`,
    });

    return;
  }

  const attachment = await createRankCard(
    levelingData,
    // mismatched User type
    target as unknown as User
  );

  await ctx.interaction.editReply({
    content: `${target.username}'s rank card`,
    files: [attachment],
  });
};

export const chatInput: ChatInputCommand = async (ctx) => {
  const guildId = ctx.interaction.guildId!;
  const target = ctx.options.getUser('user', false) ?? ctx.interaction.user;

  if (target.bot) {
    await ctx.interaction.reply({
      content: 'You cannot check the rank of a bot.',
      ephemeral: true,
    });
    return;
  }

  await ctx.interaction.deferReply();

  const start = performance.now();
  const levelingData = await fetchLevel(guildId, target.id);
  const end = performance.now() - start;

  Logger.info(`Level data fetched in ${end.toFixed(2)}ms`);

  if (!levelingData) {
    await ctx.interaction.editReply({
      content: `${target.username} is not ranked yet. Tell them to send a message in the server to get ranked!`,
    });

    return;
  }

  const attachment = await createRankCard(
    levelingData,
    // mismatched User type
    target as unknown as User
  );

  await ctx.interaction.editReply({
    content: `${target.username}'s rank card`,
    files: [attachment],
  });
};

export const message: MessageCommand = async (ctx) => {
  const guildId = ctx.message.guildId!;
  const target =
    ctx.message.mentions.users
      // omit the client user if the prefix mentions the bot
      .filter((u) => u.id !== ctx.client.user!.id)
      .first() ?? ctx.message.author;

  if (!target) {
    await ctx.message.reply({
      content:
        ctx.message.mentions.users.size > 0
          ? "I don't have rank silly"
          : 'You need to mention a user to check their rank.',
    });
    return;
  }

  if (target.bot) {
    await ctx.message.reply({
      content: 'You cannot check the rank of a bot.',
    });
    return;
  }

  const levelingData = await fetchLevel(guildId, target.id);

  if (!levelingData) {
    await ctx.message.reply({
      content: `${target.username} is not ranked yet. Tell them to send a message in the server to get ranked!`,
    });

    return;
  }

  const attachment = await createRankCard(
    levelingData,
    // mismatched User type
    target as unknown as User
  );

  await ctx.message.reply({
    content: `${target.username}'s rank card`,
    files: [attachment],
  });
};
