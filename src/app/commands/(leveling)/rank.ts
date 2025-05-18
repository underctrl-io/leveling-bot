import {
  type CommandData,
  type ChatInputCommand,
  type MessageCommand,
  type UserContextMenuCommand,
} from 'commandkit';
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  type User,
} from 'discord.js';
import { getRankCard } from './_rank.utils';

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

async function commonInteraction(
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction
) {
  const guildId = interaction.guildId!;
  const target = interaction.isUserContextMenuCommand()
    ? interaction.targetUser
    : interaction.options.getUser('user', false) ?? interaction.user;

  if (target.bot) {
    await interaction.reply({
      content: 'You cannot check the rank of a bot.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const attachment = await getRankCard(
    guildId,
    // mismatched User type
    target as unknown as User
  );

  if (!attachment) {
    await interaction.editReply({
      content: `${target.username} is not ranked yet. Tell them to send a message in the server to get ranked!`,
    });

    return;
  }

  await interaction.editReply({
    content: `${target.username}'s rank card`,
    files: [attachment],
  });
}

export const userContextMenu: UserContextMenuCommand = async (ctx) => {
  await commonInteraction(
    // type conflict
    ctx.interaction as unknown as UserContextMenuCommandInteraction
  );
};

export const chatInput: ChatInputCommand = async (ctx) => {
  await commonInteraction(
    // type conflict
    ctx.interaction as unknown as ChatInputCommandInteraction
  );
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

  const attachment = await getRankCard(
    guildId,
    // mismatched User type
    target as unknown as User
  );

  if (!attachment) {
    await ctx.message.reply({
      content: `${target.username} is not ranked yet. Tell them to send a message in the server to get ranked!`,
    });

    return;
  }

  await ctx.message.reply({
    content: `${target.username}'s rank card`,
    files: [attachment],
  });
};
