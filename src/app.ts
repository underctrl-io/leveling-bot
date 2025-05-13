import { Client, IntentsBitField } from 'discord.js';
import { onApplicationBootstrap } from 'commandkit';
import { prisma } from './database/db';
import { cacheTag, setCacheProvider } from '@commandkit/cache';
import { RedisCache } from '@commandkit/redis';
import { Redis } from 'ioredis';
import { Font } from 'canvacord';

// load the default font for canvacord
Font.loadDefault();

async function fetchGuildPrefix(guildId: string) {
  'use cache';

  cacheTag(`guild_prefix:${guildId}`);

  const guild = await prisma.guild.findUnique({ where: { id: guildId } });
  return guild?.messagePrefix ?? '!';
}

// set the prefix resolver for message commands
onApplicationBootstrap(async (commandkit) => {
  commandkit.setPrefixResolver((message) =>
    message.inGuild() ? fetchGuildPrefix(message.guildId) : '!'
  );

  const redis = new Redis(process.env.REDIS_URL!);

  setCacheProvider(new RedisCache(redis));
});

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

export default client;
