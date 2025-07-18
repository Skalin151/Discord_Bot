import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { loadSlashCommands, registerSlashCommands } from './src/handlers/slashCommandHandler.js';

// ID do servidor para registrar comandos (mais rápido para desenvolvimento)
const GUILD_ID = process.argv[2];

if (!GUILD_ID) {
    console.log('❌ Por favor, forneça o ID do servidor:');
    console.log('Exemplo: node register-commands.js 1234567890123456789');
    process.exit(1);
}

async function registerCommands() {
    try {
        const client = new Client({
            intents: [GatewayIntentBits.Guilds]
        });

        await client.login(process.env.DISCORD_TOKEN);
        
        client.slashCommands = await loadSlashCommands();
        
        await registerSlashCommands(client, GUILD_ID);
        
        console.log('✅ Comandos registrados com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
        process.exit(1);
    }
}

registerCommands();
