import { EmbedBuilder } from 'discord.js';

export default {
    name: 'stop',
    description: 'Para a música e limpa a fila',
    async execute(client, message) {
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Não há músicas na fila.');
            return await message.channel.send({ embeds: [embed] });
        }

        await queue.delete();

        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setDescription('⏹️ Música parada e fila limpa!');
        await message.channel.send({ embeds: [embed] });
    },
};
