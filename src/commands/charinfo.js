import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import charactersData from '../config/characters.js';
import { getConsistentImageSize } from '../utils/embedUtils.js';
import UserClaim from '../models/UserClaim.js';

export default {
    name: 'charinfo',
    aliases: ['ci', 'character', 'info'],
    description: 'Mostra informações detalhadas de um personagem. Uso: %charinfo <nome>',
    async execute(client, message, args) {
        try {
            if (args.length === 0) {
                return message.reply('❌ Especifica o nome do personagem!\nExemplo: `%charinfo Naruto` ou `%charinfo Mikasa Ackerman`');
            }

            const searchName = args.join(' ').toLowerCase();
            
            // Procurar personagem por nome (busca mais flexível)
            const character = charactersData.find(char => 
                char.name.toLowerCase().includes(searchName) ||
                searchName.includes(char.name.toLowerCase())
            );

            if (!character) {
                // Sugerir personagens similares
                const suggestions = charactersData
                    .filter(char => {
                        const charWords = char.name.toLowerCase().split(' ');
                        const searchWords = searchName.split(' ');
                        return searchWords.some(word => 
                            charWords.some(charWord => charWord.includes(word) || word.includes(charWord))
                        );
                    })
                    .slice(0, 3)
                    .map(char => char.name)
                    .join(', ');

                let errorMessage = `❌ Personagem "${args.join(' ')}" não encontrado!`;
                if (suggestions) {
                    errorMessage += `\n💡 **Sugestões:** ${suggestions}`;
                }
                
                return message.reply(errorMessage);
            }

            // Preparar imagens
            let images = [];
            if (character.images && Array.isArray(character.images)) {
                images = character.images.filter(img => img && img.startsWith('http'));
            } else if (character.image && character.image.startsWith('http')) {
                images = [character.image];
            }

            // Verificar se o personagem está claimed
            const claimInfo = await UserClaim.isCharacterClaimed(character.name);

            let currentImageIndex = 0;

            const createEmbed = async (imageIndex = 0) => {
                const genderEmoji = character.gender === 'female' ? '💕' : '💙';
                const genderName = character.gender === 'female' ? 'Feminino' : 'Masculino';
                const claimEmoji = claimInfo.claimed ? ' 💍' : '';

                const embed = new EmbedBuilder()
                    .setTitle(`${genderEmoji} ${character.name}${claimEmoji}`)
                    .setColor(character.gender === 'female' ? '#FF69B4' : '#4169E1')
                    .setAuthor({ 
                        name: message.author.displayName, 
                        iconURL: message.author.displayAvatarURL() 
                    });

                // Campos básicos
                const fields = [
                    { 
                        name: '👤 Género', 
                        value: genderName, 
                        inline: true 
                    },
                    { 
                        name: '💰 Pontos', 
                        value: `**${character.points || 0}** pts`, 
                        inline: true 
                    }
                ];

                // Adicionar campo de owner se claimed
                if (claimInfo.claimed) {
                    try {
                        const owner = await client.users.fetch(claimInfo.owner);
                        fields.push({
                            name: '💍 Owned by',
                            value: `**${owner.displayName}**`,
                            inline: true
                        });
                    } catch (error) {
                        fields.push({
                            name: '� Owned by',
                            value: 'Utilizador Desconhecido',
                            inline: true
                        });
                    }
                }

                // Adicionar descrição
                fields.push({
                    name: '📝 Descrição',
                    value: character.description || 'Sem descrição disponível.',
                    inline: false
                });

                embed.addFields(fields)
                    .setTimestamp();

                // Adicionar informação sobre múltiplas imagens no footer
                if (images.length > 1) {
                    embed.setFooter({ 
                        text: `ID: ${charactersData.indexOf(character) + 1} | Imagem ${imageIndex + 1}/${images.length} | Use %w, %h ou %m para fazer roll!` 
                    });
                } else {
                    embed.setFooter({ 
                        text: `ID: ${charactersData.indexOf(character) + 1} | Use %w, %h ou %m para fazer roll!` 
                    });
                }

                // Adicionar imagem se disponível
                if (images.length > 0 && images[imageIndex]) {
                    embed.setImage(getConsistentImageSize(images[imageIndex], 400, 400));
                }

                return embed;
            };

            const createButtons = () => {
                if (images.length <= 1) return null;

                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev_image')
                            .setLabel('⬅️ Anterior')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentImageIndex === 0),
                        new ButtonBuilder()
                            .setCustomId('next_image')
                            .setLabel('➡️ Próxima')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentImageIndex === images.length - 1)
                    );
            };

            const embed = await createEmbed(currentImageIndex);
            const buttons = createButtons();

            const infoMessage = await message.reply({ 
                embeds: [embed], 
                components: buttons ? [buttons] : [] 
            });

            // Se há múltiplas imagens, criar collector para navegação
            if (images.length > 1) {
                const collector = infoMessage.createMessageComponentCollector({ 
                    componentType: ComponentType.Button, 
                    time: 300000 // 5 minutos
                });

                collector.on('collect', async interaction => {
                    if (interaction.user.id !== message.author.id) {
                        await interaction.reply({ 
                            content: 'Apenas quem pediu a informação pode navegar pelas imagens!', 
                            ephemeral: true 
                        });
                        return;
                    }

                    if (interaction.customId === 'prev_image' && currentImageIndex > 0) {
                        currentImageIndex--;
                    } else if (interaction.customId === 'next_image' && currentImageIndex < images.length - 1) {
                        currentImageIndex++;
                    }

                    const newEmbed = await createEmbed(currentImageIndex);
                    const newButtons = createButtons();

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
                                .setCustomId('disabled_prev')
                                .setLabel('⬅️ Anterior')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('disabled_next')
                                .setLabel('➡️ Próxima')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );

                    infoMessage.edit({ components: [disabledButtons] }).catch(() => {});
                });
            }

        } catch (error) {
            console.error('❌ Erro no comando charinfo:', error);
            await message.reply('❌ Ocorreu um erro ao obter informações do personagem!');
        }
    }
};
