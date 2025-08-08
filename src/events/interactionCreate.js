import { Events, MessageFlags } from 'discord.js';

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
