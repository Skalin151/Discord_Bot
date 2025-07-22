
import * as Discord from 'discord.js';

export default {
    name: 'queue',
    description: 'Mostra a fila de músicas',
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

        let count = 0;
        let status;

        if (player.queue.length == 0) {
            status = "No more music in the queue";
        }
        else {
            status = player.queue.map((track) => {
                count += 1;
                return (`**[#${count}]**┆${track.title.length >= 45 ? `${track.title.slice(0, 45)}...` : track.title} (Requested by <@!${track.requester.id}>)`);
            }).join("\n");
        }

        let thumbnail;
        if (player.queue.current.thumbnail) thumbnail = player.queue.current.thumbnail;
        else thumbnail = message.guild.iconURL({ size: 1024 });

        client.embed({
            title: `${client.emotes.normal.music}・Songs queue - ${message.guild.name}`,
            desc: status,
            thumbnail: thumbnail,
            fields: [
                {
                    name: `${client.emotes.normal.music} Current song:`,
                    value: `${player.queue.current.title} (Requested by <@!${player.queue.current.requester.id}>)`
                }
            ],
            type: 'reply'
        }, message)
    }
};

 