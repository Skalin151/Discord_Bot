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
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: '❌ Erro ao processar ação do combate.', flags: MessageFlags.Ephemeral });
                    }
                }
                return;
            }
        }
    },
};
