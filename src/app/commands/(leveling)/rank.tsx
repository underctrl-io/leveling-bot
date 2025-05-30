import {
  type CommandData,
  type ChatInputCommand,
  type MessageCommand,
  type UserContextMenuCommand,
  TextDisplay,
  Container,
  Separator,
  MediaGallery,
  MediaGalleryItem,
} from 'commandkit';
import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ChatInputCommandInteraction,
  Colors,
  MessageFlags,
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

function Component({
  attachment,
  target,
  t,
}: {
  attachment: AttachmentBuilder;
  target: User;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const url = `attachment://${attachment.name}`;

  return (
    <Container accentColor={Colors.Blurple}>
      <TextDisplay>
        # {t('rank_title', { username: target.username })}
      </TextDisplay>
      <Separator />
      <MediaGallery>
        <MediaGalleryItem url={url} />
      </MediaGallery>
    </Container>
  );
}

async function commonInteraction(
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction,
  t: (key: string, params?: Record<string, string>) => string
) {
  const guildId = interaction.guildId!;
  const target = interaction.isUserContextMenuCommand()
    ? interaction.targetUser
    : interaction.options.getUser('user', false) ?? interaction.user;

  if (target.bot) {
    await interaction.reply({
      content: t('bot_not_allowed'),
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const attachment = await getRankCard(guildId, target as unknown as User);

  if (!attachment) {
    await interaction.editReply({
      content: t('not_ranked', { username: target.username }),
    });

    return;
  }

  await interaction.editReply({
    files: [attachment],
    components: [<Component attachment={attachment} target={target} t={t} />],
    flags: MessageFlags.IsComponentsV2,
  });
}

export const userContextMenu: UserContextMenuCommand = async (ctx) => {
  const { t } = ctx.locale();
  await commonInteraction(
    ctx.interaction as unknown as UserContextMenuCommandInteraction,
    t
  );
};

export const chatInput: ChatInputCommand = async (ctx) => {
  const { t } = ctx.locale();
  await commonInteraction(
    ctx.interaction as unknown as ChatInputCommandInteraction,
    t
  );
};

export const message: MessageCommand = async (ctx) => {
  const { t } = ctx.locale();
  const guildId = ctx.message.guildId!;
  const target =
    ctx.message.mentions.users
      .filter((u) => u.id !== ctx.client.user!.id)
      .first() ?? ctx.message.author;

  if (!target) {
    await ctx.message.reply({
      content:
        ctx.message.mentions.users.size > 0
          ? t('bot_no_rank')
          : t('no_mention'),
    });
    return;
  }

  if (target.bot) {
    await ctx.message.reply({
      content: t('bot_not_allowed'),
    });
    return;
  }

  const attachment = await getRankCard(guildId, target as unknown as User);

  if (!attachment) {
    await ctx.message.reply({
      content: t('not_ranked', { username: target.username }),
    });

    return;
  }

  await ctx.message.reply({
    files: [attachment],
    components: [
      <Component
        attachment={attachment}
        target={target as unknown as User}
        t={t}
      />,
    ],
    flags: MessageFlags.IsComponentsV2,
  });
};
