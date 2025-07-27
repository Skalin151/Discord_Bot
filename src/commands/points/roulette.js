import { EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';

export default {
  name: 'roulette',
  description: 'Aposte na roleta!',
  async execute(client, message, args) {
    const aposta = args[0]?.toLowerCase();
    if (!aposta) {
      return message.reply('❌ Especifique a sua aposta (vermelho, preto, par, ímpar, 0-36)');
    }
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

    const giros = 15; // Quantos giros falsos mostrar
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
          user.points += ganho;
          await user.save();
        }

        const resultado = new EmbedBuilder()
          .setTitle('🎰 Roleta')
          .setDescription(`🟢 Número final: **${numeroFinal}** (${cor.toUpperCase()})\n🎲 Sua aposta: **${aposta}**\n${venceu ? `✅ Você venceu! (+${ganho} pontos)` : '❌ Você perdeu!'}\n\nSaldo atual: **${user.points}** pontos`)
          .setColor(venceu ? 0x00ff00 : 0xff0000);

        return msg.edit({ content: '', embeds: [resultado] });
      }

      const numeroAleatorio = Math.floor(Math.random() * 37);
      await msg.edit({ content: `🎯 Girando... número atual: **${numeroAleatorio}**` });

      atual++;
      setTimeout(animar, 500); // velocidade da animação (ms)
    };

    animar();
  }
};
