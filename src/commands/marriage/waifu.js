import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import charactersData, { getRandomCharacter } from '../../config/characters.js';
import { getConsistentImageSize } from '../../utils/embedUtils.js';
import UserRolls from '../../models/UserRolls.js';
import UserClaim from '../../models/UserClaim.js';
import User from '../../models/User.js';

export default {
    name: 'waifu',
    aliases: ['w', 'h', 'm','waifu', 'husbando', 'mix'],
    description: 'Faz roll de personagens de anime. %w (feminino), %h (masculino), %m (ambos)',
    async execute(client, message, args) {
        try {
            // Verificar e consumir roll do utilizador
            const rollResult = await UserRolls.consumeRoll(message.author.id);
            
            if (!rollResult.success) {
                const timeUntilReset = UserRolls.getTimeUntilReset();
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sem Rolls Disponíveis')
                    .setDescription(`Não tens mais rolls disponíveis! Os rolls resetam a cada hora.`)
                    .setColor('#FF4444')
                    .addFields({
                        name: '⏰ Próximo Reset',
                        value: `**${timeUntilReset.minutes}m ${timeUntilReset.seconds}s**`,
                        inline: true
                    })
                    .setFooter({ text: 'Receberás 3 rolls novos na próxima hora!' });
                
                return message.reply({ embeds: [embed] });
            }
            // Detectar tipo de roll baseado no comando usado
            const commandName = message.content.split(' ')[0].substring(1).toLowerCase(); // Remove %
            
            let genderFilter;
            let commandTitle;
            let commandColor;

            switch (commandName) {
                case 'w':
                case 'waifu':
                    genderFilter = 'female';
                    commandTitle = '💕 Female Roll';
                    commandColor = '#FF69B4'; // Rosa
                    break;
                case 'h':
                case 'husbando':
                    genderFilter = 'male';
                    commandTitle = '💙 Male Roll';
                    commandColor = '#4169E1'; // Azul
                    break;
                case 'm':
                case 'mix':
                    genderFilter = 'all';
                    commandTitle = '🎭 Character Roll';
                    commandColor = '#9932CC'; // Roxo
                    break;
                default:
                    return message.reply('❌ Comando inválido! Use %w (waifu), %h (husbando) ou %m (mix)');
            }

            // Obter personagens baseado no filtro
            let availableCharacters;
            if (genderFilter === 'all') {
                availableCharacters = charactersData;
            } else {
                availableCharacters = charactersData.filter(char => char.gender === genderFilter);
            }

            if (availableCharacters.length === 0) {
                return message.reply('❌ Nenhum personagem encontrado para este filtro!');
            }

            // Escolher personagem aleatório
            const character = getRandomCharacter(availableCharacters);

            // Verificar se o personagem já está claimed
            const claimInfo = await UserClaim.isCharacterClaimed(character.name);

            // Criar embed do personagem
            const embed = new EmbedBuilder()
                .setTitle(commandTitle)
                .setColor(commandColor)
                .setAuthor({ 
                    name: message.author.displayName, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .addFields(
                    { 
                        name: '👤 Personagem', 
                        value: `**${character.name}**`, 
                        inline: true 
                    },
                    { 
                        name: '💰 Pontos', 
                        value: `**${character.points || 0}** pts`, 
                        inline: true 
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Rolls restantes: ${rollResult.rollsRemaining}/3 | Género: ${character.gender === 'female' ? 'Feminino' : 'Masculino'} | Roll #${Math.floor(Math.random() * 10000)}` 
                });

            // Adicionar descrição se disponível
            let description = character.description || '';
            
            // Adicionar mensagem de rolls renovados se for uma nova hora
            if (rollResult.isNewHour && rollResult.rollsRemaining === 4) {
                description = `🎉 **Rolls renovados!** Recebeste 3 rolls novos!\n\n${description}`;
            }
            
            // Adicionar informação sobre claim
            if (claimInfo.claimed) {
                const owner = await client.users.fetch(claimInfo.owner).catch(() => null);
                const ownerName = owner ? owner.displayName : 'Utilizador Desconhecido';
                description += `\n\n💍 **Owned by:** ${ownerName}`;
            } else {
                description += `\n\n💫 **Disponível para claim!** Reage com qualquer emoji para fazer claim.`;
            }
            
            if (description) {
                embed.setDescription(description);
            }

            // Adicionar imagem se disponível (primeira imagem do array)
            if (character.images && Array.isArray(character.images) && character.images.length > 0) {
                const firstImage = character.images[0];
                if (firstImage && firstImage.startsWith('http')) {
                    embed.setImage(getConsistentImageSize(firstImage, 400, 400));
                }
            } else if (character.image && character.image.startsWith('http')) {
                // Compatibilidade com formato antigo (single image)
                embed.setImage(getConsistentImageSize(character.image, 400, 400));
            }

            const rollMessage = await message.channel.send({ embeds: [embed] });

            // Se o personagem não está claimed, adicionar sistema de reação para claim
            if (!claimInfo.claimed) {
                // Collector para reações
                const filter = (reaction, user) => !user.bot;
                const collector = rollMessage.createReactionCollector({ filter, time: 300000 }); // 5 minutos

                collector.on('collect', async (reaction, user) => {
                    try {
                        // Tentar fazer claim
                        const claimResult = await UserClaim.claimCharacter(user.id, character.name);
                        
                        if (claimResult.success) {
                            // Claim bem sucedido
                            const claimEmbed = new EmbedBuilder()
                                .setTitle('💍 Claim Bem Sucedido!')
                                .setDescription(`**${user.displayName}** fez claim de **${character.name}**!`)
                                .setColor('#00FF00')
                                .setThumbnail(user.displayAvatarURL())
                                .setTimestamp();
                            
                            await message.channel.send({ embeds: [claimEmbed] });
                            collector.stop('claimed');
                            
                        } else if (claimResult.reason === 'cooldown') {
                            // Utilizador em cooldown
                            const cooldownEmbed = new EmbedBuilder()
                                .setTitle('⏰ Cooldown Ativo')
                                .setDescription(`${user.displayName}, ainda não podes fazer claim!\n**Tempo restante:** ${claimResult.timeLeft.hours}h ${claimResult.timeLeft.minutes}m`)
                                .setColor('#FF4444')
                                .setTimestamp();
                            
                            const cooldownMsg = await message.channel.send({ embeds: [cooldownEmbed] });
                            setTimeout(() => cooldownMsg.delete().catch(() => {}), 10000); // Apagar após 10s
                            
                        } else if (claimResult.reason === 'already_claimed') {
                            // Personagem já foi claimed por outro utilizador
                            const owner = await client.users.fetch(claimResult.owner).catch(() => null);
                            const ownerName = owner ? owner.displayName : 'Utilizador Desconhecido';
                            
                            const alreadyClaimedEmbed = new EmbedBuilder()
                                .setTitle('❌ Já foi Claimed')
                                .setDescription(`**${character.name}** já foi claimed por **${ownerName}**!`)
                                .setColor('#FF4444')
                                .setTimestamp();
                            
                            const claimedMsg = await message.channel.send({ embeds: [alreadyClaimedEmbed] });
                            setTimeout(() => claimedMsg.delete().catch(() => {}), 10000); // Apagar após 10s
                        }
                        
                    } catch (error) {
                        console.error('❌ Erro ao processar claim:', error);
                    }
                });

                collector.on('end', (collected, reason) => {
                    if (reason !== 'claimed') {
                        // Remover reações após o tempo expirar
                        rollMessage.reactions.removeAll().catch(() => {});
                    }
                });
            } else {
                // Personagem já claimed - adicionar botão de bónus
                const bonusButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('bonus_points')
                            .setLabel('🎁')
                            .setStyle(ButtonStyle.Primary)
                    );

                await rollMessage.edit({ embeds: [embed], components: [bonusButton] });

                // Collector para o botão de bónus
                const bonusCollector = rollMessage.createMessageComponentCollector({ 
                    componentType: ComponentType.Button, 
                    time: 60000 // 1 minuto para clicar
                });

                bonusCollector.on('collect', async interaction => {
                    try {
                        if (interaction.customId === 'bonus_points') {
                            // Verificar cooldown de bónus
                            const bonusCheck = await UserClaim.canUserGetBonus(interaction.user.id);
                            
                            if (!bonusCheck.canGetBonus) {
                                // Utilizador em cooldown de bónus
                                await interaction.reply({ 
                                    content: `⏰ Ainda não podes ganhar bónus! Tempo restante: **${bonusCheck.timeLeft.hours}h ${bonusCheck.timeLeft.minutes}m**`, 
                                    ephemeral: true 
                                });
                                return;
                            }
                            
                            // Verificar se é o primeiro a clicar (sem cooldown)
                            if (bonusCollector.total === 1) {
                                // Obter ou criar utilizador
                                let user = await User.findOne({ userId: interaction.user.id });
                                if (!user) {
                                    user = new User({ userId: interaction.user.id, points: 0 });
                                }

                                // Adicionar 100 pontos
                                user.points += 100;
                                await user.save();

                                // Registrar tempo de bónus
                                await UserClaim.setBonusTime(interaction.user.id);

                                // Criar embed de sucesso
                                const bonusEmbed = new EmbedBuilder()
                                    .setTitle('🎉 Bónus Ganho!')
                                    .setDescription(`**${interaction.user.displayName}** foi o primeiro a clicar e ganhou **100 pontos**!`)
                                    .setColor('#FFD700')
                                    .setThumbnail(interaction.user.displayAvatarURL())
                                    .addFields(
                                        {
                                            name: '💰 Pontos Ganhos',
                                            value: '+100 pts',
                                            inline: true
                                        },
                                        {
                                            name: '💰 Saldo Atual',
                                            value: `${user.points} pts`,
                                            inline: true
                                        },
                                        {
                                            name: '⏰ Próximo Bónus',
                                            value: 'Em 3 horas',
                                            inline: true
                                        }
                                    )
                                    .setTimestamp();

                                await interaction.reply({ embeds: [bonusEmbed] });

                                // Desativar o botão
                                const disabledButton = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('bonus_claimed')
                                            .setLabel('✅')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    );

                                await rollMessage.edit({ embeds: [embed], components: [disabledButton] });
                                bonusCollector.stop('claimed');

                            } else {
                                // Não foi o primeiro
                                await interaction.reply({ 
                                    content: '❌ Alguém já reclamou o bónus! Mais sorte na próxima.', 
                                    ephemeral: true 
                                });
                            }
                        }
                    } catch (error) {
                        console.error('❌ Erro ao processar bónus:', error);
                        await interaction.reply({ 
                            content: '❌ Ocorreu um erro ao processar o bónus!', 
                            ephemeral: true 
                        });
                    }
                });

                bonusCollector.on('end', (collected) => {
                    if (collected.size === 0) {
                        // Ninguém clicou no botão - desativar
                        const expiredButton = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('bonus_expired')
                                    .setLabel('⏰')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true)
                            );

                        rollMessage.edit({ embeds: [embed], components: [expiredButton] }).catch(() => {});
                    }
                });
            }

        } catch (error) {
            console.error('❌ Erro no comando waifu:', error);
            await message.reply('❌ Ocorreu um erro ao fazer o roll! Tenta novamente.');
        }
    }
};
