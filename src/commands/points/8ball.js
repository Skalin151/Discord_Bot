import { EmbedBuilder } from 'discord.js';

export default {
  name: '8ball',
  description: 'Pergunta ao 8ball qualquer coisa!',
  async execute(client, message, args) {
    const question = args.join(' ');
    if (!question) {
      return message.reply('❌ Faz uma pergunta para o 8ball responder!');
    }
    const respostas = [
      'Sim!',
      'Infelizmente não.',
      'Tens toda a razão!',
      'Não, desculpa.',
      'Concordo.',
      'Não faço ideia!',
      'Não sou assim tão inteligente...',
      'As minhas fontes dizem que não!',
      'É certo.',
      'Podes confiar nisso.',
      'Provavelmente não.',
      'Tudo indica que não.',
      'Sem dúvida.',
      'Absolutamente.',
      'Não sei.'
    ];
    const resultado = Math.floor(Math.random() * respostas.length);
    const embed = new EmbedBuilder()
      .setTitle('🎱・8ball')
      .setDescription('Vê a resposta à tua pergunta!')
      .addFields(
        { name: 'A tua pergunta', value: `${question}`, inline: false },
        { name: 'Resposta do bot', value: `${respostas[resultado]}`, inline: false }
      )
      .setColor('#000000');
    await message.channel.send({ embeds: [embed] });
  },
};
