import { EmbedBuilder } from 'discord.js';

export default {
    name: 'playing',
    description: 'Mostra a música atual a tocar',
    async execute(client, message) {
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Não há música a tocar.');
            return await message.channel.send({ embeds: [embed] });
        }

        const currentSong = queue.currentTrack;
        if (!currentSong) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Não há música a tocar.');
            return await message.channel.send({ embeds: [embed] });
        }

        const pedidoPor = currentSong.requestedBy?.id ? `<@${currentSong.requestedBy.id}>` : 'Desconhecido';
        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('🎶 Música a tocar agora')
            .setDescription(`**${currentSong.title}**\nDuração: ${currentSong.duration}\n\n[Link](${currentSong.url})\nPedido por: ${pedidoPor}`)
            .setThumbnail(currentSong.thumbnail);
        await message.channel.send({ embeds: [embed] });
    },
};
