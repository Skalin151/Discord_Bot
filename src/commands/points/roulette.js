import { EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';

export default {
  name: 'roulette',
  description: 'Aposte na roleta!',
  async execute(client, message, args) {
    let aposta = args[0]?.toLowerCase();
    if (!aposta) {
      return message.reply('❌ Especifique a sua aposta (vermelho, preto, par, ímpar, 0-36)');
    }
    // Aceitar apostas em inglês e mapear para português
    const apostaMap = {
      'black': 'preto',
      'red': 'vermelho',
      'even': 'par',
      'odd': 'ímpar',
    };
    aposta = apostaMap[aposta] || aposta;
    const vermelho = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const preto = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
    const apostaValor = 100;

    // Buscar ou criar utilizador
    const userId = message.author.id;
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, points: 1000 });
      await user.save();
    }
    if (user.points < apostaValor) {
      return message.reply(`❌ Não tens pontos suficientes para jogar! (Precisas de pelo menos ${apostaValor} pontos)`);
    }
    user.points -= apostaValor;
    user.pointsSpent = (user.pointsSpent || 0) + apostaValor;
    await user.save();

    // Enviar mensagem inicial
    const msg = await message.reply(`🎯 Girando a roleta... (-${apostaValor} pontos)`);

    const giros = 10; // Quantos giros falsos mostrar
    let atual = 0;

    const animar = async () => {
      if (atual >= giros) {
        const numeroFinal = Math.floor(Math.random() * 37);
        let cor = 'verde';
        if (vermelho.includes(numeroFinal)) cor = 'vermelho';
        else if (preto.includes(numeroFinal)) cor = 'preto';

        let venceu = false;
        let ganho = 0;
        if (aposta === cor) {
          venceu = true;
          ganho = apostaValor * 2;
        } else if (aposta === numeroFinal.toString()) {
          venceu = true;
          ganho = numeroFinal === 0 ? apostaValor * 10 : apostaValor * 36;
        } else if (aposta === 'par' && numeroFinal !== 0 && numeroFinal % 2 === 0) {
          venceu = true;
          ganho = apostaValor * 2;
        } else if (aposta === 'ímpar' && numeroFinal % 2 === 1) {
          venceu = true;
          ganho = apostaValor * 2;
        }

        if (venceu) {
          // Verifica se o usuário tem o cartão vip (id 6)
          const UserItem = (await import('../../models/UserItem.js')).default;
          const hasVip = await UserItem.findOne({ userId, itemId: 6, equipado: true });
          let ganhoFinal = ganho;
          let bonusMsg = '';
          if (hasVip && ganho > 0) {
            ganhoFinal = Math.floor(ganho * 1.2);
            bonusMsg = '\n💳 Bónus VIP: +20% nos ganhos!';
          }
          user.points += ganhoFinal;
          await user.save();
          ganho = ganhoFinal;
          const resultado = new EmbedBuilder()
            .setTitle('🎰 Roleta')
            .setDescription(`🟢 Número final: **${numeroFinal}** (${cor.toUpperCase()})\n🎲 Sua aposta: **${aposta}**\n✅ Você venceu! (+${ganho} pontos)${bonusMsg}\n\nSaldo atual: **${user.points}** pontos`)
            .setColor(0x00ff00);
          return msg.edit({ content: '', embeds: [resultado] });
        } else {
          const resultado = new EmbedBuilder()
            .setTitle('🎰 Roleta')
            .setDescription(`🟢 Número final: **${numeroFinal}** (${cor.toUpperCase()})\n🎲 Sua aposta: **${aposta}**\n❌ Você perdeu!\n\nSaldo atual: **${user.points}** pontos`)
            .setColor(0xff0000);
          return msg.edit({ content: '', embeds: [resultado] });
        }
      }

      const numeroAleatorio = Math.floor(Math.random() * 37);
      let emoji = '🟢';
      if (vermelho.includes(numeroAleatorio)) emoji = '🔴';
      else if (preto.includes(numeroAleatorio)) emoji = '⚫';
      await msg.edit({ content: `🎯 Girando... número atual: ${emoji} **${numeroAleatorio}**` });

      atual++;
      setTimeout(animar, 500); // velocidade da animação (ms)
    };

    animar();
  }
};
