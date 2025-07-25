import { EmbedBuilder } from 'discord.js';

export default {
    name: 'shuffle',
    description: 'Embaralha a fila de músicas',
    async execute(client, message) {
        const queue = client.player.nodes.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Não há músicas na fila.');
            return await message.channel.send({ embeds: [embed] });
        }

        queue.tracks.shuffle();

        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setDescription('🔀 Fila embaralhada!');
        await message.channel.send({ embeds: [embed] });
    },
};
