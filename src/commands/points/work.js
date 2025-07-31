import { EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';


const WORK_MESSAGES = [
  'Foi trabalhar nas obras 👷',
  'Fez entregas de pizza 🍕',
  'Postou fotos no onlyfans 👙',
  'Foi ao casino 🎰',
  'Vendeu limonada na rua 🍋',
  'Roubou dinheiro de caridade 💸',
  'Trabalhou num café ☕',
  'Foi roubar pessoas num call center 📞',
  'Ajudou a montar móveis 🪑'
];

function getNowTimestamp() {
  return Date.now();
}

const COOLDOWN = 3 * 60 * 60 * 1000; // 3 horas em ms

export default {
  name: 'work',
  description: 'Trabalha e recebe 650 pontos (cooldown de 3 horas).',
  async execute(client, message) {
    const userId = message.author.id;
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, points: 1000 });
    }
    const now = getNowTimestamp();
    const cooldownTimestamp = user.lastWorked || 0;
    if (cooldownTimestamp && now - cooldownTimestamp < COOLDOWN) {
      const restante = Math.ceil((COOLDOWN - (now - cooldownTimestamp)) / 60000);
      return message.reply(`⏳ Ainda não podes trabalhar! Tenta novamente em ${restante} minutos.`);
    }
    user.points += 650;
    user.lastWorked = now;
    await user.save();
    const workMsg = WORK_MESSAGES[Math.floor(Math.random() * WORK_MESSAGES.length)];
    const embed = new EmbedBuilder()
      .setTitle('💼 Trabalho')
      .setColor('#00b894')
      .setDescription(`${workMsg}
Recebeste **650 pontos** pelo teu esforço!`)
      .setFooter({ text: `Saldo atual: ${user.points} pontos` });
    await message.channel.send({ embeds: [embed] });
  },
};
