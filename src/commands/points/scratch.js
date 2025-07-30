import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import User from '../../models/User.js';

const symbols = [
  { emoji: '🍒', name: 'Cereja', rarity: 'comum', weight: 40 },
  { emoji: '🍋', name: 'Limão', rarity: 'comum', weight: 40 },
  { emoji: '💎', name: 'Diamante', rarity: 'raro', weight: 10 },
  { emoji: '🔔', name: 'Sino', rarity: 'raro', weight: 7 },
  { emoji: '💰', name: 'Dinheiro', rarity: 'lendário', weight: 3 },
];

function getRandomSymbol() {
  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const s of symbols) {
    if (rand < s.weight) return s.emoji;
    rand -= s.weight;
  }
  return symbols[0].emoji;
}

function getReward(arr) {
  if (arr[0] === arr[1] && arr[1] === arr[2]) {
    switch (arr[0]) {
      case '🍒': return 50;
      case '🍋': return 30;
      case '💎': return 200;
      case '🔔': return 150;
      case '💰': return 500;
    }
  }
  if (arr[0] === arr[1] || arr[1] === arr[2] || arr[0] === arr[2]) return 15;
  return 0;
}

export default {
  name: 'scratch',
  description: 'Jogue uma raspadinha! Custa 100 pontos.',
  async execute(client, message) {
    const userId = message.author.id;
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, points: 1000 });
      await user.save();
    }
    if (user.points < 100) {
      return message.reply('❌ Não tens pontos suficientes para jogar! (Precisas de pelo menos 100 pontos)');
    }
    user.points -= 100;
    user.pointsSpent = (user.pointsSpent || 0) + 100;
    await user.save();

    let revealed = [false, false, false];
    let result = [null, null, null];
    const buttons = [0, 1, 2].map(i =>
      new ButtonBuilder()
        .setCustomId(`scratch_${i}`)
        .setLabel('⬜')
        .setStyle(ButtonStyle.Secondary)
    );
    const row = new ActionRowBuilder().addComponents(buttons);
    const embed = new EmbedBuilder()
      .setTitle('🎟️ Raspadinha')
      .setDescription('Clique nos quadrados para raspar!')
      .setColor(0xf5c518);
    const gameMsg = await message.channel.send({ embeds: [embed], components: [row] });

    const { ComponentType } = await import('discord.js');
    const collector = gameMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== userId) {
        await interaction.reply({ content: 'Só quem iniciou a raspadinha pode jogar!', ephemeral: true });
        return;
      }
      const idx = parseInt(interaction.customId.split('_')[1]);
      if (revealed[idx]) {
        await interaction.reply({ content: 'Este quadrado já foi revelado!', ephemeral: true });
        return;
      }
      // Revela símbolo
      const symbol = getRandomSymbol();
      result[idx] = symbol;
      revealed[idx] = true;
      // Atualiza botões
      const newButtons = [0, 1, 2].map(i =>
        new ButtonBuilder()
          .setCustomId(`scratch_${i}`)
          .setLabel(revealed[i] ? result[i] : '⬜')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(revealed[i])
      );
      const newRow = new ActionRowBuilder().addComponents(newButtons);
      await interaction.update({ embeds: [embed], components: [newRow] });
      // Se todos revelados, calcula recompensa
      if (revealed.every(Boolean)) {
        collector.stop();
        let reward = getReward(result);
        let bonus = 0;
        let vipBonus = 0;
        if (result[0] === result[1] && result[1] === result[2]) {
          bonus = Math.floor(reward * 0.5);
          reward += bonus;
        }
        // Verifica se o usuário tem o cartão VIP equipado (itemId: 1)
        const UserItem = (await import('../../models/UserItem.js')).default;
        const vipEquipped = await UserItem.findOne({ userId, itemId: 6, equipado: true });
        if (vipEquipped) {
          vipBonus = Math.floor(reward * 0.2);
          reward += vipBonus;
        }
        user.points += reward;
        await user.save();
        let rewardMsg = reward > 0 ? `🎉 Ganhou **${reward} pontos!**` : '❌ Não ganhou nada.';
        if (bonus > 0) rewardMsg += `\n💎 Bónus: +50% por 3 iguais!`;
        if (vipBonus > 0) rewardMsg += `\n💳 Bónus VIP: +20%!`;
        const finalEmbed = new EmbedBuilder()
          .setTitle('🎟️ Raspadinha - Resultado')
          .setDescription(`${result.map(s => s || '⬜').join(' ')}\n${rewardMsg}\nSaldo atual: **${user.points}** pontos`)
          .setColor(reward > 0 ? 0x4ECDC4 : 0xFF6B6B);
        await gameMsg.edit({ embeds: [finalEmbed], components: [] });
      }
    });
    collector.on('end', async () => {
      if (!revealed.every(Boolean)) {
        const cancelEmbed = new EmbedBuilder()
          .setTitle('🎟️ Raspadinha - Cancelada')
          .setDescription('Tempo esgotado!')
          .setColor(0xFF6B6B);
        await gameMsg.edit({ embeds: [cancelEmbed], components: [] });
      }
    });
  }
};
