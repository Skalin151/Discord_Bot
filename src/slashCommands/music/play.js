import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS } from '../../utils/embedUtils.js';

export const playSlashCommand = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Toca uma música no canal de voz atual')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Nome ou URL da música')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect | PermissionFlagsBits.Speak)
        .setDMPermission(false),

    async execute(interaction) {
        try {
            const channel = interaction.member.voice.channel;
            if (!channel) {
                return interaction.reply({ content: '❌ Você precisa estar em um canal de voz!', ephemeral: true });
            }

            // Aqui você integraria com o seu player de música
            // Exemplo: await player.play(channel, song)
            const song = interaction.options.getString('song');
            // Simulação de sucesso
            await interaction.reply({ content: `🎵 Tocando: **${song}**`, ephemeral: false });

            // Log
            const embed = createSimpleLogEmbed('Play', `Música tocada: **${song}**`, LOG_COLORS.MESSAGE, interaction.user);
            await sendLogEmbed(interaction.guild, embed);
        } catch (error) {
            console.error('Erro ao executar play:', error);
            await interaction.reply({ content: '❌ Ocorreu um erro ao tentar tocar a música.', ephemeral: true });
        }
    }
};
