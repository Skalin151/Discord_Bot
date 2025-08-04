import { EmbedBuilder } from 'discord.js';
import UserClaim from '../../models/UserClaim.js';

export default {
    name: 'clearstatus',
    aliases: ['clearinfo', 'autoclear'],
    description: 'Mostra informações sobre o sistema de clear automático',
    async execute(client, message, args) {
        try {
            // Obter estatísticas atuais
            const totalClaims = await UserClaim.countDocuments();
            const uniqueUsers = await UserClaim.distinct('userId');
            
            // Calcular data do próximo clear
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia do mês atual
            const isLastDay = now.getDate() === nextMonth.getDate();
            
            let nextClearDate;
            if (isLastDay) {
                // Se é hoje o último dia, o próximo clear é no final do próximo mês
                nextClearDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
            } else {
                // Senão, é no final deste mês
                nextClearDate = nextMonth;
            }
            
            const daysUntilClear = Math.ceil((nextClearDate - now) / (1000 * 60 * 60 * 24));
            
            // Criar embed informativo
            const embed = new EmbedBuilder()
                .setTitle('🧹 Sistema de Clear Automático')
                .setDescription('Informações sobre o clear mensal de claims')
                .setColor('#5865f2')
                .addFields(
                    {
                        name: '📊 Estatísticas Atuais',
                        value: `**Total de Claims:** ${totalClaims}\n**Utilizadores com Claims:** ${uniqueUsers.length}`,
                        inline: true
                    },
                    {
                        name: '📅 Próximo Clear',
                        value: `**Data:** ${nextClearDate.toLocaleDateString('pt-PT')}\n**Dias restantes:** ${daysUntilClear}`,
                        inline: true
                    },
                    {
                        name: 'ℹ️ Como Funciona',
                        value: 'No último dia de cada mês, todos os claims são automaticamente removidos e os pontos correspondentes são atribuídos aos utilizadores.',
                        inline: false
                    },
                    {
                        name: '💰 Cálculo de Pontos',
                        value: 'Cada personagem tem um valor em pontos. Quando o clear acontece, recebes os pontos de todos os teus personagens claimed.',
                        inline: false
                    },
                    {
                        name: '🔧 Clear Manual',
                        value: 'O owner do bot pode executar um clear manual usando o comando `%clear`.',
                        inline: false
                    }
                )
                .setAuthor({ 
                    name: message.author.displayName, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setTimestamp()
                .setFooter({ 
                    text: isLastDay ? '🚨 Hoje é o último dia do mês!' : 'Clear automático ativo' 
                });

            // Destacar se é o último dia do mês
            if (isLastDay) {
                embed.setColor('#FF4444');
                embed.setDescription('⚠️ **ATENÇÃO!** Hoje é o último dia do mês. O clear automático será executado!');
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro no comando clearstatus:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erro no Sistema')
                .setDescription('Ocorreu um erro ao obter as informações do clear. Tenta novamente!')
                .setColor('#FF4444')
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
