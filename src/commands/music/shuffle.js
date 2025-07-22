import * as Discord from 'discord.js';

export default {
    name: 'shuffle',
    description: 'Embaralha a fila de músicas',
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

        if (player.queue.size === 0) return client.errNormal({
            error: "Not enough song to shuffle",
            type: 'reply'
        }, message);

        player.queue.shuffle();

        client.succNormal({
            text: `Shuffled the queue!`,
            type: 'reply'
        }, message);
    }
};

 