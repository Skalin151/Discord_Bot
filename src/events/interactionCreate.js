import { Events, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.type === 2) {
            const command = client.slashCommands?.get(interaction.commandName);
            if (!command) {
                console.error(`❌ Comando slash ${interaction.commandName} não encontrado.`);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ Erro ao executar comando slash ${interaction.commandName}:`, error);
                const errorMessage = '❌ Ocorreu um erro ao executar este comando!';
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
                    }
                } catch (replyError) {
                    console.error('❌ Erro ao enviar mensagem de erro:', replyError);
                }
            }
            return;
        }

        // Handler para botões do sistema de tickets
        if (interaction.isButton && interaction.isButton() && interaction.customId.startsWith('ticket_')) {
            const ticketHandler = await import('./ticketButtonHandler.js');
            try {
                await ticketHandler.default.execute(interaction);
            } catch (err) {
                console.error('Erro ao processar botão de ticket:', err);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Erro ao processar ação do ticket.', flags: MessageFlags.Ephemeral });
                }
            }
            return;
        }

        // Handler para botões do steamfamily
        if (interaction.isButton && interaction.isButton() && interaction.customId.startsWith('steamfamily_')) {
            try {
                // IMPORTANTE: Defer ANTES de qualquer operação
                await interaction.deferUpdate();
                
                const { handleStats, handleRefresh, handleList, handleMainMenu } = await import('../commands/steamfamily.js');
                
                if (interaction.customId === 'steamfamily_stats') {
                    await handleStats(interaction.message, true); // true = editMode
                } else if (interaction.customId === 'steamfamily_refresh') {
                    await handleRefresh(interaction.message, true); // true = editMode
                } else if (interaction.customId === 'steamfamily_list') {
                    await handleList(interaction.message, 1, true, 'alphabetical'); // true = editMode
                } else if (interaction.customId.startsWith('steamfamily_list_')) {
                    // Formato: steamfamily_list_[page]_[sortType] ou steamfamily_list_[page]
                    const parts = interaction.customId.split('_');
                    const page = parseInt(parts[2]);
                    const sortType = parts[3] || 'alphabetical';
                    await handleList(interaction.message, page, true, sortType); // true = editMode
                } else if (interaction.customId.startsWith('steamfamily_sort_')) {
                    // Formato: steamfamily_sort_[sortType]_[page]
                    const parts = interaction.customId.split('_');
                    const sortType = parts[2];
                    const page = parseInt(parts[3]) || 1;
                    await handleList(interaction.message, page, true, sortType); // true = editMode
                } else if (interaction.customId === 'steamfamily_main') {
                    await handleMainMenu(interaction.message, true); // true = editMode
                }
                
            } catch (err) {
                console.error('Erro ao processar botão do steamfamily:', err);
                // Se já fizemos deferUpdate, não podemos fazer reply
                try {
                    await interaction.followUp({ content: '❌ Erro ao processar ação.', flags: MessageFlags.Ephemeral });
                } catch (followUpError) {
                    console.error('❌ Erro ao enviar follow-up de erro:', followUpError);
                }
            }
            return;
        }

        // Handler para botões do comando version
        if (interaction.isButton && interaction.isButton() && interaction.customId.startsWith('version_')) {
            try {
                // IMPORTANTE: Defer ANTES de qualquer operação
                await interaction.deferUpdate();
                
                const { showCurrentVersion, showSpecificVersion, showVersionList } = await import('../commands/version.js');
                
                if (interaction.customId === 'version_current') {
                    await showCurrentVersion(interaction.message, true); // true = editMode
                } else if (interaction.customId === 'version_list') {
                    await showVersionList(interaction.message, 1, true); // true = editMode
                } else if (interaction.customId.startsWith('version_list_')) {
                    // Formato: version_list_[page]
                    const page = parseInt(interaction.customId.split('_')[2]) || 1;
                    await showVersionList(interaction.message, page, true); // true = editMode
                } else if (interaction.customId.startsWith('version_show_')) {
                    // Formato: version_show_[version]
                    const versionNumber = interaction.customId.split('_')[2];
                    const { getVersionByNumber } = await import('../config/versions.js');
                    const versionData = getVersionByNumber(versionNumber);
                    
                    if (versionData) {
                        await showSpecificVersion(interaction.message, versionData, true); // true = editMode
                    } else {
                        await interaction.followUp({ content: '❌ Versão não encontrada.', flags: MessageFlags.Ephemeral });
                    }
                } else if (interaction.customId === 'version_previous') {
                    const { CURRENT_VERSION, getAdjacentVersion, getVersionByNumber } = await import('../config/versions.js');
                    const previousVersion = getAdjacentVersion(CURRENT_VERSION, 'previous');
                    
                    if (previousVersion) {
                        await showSpecificVersion(interaction.message, previousVersion, true); // true = editMode
                    }
                } else if (interaction.customId === 'version_technical') {
                    // Mostra detalhes técnicos da versão atual
                    const { getCurrentVersion } = await import('../config/versions.js');
                    const currentVersionData = getCurrentVersion();
                    
                    if (currentVersionData && currentVersionData.technical) {
                        const technicalEmbed = new EmbedBuilder()
                            .setTitle(`🔧 Detalhes Técnicos - v${currentVersionData.version}`)
                            .setDescription(currentVersionData.technical.join('\n'))
                            .setColor('#6C757D')
                            .setTimestamp();
                        
                        const backButton = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('version_current')
                                    .setLabel('⬅️ Voltar')
                                    .setStyle(ButtonStyle.Secondary)
                            );
                        
                        await interaction.message.edit({ content: '', embeds: [technicalEmbed], components: [backButton] });
                    }
                }
                
            } catch (err) {
                console.error('Erro ao processar botão do version:', err);
                // Se já fizemos deferUpdate, não podemos fazer reply
                try {
                    await interaction.followUp({ content: '❌ Erro ao processar ação.', flags: MessageFlags.Ephemeral });
                } catch (followUpError) {
                    console.error('❌ Erro ao enviar follow-up de erro:', followUpError);
                }
            }
            return;
        }

        // Handler para botões do minijogo de combate por turnos
        if (interaction.isButton && interaction.isButton()) {
            const combatButtonIds = ['attack_physical', 'attack_magic', 'attack_item'];
            if (
                (interaction.customId && interaction.customId.startsWith('combat_')) ||
                combatButtonIds.includes(interaction.customId)
            ) {
                const { handleCombatButton } = await import('../minigames/turnCombat.js');
                try {
                    await handleCombatButton(interaction, client);
                } catch (err) {
                    console.error('Erro ao processar botão de combate:', err);
                    // Usar função segura para responder erro
                    try {
                        if (interaction.replied) {
                            // Se já foi respondida, não fazer nada
                            return;
                        } else if (interaction.deferred) {
                            await interaction.followUp({ content: '❌ Erro ao processar ação do combate.', flags: MessageFlags.Ephemeral });
                        } else {
                            await interaction.reply({ content: '❌ Erro ao processar ação do combate.', flags: MessageFlags.Ephemeral });
                        }
                    } catch (replyError) {
                        console.error('❌ Erro ao enviar mensagem de erro de combate:', replyError);
                    }
                }
                return;
            }
        }
    },
};
