import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { 
  getCurrentVersion, 
  getVersionByNumber, 
  getTotalVersions, 
  getAdjacentVersion,
  CURRENT_VERSION,
  VERSION_HISTORY 
} from '../config/versions.js';

export default {
  name: 'version',
  aliases: ['v', 'ver', 'changelog', 'patch', 'patchnotes', 'versions'],
  description: 'Mostra a versão atual do bot, patch notes e histórico de versões',
  usage: '%version [versão específica]',
  async execute(client, message, args) {
    // Se foi especificada uma versão, mostra ela
    if (args[0]) {
      const requestedVersion = args[0];
      const versionData = getVersionByNumber(requestedVersion);
      
      if (!versionData) {
        return await message.channel.send(`❌ Versão \`${requestedVersion}\` não encontrada. Use \`%version list\` para ver todas as versões.`);
      }
      
      await showSpecificVersion(message, versionData);
    } else {
      // Mostra a versão atual por padrão
      await showCurrentVersion(message);
    }
  }
};

// Exporta funções para uso nos handlers de botões
export { showCurrentVersion, showSpecificVersion, showVersionList };

async function showCurrentVersion(message, editMode = false) {
  try {
    const currentVersionData = getCurrentVersion();
    
    if (!currentVersionData) {
      const errorMsg = '❌ Erro ao carregar informações da versão atual.';
      return editMode ? 
        await message.edit({ content: errorMsg, embeds: [], components: [] }) :
        await message.channel.send(errorMsg);
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`🤖 THK Bot - Versão ${CURRENT_VERSION}`)
      .setDescription(`**${getVersionIcon(currentVersionData.type)} ${currentVersionData.title}**\n📅 Lançado em: ${formatDate(currentVersionData.date)}`)
      .setColor(getVersionColor(currentVersionData.type))
      .setTimestamp()
      .setFooter({ text: `Versão ${currentVersionData.version} | Total: ${getTotalVersions()} versões` });
    
    // Adiciona mudanças principais
    if (currentVersionData.changes && currentVersionData.changes.length > 0) {
      const changesText = currentVersionData.changes.slice(0, 8).join('\n'); // Máximo 8 para não exceder limite
      embed.addFields({
        name: '✨ Novidades',
        value: changesText.length > 1000 ? changesText.substring(0, 997) + '...' : changesText,
        inline: false
      });
    }
    
    // Adiciona correções se existirem
    if (currentVersionData.fixes && currentVersionData.fixes.length > 0) {
      const fixesText = currentVersionData.fixes.slice(0, 5).join('\n');
      embed.addFields({
        name: '🔧 Correções',
        value: fixesText.length > 500 ? fixesText.substring(0, 497) + '...' : fixesText,
        inline: false
      });
    }
    
    // Botões de navegação
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('version_list')
          .setLabel('📜 Todas as Versões')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('version_previous')
          .setLabel('⬅️ Versão Anterior')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!getAdjacentVersion(CURRENT_VERSION, 'previous')),
        new ButtonBuilder()
          .setCustomId('version_technical')
          .setLabel('🔧 Detalhes Técnicos')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!currentVersionData.technical || currentVersionData.technical.length === 0)
      );
    
    if (editMode) {
      await message.edit({ content: '', embeds: [embed], components: [row] });
    } else {
      await message.channel.send({ embeds: [embed], components: [row] });
    }
    
  } catch (error) {
    console.error('Erro ao exibir versão atual:', error);
    const errorMsg = '❌ Erro ao carregar informações de versão.';
    if (editMode) {
      await message.edit({ content: errorMsg, embeds: [], components: [] });
    } else {
      await message.channel.send(errorMsg);
    }
  }
}

async function showSpecificVersion(message, versionData, editMode = false) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(`${getVersionIcon(versionData.type)} Versão ${versionData.version}`)
      .setDescription(`**${versionData.title}**\n📅 ${formatDate(versionData.date)}`)
      .setColor(getVersionColor(versionData.type))
      .setTimestamp();
    
    // Determina se é a versão atual
    const isCurrent = versionData.version === CURRENT_VERSION;
    if (isCurrent) {
      embed.setFooter({ text: '⭐ Esta é a versão atual' });
    }
    
    // Adiciona mudanças
    if (versionData.changes && versionData.changes.length > 0) {
      const changesText = versionData.changes.slice(0, 10).join('\n');
      embed.addFields({
        name: '✨ Mudanças',
        value: changesText.length > 1000 ? changesText.substring(0, 997) + '...' : changesText,
        inline: false
      });
    }
    
    // Adiciona correções
    if (versionData.fixes && versionData.fixes.length > 0) {
      const fixesText = versionData.fixes.slice(0, 5).join('\n');
      embed.addFields({
        name: '🔧 Correções',
        value: fixesText.length > 500 ? fixesText.substring(0, 497) + '...' : fixesText,
        inline: false
      });
    }
    
    // Adiciona detalhes técnicos se existirem
    if (versionData.technical && versionData.technical.length > 0) {
      const technicalText = versionData.technical.slice(0, 3).join('\n');
      embed.addFields({
        name: '⚙️ Técnico',
        value: technicalText.length > 300 ? technicalText.substring(0, 297) + '...' : technicalText,
        inline: false
      });
    }
    
    // Botões de navegação
    const row = new ActionRowBuilder();
    
    // Botão para versão anterior
    const previousVersion = getAdjacentVersion(versionData.version, 'previous');
    if (previousVersion) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`version_show_${previousVersion.version}`)
          .setLabel(`⬅️ v${previousVersion.version}`)
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    // Botão para versão seguinte
    const nextVersion = getAdjacentVersion(versionData.version, 'next');
    if (nextVersion) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`version_show_${nextVersion.version}`)
          .setLabel(`v${nextVersion.version} ➡️`)
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    // Botão para lista completa
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('version_list')
        .setLabel('📜 Lista Completa')
        .setStyle(ButtonStyle.Primary)
    );
    
    // Botão para versão atual (se não estiver nela)
    if (!isCurrent) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('version_current')
          .setLabel('⭐ Versão Atual')
          .setStyle(ButtonStyle.Success)
      );
    }
    
    const components = row.components.length > 0 ? [row] : [];
    
    if (editMode) {
      await message.edit({ content: '', embeds: [embed], components });
    } else {
      await message.channel.send({ embeds: [embed], components });
    }
    
  } catch (error) {
    console.error('Erro ao exibir versão específica:', error);
    const errorMsg = '❌ Erro ao carregar informações desta versão.';
    if (editMode) {
      await message.edit({ content: errorMsg, embeds: [], components: [] });
    } else {
      await message.channel.send(errorMsg);
    }
  }
}

async function showVersionList(message, page = 1, editMode = false) {
  try {
    const versionsPerPage = 6;
    const totalPages = Math.ceil(VERSION_HISTORY.length / versionsPerPage);
    const startIndex = (page - 1) * versionsPerPage;
    const endIndex = startIndex + versionsPerPage;
    const versionsOnPage = VERSION_HISTORY.slice(startIndex, endIndex);
    
    // Validação da página
    if (page < 1 || page > totalPages) {
      const errorMsg = `❌ Página inválida. Use uma página entre 1 e ${totalPages}.`;
      return editMode ? 
        await message.edit({ content: errorMsg, embeds: [], components: [] }) :
        await message.channel.send(errorMsg);
    }
    
    const embed = new EmbedBuilder()
      .setTitle('📜 Histórico de Versões - THK Bot')
      .setDescription(`Página ${page} de ${totalPages} | Total: ${VERSION_HISTORY.length} versões`)
      .setColor('#5865F2')
      .setTimestamp();
    
    // Adiciona cada versão na página atual
    versionsOnPage.forEach((version) => {
      const isCurrent = version.version === CURRENT_VERSION;
      const status = isCurrent ? ' ⭐ **ATUAL**' : '';
      const typeIcon = getVersionIcon(version.type);
      
      embed.addFields({
        name: `${typeIcon} Versão ${version.version}${status}`,
        value: `**${version.title}**\n📅 ${formatDate(version.date)}\n${getVersionSummary(version)}`,
        inline: false
      });
    });
    
    // Primeira linha: Navegação entre páginas
    const navigationRow = new ActionRowBuilder();
    
    if (page > 1) {
      navigationRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`version_list_${page - 1}`)
          .setLabel('⬅️ Anterior')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    if (page < totalPages) {
      navigationRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`version_list_${page + 1}`)
          .setLabel('Próxima ➡️')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    // Segunda linha: Ações rápidas
    const actionRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('version_current')
          .setLabel('⭐ Versão Atual')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('version_list_1')
          .setLabel('🔝 Primeira Página')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId(`version_list_${totalPages}`)
          .setLabel('📜 Última Página')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages)
      );
    
    const components = [];
    if (navigationRow.components.length > 0) {
      components.push(navigationRow);
    }
    components.push(actionRow);
    
    embed.setFooter({ 
      text: `💡 Clique em uma versão específica ou use %version [número] para ver detalhes` 
    });
    
    if (editMode) {
      await message.edit({ content: '', embeds: [embed], components });
    } else {
      await message.channel.send({ embeds: [embed], components });
    }
    
  } catch (error) {
    console.error('Erro ao exibir lista de versões:', error);
    const errorMsg = '❌ Erro ao carregar lista de versões.';
    if (editMode) {
      await message.edit({ content: errorMsg, embeds: [], components: [] });
    } else {
      await message.channel.send(errorMsg);
    }
  }
}

// Funções utilitárias
function getVersionIcon(type) {
  switch (type) {
    case 'major': return '🚀';
    case 'minor': return '✨';
    case 'patch': return '🔧';
    default: return '📝';
  }
}

function getVersionColor(type) {
  switch (type) {
    case 'major': return '#FF6B6B'; // Vermelho para major
    case 'minor': return '#4ECDC4'; // Verde-azulado para minor
    case 'patch': return '#45B7D1'; // Azul para patch
    default: return '#95A5A6'; // Cinza para outros
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getVersionSummary(version) {
  const changeCount = (version.changes || []).length;
  const fixCount = (version.fixes || []).length;
  
  let summary = '';
  if (changeCount > 0) summary += `${changeCount} mudanças`;
  if (fixCount > 0) {
    if (summary) summary += ', ';
    summary += `${fixCount} correções`;
  }
  
  return summary || 'Versão sem detalhes';
}