import * as Discord from 'discord.js';

export default {
    name: 'loop',
    description: 'Ativa/desativa o loop da música atual',
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

        player.setTrackRepeat(!player.trackRepeat);
        const trackRepeat = player.trackRepeat ? "enabled" : "disabled";

        client.succNormal({
            text: `Loop is **${trackRepeat}** for the current song`,
            type: 'reply'
        }, message);
    }
};

 