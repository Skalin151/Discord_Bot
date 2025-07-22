import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS } from '../../utils/embedUtils.js';

export const stopSlashCommand = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Para a música e limpa a fila')
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect | PermissionFlagsBits.Speak)
        .setDMPermission(false),

    async execute(interaction) {
        try {
            const channel = interaction.member.voice.channel;
            if (!channel) {
                return interaction.reply({ content: '❌ Você precisa estar em um canal de voz!', ephemeral: true });
            }

            // Aqui você integraria com o seu player de música
            // Exemplo: await player.stop(channel)
            await interaction.reply({ content: '⏹️ Música parada e fila limpa.', ephemeral: false });

            // Log
            const embed = createSimpleLogEmbed('Stop', 'Música parada e fila limpa.', LOG_COLORS.MESSAGE, interaction.user);
            await sendLogEmbed(interaction.guild, embed);
        } catch (error) {
            console.error('Erro ao executar stop:', error);
            await interaction.reply({ content: '❌ Ocorreu um erro ao tentar parar a música.', ephemeral: true });
        }
    }
};
