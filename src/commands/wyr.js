import { EmbedBuilder } from 'discord.js';

export default {
  name: 'wyr',
  description: 'Pergunta "Would You Rather" aleatória',
  async execute(client, message, args) {
    try {
      const response = await fetch('https://would-you-rather.p.rapidapi.com/wyr/random', {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'would-you-rather.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Verifica se a resposta é um array com pelo menos um elemento
      if (!Array.isArray(data) || data.length === 0 || !data[0].question) {
        throw new Error('Formato de resposta inválido');
      }
      
      const questionText = data[0].question;
      
      // Divide a pergunta nas duas opções
      // A pergunta já vem no formato "Would you rather... or...?"
      const cleanQuestion = questionText.replace(/^Would you rather\s+/i, '');
      const parts = cleanQuestion.split(/\s+or\s+/i);
      
      let option1, option2;
      if (parts.length >= 2) {
        option1 = parts[0].trim();
        option2 = parts.slice(1).join(' or ').replace(/\?$/, '').trim();
      } else {
        // Se não conseguir dividir, usa a pergunta completa
        option1 = "Opção A (ver pergunta completa)";
        option2 = "Opção B (ver pergunta completa)";
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🤔 Would You Rather?')
        .setDescription(`**${questionText}**\n\n🅰️ ${option1}\n\n🅱️ ${option2}`)
        .setColor('#9b59b6')
        .setFooter({ text: 'Reage com 🅰️ ou 🅱️ para votar!' })
        .setTimestamp();

      const sentMessage = await message.channel.send({ embeds: [embed] });
      
      // Adiciona reações para votação
      await sentMessage.react('🅰️');
      await sentMessage.react('🅱️');

    } catch (error) {
      console.error('Erro ao obter pergunta Would You Rather:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Não foi possível obter uma pergunta "Would You Rather" neste momento.')
        .setColor('#e74c3c');
        
      await message.channel.send({ embeds: [errorEmbed] });
    }
  },
};
