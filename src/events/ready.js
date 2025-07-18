import { Events } from 'discord.js';
import { registerSlashCommands } from '../handlers/slashCommandHandler.js';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`🤖 Bot conectado como ${client.user.tag}!`);
        console.log(`📊 Servindo ${client.guilds.cache.size} servidores`);
        
        // Registrar comandos slash
        await registerSlashCommands(client);
        
        // Definir status do bot
        client.user.setActivity('os eventos do servidor', { type: 'WATCHING' });
    },
};
