import {
  type CommandData,
  type ChatInputCommand,
  type MessageCommand,
  Container,
  MediaGallery,
  MediaGalleryItem,
  TextDisplay,
  Separator,
} from 'commandkit';
import { AttachmentBuilder, Colors, Guild, MessageFlags } from 'discord.js';
import { getLeaderboardCard } from './_leaderboard.utils';

export const command: CommandData = {
  name: 'leaderboard',
  description: 'leaderboard command',
};

function Component({
  attachment,
  t,
}: {
  attachment: AttachmentBuilder;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const url = `attachment://${attachment.name}`;

  return (
    <Container accentColor={Colors.Blurple}>
      <TextDisplay># {t('title')}</TextDisplay>
      <Separator />
      <MediaGallery>
        <MediaGalleryItem url={url} />
      </MediaGallery>
    </Container>
  );
}

export const chatInput: ChatInputCommand = async (ctx) => {
  const { t } = ctx.locale();
  await ctx.interaction.deferReply();

  const leaderboard = await getLeaderboardCard(ctx.guild as unknown as Guild);

  if (!leaderboard) {
    await ctx.interaction.editReply({
      content: t('no_players'),
    });

    return;
  }

  await ctx.interaction.editReply({
    components: [<Component attachment={leaderboard} t={t} />],
    files: [leaderboard],
    flags: MessageFlags.IsComponentsV2,
  });
};

export const message: MessageCommand = async (ctx) => {
  const { t } = ctx.locale();
  const leaderboard = await getLeaderboardCard(ctx.guild as unknown as Guild);

  if (!leaderboard) {
    await ctx.message.reply({
      content: t('no_players'),
    });

    return;
  }

  await ctx.message.reply({
    files: [leaderboard],
    components: [<Component attachment={leaderboard} t={t} />],
    flags: MessageFlags.IsComponentsV2,
  });
};
