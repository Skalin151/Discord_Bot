import { EmbedBuilder } from 'discord.js';

export default {
  name: 'help',
  description: 'Mostra informações sobre os comandos e funcionalidades do bot',
  usage: '%help',
  async execute(client, message) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Ajuda do Bot')
      .setColor('#5865f2')
      .setDescription('Veja abaixo os comandos e funcionalidades disponíveis%')
      .addFields(
        { name: '🛒 Loja', value:
          '`%shop` — Mostra a loja de itens\n' +
          '`%buy <id>` — Compra um item da loja pelo ID\n' +
          '`%code <código>` — Resgata um código promocional\n'
        },
        { name: '🔒 Inventário', value:
          '`%profile` — Mostra o perfil do utilizador, itens equipados e estatísticas\n' +
          '`%bag` — Lista todos os itens do inventário do utilizador, incluindo IDs para equipar ou desequipar\n' +
          '`%equip <id>` — Equipa um item do inventário usando o ID correspondente\n' +
          '`%unequip <id>` — Desequipa um item atualmente equipado usando o ID\n'
        },
        { name: '🛠️ Utilidade (extra)', value:
          '`%server` — Mostra informações do servidor\n' +
          '`%owner` — Mostra informações sobre o desenvolvedor do bot\n' +
          '`%version` — Mostra a versão atual do bot e changelog\n' +
          '`%ping` — Latência do Bot\n' +
          '`%uptime` — Tempo de atividade do bot\n'
        },
        { name: '🏇 Corridas de Cavalos', value:
          '`%horse` — Inicia uma corrida pública de cavalos (manual, se permitido)\n' +
          '`%horsestats` — Mostra estatísticas detalhadas dos cavalos\n' +
          '`%profile` — Mostra seu perfil de jogador e conquistas\n' +
          '`%horse` — Comando clássico de corrida (privada)\n' +
          '\n' +
          '🌦️ Corridas públicas automáticas acontecem a cada 6h (00:00, 06:00, 12:00, 18:00) com clima dinâmico, traits, apostas e prêmios%\n' +
          'Itens da loja e traits afetam o desempenho dos cavalos.'
        },
        { name: '🐾 Pets', value:
          '`%petshop` — Mostra todos os pets disponíveis para compra\n' +
          '`%buy <id>` — Compra um pet pelo ID\n' +
          '`%pets` — Mostra todos os pets que você possui\n' +
          '`%walk <id>` — Leva um pet para passear (cooldown de 2h por pet, pode dar pontos ou itens)\n'
        },
        { name: '⚔️ Minigame: Combate por Turnos', value:
          '• Mensagens no chat podem fazer monstros aparecerem aleatoriamente!\n' +
          '• Até 4 jogadores podem participar da party.\n' +
          '• Use botões para atacar (físico/mágico) e defender (GUARD)\n' +
          '• Monstros têm ataques especiais, área e cura.\n' +
          '• Recompensas para todos ao derrotar o monstro.\n' +
          '• Itens equipados podem afetar o combate.\n'
        },
        { name: '🎮 Minijogos', value:
          '`%rps @user` — Rock Paper Scissors contra outro jogador\n' +
          '`%rps3 @user` — Rock Paper Scissors melhor de 3\n' +
          '`%tictactoe @user` — Jogo do Galo contra outro jogador\n' +
          '`%flip` ou `%coinflip` — Atira uma moeda ao ar\n'
        },
        { name: '🎫 Sistema de Tickets', value:
          '`%ticket` — Mostra ajuda do sistema de tickets\n' +
          '`%ticket create [tipo] [título]` — Cria um novo ticket\n' +
          '`%ticket view [ID]` — Ver detalhes de um ticket\n' +
          '**Tipos:** `feedback`, `bug`, `suggestion`, `other`\n' +
          '**Admin:** `%ticket admin list` — Ver todos os tickets\n' +
          '**Admin:** `%ticket admin close [ID]` — Fechar ticket\n'
        },
        { name: '💕 Sistema de Personagens', value:
          '`%w` — Roll de personagens femininos\n' +
          '`%h` — Roll de personagens masculinos\n' +
          '`%m` — Roll misto (todos os géneros)\n' +
          '`%rolls` — Quantos rolls te restam\n' +
          '`%claim` — Status de claim e bónus + cooldowns\n' +
          '`%myclaims` — Ver a tua coleção de personagens\n' +
          '`%charlist` — Lista todos os personagens\n' +
          '`%charinfo <nome>` — Ver detalhes de um personagem\n' +
          '`%charstats` — Ver estatísticas do sistema\n' +
          '`%divorce <nome>` — Fazer divorce e receber pontos\n' +
          '`%clearstatus` — Ver informações sobre o clear automático\n' +
          '💫 **Limite:** 3 rolls por hora | **Cooldowns:** Claim e Bónus (3h cada)\n' +
          '🎁 **Bónus:** Personagens owned têm botão de 100 pontos (1º a clicar)\n' +
          '🗓️ **Clear automático:** Último dia de cada mês todos os claims são limpos e os pontos atribuídos\n' +
          '🎯 **Como jogar:** Faz roll → Reage para claim → Constrói tua coleção!'
        },
        { name: '💸 Pontos & Jogos', value:
          '`%shop` — Mostra a loja de itens\n' +
          '`%buy <id>` — Compra um item da loja pelo ID\n' +
          '`%code <código>` — Resgata um código promocional\n' +
          '`%balance` — Mostra o saldo de pontos\n' +
          '`%daily` — Recebe 500 pontos uma vez por dia\n' +
          '`%gamble` — Slot machine para ganhar pontos\n' +
          '`%blackjack` — Joga Blackjack apostando pontos\n' +
          '`%8ball <pergunta>` — Pergunta ao 8ball qualquer coisa' +
          '`%shop` — Loja de itens especiais para corridas\n' +
          '`%buy <id>` — Compra um item da loja\n' +
          '`%item <id>` — Detalhes de um item\n' +
          '`2: ----- .----` — ???\n'
        },
        { name: '🎮 Steam', value:
          '`%steam <jogo>` — Consulta preços e detalhes de jogos da Steam\n' +
          '`%steamfamily` — Mostra jogos compartilhados da Steam Family\n' +
          '`%steamfamily list [página] [filtro]` — Lista com filtros (alfabetical, copies, owner)\n' +
          '`/steam` — Slash command para Steam'
        },
        { name: '🧹 Moderação', value:
          '`%purge <número>` — Apaga mensagens em massa\n' +
          '`/purge` — Apaga mensagens via slash command\n' +
          '`%clear` — Limpa todos os claims e atribui pontos (owner)\n' +
          '`%setclearchannel` — Define canal para logs do clear (owner)\n' +
          '`%ban`, `%kick`, `%mute`, `%warn` — Moderação rápida (em breve)'
        },
        { name: '🛡️ Verificação', value: '`%verify` — Sistema de verificação de membros (a fazer)' },
        { name: '📋 Roles', value: '`%role <nome>` — Atribui cargos por comando\nReaja para receber cargos (não tão em breve)' },
        { name: '🔔 Notificações', value: '`%ytnotify` — Notifica vídeos novos do YouTube' },
        { name: '💾 Backups', value: 'Backup automático de canais, cargos e permissões (a fazer)' },
        { name: '🛠️ Utilidade', value: '`%help` — Mostra esta mensagem de ajuda' },
        { name: '💡 Futuras implementações', value: [
          '- Painel web para admins (Bot Configs)',
          '- Dashboard de estatísticas',
          '- Logs avançados de eventos',
          '- Integração com outros serviços (Twitch, Youtube, etc)',
          '- Auto-role por tempo de servidor',
          '- Anti-spam e anti-link',
          '- Mensagens de boas-vindas customizáveis',
          '- Sistema de XP e níveis',
          '- ♿',
          '- ¿¿¿',
        ].join('\n') }
      )
      .setFooter({ text: 'Bot all-in-one em desenvolvimento por Skalin151', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    const sentMsg = await message.channel.send({ embeds: [embed] });

    // Cria coletor de reações para ℹ️ na mensagem enviada
    const filter = (reaction, user) => reaction.emoji.name === '♿' && !user.bot && reaction.message.id === sentMsg.id;
    sentMsg.client.on('messageReactionAdd', async (reaction, user) => {
      if (filter(reaction, user)) {
        const msg = '🏱︎︎︎⚐︎︎︎☼︎︎︎ ✞︎︎︎☜︎︎︎☪︎︎︎☜︎︎︎💧︎︎︎ ❄︎︎⚐︎︎☼︎︎☠︎︎✌︎︎📫︎︎💧︎︎☜︎︎ ☠︎︎︎☜︎︎︎👍︎︎︎☜︎︎︎💧︎︎︎💧︎︎︎🕚︎︎︎☼︎︎︎✋︎︎︎⚐︎︎︎ ⚐︎︎︎☹︎︎︎☟︎︎︎✌︎︎︎☼︎︎︎ ⚐︎ ☠︎⚐︎💧︎💧︎⚐︎ ☼︎︎︎☜︎︎︎☞︎︎︎☹︎︎︎☜︎︎︎✠︎︎︎⚐︎︎︎ 💣︎︎︎✌︎︎︎✋︎︎︎💧︎︎︎ ✈︎︎︎🕆︎︎︎☜︎︎︎ 🕆︎︎︎💣︎︎︎✌︎︎︎ ✞︎︎︎☜︎︎︎☪︎︎︎';
        const infoEmbed = new EmbedBuilder()
          .setTitle('Y҉o҉u҉ ҉s҉h҉o҉u҉l҉d҉n҉t҉ ҉b҉e҉ ҉h҉e҉r҉e҉')
          .addFields(
            { name: '\u200B', value: msg },
            { name: '\u200B', value: msg },
            { name: '\u200B', value: msg },
          )
          .setColor('#000000');
        await sentMsg.edit({ embeds: [infoEmbed] });
        setTimeout(async () => {
          try {
            await sentMsg.delete();
          } catch (e) { /* ignore */ }
        }, 10000);
      }
    });
  }
};
