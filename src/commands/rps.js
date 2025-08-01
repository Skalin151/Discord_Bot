import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

const activeGames = new Map();

const choices = {
    'rock': { emoji: '🪨', beats: 'scissors' },
    'paper': { emoji: '📄', beats: 'rock' },
    'scissors': { emoji: '✂️', beats: 'paper' }
};

class RPSGame {
    constructor(player1, player2, bestOf = 1) {
        this.player1 = player1;
        this.player2 = player2;
        this.bestOf = bestOf;
        this.player1Choice = null;
        this.player2Choice = null;
        this.player1Score = 0;
        this.player2Score = 0;
        this.currentRound = 1;
        this.gameOver = false;
        this.bothChosen = false;
    }

    makeChoice(userId, choice) {
        if (userId === this.player1.id) {
            this.player1Choice = choice;
        } else if (userId === this.player2.id) {
            this.player2Choice = choice;
        }
        
        this.bothChosen = this.player1Choice && this.player2Choice;
        return this.bothChosen;
    }

    getRoundWinner() {
        if (!this.bothChosen) return null;
        
        if (this.player1Choice === this.player2Choice) return 'tie';
        
        if (choices[this.player1Choice].beats === this.player2Choice) {
            this.player1Score++;
            return this.player1;
        } else {
            this.player2Score++;
            return this.player2;
        }
    }

    isGameOver() {
        const needed = Math.ceil(this.bestOf / 2);
        return this.player1Score >= needed || this.player2Score >= needed;
    }

    getGameWinner() {
        if (this.player1Score > this.player2Score) return this.player1;
        if (this.player2Score > this.player1Score) return this.player2;
        return 'tie';
    }

    nextRound() {
        this.player1Choice = null;
        this.player2Choice = null;
        this.bothChosen = false;
        this.currentRound++;
    }

    createGameEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('🪨📄✂️ Rock Paper Scissors')
            .setColor('#3498DB');

        if (this.bestOf > 1) {
            embed.setDescription(`**Melhor de ${this.bestOf}** - Ronda ${this.currentRound}\n\n${this.player1.displayName}: ${this.player1Score} | ${this.player2.displayName}: ${this.player2Score}`);
        } else {
            embed.setDescription(`${this.player1.displayName} vs ${this.player2.displayName}`);
        }

        if (this.bothChosen) {
            const winner = this.getRoundWinner();
            let resultText = `${this.player1.displayName}: ${choices[this.player1Choice].emoji} ${this.player1Choice.toUpperCase()}\n`;
            resultText += `${this.player2.displayName}: ${choices[this.player2Choice].emoji} ${this.player2Choice.toUpperCase()}\n\n`;
            
            if (winner === 'tie') {
                resultText += '🤝 **EMPATE!**';
            } else {
                resultText += `🏆 **${winner.displayName} ganha esta ronda!**`;
            }

            if (this.isGameOver()) {
                const gameWinner = this.getGameWinner();
                if (gameWinner === 'tie') {
                    resultText += '\n\n🎭 **JOGO TERMINOU EM EMPATE!**';
                } else {
                    resultText += `\n\n🎉 **${gameWinner.displayName} VENCE O JOGO!**`;
                }
                this.gameOver = true;
            }

            embed.addFields({ name: 'Resultado', value: resultText, inline: false });
        } else {
            const status1 = this.player1Choice ? '✅' : '⏳';
            const status2 = this.player2Choice ? '✅' : '⏳';
            embed.addFields({ 
                name: 'Estado das Escolhas', 
                value: `${status1} ${this.player1.displayName}\n${status2} ${this.player2.displayName}`, 
                inline: false 
            });
        }

        return embed;
    }

    createButtons() {
        const row = new ActionRowBuilder();
        
        if (this.gameOver) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('rps_new')
                    .setLabel('🔄 Novo Jogo')
                    .setStyle(ButtonStyle.Success)
            );
        } else if (this.bothChosen) {
            if (this.isGameOver()) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('rps_new')
                        .setLabel('🔄 Novo Jogo')
                        .setStyle(ButtonStyle.Success)
                );
            } else {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('rps_next')
                        .setLabel('➡️ Próxima Ronda')
                        .setStyle(ButtonStyle.Primary)
                );
            }
        } else {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('rps_rock')
                    .setLabel('🪨 Rock')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('rps_paper')
                    .setLabel('📄 Paper')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('rps_scissors')
                    .setLabel('✂️ Scissors')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        return row;
    }
}

export default {
    name: 'rps',
    description: 'Joga Rock Paper Scissors com outro jogador. Uso: %rps @user ou %rps3 @user (melhor de 3)',
    async execute(client, message, args) {
        // Detectar número no comando (ex: rps3, rps5)
        const commandName = message.content.split(' ')[0].substring(1); // Remove %
        const match = commandName.match(/^rps(\d+)?$/);
        if (!match) return;
        
        const bestOf = match[1] ? parseInt(match[1]) : 1;
        if (bestOf < 1 || bestOf > 9 || bestOf % 2 === 0) {
            return message.reply('❌ Use apenas números ímpares de 1 a 9 (ex: %rps3, %rps5)');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Menciona um utilizador para desafiar! Ex: %rps @user');
        }

        if (targetUser.id === message.author.id) {
            return message.reply('❌ Não podes jogar contra ti mesmo!');
        }

        if (targetUser.bot) {
            return message.reply('❌ Não podes desafiar bots!');
        }

        if (activeGames.has(message.author.id) || activeGames.has(targetUser.id)) {
            return message.reply('❌ Um dos jogadores já está numa partida!');
        }

        const game = new RPSGame(message.author, targetUser, bestOf);
        const gameId = `${message.author.id}_${targetUser.id}`;
        activeGames.set(message.author.id, gameId);
        activeGames.set(targetUser.id, gameId);

        const embed = game.createGameEmbed();
        const buttons = game.createButtons();

        const gameMessage = await message.reply({ 
            content: `${targetUser}, foste desafiado para Rock Paper Scissors!`,
            embeds: [embed], 
            components: [buttons] 
        });

        const { ComponentType } = await import('discord.js');
        const collector = gameMessage.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 300000 // 5 minutos
        });

        collector.on('collect', async interaction => {
            if (![game.player1.id, game.player2.id].includes(interaction.user.id)) {
                await interaction.reply({ content: 'Apenas os jogadores podem jogar!', flags: MessageFlags.Ephemeral });
                return;
            }

            if (interaction.customId === 'rps_new') {
                // Reiniciar jogo
                game.player1Score = 0;
                game.player2Score = 0;
                game.currentRound = 1;
                game.gameOver = false;
                game.nextRound();
            } else if (interaction.customId === 'rps_next') {
                game.nextRound();
            } else if (interaction.customId.startsWith('rps_')) {
                const choice = interaction.customId.replace('rps_', '');
                if (!choices[choice]) return;

                if ((interaction.user.id === game.player1.id && game.player1Choice) ||
                    (interaction.user.id === game.player2.id && game.player2Choice)) {
                    await interaction.reply({ content: 'Já fizeste a tua escolha!', flags: MessageFlags.Ephemeral });
                    return;
                }

                game.makeChoice(interaction.user.id, choice);
            }

            const newEmbed = game.createGameEmbed();
            const newButtons = game.createButtons();

            await interaction.update({ embeds: [newEmbed], components: [newButtons] });

            if (game.gameOver) {
                activeGames.delete(game.player1.id);
                activeGames.delete(game.player2.id);
                collector.stop();
            }
        });

        collector.on('end', () => {
            activeGames.delete(game.player1.id);
            activeGames.delete(game.player2.id);
        });
    }
};
