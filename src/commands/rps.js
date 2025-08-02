import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

const activeGames = new Map();

const choices = {
    'rock': { emoji: '🪨', beats: 'scissors' },
    'paper': { emoji: '📄', beats: 'rock' },
    'scissors': { emoji: '✂️', beats: 'paper' }
};

class RPSGame {
    constructor(player1, player2, bestOf = 1, isAI = false) {
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
        this.isAI = isAI; // Nova propriedade para identificar jogos contra IA
    }

    makeChoice(userId, choice) {
        if (userId === this.player1.id) {
            this.player1Choice = choice;
        } else if (userId === this.player2.id) {
            this.player2Choice = choice;
        }
        
        // Se é contra IA e o jogador fez escolha, IA escolhe automaticamente
        if (this.isAI && this.player1Choice && !this.player2Choice) {
            const aiChoices = ['rock', 'paper', 'scissors'];
            this.player2Choice = aiChoices[Math.floor(Math.random() * aiChoices.length)];
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

    // Versão que não incrementa score, apenas para exibição
    getDisplayRoundWinner() {
        if (!this.bothChosen) return null;
        
        if (this.player1Choice === this.player2Choice) return 'tie';
        
        if (choices[this.player1Choice].beats === this.player2Choice) {
            return this.player1;
        } else {
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
            .setColor(this.isAI ? '#e74c3c' : '#3498DB'); // Cor vermelha para IA

        if (this.bestOf > 1) {
            const aiIndicator = this.isAI ? ' 🤖' : '';
            const neededToWin = Math.ceil(this.bestOf / 2);
            
            // Se o jogo terminou, mostrar o score final com o vencedor atingindo o necessário
            let finalPlayer1Score = this.player1Score;
            let finalPlayer2Score = this.player2Score;
            
            if (this.gameOver) {
                if (this.player1Score >= neededToWin) finalPlayer1Score = neededToWin;
                if (this.player2Score >= neededToWin) finalPlayer2Score = neededToWin;
            }
            
            // Cria indicadores visuais de pontos
            const player1Points = '🟢'.repeat(finalPlayer1Score) + '⚪'.repeat(neededToWin - finalPlayer1Score);
            const player2Points = '🔴'.repeat(finalPlayer2Score) + '⚪'.repeat(neededToWin - finalPlayer2Score);
            
            embed.setDescription(`**Melhor de ${this.bestOf}** (Primeiro a ${neededToWin}) - **Ronda ${this.currentRound}**\n\n` +
                `🏆 **PLACAR:**\n` +
                `${this.player1.displayName}: ${player1Points} (${finalPlayer1Score}/${neededToWin})\n` +
                `${this.player2.displayName}${aiIndicator}: ${player2Points} (${finalPlayer2Score}/${neededToWin})`);
        } else {
            const aiIndicator = this.isAI ? ' 🤖' : '';
            embed.setDescription(`${this.player1.displayName} vs ${this.player2.displayName}${aiIndicator}`);
        }

        if (this.bothChosen) {
            const winner = this.getDisplayRoundWinner(); // Usa versão que não incrementa score
            let resultText = `${this.player1.displayName}: ${choices[this.player1Choice].emoji} ${this.player1Choice.toUpperCase()}\n`;
            const aiIndicator = this.isAI ? ' 🤖' : '';
            resultText += `${this.player2.displayName}${aiIndicator}: ${choices[this.player2Choice].emoji} ${this.player2Choice.toUpperCase()}\n\n`;
            
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

            embed.addFields({ name: 'Resultado da Ronda', value: resultText, inline: false });
        } else {
            const status1 = this.player1Choice ? '✅' : '⏳';
            const status2 = this.isAI ? '🤖' : (this.player2Choice ? '✅' : '⏳');
            const aiIndicator = this.isAI ? ' 🤖' : '';
            embed.addFields({ 
                name: 'Estado das Escolhas', 
                value: `${status1} ${this.player1.displayName}\n${status2} ${this.player2.displayName}${aiIndicator}`, 
                inline: false 
            });
        }

        return embed;
    }

    createButtons() {
        if (this.gameOver) {
            // Não adicionar botão "Novo Jogo" - usar comando para reiniciar
            return null;
        } else if (this.bothChosen) {
            if (this.isGameOver()) {
                // Jogo terminou - não adicionar botões
                return null;
            } else {
                const row = new ActionRowBuilder();
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('rps_next')
                        .setLabel('➡️ Próxima Ronda')
                        .setStyle(ButtonStyle.Primary)
                );
                return row;
            }
        } else {
            const row = new ActionRowBuilder();
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
            return row;
        }

        return null;
    }
}

export default {
    name: 'rps',
    aliases: ['rps3', 'rps5', 'rps7', 'rps9'],
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
            return message.reply('❌ Menciona um utilizador para desafiar! Ex: %rps @user\n💡 **Dica:** Menciona o bot para jogar contra IA!');
        }

        if (targetUser.id === message.author.id) {
            return message.reply('❌ Não podes jogar contra ti mesmo!');
        }

        // Verifica se é o bot (IA)
        const isAI = targetUser.bot && targetUser.id === client.user.id;
        
        if (targetUser.bot && !isAI) {
            return message.reply('❌ Não podes desafiar outros bots! Apenas podes jogar contra mim (IA).');
        }

        if (activeGames.has(message.author.id) || (!isAI && activeGames.has(targetUser.id))) {
            return message.reply('❌ Um dos jogadores já está numa partida!');
        }

        const game = new RPSGame(message.author, targetUser, bestOf, isAI);
        const gameId = isAI ? `${message.author.id}_AI` : `${message.author.id}_${targetUser.id}`;
        activeGames.set(message.author.id, gameId);
        if (!isAI) {
            activeGames.set(targetUser.id, gameId);
        }

        const embed = game.createGameEmbed();
        const buttons = game.createButtons();

        const gameMessage = await message.reply({ 
            content: isAI ? '🤖 Desafiaste a IA para Rock Paper Scissors!' : `${targetUser}, foste desafiado para Rock Paper Scissors!`,
            embeds: [embed], 
            components: buttons ? [buttons] : []
        });

        const { ComponentType } = await import('discord.js');
        const collector = gameMessage.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 300000 // 5 minutos
        });

        collector.on('collect', async interaction => {
            // Para IA, apenas o jogador humano pode interagir
            if (game.isAI) {
                if (interaction.user.id !== game.player1.id) {
                    await interaction.reply({ content: 'Apenas o jogador pode interagir!', flags: MessageFlags.Ephemeral });
                    return;
                }
            } else {
                if (![game.player1.id, game.player2.id].includes(interaction.user.id)) {
                    await interaction.reply({ content: 'Apenas os jogadores podem jogar!', flags: MessageFlags.Ephemeral });
                    return;
                }
            }

            if (interaction.customId === 'rps_next') {
                game.nextRound();
            } else if (interaction.customId.startsWith('rps_')) {
                const choice = interaction.customId.replace('rps_', '');
                if (!choices[choice]) return;

                // Para jogos contra IA, apenas o jogador humano pode fazer escolhas
                if (game.isAI && interaction.user.id !== game.player1.id) {
                    await interaction.reply({ content: 'Apenas o jogador pode fazer escolhas!', flags: MessageFlags.Ephemeral });
                    return;
                }

                if ((interaction.user.id === game.player1.id && game.player1Choice) ||
                    (!game.isAI && interaction.user.id === game.player2.id && game.player2Choice)) {
                    await interaction.reply({ content: 'Já fizeste a tua escolha!', flags: MessageFlags.Ephemeral });
                    return;
                }

                game.makeChoice(interaction.user.id, choice);
            }

            // Se ambos fizeram escolhas, calcular vencedor e incrementar score
            if (game.bothChosen) {
                game.getRoundWinner(); // Incrementa o score
            }

            const newEmbed = game.createGameEmbed();
            const newButtons = game.createButtons();

            await interaction.update({ embeds: [newEmbed], components: newButtons ? [newButtons] : [] });

            // Remove jogadores do activeGames apenas quando o jogo termina completamente
            if (game.gameOver) {
                activeGames.delete(game.player1.id);
                if (!game.isAI) {
                    activeGames.delete(game.player2.id);
                }
                collector.stop(); // Para o collector quando o jogo termina
            }
        });

        collector.on('end', (collected, reason) => {
            // Remove jogadores do activeGames independentemente do motivo
            activeGames.delete(game.player1.id);
            if (!game.isAI) {
                activeGames.delete(game.player2.id);
            }
            
            // Se acabou por timeout, desativa os botões
            if (reason === 'time') {
                const disabledButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('disabled')
                            .setLabel('⏰ Jogo Expirado')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );
                
                gameMessage.edit({ components: [disabledButtons] }).catch(() => {});
            }
        });
    }
};
