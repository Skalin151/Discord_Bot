import { EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';

export default {
  name: 'balance',
  description: 'Mostra o saldo de pontos do utilizador.',
  async execute(client, message) {
    const userId = message.author.id;
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, points: 1000 });
      await user.save();
    }
    const embed = new EmbedBuilder()
      .setTitle('💰 Saldo de Pontos')
      .setColor('#00b894')
      .setDescription(`Tens **${user.points} pontos** disponíveis.`)
      .setFooter({ text: 'Continua a jogar para ganhar mais pontos!' });
    await message.channel.send({ embeds: [embed] });
  },
};
