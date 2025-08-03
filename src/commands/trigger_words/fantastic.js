import { EmbedBuilder } from 'discord.js';
import { getConsistentImageSize } from '../../utils/embedUtils.js';

export default {
  name: 'fantastic',
  description: 'Envia um gif fantástico!',
  async execute(client, message) {
    const embed = new EmbedBuilder()
      .setTitle('Fantástico?')
      .setColor('#3498db')
      .setDescription('**My granny called, she said, "Travvy, you work too hard\nI\'m worried you forget about me"\n(Ball, ball, ball)**')
      .setImage(getConsistentImageSize('https://bg-so-1.zippyimage.com/2025/07/30/9480775659dfe1f04fcadfa83f8b5fe8.png', 400, 400));
    await message.channel.send({ embeds: [embed] });
  }
};
