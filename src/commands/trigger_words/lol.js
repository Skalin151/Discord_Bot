import { EmbedBuilder } from 'discord.js';

export default {
  name: 'lol',
  description: 'Mensagem motivacional sobre League of Legends.',
  async execute(client, message) {
    const embed = new EmbedBuilder()
      .setTitle('Olá amigos, vamos jogar?')
      .setColor('#3498db')
      .setDescription(`Olá amigos, vamos jogar? E se transferissem o "League of Legends" agora mesmo, começassem a jogar, e ficasem imediatamente viciados. Aprendem rapidamente como funciona, duas equipas de 5 jogadores tentam destruir a base da outra equipa, em combate num mapa cheio de lacaios e monstros, Talvez joguem com o Garen. Gostam do Garen? É facil matar adeversários com o Garen. Não pressisam de ser logo fantasticos porque o jogo junta os seus jogadores do mesmo nível, ou seja melhoram ao jogar cada vez mais e ao divertirem-se, e assim ganham o primeiro jogo de "League of Legends" na companhia de 4 desconhecidos, que bom. Mas lá no fundo teriam preferido contra enimigos na companhia de um grupo de amigos, podem ser um tanque, os vossos amigos pdoem ser curadores, arqueiros, assasinos, ou até magos, existem tantas funções disponiveis e prontas a serem usadas durante o jogo. O tempo passa, começam a preceber os outros campeoes como Lux e os seus feitiços irritantes, Darius que gosta de afundar pessoas, e Teemo o essemplo de tudo o que há de errado na civilização moderna, gostam destes campeoes, cada um com o seu estilo, tambem começam a descrobir pormenores as histórias unicas de cada campeao, e da sua ligaçam com o estilo de combate. O universo entra bem de voces mas no bom sentido. A certa altura descobrem jogos com clasificações onde os resultados desidem a posição num sistema de ligas e Divisões, Apercebem-se facilmente de que podem jogar e divertirem-se para todo o sempre. Mas com tantas coisas para exprimentar, não há qualquer pressa. Isto é o "League of Legends" é competitivo, social e dinamico, e depois de cada jogo so apetece clicar naquele butão grande que diz jogar novamente. E isto se tiverem mesmo tranferido o "League of Legends", a escolha é vossa.`)
      .setThumbnail('https://bg-so-1.zippyimage.com/2025/07/30/ac1df2f012759aad3e4b4780e4a6496c.png'); // Gif animado
    await message.channel.send({ embeds: [embed] });
  }
};
