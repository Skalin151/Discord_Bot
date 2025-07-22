import * as Discord from 'discord.js';

export default {
    name: 'play',
    description: 'Toca uma música no canal de voz atual',
    async execute(client, message, args) {
        // Adaptação para comandos prefixados
        if (!message.member.voice.channel) return client.errNormal({
            error: `You're not in a voice channel!`,
            type: 'reply'
        }, message);

        let channel = message.member.voice ? message.member.voice.channel : null;
        if (!channel) return client.errNormal({
            error: `The channel does not exist!`,
            type: 'reply'
        }, message);

        let player = client.player.players.get(message.guild.id);

        if (player && (channel.id !== player?.voiceChannel)) return client.errNormal({
            error: `You are not in the same voice channel!`,
            type: 'reply'
        }, message);

        if (!player) {
            player = client.player.create({
                guild: message.guild.id,
                voiceChannel: channel.id,
                textChannel: message.channel.id,
                selfDeafen: true
            });

            if (!channel.joinable) return client.errNormal({
                error: `That channel isn't joinable`,
                type: 'reply'
            }, message);
            player.connect()

            setTimeout(() => {
                if (channel.type == Discord.ChannelType.GuildStageVoice) {
                    message.guild.members.me.voice.setSuppressed(false);
                }
            }, 500)
        }

        player = client.player.players.get(message.guild.id);
        if (player.state !== "CONNECTED") player.connect();

        const query = args.join(' ');
        if (!query) return client.errNormal({
            error: `You must provide a song name or URL!`,
            type: 'reply'
        }, message);

        client.simpleEmbed({
            desc: `🔎┆Searching...`,
            type: 'reply'
        }, message)

        const res = await player.search(query, message.author);

        if (res.loadType === 'LOAD_FAILED') {
            if (!player.queue.current) player.destroy();
            return client.errNormal({
                error: `Error getting music. Please try again in a few minutes`,
                type: 'reply'
            }, message);
        }

        switch (res.loadType) {
            case 'NO_MATCHES': {
                if (!player.queue.current) player.destroy()
                await client.errNormal({
                    error: `No music was found`,
                    type: 'reply'
                }, message);
                break;
            }

            case 'TRACK_LOADED': {
                const track = res.tracks[0];
                await player.queue.add(track);

                if (!player.playing && !player.paused) {
                    player.play();
                }
                else {
                    client.embed({
                        title: `${client.emotes.normal.music}・${track.title}`,
                        url: track.uri,
                        desc: `The song has been added to the queue!`,
                        thumbnail: track.thumbnail,
                        fields: [
                            {
                                name: `👤┆Requested By`,
                                value: `${track.requester}`,
                                inline: true
                            },
                            {
                                name: `${client.emotes.normal.clock}┆Ends at`,
                                value: `<t:${((Date.now() / 1000) + (track.duration / 1000)).toFixed(0)}:f>`,
                                inline: true
                            },
                            {
                                name: `🎬┆Author`,
                                value: `${track.author}`,
                                inline: true
                            }
                        ],
                        type: 'reply'
                    }, message)
                }
                break;
            }

            case 'PLAYLIST_LOADED': {
                await player.queue.add(res.tracks);
                if (!player.playing && !player.paused) player.play()
                break;
            }

            case 'SEARCH_RESULT': {
                let max = 5, filter = (i) => i.user.id === message.author.id;
                if (res.tracks.length < max) max = res.tracks.length;

                // Não é possível usar componentes de interação em mensagens normais, então apenas lista as opções
                const results = res.tracks
                    .slice(0, max)
                    .map((track, index) => `[#${++index}] ${track.title.length >= 45 ? `${track.title.slice(0, 45)}...` : track.title}`)
                    .join('\n');

                client.simpleEmbed({
                    desc: `Resultados:\n${results}\nResponda com o número da música desejada (1-${max}) ou "cancel" para cancelar.`,
                    type: 'reply'
                }, message);

                // Aguardar resposta do usuário
                const filterMsg = m => m.author.id === message.author.id;
                try {
                    const collected = await message.channel.awaitMessages({ filter: filterMsg, max: 1, time: 30000, errors: ['time'] });
                    const response = collected.first().content.trim();
                    if (response.toLowerCase() === 'cancel') {
                        if (!player.queue.current) player.destroy();
                        return message.channel.send('Cancelled selection.');
                    }
                    const index = Number(response) - 1;
                    if (isNaN(index) || index < 0 || index > max - 1) return client.errNormal({
                        error: `The number you provided is invalid (1-${max})`,
                        type: 'reply'
                    }, message)
                    const track = res.tracks[index];
                    player.queue.add(track);
                    if (!player.playing && !player.paused) {
                        player.play();
                    } else {
                        client.embed({
                            title: `${client.emotes.normal.music}・${track.title}`,
                            url: track.uri,
                            desc: `The song has been added to the queue!`,
                            thumbnail: track.thumbnail,
                            fields: [
                                {
                                    name: `👤┆Requested By`,
                                    value: `${track.requester}`,
                                    inline: true
                                },
                                {
                                    name: `${client.emotes.normal.clock}┆Ends at`,
                                    value: `<t:${((Date.now() / 1000) + (track.duration / 1000)).toFixed(0)}:f>`,
                                    inline: true
                                },
                                {
                                    name: `🎬┆Author`,
                                    value: `${track.author}`,
                                    inline: true
                                }
                            ],
                            type: 'reply'
                        }, message)
                    }
                } catch (e) {
                    if (!player.queue.current) player.destroy();
                    return client.errNormal({
                        error: `You didn't provide a selection`,
                        type: 'reply'
                    }, message)
                }
                break;
            }
        }
    }
};

 