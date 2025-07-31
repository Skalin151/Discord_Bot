import { EmbedBuilder } from 'discord.js';

export default {
  name: 'owner',
  description: 'Mostra informações sobre o dono do bot.',
  async execute(client, message) {
    const embed = new EmbedBuilder()
      .setTitle('👑 Owner do Bot')
      .setThumbnail('https://i.postimg.cc/85rJwKGF/tohkapfp.jpg') // Foto personalizada
      .setDescription('Informações sobre o criador do bot:')
      .addFields(
      { name: 'Nome', value: 'Skalin151', inline: true },
      { name: 'GitHub', value: '[Skalin151](https://github.com/Skalin151)', inline: true },
      { name: 'Discord', value: 'skalin151', inline: true },
      { name: 'Site', value: '[THK](https://skalin151.github.io/)', inline: true },
      { name: '???', value: '1: .---- -----', inline: true }
      )
      .setColor(0x7c0bd9)
      .setFooter({ text: 'Obrigado por usar o bot!' });
    await message.channel.send({ embeds: [embed] });
  }
};
