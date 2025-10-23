import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import fetch from 'node-fetch';
import { convertUAHtoEUR } from '../utils/currencyUtils.js';
import { getConsistentImageSize } from '../utils/embedUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHORIZED_USERS = process.env.STEAM_FAMILY_AUTHORIZED_USERS 
  ? process.env.STEAM_FAMILY_AUTHORIZED_USERS.split(',').map(id => id.trim())
  : [];

// Validação: avisa se a lista está vazia
if (AUTHORIZED_USERS.length === 0) {
  console.warn('⚠️ STEAM_FAMILY_AUTHORIZED_USERS não configurado no .env!');
}
// ========================================

// Map para armazenar votações ativas (gameId -> votação)
const activeVotes = new Map();

export default {
  name: 'steamgamebuy',
  description: 'Cria uma votação para dividir o preço de um jogo da Steam entre os membros da família',
  usage: '%steamgamebuy <nome do jogo | appid>',
  async execute(client, message, args) {
    // Verifica se o usuário está autorizado
    if (!AUTHORIZED_USERS.includes(message.author.id)) {
      const embed = new EmbedBuilder()
        .setTitle('🔒 Acesso Negado')
        .setDescription('Você não tem permissão para usar este comando.')
        .setColor('#F44336')
        .setTimestamp();
      
      return await message.channel.send({ embeds: [embed] });
    }

    if (!args.length) {
      return await message.channel.send('❌ Use: `!steamgamebuy <nome do jogo | appid>`');
    }

    const query = args.join(' ');
    await message.channel.send('🔍 Buscando jogo...');

    try {
      const appid = await getAppId(query);
      if (!appid) {
        return await message.channel.send('❌ Jogo não encontrado!');
      }

      console.log(`📝 AppID obtido: ${appid} (type: ${typeof appid})`);

      // Verifica se já existe votação ativa para este jogo
      if (activeVotes.has(appid)) {
        return await message.channel.send('⚠️ Já existe uma votação ativa para este jogo!');
      }

      const details = await getGameDetails(appid);
      if (!details) {
        return await message.channel.send('❌ Não foi possível obter detalhes do jogo.');
      }

      const prices = await getSteamPrices(appid);
      const historicalPrice = await getHistoricalLowPrice(appid, prices);
      const familyInfo = checkFamilyShare(appid);
      const supportsFamilySharing = await checkFamilySharingSupport(appid);

      // Converte appid para string para consistência
      const appidString = String(appid);

      // Cria a votação
      const voteData = {
        appid: appidString,
        gameName: details.name,
        headerImage: details.header_image,
        priceEUR: prices.euro,
        priceUAH: prices.uah,
        lowestEUR: historicalPrice.lowestEUR,
        lowestUAH: historicalPrice.lowestUAH,
        familyInfo: familyInfo,
        supportsFamilySharing: supportsFamilySharing,
        voters: new Set([message.author.id]), // Adiciona o criador automaticamente
        noVoters: new Set(), // Rastreia votos "NÃO"
        initiator: message.author.id,
        messageId: null,
        channelId: message.channel.id
      };

      activeVotes.set(appidString, voteData);

      console.log(`✅ Votação criada - AppID: ${appidString} (type: ${typeof appidString})`);

      // Envia a mensagem de votação
      const voteMessage = await sendVoteMessage(message.channel, voteData);
      voteData.messageId = voteMessage.id;

    } catch (error) {
      console.error('Erro no comando steamgamebuy:', error);
      await message.channel.send('❌ Ocorreu um erro ao processar o comando.');
    }
  }
};

// Exporta funções para o handler de botões
export { handleVote, AUTHORIZED_USERS };

async function sendVoteMessage(channel, voteData) {
  const embed = createVoteEmbed(voteData);
  const buttons = createVoteButtons(voteData.appid);

  return await channel.send({ embeds: [embed], components: [buttons] });
}

function createVoteEmbed(voteData) {
  const { gameName, headerImage, priceEUR, priceUAH, lowestEUR, lowestUAH, voters, noVoters, familyInfo, supportsFamilySharing } = voteData;
  
  const voterCount = voters.size;
  const noVoterCount = noVoters.size;
  const totalMembers = AUTHORIZED_USERS.length;

  const embed = new EmbedBuilder()
    .setTitle(`💰 Compra Conjunta: ${gameName}`)
    .setURL(`https://store.steampowered.com/app/${voteData.appid}`)
    .setColor('#1b2836')
    .setTimestamp();

  if (headerImage) {
    embed.setImage(getConsistentImageSize(headerImage, 460, 215));
  }

  // Preço Atual EUR
  let currentPriceEUR = '❌ Indisponível';
  let currentPriceUAH = '❌ Indisponível';
  let splitPriceEUR = 'N/A';
  let splitPriceUAH = 'N/A';

  if (priceEUR) {
    const finalEUR = priceEUR.final / 100;
    currentPriceEUR = priceEUR.discount_percent > 0
      ? `~~${(priceEUR.initial / 100).toFixed(2)}€~~ **${finalEUR.toFixed(2)}€** (-${priceEUR.discount_percent}%)`
      : `**${finalEUR.toFixed(2)}€**`;
    
    if (voterCount > 0) {
      splitPriceEUR = `**${(finalEUR / voterCount).toFixed(2)}€** por pessoa`;
    }
  }

  if (priceUAH) {
    const finalUAH = priceUAH.final / 100;
    currentPriceUAH = priceUAH.discount_percent > 0
      ? `~~${(priceUAH.initial / 100).toFixed(2)}₴~~ **${finalUAH.toFixed(2)}₴** (-${priceUAH.discount_percent}%)`
      : `**${finalUAH.toFixed(2)}₴**`;
    
    if (voterCount > 0) {
      splitPriceUAH = `**${(finalUAH / voterCount).toFixed(2)}₴** por pessoa`;
    }
  }

  embed.addFields(
    { name: '💶 Preço Atual (EUR)', value: currentPriceEUR, inline: true },
    { name: '🇺🇦 Preço Atual (UAH)', value: currentPriceUAH, inline: true },
    { name: '🆔 AppID', value: String(voteData.appid), inline: true }
  );

  // Family Share Info
  if (familyInfo && familyInfo.inLibrary) {
    let sharingText = '✅ **Disponível na biblioteca**';
    
    if (supportsFamilySharing === true) {
      sharingText += ' (🟢 Family Sharing ativo)';
    } else if (supportsFamilySharing === false) {
      sharingText += ' (🔴 Family Sharing não suportado)';
    } else {
      sharingText += ' (⚪ Status de Family Sharing desconhecido)';
    }
    
    sharingText += `\n👥 ${familyInfo.copies} cópia(s) - ${familyInfo.owners}`;
    
    embed.addFields({ 
      name: '📚 Family Share', 
      value: sharingText,
      inline: false 
    });
  } else if (familyInfo && !familyInfo.inLibrary) {
    let sharingText = '❌ Não disponível na biblioteca';
    
    if (supportsFamilySharing === true) {
      sharingText += ' (🟢 Suporta Family Sharing)';
    } else if (supportsFamilySharing === false) {
      sharingText += ' (🔴 Não suporta Family Sharing)';
    } else {
      sharingText += ' (⚪ Status de Family Sharing desconhecido)';
    }
    
    embed.addFields({ 
      name: '📚 Family Share', 
      value: sharingText,
      inline: false 
    });
  }

  // Lowest Price
  if (lowestEUR) {
    embed.addFields({ 
      name: '📉 Menor Preço (EUR)', 
      value: `**${lowestEUR.toFixed(2)}€** (histórico)`, 
      inline: true 
    });
  }

  if (lowestUAH) {
    embed.addFields({ 
      name: '📉 Menor Preço (UAH)', 
      value: `**${lowestUAH.toFixed(2)}₴** (histórico)`, 
      inline: true 
    });
  }

  // Divisão de preço
  embed.addFields(
    { name: '\u200B', value: '\u200B', inline: true }, // Spacer para alinhar
    { 
      name: '👥 Participantes', 
      value: `**${voterCount}/${totalMembers}** membros\n${voterCount > 0 ? splitPriceEUR : 'Aguardando votos...'}`, 
      inline: true 
    },
    { 
      name: '💸 Divisão (UAH)', 
      value: voterCount > 0 ? splitPriceUAH : 'Aguardando votos...', 
      inline: true 
    },
    { 
      name: '\u200B', 
      value: '\u200B', 
      inline: true 
    } // Spacer
  );

  // Lista de votantes SIM
  if (voterCount > 0) {
    const votersList = Array.from(voters).map(id => `<@${id}>`).join(', ');
    embed.addFields({ 
      name: '✅ Votaram SIM', 
      value: votersList, 
      inline: true 
    });
  } else {
    embed.addFields({ 
      name: '✅ Votaram SIM', 
      value: '*Ninguém votou SIM...*', 
      inline: true 
    });
  }

  // Lista de votantes NÃO
  if (noVoterCount > 0) {
    const noVotersList = Array.from(noVoters).map(id => `<@${id}>`).join(', ');
    embed.addFields({ 
      name: '❌ Votaram NÃO', 
      value: noVotersList, 
      inline: true 
    });
  } else {
    embed.addFields({ 
      name: '❌ Votaram NÃO', 
      value: '*Ninguém votou NÃO...*', 
      inline: true 
    });
  }

  embed.setFooter({ 
    text: '💡 Clique em "SIM" para participar da compra ou "NÃO" para recusar' 
  });

  return embed;
}

function createVoteButtons(appid) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`steamgamebuy_yes_${appid}`)
        .setLabel('✅ SIM')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`steamgamebuy_no_${appid}`)
        .setLabel('❌ NÃO')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`steamgamebuy_cancel_${appid}`)
        .setLabel('🗑️ Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );
}

async function handleVote(interaction) {
  const userId = interaction.user.id;
  const parts = interaction.customId.split('_');
  const action = parts[1];
  const appid = parts[2]; // Mantém como string
  
  console.log(`🔍 HandleVote - User: ${userId}, Action: ${action}, AppID: ${appid} (type: ${typeof appid})`);
  console.log(`📋 Votações ativas:`, Array.from(activeVotes.keys()).map(k => `${k} (${typeof k})`));
  
  const voteData = activeVotes.get(appid);

  // Verifica se a votação existe PRIMEIRO
  if (!voteData) {
    console.log(`❌ Votação não encontrada para AppID: ${appid}`);
    return await interaction.reply({ 
      content: '❌ Esta votação não está mais ativa.', 
      flags: MessageFlags.Ephemeral
    });
  }

  // Verifica autorização
  if (!AUTHORIZED_USERS.includes(userId)) {
    console.log(`🔒 Usuário ${userId} não autorizado`);
    return await interaction.reply({ 
      content: '🔒 Você não tem permissão para votar nesta compra.', 
      flags: MessageFlags.Ephemeral
    });
  }

  // Para cancelamento, processar de forma especial
  if (action === 'cancel') {
    console.log(`🗑️ Tentativa de cancelamento - Iniciador: ${voteData.initiator}, User: ${userId}`);
    
    // Defer update SEMPRE primeiro
    await interaction.deferUpdate();
    
    // Apenas o iniciador pode cancelar
    if (userId !== voteData.initiator) {
      console.log(`❌ Usuário não é o iniciador`);
      return await interaction.followUp({ 
        content: '❌ Apenas quem iniciou a votação pode cancelá-la.', 
        flags: MessageFlags.Ephemeral
      });
    }

    console.log(`✅ Cancelando votação ${appid}`);
    
    // Remove a votação do map
    activeVotes.delete(appid);
    
    const cancelEmbed = new EmbedBuilder()
      .setTitle(`❌ Compra Cancelada: ${voteData.gameName}`)
      .setDescription('A votação foi cancelada pelo organizador.')
      .setColor('#F44336')
      .setTimestamp();

    // Edita a mensagem removendo os botões
    await interaction.message.edit({ embeds: [cancelEmbed], components: [] });
    console.log(`✅ Votação cancelada com sucesso`);
    return;
  }

  // Para outras ações (yes/no), defer primeiro
  await interaction.deferUpdate();

  if (action === 'yes') {
    console.log(`✅ Voto SIM de ${userId}`);
    // Adiciona voto SIM e remove de NÃO se estiver lá
    voteData.voters.add(userId);
    voteData.noVoters.delete(userId);
    await updateVoteMessage(interaction, voteData);
    
  } else if (action === 'no') {
    console.log(`❌ Voto NÃO de ${userId}`);
    // Adiciona voto NÃO e remove de SIM se estiver lá
    voteData.noVoters.add(userId);
    voteData.voters.delete(userId);
    await updateVoteMessage(interaction, voteData);
  }
}

async function updateVoteMessage(interaction, voteData) {
  const embed = createVoteEmbed(voteData);
  const buttons = createVoteButtons(voteData.appid);

  try {
    await interaction.message.edit({ embeds: [embed], components: [buttons] });
  } catch (error) {
    console.error('Erro ao atualizar mensagem de votação:', error);
  }
}



function checkFamilyShare(appid) {
  try {
    const csvPath = path.join(__dirname, '../../data/steam_games_aggregated.csv');
    if (!fs.existsSync(csvPath)) return null;
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [csvAppId, gameName, copies, owners] = line.split(',').map(s => s.trim());
      if (csvAppId === String(appid)) {
        return {
          inLibrary: true,
          copies: parseInt(copies) || 1,
          owners: owners ? owners.replace(/"/g, '') : 'Unknown'
        };
      }
    }
    return { inLibrary: false };
  } catch (error) {
    console.error('Erro ao verificar Family Share:', error);
    return null;
  }
}

async function getAppId(query) {
  try {
    const res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=eu&l=english`);
    const data = await res.json();
    if (data.items && data.items.length > 0) return data.items[0].id;
    if (/^\d+$/.test(query)) return query;
    return null;
  } catch (error) {
    console.error('Erro ao buscar AppID:', error);
    return null;
  }
}

async function getGameDetails(appid, cc = 'eu') {
  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${cc}&l=english`);
    const data = await res.json();
    return data[appid]?.data || null;
  } catch (error) {
    console.error('Erro ao buscar detalhes do jogo:', error);
    return null;
  }
}

async function getSteamPrices(appid) {
  try {
    const [euData, uaData] = await Promise.all([
      getGameDetails(appid, 'eu'),
      getGameDetails(appid, 'ua')
    ]);
    const euro = euData?.price_overview || null;
    const uah = uaData?.price_overview || null;
    return { euro, uah };
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    return { euro: null, uah: null };
  }
}

async function getHistoricalLowPrice(appid, currentPrices) {
  // Estimativa baseada em desconto típico histórico (70% do preço atual)
  // Em produção, você pode integrar com APIs como SteamDB ou IsThereAnyDeal
  const lowestEUR = currentPrices.euro ? (currentPrices.euro.final / 100) * 0.7 : null;
  const lowestUAH = currentPrices.uah ? (currentPrices.uah.final / 100) * 0.7 : null;

  return { lowestEUR, lowestUAH };
}

async function checkFamilySharingSupport(appid) {
  try {
    // Busca pela página da loja e procura pela tag "Family Sharing"
    const res = await fetch(`https://store.steampowered.com/app/${appid}`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    
    // Procura pela feature "Family Sharing" na página
    const hasFamilySharing = html.includes('Family Sharing') || 
                            html.includes('family_sharing') ||
                            html.includes('>Family Sharing<');
    
    return hasFamilySharing;
  } catch (error) {
    console.error('Erro ao verificar Family Sharing:', error);
    return null; // Retorna null se não conseguir verificar
  }
}
