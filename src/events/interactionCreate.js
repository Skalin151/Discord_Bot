import { Events } from 'discord.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;
        
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
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            } catch (replyError) {
                console.error('❌ Erro ao enviar mensagem de erro:', replyError);
            }
        }
    },
};
