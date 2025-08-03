import { EmbedBuilder } from 'discord.js';
import UserRolls from '../models/UserRolls.js';

export default {
    name: 'rolls',
    aliases: ['r', 'rollsinfo', 'myrolls'],
    description: 'Mostra quantos rolls tens disponíveis',
    async execute(client, message, args) {
        try {
            // Verificar rolls do utilizador (sem consumir)
            const rollData = await UserRolls.checkAndUpdateRolls(message.author.id);
            const timeUntilReset = UserRolls.getTimeUntilReset();
            
            let statusEmoji = '🟢';
            let statusText = 'Disponíveis';
            let statusColor = '#00FF00';
            
            if (rollData.rollsRemaining === 0) {
                statusEmoji = '🔴';
                statusText = 'Esgotados';
                statusColor = '#FF4444';
            } else if (rollData.rollsRemaining <= 3) {
                statusEmoji = '🟡';
                statusText = 'Poucos restantes';
                statusColor = '#FFD700';
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`${statusEmoji} Os Teus Rolls`)
                .setColor(statusColor)
                .setAuthor({ 
                    name: message.author.displayName, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .addFields(
                    {
                        name: '🎲 Rolls Disponíveis',
                        value: `**${rollData.rollsRemaining}/10**`,
                        inline: true
                    },
                    {
                        name: '📊 Status',
                        value: statusText,
                        inline: true
                    },
                    {
                        name: '⏰ Próximo Reset',
                        value: `**${timeUntilReset.minutes}m ${timeUntilReset.seconds}s**`,
                        inline: true
                    }
                )
                .setDescription(rollData.rollsRemaining > 0 ? 
                    'Usa `%w`, `%h` ou `%m` para fazer roll de personagens!' : 
                    'Espera pelo próximo reset para receberes 10 rolls novos!')
                .setTimestamp()
                .setFooter({ 
                    text: 'Os rolls resetam a cada hora às 00 minutos!' 
                });
            
            // Adicionar informação extra se for uma nova hora
            if (rollData.isNewHour) {
                embed.addFields({
                    name: '🎉 Rolls Renovados!',
                    value: 'Acabaste de receber 10 rolls novos!',
                    inline: false
                });
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro no comando rolls:', error);
            await message.reply('❌ Ocorreu um erro ao verificar os teus rolls!');
        }
    }
};
