import { EmbedBuilder } from 'discord.js';
import UserClaim from '../../models/UserClaim.js';

export default {
    name: 'claim',
    aliases: ['claiminfo', 'cooldown', 'cd'],
    description: 'Mostra se podes fazer claim de personagens e o tempo de cooldown restante',
    async execute(client, message, args) {
        try {
            // Verificar se o utilizador pode fazer claim
            const claimCheck = await UserClaim.canUserClaim(message.author.id);
            
            // Verificar se o utilizador pode ganhar bónus
            const bonusCheck = await UserClaim.canUserGetBonus(message.author.id);
            
            let statusEmoji = '🟢';
            let statusText = 'Disponível';
            let statusColor = '#00FF00';
            let description = 'Podes fazer claim de qualquer personagem disponível!\n\nUsa `%w`, `%h` ou `%m` para fazer roll e reage para fazer claim.';
            
            const embed = new EmbedBuilder()
                .setTitle(`${statusEmoji} Status de Claim`)
                .setColor(statusColor)
                .setAuthor({ 
                    name: message.author.displayName, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setTimestamp()
                .setFooter({ 
                    text: 'Cooldowns: Claim e Bónus (3 horas cada)' 
                });
            
            if (claimCheck.canClaim) {
                // Utilizador pode fazer claim
                embed.addFields(
                    {
                        name: '💍 Status de Claim',
                        value: '**Disponível**',
                        inline: true
                    },
                    {
                        name: '⏰ Cooldown Claim',
                        value: '**Nenhum**',
                        inline: true
                    },
                    {
                        name: '🧰 Status de Bónus',
                        value: bonusCheck.canGetBonus ? '**Disponível**' : '**Em Cooldown**',
                        inline: true
                    }
                );
                
                // Se tem cooldown de bónus, mostrar tempo restante
                if (!bonusCheck.canGetBonus) {
                    const timeLeftMs = bonusCheck.timeLeft.totalMs;
                    const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
                    const minutesLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
                    const secondsLeft = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
                    
                    let bonusTimeDisplay = '';
                    if (hoursLeft > 0) {
                        bonusTimeDisplay = `**${hoursLeft}h ${minutesLeft}m ${secondsLeft}s**`;
                    } else if (minutesLeft > 0) {
                        bonusTimeDisplay = `**${minutesLeft}m ${secondsLeft}s**`;
                    } else {
                        bonusTimeDisplay = `**${secondsLeft}s**`;
                    }
                    
                    embed.addFields({
                        name: '⏰ Próximo Bónus Em',
                        value: bonusTimeDisplay,
                        inline: false
                    });
                }
            } else {
                // Utilizador em cooldown
                statusEmoji = '🔴';
                statusText = 'Em Cooldown';
                statusColor = '#FF4444';
                description = 'Ainda não podes fazer claim de personagens.\n\nAguarda o cooldown terminar ou continua a fazer rolls para encontrar personagens.';
                
                // Calcular tempo restante mais preciso
                const timeLeftMs = claimCheck.timeLeft.totalMs;
                const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
                const secondsLeft = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
                
                let timeDisplay = '';
                if (hoursLeft > 0) {
                    timeDisplay = `**${hoursLeft}h ${minutesLeft}m ${secondsLeft}s**`;
                } else if (minutesLeft > 0) {
                    timeDisplay = `**${minutesLeft}m ${secondsLeft}s**`;
                } else {
                    timeDisplay = `**${secondsLeft}s**`;
                }
                
                // Determinar cor baseada no tempo restante
                if (timeLeftMs <= 30 * 60 * 1000) { // 30 minutos ou menos
                    statusEmoji = '🟡';
                    statusColor = '#FFD700';
                    statusText = 'Quase disponível';
                }
                
                embed.setTitle(`${statusEmoji} Status de Claim`)
                    .setColor(statusColor)
                    .addFields(
                        {
                            name: '💍 Status de Claim',
                            value: `**${statusText}**`,
                            inline: true
                        },
                        {
                            name: '⏰ Tempo Restante Claim',
                            value: timeDisplay,
                            inline: true
                        },
                        {
                            name: '🧰 Status de Bónus',
                            value: bonusCheck.canGetBonus ? '**Disponível**' : '**Em Cooldown**',
                            inline: true
                        }
                    );
                    
                // Se tem cooldown de bónus, mostrar tempo restante
                if (!bonusCheck.canGetBonus) {
                    const bonusTimeLeftMs = bonusCheck.timeLeft.totalMs;
                    const bonusHoursLeft = Math.floor(bonusTimeLeftMs / (1000 * 60 * 60));
                    const bonusMinutesLeft = Math.floor((bonusTimeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
                    const bonusSecondsLeft = Math.floor((bonusTimeLeftMs % (1000 * 60)) / 1000);
                    
                    let bonusTimeDisplay = '';
                    if (bonusHoursLeft > 0) {
                        bonusTimeDisplay = `**${bonusHoursLeft}h ${bonusMinutesLeft}m ${bonusSecondsLeft}s**`;
                    } else if (bonusMinutesLeft > 0) {
                        bonusTimeDisplay = `**${bonusMinutesLeft}m ${bonusSecondsLeft}s**`;
                    } else {
                        bonusTimeDisplay = `**${bonusSecondsLeft}s**`;
                    }
                    
                    embed.addFields({
                        name: '⏰ Próximo Bónus Em',
                        value: bonusTimeDisplay,
                        inline: false
                    });
                }
            }
            
            embed.setDescription(description);
            
            // Obter estatísticas adicionais do utilizador
            const userClaims = await UserClaim.getUserClaims(message.author.id);
            const totalClaims = userClaims.length;
            
            // Adicionar informações extras
            embed.addFields(
                {
                    name: '📊 As Tuas Estatísticas',
                    value: `**${totalClaims}** personagens na tua coleção`,
                    inline: false
                }
            );
            
            // Se o utilizador tem claims, mostrar o último
            if (totalClaims > 0) {
                const lastClaim = userClaims[0]; // Já ordenado por data (mais recente primeiro)
                const timeSinceLastClaim = new Date() - new Date(lastClaim.claimedAt);
                const daysSince = Math.floor(timeSinceLastClaim / (1000 * 60 * 60 * 24));
                const hoursSince = Math.floor((timeSinceLastClaim % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                let timeSinceText = '';
                if (daysSince > 0) {
                    timeSinceText = `${daysSince}d ${hoursSince}h atrás`;
                } else if (hoursSince > 0) {
                    timeSinceText = `${hoursSince}h atrás`;
                } else {
                    const minutesSince = Math.floor((timeSinceLastClaim % (1000 * 60 * 60)) / (1000 * 60));
                    timeSinceText = `${minutesSince}m atrás`;
                }
                
                embed.addFields(
                    {
                        name: '🏆 Último Claim',
                        value: `**${lastClaim.characterName}** (${timeSinceText})`,
                        inline: false
                    }
                );
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro no comando claim:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao verificar o status de claim!')
                .setColor('#FF4444')
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
