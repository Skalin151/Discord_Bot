
import * as Discord from 'discord.js';

export default {
    name: 'stop',
    description: 'Para a música e limpa a fila',
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

        player.destroy()

        client.succNormal({ 
            text: `Stopped the music!`, 
            type: 'reply'
        }, message);
    }
};

 