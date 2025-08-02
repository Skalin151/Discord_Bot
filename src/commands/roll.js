import { EmbedBuilder } from 'discord.js';

export default {
  name: 'roll',
  description: 'Rola um dado de 6 lados',
  async execute(client, message, args) {
    const result = Math.ceil(Math.random() * 6);

    const embed = new EmbedBuilder()
      .setTitle('🎲・Roll')
      .setDescription(`Obtiveste ${result}`)
      .setColor('#ff6b6b')
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};
