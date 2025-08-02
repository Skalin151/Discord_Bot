import { EmbedBuilder } from 'discord.js';

export default {
  name: 'fortnite',
  description: 'Mostra a loja do Fortnite (ou tenta...)',
  async execute(client, message, args) {
    try {
      // Obtém a data de hoje
      const today = new Date().toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Primeira mensagem - Loading
      const loadingEmbed = new EmbedBuilder()
        .setTitle('🔄 Fortnite Item Shop')
        .setDescription(`A carregar loja ${today}...`)
        .setColor('#9146ff')
        .setTimestamp();

      const loadingMessage = await message.channel.send({ embeds: [loadingEmbed] });

      // Aguarda 5 segundos para simular carregamento
      setTimeout(async () => {
        // Segunda mensagem - Desistência
        const giveUpEmbed = new EmbedBuilder()
          .setTitle('😅 Fortnite Item Shop')
          .setDescription(`Não me apetece, tá aqui a loja de hoje: https://www.fortnite.com/item-shop?lang=en-US`)
          .setColor('#f39c12')
          .setTimestamp();

        await loadingMessage.edit({ embeds: [giveUpEmbed] });
      }, 5000);

    } catch (error) {
      console.error('Erro no comando Fortnite:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Algo correu mal... mas podes sempre ir ver a loja diretamente!')
        .setColor('#e74c3c');
        
      await message.channel.send({ embeds: [errorEmbed] });
    }
  },
};
