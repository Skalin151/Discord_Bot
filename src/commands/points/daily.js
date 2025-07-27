import { EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';

function getTodayDatePT() {
  // Portugal timezone: UTC+0 (winter), UTC+1 (summer)
  const now = new Date();
  // For simplicity, use UTC date (works for most cases)
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default {
  name: 'daily',
  description: 'Recebe 500 pontos uma vez por dia (reset às 00:00 PT).',
  async execute(client, message) {
    const userId = message.author.id;
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, points: 1000 });
    }
    const today = getTodayDatePT();
    if (user.lastDaily === today) {
      return message.reply('❌ Já recebeste o bónus diário hoje! Volta amanhã.');
    }
    user.points += 500;
    user.lastDaily = today;
    await user.save();
    const embed = new EmbedBuilder()
      .setTitle('🎁 Bónus Diário')
      .setColor('#fdcb6e')
      .setDescription('Recebeste **500 pontos**! Volta amanhã para mais.')
      .setFooter({ text: `Saldo atual: ${user.points} pontos` });
    await message.channel.send({ embeds: [embed] });
  },
};
