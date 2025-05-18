import {
  type CommandData,
  type ChatInputCommand,
  type MessageCommand,
} from 'commandkit';
import { Guild } from 'discord.js';
import { getLeaderboardCard } from './_leaderboard.utils';

export const command: CommandData = {
  name: 'leaderboard',
  description: 'leaderboard command',
};

export const chatInput: ChatInputCommand = async (ctx) => {
  await ctx.interaction.deferReply();

  const leaderboard = await getLeaderboardCard(
    // mismatched types
    ctx.guild as unknown as Guild
  );

  if (!leaderboard) {
    await ctx.interaction.editReply({
      content: 'No players found in the leaderboard.',
    });

    return;
  }

  await ctx.interaction.editReply({
    content: 'Leaderboard 🏆',
    files: [leaderboard],
  });
};

export const message: MessageCommand = async (ctx) => {
  const leaderboard = await getLeaderboardCard(
    // mismatched types
    ctx.guild as unknown as Guild
  );

  if (!leaderboard) {
    await ctx.message.reply({
      content: 'No players found in the leaderboard.',
    });

    return;
  }

  await ctx.message.reply({
    content: 'Leaderboard 🏆',
    files: [leaderboard],
  });
};
