import { EmbedBuilder } from 'discord.js';

export const helpCommand = {
  name: 'help',
  description: 'Mostra informações sobre os comandos e funcionalidades do bot',
  usage: '!help',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Ajuda do Bot')
      .setColor('#5865f2')
      .setDescription('Veja abaixo os comandos disponíveis, funcionalidades e ideias futuras!')
      .addFields(
        { name: '🎵 Música', value: '`!play <url|termo>` — Toca músicas ou playlists do YouTube\n`/play` — Slash command com busca, playlist e música direta' },
        { name: '🧹 Moderação', value: '`!purge <número>` — Apaga mensagens em massa\n`/purge` — Apaga mensagens via slash command\n`!ban`, `!kick`, `!mute`, `!warn` — Moderação rápida (em breve)' },
        { name: '🛡️ Verificação', value: '`!verify` — Sistema de verificação de membros (a fazer)' },
        { name: '📋 Roles', value: '`!role <nome>` — Atribui cargos por comando\nReaja para receber cargos (não tão em breve)' },
        { name: '🎮 Steam', value: '`!steamfamily` — Consulta Steam Family Share' },
        { name: '🔔 Notificações', value: '`!ytnotify` — Notifica vídeos novos do YouTube' },
        { name: '💾 Backups', value: 'Backup automático de canais, cargos e permissões (a fazer)' },
        { name: '🛠️ Utilidade', value: '`!help` — Mostra esta mensagem de ajuda' },
        { name: '💡 Futuras implementações', value: [
          '- Painel web para admins (Bot Configs',
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
      .setFooter({ text: 'Bot all-in-one em desenvolvimento por Skalin151', iconURL: message.client.user.displayAvatarURL() })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};
