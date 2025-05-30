import { Container, TextDisplay } from 'commandkit';
import { Colors, Message, MessageFlags } from 'discord.js';
import { randomInt } from 'node:crypto';

// this is a custom event that is triggered when a user levels up
export default async function onLevelUp(
  message: Message<true>,
  newLevel: number
) {
  const colors = Object.values(Colors);
  const randomColor = colors[randomInt(colors.length)];

  const container = (
    <Container accentColor={randomColor}>
      {/* prettier-ignore */}
      <TextDisplay>
        🎉 {message.author.toString()} You have leveled up to level **{newLevel.toLocaleString()}**!
      </TextDisplay>
    </Container>
  );

  await message
    .reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    })
    .catch(console.error);
}
