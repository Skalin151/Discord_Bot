// Frame global para monstro derrotado
const RIP_FRAME = `\u200b\n\u0060\u0060\u0060\n    ,-=-. \n   /  +  \\   \n   | ~~~ | \n   |R.I.P|   \n   |_____|\n4: .---- .----\u0060\u0060\u0060`;
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

// Estado global simples (por canal)
const combatState = {};
// Cooldown de combate por canal (canalId: timestamp de fim do cooldown)
const combatCooldown = {};

export async function spawnMonster(channel, participants, monsterData, forceSpawn = false) {
  // Cooldown: impede novo combate se ainda não passou 10 minutos desde o último, exceto se for forçado
  const now = Date.now();
  if (!forceSpawn && combatCooldown[channel.id] && combatCooldown[channel.id] > now) return;
  if (combatState[channel.id]) return; // Já existe combate
  const monster = monsterData ? {
    nome: monsterData.nome,
    hp: monsterData.hp,
    maxHp: monsterData.hp,
    frame: 0,
    frames: monsterData.frames,
    ataques: monsterData.ataques
  } : { ...defaultMonster, maxHp: defaultMonster.hp, frame: 0 };
  // Filtra bots da party
  const realParticipants = [];
  for (const id of participants) {
    try {
      const user = await channel.client.users.fetch(id);
      if (!user.bot) realParticipants.push(id);
    } catch {}
  }
  if (realParticipants.length === 0) return;
  // Inicializar estado de cada membro da party
  const partyState = {};
  realParticipants.forEach(id => {
    partyState[id] = { hp: 30, mp: 10 };
  });
  combatState[channel.id] = {
    monster,
    participants: realParticipants,
    partyState,
    turn: 0,
    message: null,
    lastFrame: 0,
    showAppearMsg: true // flag para mostrar mensagem de aparição
  };
  const partyFields = realParticipants.map(id => ({
    name: ' ',
    value: `<@${id}>  ❤️ ${partyState[id].hp}   💙 ${partyState[id].mp}`,
    inline: true
  }));
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ${monster.nome} apareceu!⚔️`)
    .setDescription(monster.frames[0].replace('{hp}', monster.hp))
    .addFields(...partyFields)
    .setColor('#e74c3c');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('attack_physical').setLabel('AD 🗡️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('attack_magic').setLabel('MD 💫').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('attack_item').setLabel('GUARD 🛡️').setStyle(ButtonStyle.Success)
  );
  const msg = await channel.send({ embeds: [embed], components: [row] });
  combatState[channel.id].message = msg;
  // Cria embed de vez do jogador (apenas uma vez)
  const vezEmbed = new EmbedBuilder()
    .setTitle('Vez do Jogador')
    .setDescription('O combate começou!')
    .setColor('#3498db');
  const vezMsg = await channel.send({ embeds: [vezEmbed] });
  combatState[channel.id].vezMsg = vezMsg;

  // Cria embed de resultado da ação (apenas uma vez)
  const actionEmbed = new EmbedBuilder()
    .setTitle('Ação do Jogador')
    .setDescription('---')
    .setColor('#f1c40f');
  const actionMsg = await channel.send({ embeds: [actionEmbed] });
  combatState[channel.id].actionMsg = actionMsg;

  animateMonster(channel.id);
  startTurn(channel.id);
}

async function animateMonster(channelId) {
  const state = combatState[channelId];
  if (!state || !state.message) return;
  let desc;
  let embed;
  if (state.monster.hp <= 0) {
    // Mostra frame de R.I.P. ao derrotar, com HP 0
    desc = `${RIP_FRAME}\nHP: 0`;
    embed = new EmbedBuilder()
      .setTitle(`☠️ Monstro derrotado! ☠️`)
      .setDescription(desc)
      .setColor('#95a5a6');
    // Troca a embed imediatamente e não faz mais animação
    await state.message.edit({ embeds: [embed] });
    return;
  } else {
    state.monster.frame = (state.monster.frame + 1) % state.monster.frames.length;
    if (state.showAppearMsg) {
      desc = state.monster.frames[0].replace('{hp}', state.monster.hp); // sempre mostra frame 0 até primeira ação
    } else {
      desc = state.monster.frames[state.monster.frame].replace('{hp}', state.monster.hp);
    }
    const partyFields = state.participants
      .filter(id => state.partyState[id])
      .map(id => ({
        name: ' ',
        value: `<@${id}>  ❤️ ${state.partyState[id].hp}   💙 ${state.partyState[id].mp}`,
        inline: true
      }));
    embed = new EmbedBuilder()
      .setTitle(`⚔️ Um ${state.monster.nome} apareceu!⚔️`)
      .setDescription(desc)
      .addFields(...partyFields)
      .setColor('#e74c3c');
    await state.message.edit({ embeds: [embed] });
    setTimeout(() => animateMonster(channelId), 2000);
  }
}

async function startTurn(channelId) {
  const state = combatState[channelId];
  if (!state) return;
  const userId = state.participants[state.turn % state.participants.length];
  // Edita embed de vez do jogador para mostrar de quem é a vez e timer
  if (state.vezMsg) {
    let remaining = 20;
    // Atualiza o embed imediatamente
    const updateEmbed = async () => {
      // Protege contra mensagem deletada
      if (!combatState[channelId] || !state.vezMsg) return;
      try {
        const embed = EmbedBuilder.from(state.vezMsg.embeds[0])
          .setTitle('Vez do Jogador')
          .setDescription(`É a vez de <@${userId}> jogar! Escolhe uma ação.\n⏳ Tempo restante: ${remaining}s`)
          .setColor('#3498db');
        await state.vezMsg.edit({ embeds: [embed] });
      } catch (err) {
        // Se a mensagem foi deletada, limpa o intervalo
        if (state.vezInterval) {
          clearInterval(state.vezInterval);
          state.vezInterval = null;
        }
        state.vezMsg = null;
      }
    };
    await updateEmbed();

    // Limpa qualquer timer anterior
    if (state.vezInterval) clearInterval(state.vezInterval);

    // Atualiza a cada 5s
    state.vezInterval = setInterval(async () => {
      remaining -= 5;
      if (remaining <= 0) {
        clearInterval(state.vezInterval);
        state.vezInterval = null;
        return;
      }
      await updateEmbed();
    }, 5000);
  }
  // Timer de 20s para ação automática
  if (state.turnTimeout) clearTimeout(state.turnTimeout);
  state.turnTimeout = setTimeout(async () => {
    // Se o turno ainda é desse jogador e existe partyState válido
    if (
      combatState[channelId] &&
      combatState[channelId].participants &&
      combatState[channelId].participants.length > 0 &&
      combatState[channelId].participants[combatState[channelId].turn % combatState[channelId].participants.length] === userId &&
      combatState[channelId].partyState &&
      combatState[channelId].partyState[userId]
    ) {
      // Escolhe ataque automático
      const partyState = state.partyState[userId];
      let action = 'attack_physical';
      if (partyState && partyState.mp >= 3) {
        action = Math.random() < 0.5 ? 'attack_physical' : 'attack_magic';
      }
      // Cria interação fake para reaproveitar lógica
      const fakeInteraction = {
        channel: state.message.channel,
        user: { id: userId },
        customId: action,
        deferred: true,
        replied: false,
        // Métodos dummy para evitar erros
        reply: async () => {},
        deferUpdate: async () => {},
      };
      await handleCombatButton(fakeInteraction);
    }
  }, 20000);
}

export async function handleCombatButton(interaction) {
  // Defer obrigatoriamente para evitar interaction failed
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate();
  }
  const channelId = interaction.channel.id;
  const state = combatState[channelId];
  if (!state) return;
  const userId = state.participants[state.turn % state.participants.length];
  if (interaction.user.id !== userId) {
    await interaction.reply({ content: 'Não é o teu turno!', flags: MessageFlags.Ephemeral });
    return;
  }
  // Limpa timer do turno se ação foi tomada
  if (state.turnTimeout) {
    clearTimeout(state.turnTimeout);
    state.turnTimeout = null;
  }
  // Limpa intervalo de vez se existir
  if (state.vezInterval) {
    clearInterval(state.vezInterval);
    state.vezInterval = null;
  }
  let dmg = 0;
  let mpCost = 0;
  let msg = '';
  let logMsg = '';
  if (interaction.customId === 'attack_physical') {
    dmg = 10 + Math.floor(Math.random() * 6); // Exemplo de dano base
    let crit = false;
    let glassSword = false;
    // Verifica se o user tem Glass Sword equipada (itemId 98)
    try {
      const { default: UserItem } = await import('../models/UserItem.js');
      const sword = await UserItem.findOne({ userId, itemId: 98, equipado: true });
      if (sword) {
        glassSword = true;
        dmg *= 2;
      }
    } catch (err) {
      console.error('Erro ao verificar Glass Sword:', err);
    }
    if (Math.random() < 0.3) { // 30% de chance de crítico
        dmg = Math.floor(dmg * 1.3);
        crit = true;
    }
    msg = `Causaste ${dmg} de dano físico${crit ? ' (CRÍTICO!)' : ''}${glassSword ? ' (Glass Sword!)' : ''}!`;
    logMsg = `Usou ataque físico e causou ${dmg} de dano${crit ? ' (CRÍTICO)' : ''}${glassSword ? ' (Glass Sword)' : ''}.`;
}
  if (interaction.customId === 'attack_magic') {
    mpCost = 3;
    let mpMultiplier = 1;
    let dmgMultiplier = 1;
    // Verifica se o user tem Orb of Avarice equipada (itemId 99)
    try {
      const { default: UserItem } = await import('../models/UserItem.js');
      const orb = await UserItem.findOne({ userId, itemId: 99, equipado: true });
      if (orb) {
        mpMultiplier = 2;
        dmgMultiplier = 4;
      }
    } catch (err) {
      console.error('Erro ao verificar Orb of Avarice:', err);
    }
    const totalMpCost = mpCost * mpMultiplier;
    if (state.partyState[userId].mp < totalMpCost) {
      await interaction.reply({ content: 'MP insuficiente para ataque mágico!', flags: MessageFlags.Ephemeral });
      return;
    }
    dmg = (6 + Math.floor(Math.random()*6)) * dmgMultiplier;
    state.partyState[userId].mp -= totalMpCost;
    msg = `Causaste ${dmg} de dano mágico! (-${totalMpCost} MP)`;
    logMsg = `Usou ataque mágico${dmgMultiplier > 1 ? ' com Orb of Avarice' : ''}, gastou ${totalMpCost} MP e causou ${dmg} de dano.`;
  }
  if (interaction.customId === 'attack_item') {
    // GUARD: ativa proteção para o próximo ataque
    state.partyState[userId].guard = true;
    msg = `Estás em GUARD! O próximo ataque recebido terá 60% menos dano.`;
    logMsg = `Usou GUARD e receberá 60% menos dano no próximo ataque.`;
    dmg = 0;
  }
  state.monster.hp -= dmg;
  if (state.monster.hp < 0) state.monster.hp = 0;
  // Após a primeira ação, deixa de mostrar mensagem de aparição
  if (state.showAppearMsg) state.showAppearMsg = false;
  // Não envia reply privado, apenas edita o embed de ações
  // Edita o embed de resultado da ação
  if (state.actionMsg) {
    const editedEmbed = EmbedBuilder.from(state.actionMsg.embeds[0])
      .setTitle('Ação do Jogador')
      .setDescription(`<@${userId}> ${logMsg}`)
      .setColor('#f1c40f');
    await state.actionMsg.edit({ embeds: [editedEmbed] });
  }
  if (state.monster.hp <= 0) {
    // Garante que a embed de monstro derrotado aparece imediatamente
    await animateMonster(channelId);
    await state.message.channel.send('🎉 O monstro foi derrotado! Todos ganham 100 pontos!');
    // Atualiza pontos dos membros da party vencedora
    try {
      const { default: User } = await import('../models/User.js');
      for (const id of state.participants) {
        await User.findOneAndUpdate(
          { userId: id },
          { $inc: { points: 100 } },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar pontos dos vencedores:', err);
    }
    // Remove as embeds auxiliares ao fim do combate
    if (state.actionMsg) {
      try { await state.actionMsg.delete(); } catch {}
    }
    if (state.vezMsg) {
      try { await state.vezMsg.delete(); } catch {}
    }
    // Limpa timers/intervalos
    if (state.vezInterval) {
      clearInterval(state.vezInterval);
      state.vezInterval = null;
    }
    if (state.turnTimeout) {
      clearTimeout(state.turnTimeout);
      state.turnTimeout = null;
    }
    // Seta cooldown de 10 minutos (600_000 ms) para o canal
    combatCooldown[channelId] = Date.now() + 1800000;
    // Limpa estado do canal
    delete combatState[channelId];
    return;
  }
  state.turn++;
  // Se todos os jogadores já jogaram, é a vez do monstro
  if (state.turn % state.participants.length === 0) {
    // Delay de 2 segundos para dar tempo de ler o resultado da ação
    setTimeout(() => {
      monsterTurn(channelId);
    }, 2000);
  } else {
    startTurn(channelId);
  }
}

// Turno do monstro: escolhe ataque aleatório e aplica nos jogadores
async function monsterTurn(channelId) {
  const state = combatState[channelId];
  if (!state) return;
  const monster = state.monster;
  // Escolhe ataque aleatório
  const ataque = monster.ataques[Math.floor(Math.random() * monster.ataques.length)];
  let logMsg = '';
  let affected = [];
  if (ataque.tipo === 'fisico' || ataque.tipo === 'magico' || ataque.tipo === 'especial') {
    let dano = 0;
    if (ataque.efeito === 'area') {
      // Dano a todos os membros da party
      if (ataque.dano) {
        const [min, max] = ataque.dano;
        let logArr = [];
        for (const id of state.participants) {
          dano = min + Math.floor(Math.random() * (max - min + 1));
          // Glass Sword: dobra o dano recebido
          let doubleDmg = false;
          try {
            const { default: UserItem } = await import('../models/UserItem.js');
            const sword = await UserItem.findOne({ userId: id, itemId: 98, equipado: true });
            if (sword) {
              dano *= 2;
              doubleDmg = true;
            }
          } catch (err) {
            console.error('Erro ao verificar Glass Sword (area):', err);
          }
          // GUARD: reduz dano em 60% se ativo
          let guardActive = state.partyState[id].guard;
          if (guardActive) {
            dano = Math.floor(dano * 0.4);
            state.partyState[id].guard = false;
          }
          state.partyState[id].hp -= dano;
          if (state.partyState[id].hp < 0) state.partyState[id].hp = 0;
          logArr.push(`<@${id}> (${dano}${doubleDmg ? ' Glass Sword' : ''}${guardActive ? ' GUARD' : ''})`);
        }
        logMsg = `O monstro usou **${ataque.nome}** e causou dano em área: ${logArr.join(', ')}!`;
        affected = [...state.participants];
      }
    } else {
      // Ataque normal em alvo único
      let alvoId = state.participants[Math.floor(Math.random() * state.participants.length)];
      let doubleDmg = false;
      let guardActive = false;
      if (ataque.dano) {
        const [min, max] = ataque.dano;
        dano = min + Math.floor(Math.random() * (max - min + 1));
        // Glass Sword: dobra o dano recebido
        try {
          const { default: UserItem } = await import('../models/UserItem.js');
          const sword = await UserItem.findOne({ userId: alvoId, itemId: 98, equipado: true });
          if (sword) {
            dano *= 2;
            doubleDmg = true;
          }
        } catch (err) {
          console.error('Erro ao verificar Glass Sword (single):', err);
        }
        // GUARD: reduz dano em 60% se ativo
        guardActive = state.partyState[alvoId].guard;
        if (guardActive) {
          dano = Math.floor(dano * 0.4);
          state.partyState[alvoId].guard = false;
        }
        state.partyState[alvoId].hp -= dano;
        if (state.partyState[alvoId].hp < 0) state.partyState[alvoId].hp = 0;
      }
      logMsg = `O monstro usou **${ataque.nome}** em <@${alvoId}> e causou ${dano} de dano${doubleDmg ? ' (Glass Sword)' : ''}${guardActive ? ' (GUARD)' : ''}!`;
      affected = [alvoId];
    }
  }
  if (ataque.tipo === 'defesa' && ataque.cura) {
    const [min, max] = ataque.cura;
    const cura = min + Math.floor(Math.random() * (max - min + 1));
    monster.hp += cura;
    if (monster.hp > monster.maxHp) monster.hp = monster.maxHp;
    logMsg = `O monstro usou **${ataque.nome}** e se curou em ${cura} HP!`;
  }
  // Edita embed de ação para mostrar o ataque do monstro
  if (state.actionMsg) {
    const editedEmbed = EmbedBuilder.from(state.actionMsg.embeds[0])
      .setTitle('Ação do Monstro')
      .setDescription(logMsg)
      .setColor('#e67e22');
    await state.actionMsg.edit({ embeds: [editedEmbed] });
  }
  // Verifica se algum jogador morreu
  let allDead = true;
  for (const id of state.participants) {
    if (state.partyState[id].hp > 0) allDead = false;
  }
  if (allDead) {
    if (state.actionMsg) {
      try {
        await state.actionMsg.edit({ embeds: [
          new EmbedBuilder().setTitle('Derrota!').setDescription('Todos os jogadores foram derrotados!').setColor('#e74c3c')
        ] });
      } catch {}
    }
    if (state.vezMsg) {
      try { await state.vezMsg.delete(); } catch {}
    }
    // Limpa timers/intervalos
    if (state.vezInterval) {
      clearInterval(state.vezInterval);
      state.vezInterval = null;
    }
    if (state.turnTimeout) {
      clearTimeout(state.turnTimeout);
      state.turnTimeout = null;
    }
    // Seta cooldown de 30 minutos (180_000 ms) para o canal
    combatCooldown[channelId] = Date.now() + 180000;
    // Limpa estado do canal
    delete combatState[channelId];
    return;
  }
  // Próximo turno: volta para o primeiro jogador
  state.turn = 0;
  startTurn(channelId);
}

// Exemplo de integração: no messageCreate.js, a cada X mensagens, chama spawnMonster(channel, participants)
// E no handler de botões, chama handleCombatButton(interaction)
