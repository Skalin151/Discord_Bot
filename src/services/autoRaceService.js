// autoRaceService.js
// Serviço para corridas automáticas públicas de 2 em 2 horas
import { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import Horse from '../models/Horse.js';
import User from '../models/User.js';
import UserItem from '../models/UserItem.js';
import {
    trackOptions,
    weatherConditions,
    extremeWeatherEvents,
    weatherMessages,
    horsetypes
} from '../config/horseConfig.js';

// IDs dos canais onde as corridas públicas serão anunciadas (suporte a múltiplos servidores)
const PUBLIC_RACE_CHANNEL_IDS = [
    '1395894836309135390',//Debug Server
    '1302730634346631211', //Pengu's
];

class PublicHorseRace {
    constructor() {
        this.allHorses = [];
        this.horses = [];
        this.trackLength = 50;
        this.gamePhase = 'betting';
        this.bets = new Map();
        this.raceInterval = null;
        this.bettingTimeLimit = 120000; // 2 minutos para apostas públicas
        this.winner = null;
        this.raceResults = [];
        this.minBet = 100;
        this.maxBet = 1000;
        this.trackOptions = trackOptions;
        this.selectedTrack = this.trackOptions[1]; // default Medium Race
        this.raceEvents = [];
        this.weatherConditions = weatherConditions;
        this.extremeWeatherEvents = extremeWeatherEvents;
        this.horseTypes = horsetypes;
        this.weatherMessages = weatherMessages;
        this.lastExtremeEventTime = 0;
        this.extremeEventCooldown = 6000; // ms between possible events (6 seconds)
        this.raceActive = false;
        this.lastRaceTime = 0;
        this.currentWeather = null;
        this.sentMessage = null;
        this.timerMessage = null;
        this.currentChannel = null;
        this.allSentMessages = [];
        this.allTimerMessages = [];
        this.bettingPhaseEnded = false;
    }

    async loadHorsesFromDB() {
        let horses = await Horse.find();
        if (horses.length === 0) {
            const horseTypes = this.horseTypes;
            const horseList = [
                { horseId: 1, name: 'Thunder Bolt', emoji: '⚡', odds: 2.5, type: horseTypes[1].type, traits: horseTypes[1].traits },
                { horseId: 2, name: 'Earth Mover', emoji: '🪨', odds: 3.2, type: horseTypes[2].type, traits: horseTypes[2].traits },
                { horseId: 3, name: 'Fire Storm', emoji: '🔥', odds: 2.8, type: horseTypes[3].type, traits: horseTypes[3].traits },
                { horseId: 4, name: 'Wind Waker', emoji: '💨', odds: 4.1, type: horseTypes[4].type, traits: horseTypes[4].traits },
                { horseId: 5, name: 'Shadow Dash', emoji: '🌙', odds: 3.7, type: horseTypes[5].type, traits: horseTypes[5].traits },
                { horseId: 6, name: 'Golden Wind', emoji: '⭐', odds: 5.2, type: horseTypes[6].type, traits: horseTypes[6].traits },
                { horseId: 7, name: 'Silver Arrow', emoji: '🏹', odds: 3.9, type: horseTypes[7].type, traits: horseTypes[7].traits },
                { horseId: 8, name: 'Blizzard Mane', emoji: '❄️', odds: 4.5, type: horseTypes[8].type, traits: horseTypes[8].traits },
                { horseId: 9, name: 'Emerald Runner', emoji: '💚', odds: 4.8, type: horseTypes[9].type, traits: horseTypes[9].traits },
                { horseId: 10, name: 'Ruby Flash', emoji: '❤️', odds: 3.6, type: horseTypes[10].type, traits: horseTypes[10].traits },
                { horseId: 11, name: 'Sonic Boom', emoji: '💥', odds: 4.3, type: horseTypes[11].type, traits: horseTypes[11].traits },
                { horseId: 12, name: 'Ocean Wave', emoji: '🌊', odds: 3.4, type: horseTypes[12].type, traits: horseTypes[12].traits },
                { horseId: 13, name: 'Lightning Strike', emoji: '⚡️', odds: 4.9, type: horseTypes[13].type, traits: horseTypes[13].traits },
                { horseId: 14, name: 'Crystal Hoof', emoji: '🔮', odds: 5.0, type: horseTypes[14].type, traits: horseTypes[14].traits },
                { horseId: 15, name: 'Bronze Blaze', emoji: '🐤', odds: 3.8, type: horseTypes[15].type, traits: horseTypes[15].traits },
            ];
            await Horse.insertMany(horseList);
            horses = await Horse.find();
        } else {
            for (const h of horses) {
                const typeData = this.horseTypes[h.horseId];
                if (typeData && (!h.type || !h.traits)) {
                    h.type = typeData.type;
                    h.traits = typeData.traits;
                    await h.save();
                }
            }
        }
        this.allHorses = horses.map(h => ({
            id: h.horseId,
            name: h.name,
            emoji: h.emoji,
            odds: h.odds,
            wins: h.wins,
            races: h.races,
            type: h.type,
            traits: h.traits,
            position: 0,
            speed: 0
        }));
    }

    async resetRace() {
        if (!this.allHorses || this.allHorses.length === 0) {
            await this.loadHorsesFromDB();
        }
        const horsesPool = this.allHorses.map(h => ({ ...h }));
        this.horses = this.shuffleArray(horsesPool).slice(0, 6).map(horse => ({
            ...horse,
            position: 0,
            speed: 0
        }));
        this.bets.clear();
        this.winner = null;
        this.raceResults = [];
        this.raceEvents = [];
        if (this.raceInterval) clearInterval(this.raceInterval);
    }

    shuffleArray(array) {
        const arr = array.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    generateOdds() {
        this.horses.forEach(horse => {
            const baseOdds = 2.0 + (Math.random() * 3.5);
            horse.odds = Math.round(baseOdds * 10) / 10;
        });
        const favIdx = Math.floor(Math.random() * this.horses.length);
        const longIdx = Math.floor(Math.random() * this.horses.length);
        this.horses[favIdx].odds = Math.round((1.5 + Math.random() * 0.7) * 10) / 10;
        this.horses[longIdx].odds = Math.round((4.5 + Math.random() * 2.0) * 10) / 10;
        this.horses.forEach(horse => {
            horse.odds = Math.round(horse.odds * 10) / 10;
        });
    }

    applySpecialWeatherEffects(horse, speed) {
        const traitText = horse.traits && horse.traits.length ? horse.traits.join(', ') : '';
        switch (this.currentWeather?.name) {
            case 'Chuva':
                if (horse.type === 'resistente' && Math.random() < 0.18) {
                    this.raceEvents.push(`🌧️ ${horse.name} (${traitText}) atravessa a lama com força!`);
                    return speed * 1.4;
                }
                if (horse.type === 'velocista' && Math.random() < 0.12) {
                    this.raceEvents.push(`🌧️ ${horse.name} (${traitText}) escorregou na lama!`);
                    return speed * 0.5;
                }
                if (horse.type === 'aerodinâmico' && Math.random() < 0.10) {
                    this.raceEvents.push(`🌧️ ${horse.name} (${traitText}) perde tração na pista molhada!`);
                    return speed * 0.7;
                }
                break;
            case 'Frio':
                if (horse.type === 'resistente' && Math.random() < 0.15) {
                    this.raceEvents.push(`❄️ ${horse.name} (${traitText}) ignora o frio e acelera!`);
                    return speed * 1.3;
                }
                if (horse.type === 'velocista' && Math.random() < 0.12) {
                    this.raceEvents.push(`❄️ ${horse.name} (${traitText}) está travado pelo frio!`);
                    return speed * 0.5;
                }
                if (horse.type === 'elite' && Math.random() < 0.10) {
                    this.raceEvents.push(`❄️ ${horse.name} (${traitText}) usa equipamento especial e acelera!`);
                    return speed * 1.2;
                }
                break;
            case 'Vento Forte':
                if (horse.type === 'aerodinâmico' && Math.random() < 0.20) {
                    this.raceEvents.push(`🌪️ ${horse.name} (${traitText}) corta o vento com agilidade!`);
                    return speed * 1.6;
                }
                if (horse.type === 'resistente' && Math.random() < 0.10) {
                    this.raceEvents.push(`🌪️ ${horse.name} (${traitText}) resiste às rajadas!`);
                    return speed * 1.2;
                }
                if (horse.type === 'velocista' && Math.random() < 0.12) {
                    this.raceEvents.push(`🌪️ ${horse.name} (${traitText}) é travado pelo vento!`);
                    return speed * 0.6;
                }
                break;
            case 'Calor Extremo':
                if (horse.type === 'resistente' && Math.random() < 0.15) {
                    this.raceEvents.push(`🔥 ${horse.name} (${traitText}) aguenta o calor e acelera!`);
                    return speed * 1.3;
                }
                if (horse.type === 'velocista' && Math.random() < 0.12) {
                    this.raceEvents.push(`🔥 ${horse.name} (${traitText}) cansou com o calor!`);
                    return speed * 0.5;
                }
                if (horse.type === 'misterioso' && Math.random() < 0.10) {
                    this.raceEvents.push(`🔥 ${horse.name} (${traitText}) surpreende todos no calor!`);
                    return speed * 1.4;
                }
                break;
            case 'Ensolarado':
                if (horse.type === 'velocista' && Math.random() < 0.15) {
                    this.raceEvents.push(`☀️ ${horse.name} (${traitText}) aproveita o clima perfeito!`);
                    return speed * 1.3;
                }
                if (horse.type === 'elite' && Math.random() < 0.10) {
                    this.raceEvents.push(`☀️ ${horse.name} (${traitText}) mostra toda sua classe!`);
                    return speed * 1.2;
                }
                if (horse.type === 'misterioso' && Math.random() < 0.08) {
                    this.raceEvents.push(`☀️ ${horse.name} (${traitText}) faz algo inesperado!`);
                    return speed * (1 + Math.random());
                }
                break;
        }
        return speed;
    }

    updateRacePositions() {
        this.horses.forEach(horse => {
            const baseSpeed = 1 + Math.random() * 2;
            const luckFactor = Math.random() < 0.1 ? 2 : 1;
            const badLuck = Math.random() < 0.05 ? 0.3 : 1;
            let speed = baseSpeed * luckFactor * badLuck;
            speed = this.applySpecialWeatherEffects(horse, speed);
            horse.speed = speed;
            horse.position += horse.speed;
            if (horse.position > this.trackLength) horse.position = this.trackLength;
        });

        const now = Date.now();
        if ((now - this.lastExtremeEventTime > this.extremeEventCooldown) && Math.random() < 0.03) {
            this.lastExtremeEventTime = now;
            const totalFreq = this.extremeWeatherEvents.reduce((acc, e) => acc + e.frequency, 0);
            let roll = Math.random() * totalFreq;
            let acc = 0;
            let event = this.extremeWeatherEvents[0];
            for (const e of this.extremeWeatherEvents) {
                acc += e.frequency;
                if (roll <= acc) {
                    event = e;
                    break;
                }
            }
            if (event.effect === 'shuffle') {
                const positions = this.horses.map(h => h.position);
                this.horses = this.shuffleArray(this.horses);
                this.horses.forEach((h, i) => {
                    h.position = positions[i];
                });
                this.raceEvents.push(`${event.emoji} **${event.name}**: ${event.description}\n${event.emoji.repeat(3)} **Os cavalos trocam de lugar na pista!** ${event.emoji.repeat(3)}`);
            } else if (event.effect === 'boost_random') {
                const idx = Math.floor(Math.random() * this.horses.length);
                this.horses[idx].position += 10;
                this.raceEvents.push(`${event.emoji} **${event.name}**: ${event.description} ${this.horses[idx].emoji} ${this.horses[idx].name} avança rapidamente!`);
            } else if (event.effect === 'everyone_wins') {
                this.horses.forEach(h => h.position += 5);
                this.raceEvents.push(`${event.emoji} **${event.name}**: ${event.description} Todos os cavalos avançam!`);
            } else if (event.effect === 'slow_all') {
                this.horses.forEach(h => {
                    h.speed *= 0.5;
                });
                this.raceEvents.push(`${event.emoji} **${event.name}**: ${event.description} Todos os cavalos ficam mais lentos!`);
            }
        }
    }

    createTrackVisualization() {
        let track = '';
        this.horses.forEach(horse => {
            const progress = Math.floor((horse.position / this.trackLength) * 15);
            const trackLine = '═'.repeat(15);
            const position = Math.max(0, Math.min(15, progress));
            let visualTrack = trackLine.split('');
            if (position < 15) visualTrack[position] = horse.emoji;
            else visualTrack[14] = horse.emoji;
            const finishFlag = horse.position >= this.trackLength ? '🏁' : '🏁';
            track += `${visualTrack.join('')}${finishFlag}\n`;
        });
        return track;
    }

    createGameEmbed() {
        const embed = new EmbedBuilder().setTitle('🏇 CORRIDA PÚBLICA DE CAVALOS').setColor(0x3498DB);
        let description = '';
        switch (this.gamePhase) {
            case 'betting': description = '💰 **APOSTAS ABERTAS!** Escolhe o teu cavalo e aposta!'; break;
            case 'racing': description = '🏁 **A CORRIDA COMEÇOU!**'; break;
            case 'finished': description = `🏆 **CORRIDA TERMINADA!**\n🥇 Vencedor: **${this.winner.name}** ${this.winner.emoji}`; break;
            default: description = '⏳ Preparando próxima corrida...';
        }
        embed.setDescription(description);
        let horsesText = '';
        this.horses.forEach(horse => {
            const bettors = Array.from(this.bets.values()).filter(bet => bet.horseId === horse.id).length;
            horsesText += `${horse.emoji} **${horse.name}** - ${(Math.round(horse.odds * 10) / 10).toFixed(1)}x ${bettors > 0 ? `(${bettors} apostas)` : ''}\n`;
        });
        embed.addFields({ name: '🐎 Cavalos & Odds', value: horsesText, inline: false });
        
        if (this.gamePhase === 'racing' || this.gamePhase === 'finished') {
            const track = this.createTrackVisualization();
            let trackValue = `\u007f\u007f\u007f\n${track}\u007f\u007f\u007f`;
            if (this.raceEvents.length > 0) {
                const recentEvents = this.raceEvents.slice(-3).map(e => {
                    if (e.includes('🌪️') || e.includes('⚡') || e.includes('🌈') || e.includes('🔥') || e.includes('❄️') || e.includes('💧') || e.includes('🌫️') || e.includes('🧊') || e.includes('🌋')) {
                        return `**━━━━━━━━━━━━━━**\n**${e}**\n**━━━━━━━━━━━━━━**`;
                    }
                    return `• ${e}`;
                }).join('\n');
                trackValue += `\n\n__Eventos Recentes:__\n${recentEvents}`;
            }
            embed.addFields({ name: '🏁 Pista de Corrida', value: trackValue, inline: false });
        }
        
        if (this.gamePhase === 'finished' && this.bets.size > 0) {
            let resultsText = '';
            for (let [userId, bet] of this.bets) {
                const username = `<@${userId}>`;
                const result = bet.result === 'won' ? `✅ +${bet.profit} pts` : `❌ -${bet.amount} pts`;
                resultsText += `${username}: ${bet.horse.name} ${result}\n`;
            }
            embed.addFields({ name: `💰 Resultados (${this.bets.size} apostas)`, value: resultsText, inline: false });
        }
        embed.setFooter({ text: `Min: ${this.minBet} | Max: ${this.maxBet} pts | Corrida Pública` });
        return embed;
    }

    createGameButtons() {
        const components = [];
        if (this.gamePhase === 'betting') {
            const row1 = new ActionRowBuilder();
            for (let i = 0; i < 3; i++) {
                const horse = this.horses[i];
                if (horse) row1.addComponents(new ButtonBuilder().setCustomId(`public_horse_bet_${horse.id}`).setLabel(`${horse.emoji} ${horse.name}`).setStyle(ButtonStyle.Primary));
            }
            const row2 = new ActionRowBuilder();
            for (let i = 3; i < 6; i++) {
                const horse = this.horses[i];
                if (horse) row2.addComponents(new ButtonBuilder().setCustomId(`public_horse_bet_${horse.id}`).setLabel(`${horse.emoji} ${horse.name}`).setStyle(ButtonStyle.Primary));
            }
            components.push(row1, row2);
        }
        return components;
    }

    placeBet(userId, horseId, amount) {
        if (this.gamePhase !== 'betting') return { success: false, error: 'Não podes apostar agora! Aguarda a próxima corrida.' };
        if (amount < this.minBet || amount > this.maxBet) return { success: false, error: `Aposta deve ser entre ${this.minBet} e ${this.maxBet} pontos!` };
        const horse = this.horses.find(h => h.id === horseId);
        if (!horse) return { success: false, error: 'Cavalo inválido!' };
        if (this.bets.has(userId)) return { success: false, error: 'Já apostaste nesta corrida!' };
        this.bets.set(userId, { horseId, amount, horse, winnings: 0, profit: 0, result: null });
        return { success: true, horse };
    }

    startRacing() {
        // Para corridas públicas automáticas, permite corrida mesmo sem apostas
        if (this.bets.size === 0) { 
            console.log('🏇 Iniciando corrida pública sem apostas - apenas demonstração');
        }
        this.gamePhase = 'racing';
        this.raceFinished = false;
        this.raceInterval = setInterval(() => {
            this.updateRacePositions();
            const finished = this.horses.filter(horse => horse.position >= this.trackLength);
            if (finished.length > 0 && !this.raceFinished) {
                this.raceFinished = true;
                this.finishRace();
            }
        }, 800);
    }

    async finishRace() {
        console.log('🏇 Corrida finalizada!');
        this.gamePhase = 'finished';
        if (this.raceInterval) clearInterval(this.raceInterval);
        this.raceResults = [...this.horses].sort((a, b) => b.position - a.position).map((horse, i) => ({ ...horse, placement: i + 1 }));
        this.winner = this.raceResults[0];
        
        console.log(`🏆 Vencedor: ${this.winner.name} ${this.winner.emoji}`);
        
        // Só processa ganhos se houver apostas
        if (this.bets.size > 0) {
            await this.processWinnings();
            console.log(`💰 Processados ganhos para ${this.bets.size} apostas`);
        } else {
            console.log('💰 Nenhuma aposta para processar');
        }
        
        // Atualiza estatísticas dos cavalos no MongoDB
        for (const horse of this.horses) {
            const horseDoc = await Horse.findOne({ horseId: horse.id });
            if (horseDoc) {
                horseDoc.races += 1;
                if (horse.id === this.winner.id) horseDoc.wins += 1;
                horseDoc.odds = horse.odds;
                await horseDoc.save();
            }
        }

        // Credita pontos aos vencedores apenas se houver apostas
        if (this.bets.size > 0) {
            for (let [userId, bet] of this.bets) {
                if (bet.winnings > 0) {
                    let user = await User.findOne({ userId });
                    if (user) {
                        user.points += bet.winnings;
                        await user.save();
                        console.log(`💰 ${user.username || userId} ganhou ${bet.winnings} pontos`);
                    }
                }
            }
        }
        
        this.raceActive = false;
        console.log('🏇 Corrida marcada como inativa');
        
        // Aguarda 15 segundos para mostrar resultado final antes de resetar
        setTimeout(() => {
            this.resetForNextRace();
            console.log('🏇 Estado resetado para próxima corrida');
        }, 15000);
    }

    resetForNextRace() {
        this.gamePhase = 'betting';
        this.sentMessage = null;
        this.timerMessage = null;
        this.currentChannel = null;
        this.allSentMessages = [];
        this.allTimerMessages = [];
        this.bettingPhaseEnded = false;
    }

    // Lógica de apostas e distribuição de prêmios para corridas públicas
    async processWinnings() {
        for (let [userId, bet] of this.bets) {
            const horse = this.horses.find(h => h.id === bet.horseId);
            bet.horse = horse;
            if (horse.id === this.winner.id) {
                bet.winnings = Math.floor(bet.amount * horse.odds);
                bet.profit = bet.winnings - bet.amount;
                bet.result = 'won';
            } else {
                bet.winnings = 0;
                bet.profit = -bet.amount;
                bet.result = 'lost';
            }
        }
        // Adiciona bônus de 20% nos ganhos do cartão vip (id 6)
        for (let [userId, bet] of this.bets) {
            const hasVip = await UserItem.findOne({ userId, itemId: 6, equipado: true });
            if (hasVip && bet.winnings > 0) {
                bet.winnings = Math.floor(bet.winnings * 1.2);
                bet.profit = bet.winnings - bet.amount;
            }
        }
    }

    async startRace(client) {
        if (this.raceActive) return;
        this.raceActive = true;
        this.lastRaceTime = Date.now();

        // Reset race state
        await this.resetRace();
        this.gamePhase = 'betting';
        this.bettingPhaseEnded = false; // Nova flag para controlar o fim das apostas

        // Sorteia mapa e clima
        const trackIdx = Math.floor(Math.random() * trackOptions.length);
        this.selectedTrack = trackOptions[trackIdx];
        this.trackLength = this.selectedTrack.length;
        
        const totalFreq = weatherConditions.reduce((acc, w) => acc + w.frequency, 0);
        const weatherRoll = Math.random() * totalFreq;
        let acc = 0;
        this.currentWeather = weatherConditions[0];
        for (const w of weatherConditions) {
            acc += w.frequency;
            if (weatherRoll <= acc) {
                this.currentWeather = w;
                break;
            }
        }
        
        const weatherMsgArr = weatherMessages[this.currentWeather.name] || [this.currentWeather.description];
        const weatherMsg = weatherMsgArr[Math.floor(Math.random() * weatherMsgArr.length)];

        this.generateOdds();
        
        // Array para armazenar todas as mensagens enviadas
        this.allSentMessages = [];
        this.allTimerMessages = [];

        // Envia para todos os canais configurados
        for (const channelId of PUBLIC_RACE_CHANNEL_IDS) {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel) continue;
            
            this.currentChannel = channel;

            // Envia mapa e clima
            await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🌍 Mapa & Clima Sorteados!')
                        .setDescription(`Mapa: **${this.selectedTrack.name}** (${this.trackLength} unidades)\n${this.currentWeather.emoji} **${this.currentWeather.name}**\n${weatherMsg}`)
                        .setColor(0x2ECC71)
                ]
            });

            // Envia embed principal da corrida
            const embed = this.createGameEmbed();
            const buttons = this.createGameButtons();
            const sentMessage = await channel.send({ embeds: [embed], components: buttons });
            this.allSentMessages.push(sentMessage);

            // Timer de apostas
            let timeLeft = Math.floor(this.bettingTimeLimit / 1000);
            const timerEmbed = new EmbedBuilder()
                .setTitle('⏳ Tempo para apostas públicas')
                .setColor(0xE67E22)
                .setDescription(`Faltam **${timeLeft}** segundos para fechar as apostas!`);
            const timerMessage = await channel.send({ embeds: [timerEmbed] });
            this.allTimerMessages.push(timerMessage);

            // Configura collector para apostas
            const { ComponentType } = await import('discord.js');
            const collector = sentMessage.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: this.bettingTimeLimit 
            });

            // Timer compartilhado apenas para o primeiro canal (evita múltiplos timers)
            if (this.allTimerMessages.length === 1) {
                const timerInterval = setInterval(async () => {
                    timeLeft--;
                    if (timeLeft > 0) {
                        // Atualiza todos os timers
                        for (const timer of this.allTimerMessages) {
                            await timer.edit({ 
                                embeds: [timerEmbed.setDescription(`Faltam **${timeLeft}** segundos para fechar as apostas!`)] 
                            }).catch(() => {});
                        }
                    } else {
                        clearInterval(timerInterval);
                        // Remove todos os timers
                        for (const timer of this.allTimerMessages) {
                            await timer.delete().catch(() => {});
                        }
                        this.allTimerMessages = [];
                    }
                }, 1000);
            }

            collector.on('collect', async interaction => {
                const userId = interaction.user.id;
                if (interaction.customId.startsWith('public_horse_bet_')) {
                    const horseId = parseInt(interaction.customId.split('_')[3]);
                    let user = await User.findOne({ userId });
                    if (!user) {
                        user = new User({ userId, points: 1000 });
                        await user.save();
                    }
                    const selectedHorse = this.horses.find(h => h.id === horseId);
                    if (!selectedHorse) {
                        await interaction.reply({ content: '❌ Cavalo inválido ou não encontrado nesta corrida.', flags: MessageFlags.Ephemeral });
                        return;
                    }
                    await interaction.reply({ 
                        content: `🐎 Escolheste **${selectedHorse.name}**!\nQual o valor da tua aposta? (${this.minBet}-${this.maxBet} pontos)\nResponde com apenas o número.`, 
                        flags: MessageFlags.Ephemeral 
                    });
                    const filter = m => m.author.id === userId && !isNaN(m.content);
                    const msgCollector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });
                    msgCollector.on('collect', async m => {
                        const betAmount = parseInt(m.content);
                        if (user.points < betAmount) {
                            await interaction.followUp({ 
                                content: `❌ Não tens pontos suficientes! Tens ${user.points}, precisas de ${betAmount}.`, 
                                flags: MessageFlags.Ephemeral 
                            });
                            await m.delete().catch(() => {});
                            return;
                        }
                        const result = this.placeBet(userId, horseId, betAmount);
                        if (result.success) {
                            user.points -= betAmount;
                            user.pointsSpent = (user.pointsSpent || 0) + betAmount;
                            await user.save();
                            await interaction.followUp({ 
                                content: `✅ Apostaste **${betAmount}** pontos no **${result.horse.name}** ${result.horse.emoji}!\nOdds: **${result.horse.odds}x** | Ganho potencial: **${Math.floor(betAmount * result.horse.odds)}** pontos! 🏇`, 
                                flags: MessageFlags.Ephemeral 
                            });
                            setTimeout(() => { m.delete().catch(() => {}); }, 3000);
                        } else {
                            await interaction.followUp({ content: `❌ ${result.error}`, flags: MessageFlags.Ephemeral });
                            await m.delete().catch(() => {});
                        }
                    });
                    msgCollector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: '⏰ Tempo esgotado para fazer a aposta!', flags: MessageFlags.Ephemeral });
                        }
                    });
                }
            });

            collector.on('end', async () => {
                // Só processa o fim das apostas uma vez, mesmo com múltiplos collectors
                if (this.bettingPhaseEnded) return;
                this.bettingPhaseEnded = true;
                
                console.log(`🏇 Tempo de apostas terminou! Total de apostas: ${this.bets.size}`);
                
                // Quando o tempo de apostas acabar, começa a corrida
                this.startRacing();
                
                console.log(`🏇 Estado da corrida após startRacing: ${this.gamePhase}`);
                
                // Atualiza todas as mensagens para mostrar o estado da corrida e remove os botões
                for (const message of this.allSentMessages) {
                    await message.edit({ embeds: [this.createGameEmbed()], components: [] }).catch(() => {});
                }
                console.log('🏇 Embeds atualizados após iniciar corrida');

                // Se a corrida começou, atualiza os embeds em tempo real
                if (this.gamePhase === 'racing') {
                    console.log('🏇 Iniciando atualizações em tempo real da corrida');
                    const updateInterval = setInterval(async () => {
                        // Verifica se a corrida ainda está ativa antes de atualizar
                        if (this.gamePhase === 'racing' || this.gamePhase === 'finished') {
                            // Atualiza todos os embeds com o estado atual da corrida
                            const currentEmbed = this.createGameEmbed();
                            for (const message of this.allSentMessages) {
                                await message.edit({ embeds: [currentEmbed], components: [] }).catch(() => {});
                            }
                        }
                        
                        // Se a corrida terminou, para o intervalo após mostrar resultado final
                        if (this.gamePhase === 'finished') {
                            setTimeout(() => {
                                clearInterval(updateInterval);
                                console.log('🏇 Atualizações em tempo real finalizadas');
                                // Mostra o resultado final por mais alguns segundos
                                setTimeout(async () => {
                                    const finalEmbed = this.createGameEmbed();
                                    for (const message of this.allSentMessages) {
                                        await message.edit({ embeds: [finalEmbed], components: [] }).catch(() => {});
                                    }
                                    console.log('🏇 Embeds finais atualizados com resultados');
                                }, 5000);
                            }, 10000); // Aguarda 10 segundos antes de parar as atualizações
                        }
                        
                        // Se o estado foi resetado para betting, para o intervalo
                        if (this.gamePhase === 'betting' && !this.raceActive) {
                            clearInterval(updateInterval);
                            console.log('🏇 Atualizações finalizadas - corrida resetada');
                        }
                    }, 1000);
                } else {
                    console.log(`⚠️ Corrida não iniciou! Estado atual: ${this.gamePhase}`);
                }
            });
        }
    }
}

const publicHorseRace = new PublicHorseRace();



let avisoMsgId = null;
let waitingForRace = false;
let lastScheduledHour = null;

// Configuração do modo de operação
const testMode = false; // Altere para true para modo teste (10 minutos) ou false para produção (4 horas)

// Função para obter a data/hora atual em UTC
function getUTCDate(baseDate = new Date()) {
    return new Date(baseDate.getTime());
}

function getNextScheduledHour(now = new Date()) {
    // MODO TESTE: Corridas a cada 10 minutos para teste rápido
    // Para produção, use: const hours = [0, 4, 8, 12, 16, 20];
    
    if (testMode) {
        // Teste: encontra o próximo minuto que é múltiplo de 10
        const current = new Date(now.getTime());
        const minutes = current.getMinutes();
        const nextInterval = Math.ceil(minutes / 10) * 10;
        
        if (nextInterval >= 60) {
            // Vai para a próxima hora
            current.setHours(current.getHours() + 1);
            current.setMinutes(0, 0, 0);
        } else {
            current.setMinutes(nextInterval, 0, 0);
        }
        
        return current;
    }
    
    // Produção: Retorna o próximo horário plano de 4 em 4 horas (00:00, 04:00, 08:00, 12:00, 16:00, 20:00) em UTC
    const hours = [0, 4, 8, 12, 16, 20];
    const utcNow = new Date(now.getTime());
    utcNow.setSeconds(0, 0);
    let next = new Date(utcNow);
    next.setMinutes(0, 0, 0);
    
    for (let h of hours) {
        if (utcNow.getUTCHours() < h || (utcNow.getUTCHours() === h && utcNow.getUTCMinutes() < 0)) {
            next.setUTCHours(h, 0, 0, 0);
            return next;
        }
    }
    // Se passou de 20:00, vai para o próximo dia 00:00
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(0, 0, 0, 0);
    return next;
}

export function startAutoRaceScheduler(client) {
    console.log('🏇 [ENTRADA] startAutoRaceScheduler chamada!');
    
    // Determina o texto do modo baseado na configuração
    const modeText = testMode ? 'MODO TESTE: Corridas a cada 10 minutos' : 'MODO PRODUÇÃO: Corridas a cada 4 horas';
    console.log(`🏇 Serviço de corridas automáticas iniciado! ${modeText}`);
    
    console.log('🏇 [TESTE] Criando setInterval...');
    const intervalId = setInterval(async () => {
        console.log('🏇 [INTERVAL] Verificação de corrida executando...');
        const now = new Date();
        const nextHour = getNextScheduledHour(now);
        const msToNext = nextHour - now;
        
        // Log de debugging
        console.log(`🔍 [DEBUG] Agora: ${now.toLocaleTimeString('pt-PT')} | Próxima: ${nextHour.toLocaleTimeString('pt-PT')} | Faltam: ${Math.round(msToNext / 1000)}s | Esperando: ${waitingForRace}`);
        
        // Tempo de aviso baseado no modo: 2 minutos para teste, 10 minutos para produção
        const warningTime = testMode ? 2 * 60 * 1000 : 10 * 60 * 1000;
        
        if (!waitingForRace && msToNext <= warningTime && msToNext > 0) {
            waitingForRace = true;
            lastScheduledHour = nextHour.getTime();
            
            console.log(`🏇 Corrida agendada para ${nextHour.toISOString()} (em ${Math.round(msToNext / 1000)} segundos) - ${testMode ? 'MODO TESTE' : 'PRODUÇÃO'}`);
            
            try {
                for (const channelId of PUBLIC_RACE_CHANNEL_IDS) {
                    const channel = await client.channels.fetch(channelId).catch(() => null);
                    if (channel) {
                        const embedTitle = testMode ? '⏳ Corrida pública em breve! (TESTE)' : '⏳ Corrida pública em breve!';
                        const embedDescription = testMode 
                            ? `A corrida pública de cavalos começa em **${Math.round(msToNext / 1000)}** segundos! Prepare-se para apostar!\n\n⚠️ **MODO TESTE** - Corridas a cada 10 minutos`
                            : `A corrida pública de cavalos começa em **${Math.round(msToNext / 1000)}** segundos! Prepare-se para apostar!`;
                        const embedFooter = testMode ? 'Teste do sistema de corridas automáticas' : 'Sistema de corridas automáticas';
                        
                        const avisoMsg = await channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(embedTitle)
                                    .setDescription(embedDescription)
                                    .setColor(0xF1C40F)
                                    .setFooter({ text: embedFooter })
                            ]
                        });
                        avisoMsgId = avisoMsg.id;
                    }
                }
            } catch (e) { 
                console.error('Erro ao enviar aviso de corrida:', e);
            }
            
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
                } catch (e) { 
                    console.error('Erro ao limpar aviso de corrida:', e);
                }
                
                if (!publicHorseRace.raceActive) {
                    console.log('🏇 Iniciando corrida pública automática...');
                    await publicHorseRace.startRace(client);
                } else {
                    console.log('🏇 Corrida já está ativa, pulando...');
                }
                waitingForRace = false;
            }, msToNext);
        }
        
        // Se passou do horário e não iniciou, reseta o estado
        if (waitingForRace && lastScheduledHour && now.getTime() > lastScheduledHour + warningTime) {
            console.log('🏇 Reset do estado de espera - horário passou');
            waitingForRace = false;
            avisoMsgId = null;
        }
    }, testMode ? 30 * 1000 : 60 * 1000); // 30s para teste, 60s para produção
    
    console.log(`🏇 [SUCESSO] setInterval criado com ID: ${intervalId}`);
}
