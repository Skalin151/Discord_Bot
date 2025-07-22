
import { EmbedBuilder } from 'discord.js';

export default {
    name: 'queue',
    description: 'Mostra as primeiras 10 músicas na fila',
    async execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Não há músicas na fila.');
            return await message.channel.send({ embeds: [embed] });
        }

        const queueString = queue.tracks.slice(0, 10).map((song, i) => {
            return `${i + 1}) [${song.duration}] \`${song.title}\` - <@${song.requestedBy.id}>`;
        }).join('\n');

        const currentSong = queue.current;

        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('🎶 Fila de Músicas')
            .setDescription(
                `**A tocar agora:**\n` +
                (currentSong ? `\`[${currentSong.duration}]\` ${currentSong.title} - <@${currentSong.requestedBy.id}>` : 'Nenhuma') +
                `\n\n**Fila:**\n${queueString}`
            )
            .setThumbnail(currentSong?.thumbnail || null);

        await message.channel.send({ embeds: [embed] });
    },
};
