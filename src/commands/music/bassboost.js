import * as Discord from 'discord.js';

export default {
    name: 'bassboost',
    description: 'Ajusta o nível de bass boost',
    async execute(client, message, args) {
        const player = client.player.players.get(message.guild.id);

        const levels = {
            0: 0.0,
            1: 0.50,
            2: 1.0,
            3: 2.0,
        };

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

        let level = args[0];
        if (!Object.keys(levels).includes(level)) {
            return client.errNormal({
                error: `Invalid level! Use 0, 1, 2 ou 3.`,
                type: 'reply'
            }, message);
        }

        const bands = new Array(3)
            .fill(null)
            .map((_, i) =>
                ({ band: i, gain: levels[level] })
            );

        player.setEQ(...bands);

        client.succNormal({
            text: `Bass boost level adjusted to **level ${level}**`,
            type: 'reply'
        }, message);
    }
};

 