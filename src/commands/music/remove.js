import * as Discord from 'discord.js';

export default {
    name: 'remove',
    description: 'Remove uma música da fila',
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
        if (!number || isNaN(number) || number > player.queue.size) {
            return client.errNormal({
                error: `The queue doesn't have that many songs`,
                type: 'reply'
            }, message);
        }
        const targetSong = player.queue[parseInt(number - 1)];
        player.queue.remove((parseInt(number)) - 1);

        client.succNormal({ 
            text: `Removed **${targetSong.title}** from the queue`,
            type: 'reply'
        }, message);
    }
};

 
