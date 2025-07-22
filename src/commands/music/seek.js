import * as Discord from 'discord.js';


export default {
    name: 'seek',
    description: 'Avança para um tempo específico da música',
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
                error: `You must provide a valid time in seconds!`,
                type: 'reply'
            }, message);
        }
        player.seek(Number(number) * 1000);

        const musicLength = (player.queue.current.isStream ? null : ((!player.queue.current || !player.queue.current.duration || isNaN(player.queue.current.duration)) ? null : player.queue.current.duration))
        const nowTime = (!player.position || isNaN(player.position)) ? null : player.position;


        const bar = await createProgressBar(musicLength, nowTime);
        // format já está definido localmente

        client.succNormal({
            text: `Seeked song to: ${format(Number(number) * 1000)}`,
            fields: [
                {
                    name: `${client.emotes.normal.music}┆Progress`,
                    value: `${new Date(player.position).toISOString().slice(11, 19)} ┆ ` +
                        bar +
                        ` ┆ ${new Date(player.queue.current.duration).toISOString().slice(11, 19)}`,
                    inline: false
                }
            ],
            type: 'editreply'
        }, message);

    }
}

async function createProgressBar(total, current, size = 10, line = '▬', slider = '🔘') {
    if (current > total) {
        const bar = line.repeat(size + 2);
        const percentage = (current / total) * 100;
        return [bar, percentage];
    } else {
        const percentage = current / total;
        const progress = Math.round((size * percentage));

        if (progress > 1 && progress < 10) {
            const emptyProgress = size - progress;
            const progressText = line.repeat(progress).replace(/.$/, slider);
            const emptyProgressText = line.repeat(emptyProgress);
            const bar = progressText + emptyProgressText;
            return [bar];
        }
        else if (progress < 1 || progress == 1) {
            const emptyProgressText = line.repeat(9);
            const bar = "🔘" + emptyProgressText;
            return [bar];
        }

        else if (progress > 10 || progress == 10) {
            const emptyProgressText = line.repeat(9);
            const bar = emptyProgressText + "🔘";
            return [bar];
        }
    }
}

function format(millis) {
    try {
        var h = Math.floor(millis / 3600000),
            m = Math.floor(millis / 60000),
            s = ((millis % 60000) / 1000).toFixed(0);
        if (h < 1) return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s ;
        else return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    } catch (e) {
        console.log(String(e.stack).bgRed)
    }
}

 