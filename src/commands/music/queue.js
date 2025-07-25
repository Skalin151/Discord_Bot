

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export default {
    name: 'queue',
    description: 'Mostra as primeiras 10 músicas na fila',
    async execute(client, message) {
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Não há músicas na fila.');
            return await message.channel.send({ embeds: [embed] });
        }

        const tracks = queue.tracks.data;
        const pageSize = 10;
        let page = 0;
        const totalPages = Math.ceil(tracks.length / pageSize);

        function getQueueEmbed(pageIdx) {
            const start = pageIdx * pageSize;
            const end = start + pageSize;
            const pageTracks = tracks.slice(start, end);
            const queueString = pageTracks.length > 0
                ? pageTracks.map((song, i) => {
                    return `${start + i + 1}) [${song.duration}] \`${song.title}\` - <@${song.requestedBy?.id || 'Desconhecido'}>`;
                }).join('\n')
                : 'Nenhuma música na fila.';
            const currentSong = queue.currentTrack;
            return new EmbedBuilder()
                .setColor('#5865f2')
                .setTitle('🎶 Fila de Músicas')
                .setDescription(
                    `**A tocar agora:**\n` +
                    (currentSong ? `\`[${currentSong.duration}]\` ${currentSong.title} - <@${currentSong.requestedBy?.id || 'Desconhecido'}>` : 'Nenhuma') +
                    `\n\n**Fila (Página ${pageIdx + 1}/${totalPages}):**\n${queueString}`
                )
                .setThumbnail(currentSong?.thumbnail || null);
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('⏪')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('⏩')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(totalPages <= 1)
            );

        const embed = getQueueEmbed(page);
        const sentMsg = await message.channel.send({ embeds: [embed], components: [row] });

        if (totalPages <= 1) return;

        const collector = sentMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async interaction => {
            if (!interaction.isButton()) return;
            if (interaction.customId === 'prev' && page > 0) {
                page--;
            } else if (interaction.customId === 'next' && page < totalPages - 1) {
                page++;
            } else {
                await interaction.deferUpdate();
                return;
            }

            const newRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('⏪')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('⏩')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === totalPages - 1)
                );
            await interaction.update({ embeds: [getQueueEmbed(page)], components: [newRow] });
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('⏪')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('⏩')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );
            await sentMsg.edit({ components: [disabledRow] });
        });
    },
};
