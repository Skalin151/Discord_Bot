
import * as Discord from 'discord.js';

export default {
    name: 'volume',
    description: 'Define ou mostra o volume atual da música',
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

        let amount = args[0];

        if (!amount) return client.simpleEmbed({
            desc: `${client.emotes.normal.volume}┆Current volume is **${player.volume}%**`,
            type: 'reply'
        }, message);

        if (isNaN(amount) || amount === 'Infinity') return client.errNormal({
            text: `Please enter a valid number!`,
            type: 'reply'
        }, message);

        if (Math.round(parseInt(amount)) < 1 || Math.round(parseInt(amount)) > 1000) return client.errNormal({
            text: "Volume cannot exceed 1000%",
            type: 'reply'
        }, message);

        player.setVolume(parseInt(amount))

        client.succNormal({
            text: `Volume set to **${amount}%**`,
            type: 'reply'
        }, message);
    }
};

 