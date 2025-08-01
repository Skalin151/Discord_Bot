import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

const activeGames = new Map();

class TicTacToeGame {
    constructor(player1, player2) {
        this.player1 = player1; // X
        this.player2 = player2; // O
        this.currentPlayer = player1;
        this.board = Array(9).fill(null); // 0-8 positions
        this.gameOver = false;
        this.winner = null;
        this.isDraw = false;
    }

    makeMove(userId, position) {
        if (this.gameOver) return false;
        if (this.currentPlayer.id !== userId) return false;
        if (this.board[position] !== null) return false;

        // Fazer jogada
        this.board[position] = this.currentPlayer.id === this.player1.id ? 'X' : 'O';
        
        // Verificar vitória
        if (this.checkWin()) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
        } else if (this.board.every(cell => cell !== null)) {
            this.gameOver = true;
            this.isDraw = true;
        } else {
            // Trocar jogador
            this.currentPlayer = this.currentPlayer.id === this.player1.id ? this.player2 : this.player1;
        }

        return true;
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
            [0, 4, 8], [2, 4, 6] // Diagonais
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c];
        });
    }

    getSymbol(userId) {
        return userId === this.player1.id ? 'X' : 'O';
    }

    createGameEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('⭕ Tic Tac Toe ❌')
            .setColor('#3498DB');

        let description = '';
        if (this.gameOver) {
            if (this.isDraw) {
                description = '🤝 **EMPATE!**';
            } else {
                const winnerSymbol = this.getSymbol(this.winner.id);
                description = `🎉 **${this.winner.displayName} (${winnerSymbol}) VENCEU!**`;
            }
        } else {
            const currentSymbol = this.getSymbol(this.currentPlayer.id);
            description = `Vez de: **${this.currentPlayer.displayName} (${currentSymbol})**`;
        }

        embed.setDescription(`${this.player1.displayName} ❌ vs ⭕ ${this.player2.displayName}\n\n${description}`);

        return embed;
    }

    createButtons() {
        const rows = [];
        
        // Criar 3 linhas de 3 botões cada
        for (let row = 0; row < 3; row++) {
            const actionRow = new ActionRowBuilder();
            
            for (let col = 0; col < 3; col++) {
                const position = row * 3 + col;
                const cellValue = this.board[position];
                
                let emoji = '⬜';
                let style = ButtonStyle.Secondary;
                let disabled = this.gameOver;
                
                if (cellValue === 'X') {
                    emoji = '❌';
                    style = ButtonStyle.Danger;
                    disabled = true;
                } else if (cellValue === 'O') {
                    emoji = '⭕';
                    style = ButtonStyle.Success;
                    disabled = true;
                }

                actionRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ttt_${position}`)
                        .setEmoji(emoji)
                        .setStyle(style)
                        .setDisabled(disabled)
                );
            }
            
            rows.push(actionRow);
        }

        // Botão de novo jogo se terminou
        if (this.gameOver) {
            const newGameRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ttt_new')
                        .setLabel('🔄 Novo Jogo')
                        .setStyle(ButtonStyle.Primary)
                );
            rows.push(newGameRow);
        }

        return rows;
    }

    reset() {
        this.board = Array(9).fill(null);
        this.currentPlayer = this.player1;
        this.gameOver = false;
        this.winner = null;
        this.isDraw = false;
    }
}

export default {
    name: 'tictactoe',
    description: 'Joga Tic Tac Toe com outro jogador. Uso: %tictactoe @user',
    async execute(client, message, args) {
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Menciona um utilizador para desafiar! Ex: %tictactoe @user');
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

        const game = new TicTacToeGame(message.author, targetUser);
        const gameId = `${message.author.id}_${targetUser.id}`;
        activeGames.set(message.author.id, gameId);
        activeGames.set(targetUser.id, gameId);

        const embed = game.createGameEmbed();
        const buttons = game.createButtons();

        const gameMessage = await message.reply({ 
            content: `${targetUser}, foste desafiado para Tic Tac Toe!`,
            embeds: [embed], 
            components: buttons
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

            if (interaction.customId === 'ttt_new') {
                game.reset();
            } else if (interaction.customId.startsWith('ttt_')) {
                const position = parseInt(interaction.customId.replace('ttt_', ''));
                
                if (!game.makeMove(interaction.user.id, position)) {
                    await interaction.reply({ content: 'Jogada inválida!', flags: MessageFlags.Ephemeral });
                    return;
                }
            }

            const newEmbed = game.createGameEmbed();
            const newButtons = game.createButtons();

            await interaction.update({ embeds: [newEmbed], components: newButtons });

            if (game.gameOver) {
                // Não remove da lista para permitir novo jogo
                setTimeout(() => {
                    activeGames.delete(game.player1.id);
                    activeGames.delete(game.player2.id);
                }, 30000); // Remove após 30 segundos
            }
        });

        collector.on('end', () => {
            activeGames.delete(game.player1.id);
            activeGames.delete(game.player2.id);
        });
    }
};
