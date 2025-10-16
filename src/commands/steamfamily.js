import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);


const AUTHORIZED_USERS = process.env.STEAM_FAMILY_AUTHORIZED_USERS 
  ? process.env.STEAM_FAMILY_AUTHORIZED_USERS.split(',').map(id => id.trim())
  : [];

// Validação: avisa se a lista está vazia
if (AUTHORIZED_USERS.length === 0) {
  console.warn('⚠️ STEAM_FAMILY_AUTHORIZED_USERS não configurado no .env!');
}
// ========================================

export default {
  name: 'steamfamily',
  description: 'Mostra os jogos compartilhados da Steam Family com estatísticas detalhadas',
  usage: '%steamfamily [refresh|stats|list [página] [filtro]|search <jogo>]',
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
    
    const subcommand = args[0]?.toLowerCase();
    
    switch (subcommand) {
      case 'refresh':
        await handleRefresh(message);
        break;
      case 'stats':
        await handleStats(message);
        break;
      case 'list':
        const page = parseInt(args[1]) || 1;
        const sortType = args[2] || 'alphabetical';
        await handleList(message, page, false, sortType);
        break;
      case 'search':
        if (args.length < 2) {
          return await message.channel.send('❌ Use: `!steamfamily search <nome do jogo>`');
        }
        await handleSearch(message, args.slice(1).join(' '));
        break;
      default:
        await handleDefault(message);
        break;
    }
  }
};

// Exporta as funções para uso nos handlers de botões
export { handleRefresh, handleStats, handleList, handleMainMenu, AUTHORIZED_USERS };

// Função auxiliar para verificar autorização
function checkAuthorization(userId) {
  return AUTHORIZED_USERS.includes(userId);
}

// Função auxiliar para mostrar o menu principal (para botões)
async function handleMainMenu(message, editMode = false, userId = null) {
  // Se userId for fornecido (chamada de botão), verifica autorização
  if (userId && !checkAuthorization(userId)) {
    const embed = new EmbedBuilder()
      .setTitle('🔒 Acesso Negado')
      .setDescription('Você não tem permissão para usar este comando.')
      .setColor('#F44336')
      .setTimestamp();
    
    if (editMode) {
      return await message.edit({ content: '', embeds: [embed], components: [] });
    } else {
      return await message.channel.send({ embeds: [embed] });
    }
  }
  
  try {
    const csvPath = await findCSVPath();
    const data = await readCSVData(csvPath);
    
    if (!data || data.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📚 Steam Family - Sem Dados')
        .setDescription('Nenhum dado encontrado. Use o comando abaixo para buscar os dados.')
        .addFields({
          name: '🔄 Atualizar Dados',
          value: '`!steamfamily refresh`'
        })
        .setColor('#FF9800');
      
      if (editMode) {
        return await message.edit({ content: '', embeds: [embed], components: [] });
      } else {
        return await message.channel.send({ embeds: [embed] });
      }
    }
    
    // OTIMIZADO: Mostra os 10 jogos mais populares (REDUZIDO de 15)
    const topGames = data
      .sort((a, b) => b.copies - a.copies)
      .slice(0, 10);
    
    const embed = new EmbedBuilder()
      .setTitle('🎮 Steam Family - Top 10 Jogos')
      .setDescription('Jogos com mais cópias na família:')
      .setColor('#1b2836')
      .setTimestamp();
    
    // REDUZIDO: Formato compacto para economizar memória
    topGames.forEach((game, index) => {
      const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
      const gameName = game.name.length > 40 ? game.name.substring(0, 37) + '...' : game.name;
      embed.addFields({
        name: `${medal} ${gameName}`,
        value: `**${game.copies}** cópias | ID: ${game.appid}`,
        inline: true
      });
    });
    
    // Botões de navegação
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('steamfamily_stats')
          .setLabel('📊 Estatísticas')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('steamfamily_list')
          .setLabel('📋 Lista Completa')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('steamfamily_refresh')
          .setLabel('🔄 Atualizar')
          .setStyle(ButtonStyle.Success)
      );
    
    if (editMode) {
      await message.edit({ content: '', embeds: [embed], components: [row] });
    } else {
      await message.channel.send({ embeds: [embed], components: [row] });
    }
    
  } catch (error) {
    console.error('Erro ao exibir dados:', error);
    
    const embed = new EmbedBuilder()
      .setTitle('❌ Erro')
      .setDescription('Não foi possível carregar os dados da Steam Family.')
      .addFields({
        name: 'Comandos Disponíveis',
        value: '`!steamfamily refresh` - Atualizar dados\n`!steamfamily stats` - Ver estatísticas\n`!steamfamily list [página] [filtro]` - Lista com filtros\n`!steamfamily search <jogo>` - Buscar jogo\n\n**Filtros:** alphabetical, copies, owner'
      })
      .setColor('#F44336');
    
    if (editMode) {
      await message.edit({ content: '', embeds: [embed], components: [] });
    } else {
      await message.channel.send({ embeds: [embed] });
    }
  }
}

async function handleRefresh(message, editMode = false, userId = null) {
  // Verifica autorização se userId for fornecido
  if (userId && !checkAuthorization(userId)) {
    const embed = new EmbedBuilder()
      .setTitle('🔒 Acesso Negado')
      .setDescription('Você não tem permissão para usar este comando.')
      .setColor('#F44336')
      .setTimestamp();
    
    if (editMode) {
      return await message.edit({ content: '', embeds: [embed], components: [] });
    } else {
      return await message.channel.send({ embeds: [embed] });
    }
  }
  
  let loadingMsg;
  
  if (editMode) {
    // Se estamos editando uma mensagem existente, usa ela diretamente
    loadingMsg = message;
    await loadingMsg.edit({ content: '🔄 Atualizando dados da Steam Family...', embeds: [], components: [] });
  } else {
    // Se é um comando normal, cria nova mensagem
    loadingMsg = await message.channel.send('🔄 Atualizando dados da Steam Family...');
  }
  
  try {
    // Para hosting: verifica se temos dados pré-carregados
    const csvInData = path.join(process.cwd(), 'data', 'steam_games_aggregated.csv');
    const csvInRoot = path.join(process.cwd(), 'steam_games_aggregated.csv');
    
    // Se estamos no hosting e o arquivo já existe, apenas confirma
    try {
      await fs.access(csvInData);
      const embed = new EmbedBuilder()
        .setTitle('✅ Steam Family - Dados Disponíveis')
        .setDescription('Dados da Steam Family estão disponíveis e atualizados!')
        .addFields({
          name: 'ℹ️ Nota',
          value: 'Em hosting, os dados são atualizados manualmente. Use os comandos para visualizar.'
        })
        .setColor('#4CAF50')
        .setTimestamp();
      
      return await loadingMsg.edit({ content: '', embeds: [embed] });
    } catch {
      // Arquivo não existe na pasta data, continua com a lógica original
    }
    
    // Caminhos alternativos para o script Python (apenas para desenvolvimento local)
    const possibleScriptPaths = [
      path.join(process.cwd(), '..', 'Steam-Family-Share-Game-Fetcher', 'Steam_Games.py'),
      path.join(process.cwd(), '..', '..', 'Steam-Family-Share-Game-Fetcher', 'Steam_Games.py'),
      path.join('C:', 'Users', 'Skalin', 'Documents', 'GitHub', 'Steam-Family-Share-Game-Fetcher', 'Steam_Games.py')
    ];
    
    let scriptPath = null;
    let csvPath = null;
    
    for (const testPath of possibleScriptPaths) {
      try {
        await fs.access(testPath);
        scriptPath = testPath;
        csvPath = path.join(path.dirname(testPath), 'steam_games_aggregated.csv');
        break;
      } catch {
        continue;
      }
    }
    
    if (!scriptPath) {
      const embed = new EmbedBuilder()
        .setTitle('ℹ️ Steam Family - Hosting Mode')
        .setDescription('Script Python não encontrado (normal em hosting).')
        .addFields({
          name: '📋 Para atualizar dados no hosting',
          value: '1. Execute o script localmente\n2. Faça upload do CSV atualizado\n3. Redeploy no Render'
        })
        .setColor('#FF9800')
        .setTimestamp();
      
      return await loadingMsg.edit({ content: '', embeds: [embed] });
    }
    
    // Executa o script Python (apenas local)
    await execAsync(`python "${scriptPath}"`);
    
    // Verifica se o arquivo foi gerado
    await fs.access(csvPath);
    
    // Copia para a pasta data se não existir lá
    try {
      await fs.copyFile(csvPath, csvInData);
    } catch (error) {
      console.log('Aviso: Não foi possível copiar para pasta data:', error.message);
    }
    
    const embed = new EmbedBuilder()
      .setTitle('✅ Steam Family - Dados Atualizados')
      .setDescription('Os dados da Steam Family foram atualizados com sucesso!')
      .setColor('#4CAF50')
      .setTimestamp();
    
    await loadingMsg.edit({ content: '', embeds: [embed] });
    
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    
    const embed = new EmbedBuilder()
      .setTitle('❌ Erro na Atualização')
      .setDescription('Não foi possível atualizar os dados da Steam Family.')
      .addFields({
        name: 'Erro',
        value: `\`\`\`${error.message.slice(0, 1000)}\`\`\``
      })
      .setColor('#F44336')
      .setTimestamp();
    
    await loadingMsg.edit({ content: '', embeds: [embed] });
  }
}

async function findCSVPath() {
  const possiblePaths = [
    // Para hosting (Render, etc.) - pasta data do bot
    path.join(process.cwd(), 'data', 'steam_games_aggregated.csv'),
    // Para desenvolvimento local - pasta raiz do bot
    path.join(process.cwd(), 'steam_games_aggregated.csv'),
    // Caminhos locais originais (fallback)
    path.join(process.cwd(), '..', 'Steam-Family-Share-Game-Fetcher', 'steam_games_aggregated.csv'),
    path.join(process.cwd(), '..', '..', 'Steam-Family-Share-Game-Fetcher', 'steam_games_aggregated.csv'),
    path.join('C:', 'Users', 'Skalin', 'Documents', 'GitHub', 'Steam-Family-Share-Game-Fetcher', 'steam_games_aggregated.csv'),
    path.join('C:', 'Users', 'Skalin', 'Music', 'Steam_Games', 'steam_games_aggregated.csv')
  ];
  
  for (const testPath of possiblePaths) {
    try {
      await fs.access(testPath);
      return testPath;
    } catch {
      continue;
    }
  }
  
  throw new Error('Arquivo CSV não encontrado. Execute o comando refresh primeiro.');
}

async function handleList(message, page = 1, editMode = false, sortType = 'alphabetical', userId = null) {
  // Verifica autorização se userId for fornecido
  if (userId && !checkAuthorization(userId)) {
    const embed = new EmbedBuilder()
      .setTitle('🔒 Acesso Negado')
      .setDescription('Você não tem permissão para usar este comando.')
      .setColor('#F44336')
      .setTimestamp();
    
    if (editMode) {
      return await message.edit({ content: '', embeds: [embed], components: [] });
    } else {
      return await message.channel.send({ embeds: [embed] });
    }
  }
  
  try {
    const csvPath = await findCSVPath();
    const data = await readCSVData(csvPath);
    
    if (!data || data.length === 0) {
      const errorMsg = '❌ Nenhum dado encontrado. Use `!steamfamily refresh` primeiro.';
      return editMode ? 
        await message.edit({ content: errorMsg, embeds: [], components: [] }) :
        await message.channel.send(errorMsg);
    }
    
    // Aplica ordenação baseada no tipo selecionado
    let sortedGames;
    let sortDescription = '';
    
    switch (sortType) {
      case 'copies':
        sortedGames = data.sort((a, b) => b.copies - a.copies);
        sortDescription = '📊 Ordenado por número de cópias (maior para menor)';
        break;
      case 'owner':
        sortedGames = data.sort((a, b) => {
          const ownerA = a.owners.split(',')[0].trim();
          const ownerB = b.owners.split(',')[0].trim();
          return ownerA.localeCompare(ownerB);
        });
        sortDescription = '👤 Ordenado por proprietário (primeiro da lista)';
        break;
      case 'alphabetical':
      default:
        sortedGames = data.sort((a, b) => a.name.localeCompare(b.name));
        sortDescription = '🔤 Ordenado alfabeticamente';
        break;
    }
    
    // Configuração da paginação
    const gamesPerPage = 8; // Reduzido para dar espaço aos botões de filtro
    const totalPages = Math.ceil(sortedGames.length / gamesPerPage);
    const startIndex = (page - 1) * gamesPerPage;
    const endIndex = startIndex + gamesPerPage;
    const gamesOnPage = sortedGames.slice(startIndex, endIndex);
    
    // Validação da página
    if (page < 1 || page > totalPages) {
      const errorMsg = `❌ Página inválida. Use uma página entre 1 e ${totalPages}.`;
      return editMode ? 
        await message.edit({ content: errorMsg, embeds: [], components: [] }) :
        await message.channel.send(errorMsg);
    }
    
    const embed = new EmbedBuilder()
      .setTitle('📋 Steam Family - Lista Completa de Jogos')
      .setDescription(`${sortDescription}\nPágina ${page} de ${totalPages} (${sortedGames.length} jogos total)`)
      .setColor('#1b2836')
      .setTimestamp();
    
    // Adiciona jogos à embed
    gamesOnPage.forEach((game, index) => {
      const gameNumber = startIndex + index + 1;
      const copiesInfo = game.copies > 1 ? `${game.copies} cópias` : '1 cópia';
      const ownersInfo = game.owners.length > 50 ? 
        `${game.owners.substring(0, 47)}...` : 
        game.owners;
      
      embed.addFields({
        name: `${gameNumber}. ${game.name}`,
        value: `**AppID:** ${game.appid} | **${copiesInfo}**\n**Proprietários:** ${ownersInfo}`,
        inline: false
      });
    });
    
    // Primeira linha de botões: Filtros de ordenação
    const sortRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`steamfamily_sort_alphabetical_${page}`)
          .setLabel('🔤 A-Z')
          .setStyle(sortType === 'alphabetical' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(sortType === 'alphabetical'),
        new ButtonBuilder()
          .setCustomId(`steamfamily_sort_copies_${page}`)
          .setLabel('📊 Cópias')
          .setStyle(sortType === 'copies' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(sortType === 'copies'),
        new ButtonBuilder()
          .setCustomId(`steamfamily_sort_owner_${page}`)
          .setLabel('👤 Proprietário')
          .setStyle(sortType === 'owner' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(sortType === 'owner')
      );
    
    // Segunda linha de botões: Navegação entre páginas
    const navigationRow = new ActionRowBuilder();
    
    // Botão página anterior
    if (page > 1) {
      navigationRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`steamfamily_list_${page - 1}_${sortType}`)
          .setLabel('⬅️ Anterior')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    // Botão página seguinte
    if (page < totalPages) {
      navigationRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`steamfamily_list_${page + 1}_${sortType}`)
          .setLabel('Próxima ➡️')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    // Botão voltar ao menu principal
    navigationRow.addComponents(
      new ButtonBuilder()
        .setCustomId('steamfamily_main')
        .setLabel('🏠 Menu Principal')
        .setStyle(ButtonStyle.Primary)
    );
    
    const components = [sortRow];
    if (navigationRow.components.length > 0) {
      components.push(navigationRow);
    }
    
    // Footer com informações de navegação
    embed.setFooter({ 
      text: `💡 Use !steamfamily list ${page} ${sortType} para voltar a esta página | Total: ${sortedGames.length} jogos` 
    });
    
    if (editMode) {
      await message.edit({ content: '', embeds: [embed], components });
    } else {
      await message.channel.send({ embeds: [embed], components });
    }
    
  } catch (error) {
    console.error('Erro ao gerar lista:', error);
    const errorMsg = '❌ Erro ao gerar lista de jogos. Verifique se os dados foram atualizados.';
    if (editMode) {
      await message.edit({ content: errorMsg, embeds: [], components: [] });
    } else {
      await message.channel.send(errorMsg);
    }
  }
}

async function handleStats(message, editMode = false, userId = null) {
  // Verifica autorização se userId for fornecido
  if (userId && !checkAuthorization(userId)) {
    const embed = new EmbedBuilder()
      .setTitle('🔒 Acesso Negado')
      .setDescription('Você não tem permissão para usar este comando.')
      .setColor('#F44336')
      .setTimestamp();
    
    if (editMode) {
      return await message.edit({ content: '', embeds: [embed], components: [] });
    } else {
      return await message.channel.send({ embeds: [embed] });
    }
  }
  
  try {
    const csvPath = await findCSVPath();
    const data = await readCSVData(csvPath);
    
    if (!data || data.length === 0) {
      const errorMsg = '❌ Nenhum dado encontrado. Use `!steamfamily refresh` primeiro.';
      return editMode ? 
        await message.edit({ content: errorMsg, embeds: [], components: [] }) :
        await message.channel.send(errorMsg);
    }
    
    // Calcula estatísticas
    const stats = calculateStats(data);
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Steam Family - Estatísticas')
      .setColor('#1b2836')
      .addFields(
        { name: '🎮 Total de Jogos', value: stats.totalGames.toString(), inline: true },
        { name: '👥 Total de Usuários', value: stats.totalUsers.toString(), inline: true },
        { name: '🔄 Jogos Compartilhados', value: stats.sharedGames.toString(), inline: true },
        { name: '📈 Média de Cópias', value: stats.averageCopies.toFixed(1), inline: true },
        { name: '🏆 Jogo Mais Popular', value: stats.mostPopular.name, inline: true },
        { name: '👑 Usuário com Mais Jogos', value: stats.topUser.name, inline: true }
      )
      .setTimestamp();
    
    // Botão para voltar ao menu principal
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('steamfamily_main')
          .setLabel('🏠 Voltar ao Menu')
          .setStyle(ButtonStyle.Secondary)
      );
    
    if (editMode) {
      await message.edit({ content: '', embeds: [embed], components: [backButton] });
    } else {
      await message.channel.send({ embeds: [embed], components: [backButton] });
    }
    
  } catch (error) {
    console.error('Erro ao gerar estatísticas:', error);
    const errorMsg = '❌ Erro ao gerar estatísticas. Verifique se os dados foram atualizados.';
    if (editMode) {
      await message.edit({ content: errorMsg, embeds: [], components: [] });
    } else {
      await message.channel.send(errorMsg);
    }
  }
}

async function handleSearch(message, searchTerm) {
  try {
    const csvPath = await findCSVPath();
    const data = await readCSVData(csvPath);
    
    if (!data || data.length === 0) {
      return await message.channel.send('❌ Nenhum dado encontrado. Use `!steamfamily refresh` primeiro.');
    }
    
    // Busca jogos que correspondem ao termo
    const results = data.filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limita a 10 resultados
    
    if (results.length === 0) {
      return await message.channel.send(`❌ Nenhum jogo encontrado com o termo: "${searchTerm}"`);
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`🔍 Resultados para: "${searchTerm}"`)
      .setColor('#1b2836')
      .setDescription(`Encontrados ${results.length} jogo(s):`);
    
    results.forEach(game => {
      embed.addFields({
        name: game.name,
        value: `**AppID:** ${game.appid}\n**Cópias:** ${game.copies}\n**Proprietários:** ${game.owners}`,
        inline: false
      });
    });
    
    await message.channel.send({ embeds: [embed] });
    
  } catch (error) {
    console.error('Erro na busca:', error);
    await message.channel.send('❌ Erro ao buscar jogos.');
  }
}

async function handleDefault(message) {
  try {
    const csvPath = await findCSVPath();
    const data = await readCSVData(csvPath);
    
    if (!data || data.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📚 Steam Family - Sem Dados')
        .setDescription('Nenhum dado encontrado. Use o comando abaixo para buscar os dados.')
        .addFields({
          name: '🔄 Atualizar Dados',
          value: '`!steamfamily refresh`'
        })
        .setColor('#FF9800');
      
      return await message.channel.send({ embeds: [embed] });
    }
    
    // Mostra os 15 jogos mais populares (com mais cópias)
    const topGames = data
      .sort((a, b) => b.copies - a.copies)
      .slice(0, 15);
    
    const embed = new EmbedBuilder()
      .setTitle('🎮 Steam Family - Jogos Mais Populares')
      .setDescription('Top 15 jogos com mais cópias na família:')
      .setColor('#1b2836')
      .setTimestamp();
    
    topGames.forEach((game, index) => {
      const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
      embed.addFields({
        name: `${medal} ${game.name}`,
        value: `**Cópias:** ${game.copies} | **AppID:** ${game.appid}\n**Proprietários:** ${game.owners}`,
        inline: false
      });
    });
    
    // Botões de navegação
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('steamfamily_stats')
          .setLabel('📊 Estatísticas')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('steamfamily_list')
          .setLabel('📋 Lista Completa')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('steamfamily_refresh')
          .setLabel('🔄 Atualizar')
          .setStyle(ButtonStyle.Success)
      );
    
    await message.channel.send({ embeds: [embed], components: [row] });
    
  } catch (error) {
    console.error('Erro ao exibir dados:', error);
    
    const embed = new EmbedBuilder()
      .setTitle('❌ Erro')
      .setDescription('Não foi possível carregar os dados da Steam Family.')
      .addFields({
        name: 'Comandos Disponíveis',
        value: '`!steamfamily refresh` - Atualizar dados\n`!steamfamily stats` - Ver estatísticas\n`!steamfamily search <jogo>` - Buscar jogo'
      })
      .setColor('#F44336');
    
    await message.channel.send({ embeds: [embed] });
  }
}

async function readCSVData(csvPath) {
  try {
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Remove header
    const dataLines = lines.slice(1);
    
    // CRITICAL: Processar em chunks para evitar usar muita memória de uma vez
    const chunkSize = 100;
    const games = [];
    
    for (let i = 0; i < dataLines.length; i += chunkSize) {
      const chunk = dataLines.slice(i, i + chunkSize);
      const processedChunk = chunk.map(line => {
        const [appid, name, copies, owners] = parseCSVLine(line);
        return {
          appid: appid.trim(),
          name: name.trim(),
          copies: parseInt(copies.trim()),
          owners: owners.trim()
        };
      }).filter(game => game.name && game.appid);
      
      games.push(...processedChunk);
      
      // Liberar memória entre chunks
      if (global.gc && i % 500 === 0) {
        global.gc();
      }
    }
    
    return games;
    
  } catch (error) {
    console.error('Erro ao ler CSV:', error);
    return null;
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

function calculateStats(data) {
  const totalGames = data.length;
  const totalUsers = new Set();
  let totalCopies = 0;
  const userGameCount = {};
  
  data.forEach(game => {
    totalCopies += game.copies;
    
    // Extrai nomes dos usuários
    const owners = game.owners.split(',').map(owner => owner.trim());
    owners.forEach(owner => {
      totalUsers.add(owner);
      userGameCount[owner] = (userGameCount[owner] || 0) + 1;
    });
  });
  
  const sharedGames = data.filter(game => game.copies > 1).length;
  const averageCopies = totalCopies / totalGames;
  
  const mostPopular = data.reduce((max, game) => 
    game.copies > max.copies ? game : max
  );
  
  const topUserName = Object.keys(userGameCount).reduce((a, b) => 
    userGameCount[a] > userGameCount[b] ? a : b
  );
  
  return {
    totalGames,
    totalUsers: totalUsers.size,
    sharedGames,
    averageCopies,
    mostPopular,
    topUser: { name: topUserName, games: userGameCount[topUserName] }
  };
}
