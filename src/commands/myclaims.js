import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import UserClaim from '../models/UserClaim.js';
import charactersData from '../config/characters.js';

export default {
    name: 'myclaims',
    aliases: ['claims', 'owned', 'collection'],
    description: 'Mostra os teus personagens claimed',
    async execute(client, message, args) {
        try {
            // Obter claims do utilizador
            const rawUserClaims = await UserClaim.getUserClaims(message.author.id);
            
            // Ordenar claims por pontos dos personagens (maior primeiro)
            const userClaims = rawUserClaims.sort((a, b) => {
                const charA = charactersData.find(char => char.name === a.characterName);
                const charB = charactersData.find(char => char.name === b.characterName);
                const pointsA = charA?.points || 0;
                const pointsB = charB?.points || 0;
                
                // Se os pontos forem diferentes, ordenar por pontos (maior primeiro)
                if (pointsA !== pointsB) {
                    return pointsB - pointsA;
                }
                
                // Se os pontos forem iguais, ordenar por data de claim (mais recente primeiro)
                return new Date(b.claimedAt) - new Date(a.claimedAt);
            });
            
            if (userClaims.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 A Tua Coleção')
                    .setDescription('Ainda não tens nenhum personagem claimed!\nUsa `%w`, `%h` ou `%m` para fazer roll e reage para fazer claim.')
                    .setColor('#FFD700')
                    .setAuthor({ 
                        name: message.author.displayName, 
                        iconURL: message.author.displayAvatarURL() 
                    })
                    .setFooter({ text: 'Claims resetam a cada 3 horas!' });
                
                return message.reply({ embeds: [embed] });
            }

            // Paginação
            const claimsPerPage = 10;
            const totalPages = Math.ceil(userClaims.length / claimsPerPage);
            let currentPage = 1;
            
            const getPageClaims = (page) => {
                const startIndex = (page - 1) * claimsPerPage;
                const endIndex = startIndex + claimsPerPage;
                return userClaims.slice(startIndex, endIndex);
            };

            const createEmbed = (page) => {
                const pageClaims = getPageClaims(page);
                const startIndex = (page - 1) * claimsPerPage;
                
                // Criar lista formatada
                const claimsList = pageClaims.map((claim, index) => {
                    // Encontrar personagem nos dados para obter género e pontos
                    const character = charactersData.find(char => char.name === claim.characterName);
                    const genderEmoji = character?.gender === 'female' ? '💕' : '💙';
                    const points = character?.points || 0;
                    const claimedDate = new Date(claim.claimedAt).toLocaleDateString('pt-PT');
                    
                    return `${startIndex + index + 1}. **${claim.characterName}** ${genderEmoji} \`${points} pts\` • ${claimedDate}`;
                }).join('\n');

                // Calcular estatísticas
                const totalPoints = userClaims.reduce((sum, claim) => {
                    const character = charactersData.find(char => char.name === claim.characterName);
                    return sum + (character?.points || 0);
                }, 0);

                const femaleCount = userClaims.filter(claim => {
                    const character = charactersData.find(char => char.name === claim.characterName);
                    return character?.gender === 'female';
                }).length;

                const maleCount = userClaims.length - femaleCount;

                const embed = new EmbedBuilder()
                    .setTitle('💍 A Tua Coleção')
                    .setColor('#FFD700')
                    .setAuthor({ 
                        name: message.author.displayName, 
                        iconURL: message.author.displayAvatarURL() 
                    })
                    .setDescription(claimsList)
                    .addFields(
                        { 
                            name: '📊 Total Claims', 
                            value: `**${userClaims.length}** personagens`, 
                            inline: true 
                        },
                        { 
                            name: '📄 Página', 
                            value: `${page} de ${totalPages}`, 
                            inline: true 
                        },
                        { 
                            name: '💰 Pontos Totais', 
                            value: `**${totalPoints}** pts`, 
                            inline: true 
                        },
                        {
                            name: '🎲 Distribuição',
                            value: `💕 ${femaleCount} Feminino | 💙 ${maleCount} Masculino`,
                            inline: false
                        }
                    )
                    .setTimestamp()
                    .setFooter({ 
                        text: 'Ordenado por pontos (maior → menor) • %charinfo <nome> para ver detalhes!' 
                    });

                return embed;
            };

            const createButtons = (page) => {
                if (totalPages <= 1) return null;

                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('first_page')
                            .setLabel('⏮️ Primeira')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === 1),
                        new ButtonBuilder()
                            .setCustomId('prev_page')
                            .setLabel('⬅️ Anterior')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === 1),
                        new ButtonBuilder()
                            .setCustomId('next_page')
                            .setLabel('➡️ Próxima')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === totalPages),
                        new ButtonBuilder()
                            .setCustomId('last_page')
                            .setLabel('⏭️ Última')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === totalPages)
                    );
            };

            const embed = createEmbed(currentPage);
            const buttons = createButtons(currentPage);

            const claimsMessage = await message.reply({ 
                embeds: [embed], 
                components: buttons ? [buttons] : [] 
            });

            // Se há múltiplas páginas, criar collector para navegação
            if (totalPages > 1) {
                const collector = claimsMessage.createMessageComponentCollector({ 
                    componentType: ComponentType.Button, 
                    time: 300000 // 5 minutos
                });

                collector.on('collect', async interaction => {
                    if (interaction.user.id !== message.author.id) {
                        await interaction.reply({ 
                            content: 'Apenas quem pediu a coleção pode navegar pelas páginas!', 
                            ephemeral: true 
                        });
                        return;
                    }

                    switch (interaction.customId) {
                        case 'first_page':
                            currentPage = 1;
                            break;
                        case 'prev_page':
                            if (currentPage > 1) currentPage--;
                            break;
                        case 'next_page':
                            if (currentPage < totalPages) currentPage++;
                            break;
                        case 'last_page':
                            currentPage = totalPages;
                            break;
                    }

                    const newEmbed = createEmbed(currentPage);
                    const newButtons = createButtons(currentPage);

                    await interaction.update({ 
                        embeds: [newEmbed], 
                        components: newButtons ? [newButtons] : [] 
                    });
                });

                collector.on('end', () => {
                    // Desativar botões quando expira
                    const disabledButtons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('disabled_first')
                                .setLabel('⏮️ Primeira')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('disabled_prev')
                                .setLabel('⬅️ Anterior')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('disabled_next')
                                .setLabel('➡️ Próxima')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('disabled_last')
                                .setLabel('⏭️ Última')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );

                    claimsMessage.edit({ components: [disabledButtons] }).catch(() => {});
                });
            }

        } catch (error) {
            console.error('❌ Erro no comando myclaims:', error);
            await message.reply('❌ Ocorreu um erro ao obter a tua coleção!');
        }
    }
};
