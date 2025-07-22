import { EmbedBuilder } from 'discord.js';
import { QueryType } from 'discord-player';

export default {
    name: 'play',
    description: 'Toca uma música do YouTube',
    async execute(client, message, args) {
        if (!message.member.voice.channel) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Você precisa estar num canal de voz para tocar música.');
            return await message.channel.send({ embeds: [embed] });
        }

        const query = args.join(' ');
        if (!query) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Forneça o nome ou link da música.');
            return await message.channel.send({ embeds: [embed] });
        }

        try {
            await client.player.play(message.member.voice.channel, query, {
                nodeOptions: {
                    metadata: message.channel,
                    requestedBy: message.author
                }
            });
            const embed = new EmbedBuilder()
                .setColor('#5865f2')
                .setDescription(`▶️ Pedido recebido! A música será tocada ou adicionada à fila.`);
            await message.channel.send({ embeds: [embed] });
        } catch (err) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('❌ Não foi possível tocar a música.');
            await message.channel.send({ embeds: [embed] });
        }
    },
};


