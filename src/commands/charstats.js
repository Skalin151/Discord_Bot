import { EmbedBuilder } from 'discord.js';
import charactersData, { getPointsStats } from '../config/characters.js';
import UserClaim from '../models/UserClaim.js';

export default {
    name: 'charstats',
    aliases: ['cs', 'characterstats'],
    description: 'Mostra estatísticas dos personagens disponíveis',
    async execute(client, message, args) {
        try {
            // Calcular estatísticas básicas
            const totalCharacters = charactersData.length;
            const femaleCount = charactersData.filter(char => char.gender === 'female').length;
            const maleCount = charactersData.filter(char => char.gender === 'male').length;

            // Calcular estatísticas de pontos
            const pointsStats = getPointsStats(charactersData);
            
            // Calcular estatísticas de claims
            const totalClaims = await UserClaim.getTotalClaims();
            const claimedPercentage = ((totalClaims / totalCharacters) * 100).toFixed(1);
            
            // Top 5 personagens por pontos
            const topCharacters = charactersData
                .sort((a, b) => (b.points || 0) - (a.points || 0))
                .slice(0, 5)
                .map((char, index) => {
                    return `${index + 1}. **${char.name}** \`${char.points || 0} pts\``;
                })
                .join('\n');

            // Criar embed
            const embed = new EmbedBuilder()
                .setTitle('📊 Estatísticas dos Personagens')
                .setColor('#3498DB')
                .setAuthor({ 
                    name: message.author.displayName, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .addFields(
                    { 
                        name: '👥 Total de Personagens', 
                        value: `**${totalCharacters}**`, 
                        inline: true 
                    },
                    { 
                        name: '💕 Waifus (Feminino)', 
                        value: `**${femaleCount}**`, 
                        inline: true 
                    },
                    { 
                        name: '💙 Husbandos (Masculino)', 
                        value: `**${maleCount}**`, 
                        inline: true 
                    },
                    { 
                        name: '💰 Pontos - Estatísticas', 
                        value: `**Total:** ${pointsStats.total} pts\n**Média:** ${pointsStats.average} pts\n**Min/Max:** ${pointsStats.min}/${pointsStats.max} pts`, 
                        inline: true 
                    },
                    { 
                        name: '💍 Sistema de Claims', 
                        value: `**Claimed:** ${totalClaims}/${totalCharacters}\n**Percentagem:** ${claimedPercentage}%\n**Disponíveis:** ${totalCharacters - totalClaims}`, 
                        inline: true 
                    },
                    { 
                        name: '🏆 Top 5 Personagens', 
                        value: topCharacters || 'Nenhum personagem encontrado', 
                        inline: false 
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: 'Use %w, %h ou %m para fazer roll! • %charinfo <nome> para detalhes • %myclaims para ver tua coleção' 
                });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro no comando charstats:', error);
            await message.reply('❌ Ocorreu um erro ao obter as estatísticas!');
        }
    }
};
