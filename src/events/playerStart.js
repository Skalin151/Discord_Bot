import discordPlayer from 'discord-player';
const { Events } = discordPlayer;

export default {
    name: 'player.playerStart',
    async execute(queue, track, client) {
        // Atualiza o status do bot para mostrar a música tocando
        if (client.user) {
            client.user.setActivity(`A tocar: ${track.title}`, { type: 'LISTENING' });
        }
    },
};
