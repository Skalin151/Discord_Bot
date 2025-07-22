import * as Discord from 'discord.js';

export default {
    name: 'skipto',
    description: 'Pula para uma música específica na fila',
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

        let number = args[0];
        if (!number || isNaN(number)) {
            return client.errNormal({
                error: `You must provide a valid number!`,
                type: 'reply'
            }, message);
        }
        player.skipto(parseInt(number));

        client.succNormal({ 
            text: `Skipped the music to **${number}**`, 
            type: 'reply'
        }, message);
    }
};

 