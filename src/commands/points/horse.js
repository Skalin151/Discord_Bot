import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import User from '../../models/User.js';
import Horse from '../../models/Horse.js';
import {
    trackOptions,
    weatherConditions,
    extremeWeatherEvents,
    weatherMessages,
    horsetypes
} from '../../config/horseConfig.js';

class HorseRacingGame {
    constructor() {
        this.allHorses = [];
        this.horses = [];
        this.trackLength = 50;
        this.gamePhase = 'betting';
        this.bets = new Map();
        this.raceInterval = null;
        this.bettingTimeLimit = 20000;
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
    }

    async loadHorsesFromDB() {
        // Carrega todos os cavalos do MongoDB, se não existirem, cria-os
        let horses = await Horse.find();
        if (horses.length === 0) {
            // Inicializa os cavalos na base de dados com tipo e traits
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
            // Atualiza tipo e traits se não existirem
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
        // Seleciona 6 cavalos aleatórios da lista de 15
        if (!this.allHorses || this.allHorses.length === 0) {
            await this.loadHorsesFromDB();
        }
        this.horses = this.shuffleArray(this.allHorses).slice(0, 6).map(horse => ({ ...horse, position: 0, speed: 0 }));
        this.bets.clear();
        this.winner = null;
        this.raceResults = [];
        if (this.raceInterval) clearInterval(this.raceInterval);
    }

    // Função para embaralhar array
    shuffleArray(array) {
        const arr = array.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Aplica efeitos especiais do clima e registra eventos, usando traits e tipo
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
    generateOdds() {
        this.horses.forEach(horse => {
            const baseOdds = 2.0 + (Math.random() * 3.5);
            horse.odds = Math.round(baseOdds * 10) / 10;
        });
        // Odds especiais também arredondadas
        const favIdx = Math.floor(Math.random() * this.horses.length);
        const longIdx = Math.floor(Math.random() * this.horses.length);
        this.horses[favIdx].odds = Math.round((1.5 + Math.random() * 0.7) * 10) / 10;
        this.horses[longIdx].odds = Math.round((4.5 + Math.random() * 2.0) * 10) / 10;
        // Garante que todas odds estão arredondadas
        this.horses.forEach(horse => {
            horse.odds = Math.round(horse.odds * 10) / 10;
        });
    }
    async startNewRace() {
        await this.resetRace();
        this.gamePhase = 'betting';
        this.generateOdds();
        setTimeout(() => { this.startRacing(); }, this.bettingTimeLimit);
    }
    startRacing() {
        if (this.bets.size === 0) { this.gamePhase = 'betting'; return; }
        this.gamePhase = 'racing';
        this.raceFinished = false; // flag para garantir chamada única
        this.raceInterval = setInterval(() => {
            this.updateRacePositions();
            const finished = this.horses.filter(horse => horse.position >= this.trackLength);
            if (finished.length > 0 && !this.raceFinished) {
                this.raceFinished = true;
                this.finishRace();
            }
        }, 800);
    }
    updateRacePositions() {

        this.horses.forEach(horse => {
            const baseSpeed = 1 + Math.random() * 2;
            const luckFactor = Math.random() < 0.1 ? 2 : 1;
            const badLuck = Math.random() < 0.05 ? 0.3 : 1;
            let speed = baseSpeed * luckFactor * badLuck;
            // Aplica efeitos especiais do clima
            speed = this.applySpecialWeatherEffects(horse, speed);
            horse.speed = speed;
            horse.position += horse.speed;
            if (horse.position > this.trackLength) horse.position = this.trackLength;
        });

        // Trigger extreme weather event with low chance (e.g., 3%) at any moment during the race
        const now = Date.now();
        if ((now - this.lastExtremeEventTime > this.extremeEventCooldown) && Math.random() < 0.03) {
            this.lastExtremeEventTime = now;
            // Pick event by weighted frequency
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
            // Apply event effect
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
            } else if (event.effect === 'slow_random') {
                const idx = Math.floor(Math.random() * this.horses.length);
                this.horses[idx].speed *= 0.3;
                this.raceEvents.push(`${event.emoji} **${event.name}**: ${event.description} ${this.horses[idx].emoji} ${this.horses[idx].name} perde velocidade!`);
            } else if (event.effect === 'unstable_all') {
                this.horses.forEach(h => {
                    const mod = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 4 + 1);
                    h.position += mod;
                    if (h.position < 0) h.position = 0;
                    if (h.position > this.trackLength) h.position = this.trackLength;
                });
                this.raceEvents.push(`${event.emoji} **${event.name}**: ${event.description} Todos os cavalos sofrem efeitos aleatórios!`);
            } else if (event.effect === 'retreat_all') {
                this.horses.forEach(h => {
                    h.position -= 5;
                    if (h.position < 0) h.position = 0;
                });
                this.raceEvents.push(`${event.emoji} **${event.name}**: ${event.description} Todos os cavalos recuam!`);
            }
        }
    }
    async finishRace() {
        this.gamePhase = 'finished';
        if (this.raceInterval) clearInterval(this.raceInterval);
        this.raceResults = [...this.horses].sort((a, b) => b.position - a.position).map((horse, i) => ({ ...horse, placement: i + 1 }));
        this.winner = this.raceResults[0];
        await this.processWinnings();
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
        setTimeout(() => { this.startNewRace(); }, 10000);
    }
    processWinnings() {
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
        const embed = new EmbedBuilder().setTitle('🏇 CORRIDA DE CAVALOS').setColor(0x3498DB);
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
        // Mostrar pista durante/após corrida
        if (this.gamePhase === 'racing' || this.gamePhase === 'finished') {
            const track = this.createTrackVisualization();
            let trackValue = `\u007f\u007f\u007f\n${track}\u007f\u007f\u007f`;
            // Adiciona eventos abaixo da pista
            if (this.raceEvents.length > 0) {
                // Destaca eventos extremos
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
        embed.setFooter({ text: `Min: ${this.minBet} | Max: ${this.maxBet} pts` });
        return embed;
    }
    createGameButtons() {
        const components = [];
        if (this.gamePhase === 'betting') {
            const row1 = new ActionRowBuilder();
            for (let i = 0; i < 3; i++) {
                const horse = this.horses[i];
                if (horse) row1.addComponents(new ButtonBuilder().setCustomId(`horse_bet_${horse.id}`).setLabel(`${horse.emoji} ${horse.name}`).setStyle(ButtonStyle.Primary));
            }
            const row2 = new ActionRowBuilder();
            for (let i = 3; i < 6; i++) {
                const horse = this.horses[i];
                if (horse) row2.addComponents(new ButtonBuilder().setCustomId(`horse_bet_${horse.id}`).setLabel(`${horse.emoji} ${horse.name}`).setStyle(ButtonStyle.Primary));
            }
            components.push(row1, row2);
        }
        return components;
    }
}

const horseRacing = new HorseRacingGame();
horseRacing.startNewRace();

export default {
    name: 'horse',
    description: 'Joga na corrida de cavalos apostando pontos!',
    async execute(client, message) {
        // Seleção aleatória do mapa antes das apostas
        const randomIdx = Math.floor(Math.random() * horseRacing.trackOptions.length);
        horseRacing.selectedTrack = horseRacing.trackOptions[randomIdx];
        horseRacing.trackLength = horseRacing.selectedTrack.length;

        // Seleção aleatória da condição climática
        const totalFreq = horseRacing.weatherConditions.reduce((acc, w) => acc + w.frequency, 0);
        const weatherRoll = Math.random() * totalFreq;
        let acc = 0;
        let selectedWeather = horseRacing.weatherConditions[0];
        for (const w of horseRacing.weatherConditions) {
            acc += w.frequency;
            if (weatherRoll <= acc) {
                selectedWeather = w;
                break;
            }
        }
        horseRacing.currentWeather = selectedWeather;

        // Mensagens temáticas do clima
        const weatherMessages = {
            'Ensolarado': [
                "☀️ Que dia perfeito para corridas!",
                "☀️ O sol brilha sobre a pista!",
                "☀️ Condições ideais para os cavalos!"
            ],
            'Chuva': [
                "🌧️ A chuva está a dificultar a corrida!",
                "🌧️ Os cavalos resistentes estão a destacar-se!",
                "🌧️ Cuidado com a lama na pista!"
            ],
            'Vento Forte': [
                "🌪️ O vento está a baralhar tudo!",
                "🌪️ Rajadas fortes afetam os cavalos!",
                "🌪️ Os cavalos aerodinâmicos têm vantagem!"
            ],
            'Frio': [
                "❄️ Brrr! Os cavalos estão com frio!",
                "❄️ O frio torna o arranque mais difícil!",
                "❄️ Cavalos resistentes não se importam!"
            ],
            'Calor Extremo': [
                "🔥 Que calor! Os cavalos estão a suar!",
                "🔥 O calor está a cansar os velocistas!",
                "🔥 Cavalos resistentes aguentam melhor!"
            ]
        };
        const weatherMsgArr = weatherMessages[selectedWeather.name] || [selectedWeather.description];
        const weatherMsg = weatherMsgArr[Math.floor(Math.random() * weatherMsgArr.length)];

        await message.channel.send({
            embeds: [new EmbedBuilder()
                .setTitle('🌍 Mapa & Clima Sorteados!')
                .setDescription(`Mapa: **${horseRacing.selectedTrack.name}** (${horseRacing.trackLength} unidades)\n${selectedWeather.emoji} **${selectedWeather.name}**\n${weatherMsg}`)
                .setColor(0x2ECC71)]
        });

        // ...restante lógica igual...
        const embed = horseRacing.createGameEmbed();
        const buttons = horseRacing.createGameButtons();
        const sentMsg = await message.channel.send({ embeds: [embed], components: buttons });

        // Embed de timer
        let timeLeft = Math.floor(horseRacing.bettingTimeLimit / 1000);
        const timerEmbed = new EmbedBuilder()
            .setTitle('⏳ Tempo para apostas')
            .setColor(0xE67E22)
            .setDescription(`Faltam **${timeLeft}** segundos para fechar as apostas!`);
        const timerMsg = await message.channel.send({ embeds: [timerEmbed] });

        const { ComponentType } = await import('discord.js');
        const collector = sentMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: horseRacing.bettingTimeLimit });

        const timerInterval = setInterval(async () => {
            timeLeft--;
            if (timeLeft > 0) {
                await timerMsg.edit({ embeds: [timerEmbed.setDescription(`Faltam **${timeLeft}** segundos para fechar as apostas!`)] });
            } else {
                clearInterval(timerInterval);
                await timerMsg.delete().catch(() => {});
            }
        }, 1000);

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            if (interaction.customId.startsWith('horse_bet_')) {
                let horseId = parseInt(interaction.customId.split('_')[2]);
                let user = await User.findOne({ userId });
                if (!user) {
                    user = new User({ userId, points: 1000 });
                    await user.save();
                }
                await interaction.reply({ content: `🐎 Escolheste **${horseRacing.horses.find(h => h.id === horseId).name}**!\nQual o valor da tua aposta? (${horseRacing.minBet}-${horseRacing.maxBet} pontos)\nResponde com apenas o número.`, ephemeral: true });
                const filter = m => m.author.id === userId && !isNaN(m.content);
                const msgCollector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });
                msgCollector.on('collect', async m => {
                    const betAmount = parseInt(m.content);
                    if (user.points < betAmount) {
                        await m.reply(`❌ Não tens pontos suficientes! Tens ${user.points}, precisas de ${betAmount}.`);
                        return;
                    }
                    const result = horseRacing.placeBet(userId, horseId, betAmount);
                    if (result.success) {
                        user.points -= betAmount;
                        user.pointsSpent = (user.pointsSpent || 0) + betAmount;
                        await user.save();
                        await m.reply(`✅ Apostaste **${betAmount}** pontos no **${result.horse.name}** ${result.horse.emoji}!\nOdds: **${result.horse.odds}x** | Ganho potencial: **${Math.floor(betAmount * result.horse.odds)}** pontos! 🏇`);
                        setTimeout(() => { m.delete().catch(() => {}); }, 3000);
                    } else {
                        await m.reply(`❌ ${result.error}`);
                    }
                });
                msgCollector.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.followUp({ content: '⏰ Tempo esgotado para fazer a aposta!', ephemeral: true });
                    }
                });
            }
        });

        collector.on('end', async () => {
            // Quando o tempo de apostas acabar, começa a corrida
            horseRacing.startRacing();
            // Atualiza o embed para mostrar o estado da corrida e remove os botões
            await sentMsg.edit({ embeds: [horseRacing.createGameEmbed()], components: [] });

            // Se a corrida começou, atualiza o embed em tempo real
            if (horseRacing.gamePhase === 'racing') {
                const updateInterval = setInterval(async () => {
                    // Atualiza o embed com o estado atual da corrida
                    await sentMsg.edit({ embeds: [horseRacing.createGameEmbed()], components: [] });
                    // Se a corrida terminou, para o intervalo
                    if (horseRacing.gamePhase === 'finished') {
                        clearInterval(updateInterval);
                        // Mostra o resultado final
                        await sentMsg.edit({ embeds: [horseRacing.createGameEmbed()], components: [] });
                    }
                }, 1000);
            }
        });
    },
};
