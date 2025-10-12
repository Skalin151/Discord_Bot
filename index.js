// Configuração de memória para Render Free (512MB limit)
// Limitar heap do Node.js para evitar crashes - REDUZIDO para 400MB
if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = '--max-old-space-size=400'; // 400MB para deixar mais margem
}

// Inicia o servidor de ping HTTP para Render Free
import './ping.js';
import { setBotClient } from './ping.js';
import * as youtubei from 'discord-player-youtubei';
console.log('youtubei:', youtubei);
const { YoutubeiExtractor } = youtubei;
import dotenv from 'dotenv';
dotenv.config();


import { Client, GatewayIntentBits, Options } from 'discord.js';
import { Player } from 'discord-player';
import { useMainPlayer } from 'discord-player';
import extractor from '@discord-player/extractor';
import { loadEvents } from './src/handlers/eventHandler.js';
import { loadCommands } from './src/handlers/commandHandler.js';
import { loadSlashCommands, registerSlashCommands } from './src/handlers/slashCommandHandler.js';

import { connectDB } from './src/config/db.js';

import { startAutoRaceScheduler } from './src/services/autoRaceService.js';
import AutoClearService from './src/services/autoClearService.js';
import HealthMonitor from './src/services/healthMonitor.js';

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
            ],
            // CRITICAL: Configurações AGRESSIVAS para reduzir uso de memória no Render (512MB)
            makeCache: Options.cacheWithLimits({
                MessageManager: 20, // REDUZIDO: 20 mensagens por canal
                GuildMemberManager: 50, // REDUZIDO: 50 membros
                UserManager: 50, // REDUZIDO: 50 usuários
                PresenceManager: 0, // Desabilitar presences
                ReactionManager: 0, // Desabilitar reactions cache
                GuildBanManager: 0, // Desabilitar bans cache
                GuildInviteManager: 0, // Desabilitar invites cache
                VoiceStateManager: 50, // Apenas estados de voz necessários
            }),
            // Sweepers AGRESSIVOS para limpar caches frequentemente
            sweepers: {
                messages: {
                    interval: 1800, // A cada 30 minutos
                    lifetime: 900, // Mensagens com mais de 15 minutos
                },
                users: {
                    interval: 1800,
                    filter: () => user => user.bot && user.id !== client.user.id,
                },
                guildMembers: {
                    interval: 3600, // Limpar membros a cada 1 hora
                    filter: () => member => member.id !== client.user.id,
                },
                threads: {
                    interval: 3600,
                    lifetime: 14400, // Threads com mais de 4 horas
                }
            }
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

        // Registrar o cliente no servidor de ping para health checks
        setBotClient(client);

        // Iniciar o Health Monitor
        console.log('🔍 Iniciando Health Monitor...');
        try {
            const healthMonitor = new HealthMonitor(client);
            healthMonitor.start();
            console.log('🔍 Health Monitor iniciado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao iniciar Health Monitor:', error);
        }

        // Inicia o agendador de corridas públicas automáticas
        console.log('🏇 Tentando iniciar o serviço de corridas automáticas...');
        try {
            startAutoRaceScheduler(client);
            console.log('🏇 Serviço de corridas automáticas iniciado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao iniciar serviço de corridas:', error);
        }

        // Iniciar o serviço de clear automático
        console.log('🧹 Tentando iniciar o serviço de clear automático...');
        try {
            const autoClearService = new AutoClearService(client);
            // Opcional: definir canal de logs para notificações
            // autoClearService.setLogChannel('SEU_CANAL_ID_AQUI');
            autoClearService.start();
            console.log('🧹 Serviço de clear automático iniciado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao iniciar serviço de clear:', error);
        }

        // Registrar comandos slash após login (client.user.id disponível)
        await registerSlashCommands(client);
    } catch (error) {
        console.error('Erro ao iniciar o bot:', error);
        process.exit(1);
    }
}

// CRITICAL: Tratamento de erros de memória
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não tratado:', error);
    if (error.message && error.message.includes('heap')) {
        console.error('💥 ERRO DE MEMÓRIA DETECTADO! Reiniciando...');
        process.exit(1); // Render vai reiniciar automaticamente
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
});

// Monitorar uso de memória periodicamente - AGRESSIVO para Render
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
        
        // Limites REDUZIDOS para Render Free (512MB total)
        if (heapUsedMB > 350) {
            console.warn(`⚠️ MEMÓRIA CRÍTICA: ${heapUsedMB}MB/${heapTotalMB}MB`);
            if (global.gc) {
                console.log('🗑️ Forçando garbage collection...');
                global.gc();
            }
        } else if (heapUsedMB > 250) {
            // Garbage collection preventivo
            if (global.gc) {
                global.gc();
            }
        }
    }, 30000); // A cada 30 segundos (mais frequente)
}

startBot();
