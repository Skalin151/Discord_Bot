import { EmbedBuilder } from 'discord.js';

export default {
  name: 'help',
  description: 'Mostra informações sobre os comandos e funcionalidades do bot',
  usage: '!help',
  async execute(client, message) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Ajuda do Bot')
      .setColor('#5865f2')
      .setDescription('Veja abaixo os comandos e funcionalidades disponíveis!')
      .addFields(
        { name: '🎵 Música', value:
          '`!play <url|termo>` — Toca músicas ou playlists\n' +
          '`!queue` — Mostra a fila de músicas (com paginação)\n' +
          '`!skip`, `!previous`, `!stop`, `!shuffle`, `!pause`, `!resume` — Controlo total da reprodução\n' +
          '`!steam <jogo>` — Consulta preços e detalhes de jogos da Steam\n' +
          '`/steam` — Slash command para Steam\n'
        },
        { name: '💸 Pontos & Jogos', value:
          '`!balance` — Mostra o saldo de pontos\n' +
          '`!daily` — Recebe 500 pontos uma vez por dia\n' +
          '`!gamble` — Slot machine para ganhar pontos\n' +
          '`!blackjack` — Joga Blackjack apostando pontos\n' +
          '`!8ball <pergunta>` — Pergunta ao 8ball qualquer coisa'
        },
        { name: '🧹 Moderação', value:
          '`!purge <número>` — Apaga mensagens em massa\n' +
          '`/purge` — Apaga mensagens via slash command\n' +
          '`!ban`, `!kick`, `!mute`, `!warn` — Moderação rápida (em breve)'
        },
        { name: '🛡️ Verificação', value: '`!verify` — Sistema de verificação de membros (a fazer)' },
        { name: '📋 Roles', value: '`!role <nome>` — Atribui cargos por comando\nReaja para receber cargos (não tão em breve)' },
        { name: '🔔 Notificações', value: '`!ytnotify` — Notifica vídeos novos do YouTube' },
        { name: '💾 Backups', value: 'Backup automático de canais, cargos e permissões (a fazer)' },
        { name: '🛠️ Utilidade', value: '`!help` — Mostra esta mensagem de ajuda' },
        { name: '💡 Futuras implementações', value: [
          '- Painel web para admins (Bot Configs)',
          '- Dashboard de estatísticas',
          '- Sistema de tickets',
          '- Logs avançados de eventos',
          '- Integração com outros serviços (Twitch, Youtube, etc)',
          '- Auto-role por tempo de servidor',
          '- Anti-spam e anti-link',
          '- Mensagens de boas-vindas customizáveis',
          '- Sistema de XP e níveis',
          '- Gamble'
        ].join('\n') }
      )
      .setFooter({ text: 'Bot all-in-one em desenvolvimento por Skalin151', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};
