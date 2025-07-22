import dotenv from 'dotenv';
dotenv.config();


import { Client, GatewayIntentBits } from 'discord.js';
import { Manager } from 'erela.js';
import { loadEvents } from './src/handlers/eventHandler.js';
import { loadCommands } from './src/handlers/commandHandler.js';
import { loadSlashCommands, registerSlashCommands } from './src/handlers/slashCommandHandler.js';

async function startBot() {
    // Ouvinte de eventos de voz do Discord deve ser adicionado após a criação do client
    try {

        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
            ]
        });

        // Garantir que o erela.js recebe eventos de voz do Discord
        client.on('raw', d => client.player.updateVoiceState(d));

        // Inicializar o player de música (erela.js)

        client.player = new Manager({
            nodes: [
                {
                    host: 'localhost', // Altere se o Lavalink estiver em outro host
                    port: 3000,
                    password: 'youshallnotpass',
                },
            ],
            send: (id, payload) => {
                const guild = client.guilds.cache.get(id);
                if (guild) guild.shard.send(payload);
            },
        });

        // Debug: eventos de conexão do node Lavalink
        client.player.on('nodeConnect', node => {
            console.log(`✅ Node "${node.options.identifier || node.options.host}" conectado!`);
        });
        client.player.on('nodeError', (node, error) => {
            console.error(`❌ Erro no node "${node.options.identifier || node.options.host}":`, error);
        });

        // Carregar comandos
        client.commands = await loadCommands();

        // Carregar comandos slash
        client.slashCommands = await loadSlashCommands();

        await loadEvents(client);
        if (!process.env.DISCORD_TOKEN) {
            throw new Error('DISCORD_TOKEN não encontrado no arquivo .env');
        }

        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('Erro ao iniciar o bot:', error);
        process.exit(1);
    }
}

startBot();
