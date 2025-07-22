import * as Discord from 'discord.js';

export default {
    name: 'clear',
    description: 'Limpa a fila de músicas',
    async execute(client, message, args) {
        const player = client.player.players.get(message.guild.id);

        const channel = message.member.voice.channel;
        if (!channel) return client.errNormal({
            error: `You're not in a voice channel!`,
            type: 'reply'
        }, message);

        if (player && (channel.id !== player?.voiceChannel)) return client.errNormal({
            error: `You're not in the same voice channel!`,
            type: 'reply'
        }, message);

        if (!player || !player.queue.current) return client.errNormal({
            error: "There are no songs playing in this server",
            type: 'reply'
        }, message);

        if (player.queue.size <= 1) return client.errNormal({
            error: `There is only one song in the queue!`,
            type: 'reply'
        }, message);

        player.queue.clear();

        client.succNormal({
            text: "The queue has just been **removed**!",
            type: 'reply'
        }, message);
    }
};

 