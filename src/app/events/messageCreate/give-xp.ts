import type { Message } from 'discord.js';
import { randomInt } from 'node:crypto';
import { LevelingModule } from '../../../modules/leveling-module';
import { invalidate } from '@commandkit/cache';

export default async function onMessageCreate(message: Message) {
  // ignore DMs
  if (!message.inGuild()) return;
  // ignore bot messages
  if (message.author.bot) return;

  const isBooster = message.member?.premiumSinceTimestamp != null;

  const currentLevel = await LevelingModule.getLevel(
    message.guildId,
    message.author.id
  );

  // random xp between 1 and 30
  // boosters get random 0-10 extra xp
  const randomXP = randomInt(1, 20) + (isBooster ? randomInt(0, 10) : 0);
  const nextXP = (currentLevel?.xp ?? 0) + randomXP;

  // level up if the user has enough xp
  if (currentLevel) {
    const currentLevelXP = LevelingModule.calculateLevelXP(currentLevel.level);

    if (nextXP > currentLevelXP) {
      await LevelingModule.incrementLevel(message.guildId, message.author.id);

      await message.reply({
        content: `You leveled up to level ${
          currentLevel.level + 1
        }! You now have ${nextXP} XP.`,
      });

      // invalidate the cache for the user and leaderboard
      await invalidate([
        `xp:${message.guildId}:${message.author.id}`, // xp cache
        `leaderboard:${message.guildId}`, // leaderboard cache
      ]);

      return;
    }
  }

  // assign xp to the user
  await LevelingModule.assignXP({
    guildId: message.guildId,
    userId: message.author.id,
    xp: nextXP,
    level: currentLevel?.level ?? 1,
  });

  // invalidate the cache for the user and leaderboard
  await invalidate([
    `xp:${message.guildId}:${message.author.id}`, // xp cache
    `leaderboard:${message.guildId}`, // leaderboard cache
  ]);
}
