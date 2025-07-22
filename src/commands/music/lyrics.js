import * as Discord from 'discord.js';
import lyricsFinder from 'lyrics-finder';

export default {
    name: 'lyrics',
    description: 'Mostra a letra da música atual ou de uma música pesquisada',
    async execute(client, message, args) {
        let search = "";
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

        if (!args[0]) {
            search = player.queue.current.title;
        } else {
            search = args.join(' ');
        }

        let lyrics = "";
        try {
            lyrics = await lyricsFinder(search, "");
            if (!lyrics) lyrics = `No lyrics found for ${search} :x:`;
        } catch (error) {
            lyrics = `No lyrics found for ${search} :x:`;
        }

        client.embed({
            title: `${client.emotes.normal.music}・Lyrics For ${search}`,
            desc: lyrics,
            type: 'reply'
        }, message);
    }
};

 