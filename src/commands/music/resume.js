
import { EmbedBuilder } from 'discord.js';

export default {
    name: 'resume',
    description: 'Retoma a música atual',
    async execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Não há nenhuma música pausada.');
            return await message.channel.send({ embeds: [embed] });
        }

        queue.setPaused(false);

        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setDescription('▶️ Música retomada com sucesso!');
        await message.channel.send({ embeds: [embed] });
    },
};
