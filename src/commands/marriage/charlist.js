import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import charactersData from '../../config/characters.js';
import UserClaim from '../../models/UserClaim.js';

export default {
    name: 'charlist',
    aliases: ['cl', 'characters', 'list'],
    description: 'Lista todos os personagens disponíveis. Uso: %charlist [nome] (opcional para buscar)',
    async execute(client, message, args) {
        try {
            let allCharacters = charactersData;
            let isSearchMode = false;
            let searchTerm = '';

            // Se args fornecidos, fazer busca
            if (args.length > 0) {
                searchTerm = args.join(' ').toLowerCase();
                isSearchMode = true;
                
                // Procurar por nome
                allCharacters = charactersData.filter(char => 
                    char.name.toLowerCase().includes(searchTerm)
                );

                if (allCharacters.length === 0) {
                    return message.reply(`❌ Nenhum personagem encontrado para "${searchTerm}"!`);
                }
            }

            // Ordenar por pontos (decrescente) e depois por nome
            allCharacters.sort((a, b) => {
                const pointsA = a.points || 0;
                const pointsB = b.points || 0;
                
                // Se os pontos forem diferentes, ordenar por pontos (maior primeiro)
                if (pointsA !== pointsB) {
                    return pointsB - pointsA;
                }
                
                // Se os pontos forem iguais, ordenar alfabeticamente
                return a.name.localeCompare(b.name);
            });

            // Dividir em grupos de 10 para paginação
            const charactersPerPage = 10;
            const totalPages = Math.ceil(allCharacters.length / charactersPerPage);
            let currentPage = 1;
            
            const getPageCharacters = (page) => {
                const startIndex = (page - 1) * charactersPerPage;
                const endIndex = startIndex + charactersPerPage;
                return allCharacters.slice(startIndex, endIndex);
            };

            const createEmbed = async (page) => {
                const pageCharacters = getPageCharacters(page);
                const startIndex = (page - 1) * charactersPerPage;
                
                // Verificar quais personagens estão claimed
                const claimChecks = await Promise.all(
                    pageCharacters.map(char => UserClaim.isCharacterClaimed(char.name))
                );
                
                // Criar lista formatada
                const characterList = pageCharacters.map((char, index) => {
                    const genderEmoji = char.gender === 'female' ? '💕' : '💙';
                    const points = char.points || 0;
                    const claimedEmoji = claimChecks[index].claimed ? ' 💍' : '';
                    return `${startIndex + index + 1}. **${char.name}** ${genderEmoji} \`${points} pts\`${claimedEmoji}`;
                }).join('\n');

                // Título dinâmico baseado no modo
                const title = isSearchMode ? 
                    `🔍 Resultados para "${searchTerm}"` : 
                    '📋 Lista de Personagens';

                const embed = new EmbedBuilder()
                    .setTitle(title)
                    .setColor('#9932CC')
                    .setAuthor({ 
                        name: message.author.displayName, 
                        iconURL: message.author.displayAvatarURL() 
                    })
                    .setDescription(characterList)
                    .addFields(
                        { 
                            name: '📊 Total', 
                            value: `${allCharacters.length} personagem(s)`, 
                            inline: true 
                        },
                        { 
                            name: '📄 Página', 
                            value: `${page} de ${totalPages}`, 
                            inline: true 
                        },
                        {
                            name: '🎲 Géneros',
                            value: `💕 ${allCharacters.filter(c => c.gender === 'female').length} Feminino | 💙 ${allCharacters.filter(c => c.gender === 'male').length} Masculino`,
                            inline: true
                        },
                        {
                            name: '💰 Pontos',
                            value: `Média: **${Math.round(allCharacters.reduce((sum, c) => sum + (c.points || 0), 0) / allCharacters.length)}** pts`,
                            inline: true
                        }
                    )
                    .setTimestamp()
                    .setFooter({ 
                        text: '• %charinfo <nome> para detalhes • 💍 = Claimed' 
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

            const embed = await createEmbed(currentPage);
            const buttons = createButtons(currentPage);

            const listMessage = await message.reply({ 
                embeds: [embed], 
                components: buttons ? [buttons] : [] 
            });

            // Se há múltiplas páginas, criar collector para navegação
            if (totalPages > 1) {
                const collector = listMessage.createMessageComponentCollector({ 
                    componentType: ComponentType.Button, 
                    time: 300000 // 5 minutos
                });

                collector.on('collect', async interaction => {
                    if (interaction.user.id !== message.author.id) {
                        await interaction.reply({ 
                            content: 'Apenas quem pediu a lista pode navegar pelas páginas!', 
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

                    const newEmbed = await createEmbed(currentPage);
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

                    listMessage.edit({ components: [disabledButtons] }).catch(() => {});
                });
            }

        } catch (error) {
            console.error('❌ Erro no comando charlist:', error);
            await message.reply('❌ Ocorreu um erro ao procurar personagens!');
        }
    }
};
