import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import User from '../../models/User.js';

class BlackjackGame {
  constructor(userId) {
    this.userId = userId;
    this.suits = ['♠️', '♥️', '♦️', '♣️'];
    this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    this.deck = [];
    this.playerHand = [];
    this.dealerHand = [];
    this.gameOver = false;
    this.gameStarted = false;
  }
  createDeck() {
    this.deck = [];
    for (let suit of this.suits) {
      for (let value of this.values) {
        this.deck.push({ suit, value });
      }
    }
    this.shuffleDeck();
  }
  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }
  drawCard() {
    return this.deck.pop();
  }
  calculateHandValue(hand) {
    let value = 0, aces = 0;
    for (let card of hand) {
      if (card.value === 'A') { aces++; value += 11; }
      else if (['J', 'Q', 'K'].includes(card.value)) value += 10;
      else value += parseInt(card.value);
    }
    while (value > 21 && aces > 0) { value -= 10; aces--; }
    return value;
  }
  formatHand(hand, hideFirst = false) {
    if (hideFirst && hand.length > 0) {
      const visibleCards = hand.slice(1);
      return `${visibleCards.map(card => `${card.value}${card.suit}`).join(' ')} `;
    }
    return hand.map(card => `${card.value}${card.suit}`).join(' ');
  }
  startGame() {
    this.createDeck();
    this.playerHand = [];
    this.dealerHand = [];
    this.gameOver = false;
    this.gameStarted = true;
    this.playerHand.push(this.drawCard());
    this.dealerHand.push(this.drawCard());
    this.playerHand.push(this.drawCard());
    this.dealerHand.push(this.drawCard());
  }
  hit() {
    if (this.gameOver) return false;
    this.playerHand.push(this.drawCard());
    if (this.calculateHandValue(this.playerHand) > 21) this.gameOver = true;
    return true;
  }
  stay() {
    if (this.gameOver) return;
    while (this.calculateHandValue(this.dealerHand) < 17) {
      this.dealerHand.push(this.drawCard());
    }
    this.gameOver = true;
  }
  getGameResult() {
    const playerValue = this.calculateHandValue(this.playerHand);
    const dealerValue = this.calculateHandValue(this.dealerHand);
    const playerBlackjack = playerValue === 21 && this.playerHand.length === 2;
    const dealerBlackjack = dealerValue === 21 && this.dealerHand.length === 2;
    if (playerValue > 21) return { result: 'lose', message: '💥 Rebentaste! Perdeste!' };
    if (dealerValue > 21) return { result: 'win', message: '🎉 O dealer rebentou! Ganhaste!' };
    if (playerBlackjack && dealerBlackjack) return { result: 'tie', message: '🤝 Empate! Ambos têm Blackjack!' };
    if (playerBlackjack) return { result: 'blackjack', message: '🔥 BLACKJACK! Ganhaste!' };
    if (dealerBlackjack) return { result: 'lose', message: '😞 O dealer tem Blackjack! Perdeste!' };
    if (playerValue > dealerValue) return { result: 'win', message: '🎉 Ganhaste!' };
    else if (dealerValue > playerValue) return { result: 'lose', message: '😞 Perdeste!' };
    else return { result: 'tie', message: '🤝 Empate!' };
  }
  createGameEmbed(userPoints) {
    const playerValue = this.calculateHandValue(this.playerHand);
    const dealerValue = this.calculateHandValue(this.dealerHand);
    const embed = new EmbedBuilder()
      .setTitle('Blackjack')
      .setColor('#36393f');
    if (this.gameOver) {
      embed.addFields({ name: `🎩 Dealer (${dealerValue})`, value: this.formatHand(this.dealerHand), inline: false });
    } else {
      embed.addFields({ name: `🎩 Dealer (??)`, value: this.formatHand(this.dealerHand, true), inline: false });
    }
    
    embed.addFields({ name: `👤(${playerValue})`, value: `<@${this.userId}>\n${this.formatHand(this.playerHand)}`, inline: false });
    if (this.gameOver) {
      const result = this.getGameResult();
      embed.addFields({ name: 'Resultado:', value: result.message, inline: false });
      if (result.result === 'win' || result.result === 'blackjack') embed.setColor('#4ECDC4');
      else if (result.result === 'lose') embed.setColor('#FF6B6B');
      else embed.setColor('#FFE66D');
      embed.setFooter({ text: `Saldo atual: ${userPoints} pontos` });
    } else {
      embed.setFooter({ text: 'Usa os botões abaixo para jogar!' });
    }
    return embed;
  }
  createGameButtons() {
    const row = new ActionRowBuilder();
    if (!this.gameStarted) {
      row.addComponents(
        new ButtonBuilder().setCustomId('blackjack_start').setLabel('🎮 Novo Jogo').setStyle(ButtonStyle.Success)
      );
    } else if (!this.gameOver) {
      row.addComponents(
        new ButtonBuilder().setCustomId('blackjack_hit').setLabel('🃏 Hit').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('blackjack_stay').setLabel('✋ Stay').setStyle(ButtonStyle.Secondary)
      );
    } else {
      row.addComponents(
        new ButtonBuilder().setCustomId('blackjack_start').setLabel('🔄 Jogar Novamente').setStyle(ButtonStyle.Success)
      );
    }
    return row;
  }
}

const activeGames = new Map();

export default {
  name: 'blackjack',
  description: 'Joga Blackjack apostando pontos!',
  async execute(client, message) {
    const userId = message.author.id;
    const betAmount = 500;
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, points: 1000 });
      await user.save();
    }
    if (user.points < betAmount) {
      return message.reply(`❌ Não tens pontos suficientes para jogar! (Precisas de pelo menos ${betAmount} pontos)`);
    }
    user.points -= betAmount;
    user.pointsSpent = (user.pointsSpent || 0) + betAmount;
    await user.save();
    const game = new BlackjackGame(userId);
    game.startGame();
    activeGames.set(userId, game);
    let embed = game.createGameEmbed(user.points);
    let buttons = game.createGameButtons();
    const sentMsg = await message.reply({ embeds: [embed], components: [buttons] });

    const { ComponentType } = await import('discord.js');
    const collector = sentMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== userId) {
        await interaction.reply({ content: 'Só quem iniciou o jogo pode jogar!', ephemeral: true });
        return;
      }
      let shouldUpdate = true;
      switch (interaction.customId) {
        case 'blackjack_start':
          game.startGame();
          break;
        case 'blackjack_hit':
          if (!game.hit()) shouldUpdate = false;
          break;
        case 'blackjack_stay':
          game.stay();
          break;
        default:
          shouldUpdate = false;
      }
      // Se o jogo acabou, atualizar pontos
      if (game.gameOver) {
        const result = game.getGameResult();
        let ganho = 0;
        if (result.result === 'blackjack') ganho = 1000;
        else if (result.result === 'win') ganho = 900;
        else if (result.result === 'tie') ganho = 500;
        // Verifica se o usuário tem o cartão vip (id 6)
        const UserItem = (await import('../../models/UserItem.js')).default;
        const hasVip = await UserItem.findOne({ userId, itemId: 6, equipado: true });
        if (hasVip && ganho > 0) {
          ganho = Math.floor(ganho * 1.2);
        }
        user.points += ganho;
        await user.save();
      }
      if (shouldUpdate) {
        embed = game.createGameEmbed(user.points);
        buttons = game.createGameButtons();
        await interaction.update({ embeds: [embed], components: [buttons] });
      }
    });

    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('blackjack_hit').setLabel('🃏 Hit').setStyle(ButtonStyle.Primary).setDisabled(true),
          new ButtonBuilder().setCustomId('blackjack_stay').setLabel('✋ Stay').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );
      await sentMsg.edit({ components: [disabledRow] });
    });
  },
};
