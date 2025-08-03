import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import UserClaim from '../models/UserClaim.js';
import User from '../models/User.js';
import charactersData from '../config/characters.js';

export default {
    name: 'divorce',
    aliases: ['release', 'unclaim'],
    description: 'Remove um personagem dos teus claims e recebe os pontos correspondentes',
    async execute(client, message, args) {
        try {
            // Verificar se foi fornecido um nome de personagem
            if (!args.length) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Nome do Personagem Necessário')
                    .setDescription('Tens de especificar o nome do personagem que queres fazer divorce!\n\n**Uso:** `%divorce <nome do personagem>`\n**Exemplo:** `%divorce V1`')
                    .setColor('#FF4444')
                    .setFooter({ text: 'Use %myclaims para ver os teus personagens claimed' });
                
                return message.reply({ embeds: [embed] });
            }

            // Obter o nome do personagem (join dos argumentos para suportar nomes com espaços)
            const characterName = args.join(' ');
            
            // Verificar se o utilizador tem este personagem claimed (antes de pedir confirmação)
            const existingClaim = await UserClaim.findOne({ 
                userId: message.author.id, 
                characterName: { $regex: new RegExp(`^${characterName}$`, 'i') }
            });

            if (!existingClaim) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Personagem Não Encontrado')
                    .setDescription(`Não tens o personagem **${characterName}** na tua coleção!\n\nUsa \`%myclaims\` para ver os teus personagens claimed.`)
                    .setColor('#FF4444')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Encontrar os dados do personagem para mostrar na confirmação
            const character = charactersData.find(char => 
                char.name.toLowerCase() === existingClaim.characterName.toLowerCase()
            );

            if (!character) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erro de Sistema')
                    .setDescription('Personagem não encontrado na base de dados!')
                    .setColor('#FF4444')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            const pointsToReceive = character.points || 0;
            const genderEmoji = character.gender === 'female' ? '💕' : '💙';
            const claimedDate = new Date(existingClaim.claimedAt).toLocaleDateString('pt-PT');

            // Criar embed de confirmação
            const confirmEmbed = new EmbedBuilder()
                .setTitle('💔 Confirmação de Divorce')
                .setDescription(`Tens a certeza que queres fazer divorce de **${character.name}** ${genderEmoji}?`)
                .setColor('#FFA500')
                .setThumbnail(character.images[0])
                .addFields(
                    { 
                        name: '💰 Pontos a Receber', 
                        value: `+${pointsToReceive} pontos`, 
                        inline: true 
                    },
                    { 
                        name: '📅 Claimed em', 
                        value: claimedDate, 
                        inline: true 
                    },
                    {
                        name: '⚠️ Aviso',
                        value: 'Após o divorce, este personagem ficará disponível para outros utilizadores fazerem claim!',
                        inline: false
                    }
                )
                .setAuthor({ 
                    name: message.author.displayName, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setTimestamp()
                .setFooter({ 
                    text: 'Escolhe uma opção abaixo:' 
                });

            // Criar botões de confirmação
            const confirmButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_divorce')
                        .setLabel('✅ Sim, fazer divorce')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_divorce')
                        .setLabel('❌ Cancelar')
                        .setStyle(ButtonStyle.Secondary)
                );

            const confirmMessage = await message.reply({ 
                embeds: [confirmEmbed], 
                components: [confirmButtons] 
            });

            // Criar collector para os botões
            const collector = confirmMessage.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 30000 // 30 segundos para responder
            });

            collector.on('collect', async interaction => {
                if (interaction.user.id !== message.author.id) {
                    await interaction.reply({ 
                        content: 'Apenas quem pediu o divorce pode confirmar!', 
                        ephemeral: true 
                    });
                    return;
                }

                if (interaction.customId === 'confirm_divorce') {
                    // Fazer o divorce
                    const divorceResult = await UserClaim.divorceCharacter(message.author.id, character.name);
                    
                    if (!divorceResult.success) {
                        await interaction.update({
                            embeds: [new EmbedBuilder()
                                .setTitle('❌ Erro')
                                .setDescription('Não foi possível fazer o divorce. O personagem pode já não estar na tua coleção.')
                                .setColor('#FF4444')
                                .setTimestamp()],
                            components: []
                        });
                        return;
                    }

                    // Obter ou criar utilizador
                    let user = await User.findOne({ userId: message.author.id });
                    if (!user) {
                        user = new User({ userId: message.author.id, points: 0 });
                    }

                    // Adicionar pontos ao utilizador
                    user.points += pointsToReceive;
                    await user.save();

                    // Criar embed de sucesso
                    const successEmbed = new EmbedBuilder()
                        .setTitle('💔 Divorce Concluído')
                        .setDescription(`Fizeste divorce de **${character.name}** ${genderEmoji}\n\n**Pontos recebidos:** \`+${pointsToReceive} pts\`\n**Saldo atual:** \`${user.points} pts\``)
                        .setColor('#00FF00')
                        .setThumbnail(character.images[0])
                        .addFields(
                            { 
                                name: '📅 Data do Claim Original', 
                                value: claimedDate, 
                                inline: true 
                            },
                            { 
                                name: '💰 Valor do Personagem', 
                                value: `${pointsToReceive} pontos`, 
                                inline: true 
                            },
                            {
                                name: '📊 Status',
                                value: `**${character.name}** agora está disponível para claim novamente!`,
                                inline: false
                            }
                        )
                        .setAuthor({ 
                            name: message.author.displayName, 
                            iconURL: message.author.displayAvatarURL() 
                        })
                        .setTimestamp()
                        .setFooter({ 
                            text: 'Pontos adicionados ao teu saldo!' 
                        });

                    await interaction.update({ 
                        embeds: [successEmbed], 
                        components: [] 
                    });

                } else if (interaction.customId === 'cancel_divorce') {
                    // Cancelar divorce
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle('❌ Divorce Cancelado')
                        .setDescription(`O divorce de **${character.name}** ${genderEmoji} foi cancelado.`)
                        .setColor('#808080')
                        .setTimestamp();

                    await interaction.update({ 
                        embeds: [cancelEmbed], 
                        components: [] 
                    });
                }
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    // Timeout - desativar botões
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('⏰ Tempo Esgotado')
                        .setDescription('O pedido de divorce expirou. Tenta novamente se ainda quiseres fazer divorce.')
                        .setColor('#808080')
                        .setTimestamp();

                    confirmMessage.edit({ 
                        embeds: [timeoutEmbed], 
                        components: [] 
                    }).catch(() => {});
                }
            });

        } catch (error) {
            console.error('❌ Erro no comando divorce:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erro no Sistema')
                .setDescription('Ocorreu um erro ao processar o divorce. Tenta novamente!')
                .setColor('#FF4444')
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
