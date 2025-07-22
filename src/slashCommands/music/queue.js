import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS } from '../../utils/embedUtils.js';

export const queueSlashCommand = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Mostra a fila de músicas')
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect | PermissionFlagsBits.Speak)
        .setDMPermission(false),

    async execute(interaction) {
        try {
            // Aqui você integraria com o seu player de música para obter a fila
            // Exemplo: const queue = await player.getQueue(channel)
            // Simulação de fila
            const queue = ['Música 1', 'Música 2', 'Música 3'];
            const queueString = queue.length ? queue.map((s, i) => `${i+1}. ${s}`).join('\n') : 'Fila vazia.';
            await interaction.reply({ content: `🎶 Fila:\n${queueString}`, ephemeral: false });

            // Log
            const embed = createSimpleLogEmbed('Queue', `Fila consultada.`, LOG_COLORS.MESSAGE, interaction.user);
            await sendLogEmbed(interaction.guild, embed);
        } catch (error) {
            console.error('Erro ao executar queue:', error);
            await interaction.reply({ content: '❌ Ocorreu um erro ao tentar mostrar a fila.', ephemeral: true });
        }
    }
};
