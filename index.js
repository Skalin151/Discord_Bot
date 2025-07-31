// Inicia o servidor de ping HTTP para Render Free
import './ping.js';
import * as youtubei from 'discord-player-youtubei';
console.log('youtubei:', youtubei);
const { YoutubeiExtractor } = youtubei;
import dotenv from 'dotenv';
dotenv.config();


import { Client, GatewayIntentBits } from 'discord.js';
import { Player } from 'discord-player';
import { useMainPlayer } from 'discord-player';
import extractor from '@discord-player/extractor';
import { loadEvents } from './src/handlers/eventHandler.js';
import { loadCommands } from './src/handlers/commandHandler.js';
import { loadSlashCommands, registerSlashCommands } from './src/handlers/slashCommandHandler.js';

import { connectDB } from './src/config/db.js';

import { startAutoRaceScheduler } from './src/services/autoRaceService.js';

async function startBot() {
    // Ouvinte de eventos de voz do Discord deve ser adicionado após a criação do client
    try {
        // Conectar ao MongoDB
        await connectDB();

        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessageReactions,
            ]
        });

        // Inicializar o player de música (discord-player)
        client.player = new Player(client);
        const mainPlayer = useMainPlayer();
        if (typeof extractor.register === 'function') {
            extractor.register(mainPlayer);
        } else {
            if (extractor.SpotifyExtractor) mainPlayer.extractors.register(extractor.SpotifyExtractor);
            if (extractor.SoundCloudExtractor) mainPlayer.extractors.register(extractor.SoundCloudExtractor);
        }
        // Workaround: registrar o extractor do plugin youtubei
        if (YoutubeiExtractor) {
            client.player.extractors.register(YoutubeiExtractor, {});
        } else {
            console.error('YoutubeiExtractor não encontrado no plugin discord-player-youtubei');
        }

        // Silenciar logs detalhados de erro do discord-player
        client.player.events.on('error', () => {});
        client.player.events.on('playerError', () => {});

        // Carregar comandos
        client.commands = await loadCommands();

        // Carregar comandos slash
        client.slashCommands = await loadSlashCommands();

        await loadEvents(client);
        if (!process.env.DISCORD_TOKEN) {
            throw new Error('DISCORD_TOKEN não encontrado no arquivo .env');
        }

        await client.login(process.env.DISCORD_TOKEN);

        // Inicia o agendador de corridas públicas automáticas
        startAutoRaceScheduler(client);

        // Registrar comandos slash após login (client.user.id disponível)
        await registerSlashCommands(client);
    } catch (error) {
        console.error('Erro ao iniciar o bot:', error);
        process.exit(1);
    }
}

startBot();
