
import { EmbedBuilder } from 'discord.js';

export default {
    name: 'skip',
    description: 'Pula a música atual',
    async execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Não há músicas na fila.');
            return await message.channel.send({ embeds: [embed] });
        }

        const currentSong = queue.current;
        queue.skip();

        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setDescription(`⏭️ **${currentSong.title}** foi pulada!`)
            .setThumbnail(currentSong.thumbnail);
        await message.channel.send({ embeds: [embed] });
    },
};
