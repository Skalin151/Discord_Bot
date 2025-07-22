import dotenv from 'dotenv';
dotenv.config();


import { Client, GatewayIntentBits } from 'discord.js';
import { Player } from 'discord-player';
import { useMainPlayer } from 'discord-player';
import extractor from '@discord-player/extractor';
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


        // Inicializar o player de música (discord-player)
        client.player = new Player(client);
        const mainPlayer = useMainPlayer();
        if (typeof extractor.register === 'function') {
            extractor.register(mainPlayer);
        } else {
            if (extractor.YouTubeExtractor) mainPlayer.extractors.register(extractor.YouTubeExtractor);
            if (extractor.SpotifyExtractor) mainPlayer.extractors.register(extractor.SpotifyExtractor);
            if (extractor.SoundCloudExtractor) mainPlayer.extractors.register(extractor.SoundCloudExtractor);
        }

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
