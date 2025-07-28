// autoRaceService.js
// Serviço para corridas automáticas públicas de 2 em 2 horas
import { Client, EmbedBuilder } from 'discord.js';
import Horse from '../models/Horse.js';
import User from '../models/User.js';
import {
    trackOptions,
    weatherConditions,
    extremeWeatherEvents,
    weatherMessages,
    horsetypes
} from '../config/horseConfig.js';
import { isRaceEventNow, getNextRaceEventTime } from '../utils/raceEventUtils.js';

// IDs dos canais onde as corridas públicas serão anunciadas (suporte a múltiplos servidores)
const PUBLIC_RACE_CHANNEL_IDS = [
    '1395894836309135390', //Debug Server
];

class PublicHorseRace {
    constructor() {
        this.raceActive = false;
        this.lastRaceTime = 0;
        this.horseRacing = null;
    }

    async startRace(client) {
        if (this.raceActive) return;
        this.raceActive = true;
        this.lastRaceTime = Date.now();

        // --- Lógica de corrida pública ---
        // 1. Sorteia mapa e clima
        var trackIdx = Math.floor(Math.random() * trackOptions.length);
        var selectedTrack = trackOptions[trackIdx];
        var trackLength = selectedTrack.length;
        var totalFreq = weatherConditions.reduce((acc, w) => acc + w.frequency, 0);
        var weatherRoll = Math.random() * totalFreq;
        var acc = 0;
        var selectedWeather = weatherConditions[0];
        for (var w of weatherConditions) {
            acc += w.frequency;
            if (weatherRoll <= acc) {
                selectedWeather = w;
                break;
            }
        }
        // Mensagem de clima
        var weatherMsgArr = weatherMessages[selectedWeather.name] || [selectedWeather.description];
        var weatherMsg = weatherMsgArr[Math.floor(Math.random() * weatherMsgArr.length)];

        // Envia para todos os canais configurados
        for (var channelId of PUBLIC_RACE_CHANNEL_IDS) {
            var channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel) continue;
            await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🌍 Mapa & Clima Sorteados!')
                        .setDescription(`Mapa: **${selectedTrack.name}** (${trackLength} unidades)\n${selectedWeather.emoji} **${selectedWeather.name}**\n${weatherMsg}`)
                        .setColor(0x2ECC71)
                ]
            });
        }
        // ...restante lógica da corrida (apostas, etc) pode ser centralizada em um canal se preferir
    }
    }

const publicHorseRace = new PublicHorseRace();



let avisoMsgId = null;
let waitingForRace = false;
let lastScheduledHour = null;
function getNextScheduledHour(now = new Date()) {
    // Retorna o próximo horário plano de 6 em 6 horas (00:00, 06:00, 12:00, 18:00)
    const hours = [0, 6, 12, 18];
    const current = new Date(now);
    current.setSeconds(0, 0);
    let next = new Date(current);
    next.setMinutes(0, 0, 0);
    for (let h of hours) {
        if (current.getHours() < h || (current.getHours() === h && current.getMinutes() < 0)) {
            next.setHours(h, 0, 0, 0);
            return next;
        }
    }
    // Se passou de 18:00, vai para o próximo dia 00:00
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
}

export function startAutoRaceScheduler(client) {
    setInterval(async () => {
        const now = new Date();
        const nextHour = getNextScheduledHour(now);
        const msToNext = nextHour - now;
        // Se faltam menos de 2 minutos para o próximo horário plano, agenda o aviso e corrida
        if (!waitingForRace && msToNext <= 2 * 60 * 1000 && msToNext > 0) {
            waitingForRace = true;
            lastScheduledHour = nextHour.getTime();
            try {
                for (const channelId of PUBLIC_RACE_CHANNEL_IDS) {
                    const channel = await client.channels.fetch(channelId).catch(() => null);
                    if (channel) {
                        const avisoMsg = await channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('⏳ Corrida pública em breve!')
                                    .setDescription(`A corrida pública de cavalos começa às **${nextHour.getHours().toString().padStart(2, '0')}:00**! Prepare-se para apostar!`)
                                    .setColor(0xF1C40F)
                            ]
                        });
                        avisoMsgId = avisoMsg.id;
                    }
                }
            } catch (e) { /* ignore */ }
            setTimeout(async () => {
                try {
                    for (const channelId of PUBLIC_RACE_CHANNEL_IDS) {
                        const channel = await client.channels.fetch(channelId).catch(() => null);
                        if (avisoMsgId && channel) {
                            const msg = await channel.messages.fetch(avisoMsgId).catch(() => null);
                            if (msg) await msg.delete().catch(() => {});
                            avisoMsgId = null;
                        }
                    }
                } catch (e) { /* ignore */ }
                if (!publicHorseRace.raceActive) {
                    await publicHorseRace.startRace(client);
                }
                waitingForRace = false;
            }, msToNext);
        }
        // Se passou do horário e não iniciou, reseta o estado
        if (waitingForRace && lastScheduledHour && now.getTime() > lastScheduledHour + 2 * 60 * 1000) {
            waitingForRace = false;
            avisoMsgId = null;
        }
    }, 60 * 1000); // Checa a cada minuto
}
