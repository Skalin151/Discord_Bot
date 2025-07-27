import { EmbedBuilder } from 'discord.js';

const symbols = [
  { emoji: '🍒', name: 'Cereja', weight: 20 },
  { emoji: '🍋', name: 'Limão', weight: 15 },
  { emoji: '🍇', name: 'Uva', weight: 15 },
  { emoji: '🍉', name: 'Melancia', weight: 15 },
  { emoji: '💎', name: 'Diamante', weight: 5 },
  { emoji: '7️⃣', name: 'Sete', weight: 3 },
  { emoji: '❓', name: 'Mistério', weight: 2 },
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

function countConsecutive(arr, symbol) {
  let max = 0, current = 0;
  for (const s of arr) {
    if (s === symbol) current++;
    else current = 0;
    if (current > max) max = current;
  }
  return max;
}

export default {
  name: 'gamble',
  description: 'Jogue na slot machine e ganhe pontos!',
  async execute(client, message) {
    
    const slots = Array.from({ length: 6 }, getRandomSymbol);
    let basePoints = 0;
    let multiplier = 1;
    let bonus = 0;
    let effects = [];

    for (const symbolObj of symbols) {
      const symbol = symbolObj.emoji;
      const count = slots.filter(s => s === symbol).length;
      if (['🍒', '🍋', '🍇', '🍉'].includes(symbol)) {
        if (count === 2) {
          basePoints += 100;
          effects.push(`✨ Par de ${symbol} → +100 pontos`);
        } else if (count === 3) {
          basePoints += 300;
          effects.push(`✨ Trio de ${symbol} → +300 pontos`);
        } else if (count === 4) {
          basePoints += 1000;
          effects.push(`✨ 4x ${symbol} → +1000 pontos`);
        } else if (count === 5) {
          basePoints += 3000;
          effects.push(`✨ 5x ${symbol} → +3000 pontos`);
        }
      }
      if (symbol === '🍒' && count === 2) {
        basePoints += 100;
      }
      if (symbol === '💎' && count > 0) {
        multiplier *= Math.pow(2, count);
        effects.push(`💎 Diamante → x${Math.pow(2, count)} multiplicador`);
      }
      if (symbol === '7️⃣' && count > 0) {
        basePoints += 200 * count;
        effects.push(`7️⃣ Sete → +${200 * count} pontos`);
      }
      if (symbol === '❓' && count > 0) {
        for (let i = 0; i < count; i++) {
          const mystery = Math.floor(Math.random() * 451) + 50;
          bonus += mystery;
          effects.push(`❓ Mistério → +${mystery} pontos`);
        }
      }
    }

    let total = Math.max(0, Math.floor((basePoints + bonus) * multiplier));

    const embed = new EmbedBuilder()
      .setTitle('🎰 Slot Machine')
      .setColor('#f5c518')
      .setDescription(`${slots.join(' • ')}
\n${effects.join('\n')}
\n💰 **Total: ${total} pontos!**`)
      .setFooter({ text: 'Joga mais uma, mal não vai fazer :)' })

    await message.channel.send({ embeds: [embed] });
  },
};
