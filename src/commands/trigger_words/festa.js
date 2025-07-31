import { EmbedBuilder } from 'discord.js';

export default {
  name: 'festa',
  description: 'Envia uma mensagem de festa!',
  async execute(client, message) {
    const embed = new EmbedBuilder()
      .setTitle('Festa?')
      .setColor('#e67e22')
      .setDescription('Pila na testa');
    await message.channel.send({ embeds: [embed] });
  }
};
