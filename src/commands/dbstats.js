import { EmbedBuilder } from 'discord.js';
import User from '../models/User.js';
import UserItem from '../models/UserItem.js';
import UserCode from '../models/UserCode.js';
import Horse from '../models/Horse.js';
import Ticket from '../models/Ticket.js';
import mongoose from 'mongoose';

export default {
  name: 'dbstats',
  description: 'Mostra estatísticas da base de dados MongoDB',
  async execute(client, message) {
    try {
      // Verifica se o usuário é admin/owner (pode ajustar conforme necessário)
      const ownerId = '358926963446120448'; // Substitua pelo seu ID
      if (message.author.id !== ownerId) {
        return message.reply('❌ Apenas o owner pode usar este comando.');
      }

      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas da Base de Dados')
        .setColor('#00d2d3')
        .setTimestamp();

      // Conta documentos em cada collection
      const [userCount, userItemCount, userCodeCount, horseCount, ticketCount] = await Promise.all([
        User.countDocuments(),
        UserItem.countDocuments(),
        UserCode.countDocuments(),
        Horse.countDocuments(),
        Ticket.countDocuments()
      ]);

      // Estatísticas gerais
      embed.addFields(
        { name: '👥 Utilizadores', value: `${userCount.toLocaleString()}`, inline: true },
        { name: '🎒 Itens de Utilizadores', value: `${userItemCount.toLocaleString()}`, inline: true },
        { name: '🎫 Códigos Usados', value: `${userCodeCount.toLocaleString()}`, inline: true },
        { name: '🐎 Cavalos', value: `${horseCount.toLocaleString()}`, inline: true },
        { name: '🎟️ Tickets', value: `${ticketCount.toLocaleString()}`, inline: true },
        { name: '📊 Total de Documentos', value: `${(userCount + userItemCount + userCodeCount + horseCount + ticketCount).toLocaleString()}`, inline: true }
      );

      // Estatísticas adicionais dos utilizadores
      if (userCount > 0) {
        const userStats = await User.aggregate([
          {
            $group: {
              _id: null,
              totalPoints: { $sum: '$points' },
              totalSpent: { $sum: '$pointsSpent' },
              avgPoints: { $avg: '$points' },
              maxPoints: { $max: '$points' },
              minPoints: { $min: '$points' }
            }
          }
        ]);

        if (userStats.length > 0) {
          const stats = userStats[0];
          embed.addFields(
            { name: '💰 Total de Pontos em Circulação', value: `${stats.totalPoints.toLocaleString()}`, inline: true },
            { name: '💸 Total de Pontos Gastos', value: `${stats.totalSpent.toLocaleString()}`, inline: true },
            { name: '📈 Média de Pontos', value: `${Math.round(stats.avgPoints).toLocaleString()}`, inline: true }
          );
        }
      }

      // Estatísticas dos tickets
      if (ticketCount > 0) {
        const ticketStats = await Ticket.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const openTickets = ticketStats.find(t => t._id === 'open')?.count || 0;
        const closedTickets = ticketStats.find(t => t._id === 'closed')?.count || 0;

        embed.addFields(
          { name: '🟢 Tickets Abertos', value: `${openTickets.toLocaleString()}`, inline: true },
          { name: '🔴 Tickets Fechados', value: `${closedTickets.toLocaleString()}`, inline: true }
        );
      }

      // Estatísticas dos itens
      if (userItemCount > 0) {
        const itemStats = await UserItem.aggregate([
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: '$quantidade' },
              equippedItems: { $sum: { $cond: ['$equipado', 1, 0] } },
              avgQuantity: { $avg: '$quantidade' }
            }
          }
        ]);

        if (itemStats.length > 0) {
          const stats = itemStats[0];
          embed.addFields(
            { name: '📦 Total de Itens', value: `${stats.totalQuantity.toLocaleString()}`, inline: true },
            { name: '⚡ Itens Equipados', value: `${stats.equippedItems.toLocaleString()}`, inline: true }
          );
        }
      }

      // Informações da conexão
      const dbConnection = mongoose.connection;
      embed.addFields(
        { name: '🔌 Estado da Conexão', value: dbConnection.readyState === 1 ? '✅ Conectado' : '❌ Desconectado', inline: true },
        { name: '🗄️ Base de Dados', value: dbConnection.name || 'N/A', inline: true },
      );

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Erro ao obter estatísticas da DB:', error);
      message.reply('❌ Erro ao obter estatísticas da base de dados.');
    }
  },
};
