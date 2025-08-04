import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import UserClaim from '../../models/UserClaim.js';
import User from '../../models/User.js';
import charactersData from '../../config/characters.js';
import AutoClearService from '../../services/autoClearService.js';

export default {
    name: 'clear',
    aliases: ['clearall', 'cleanclaims'],
    description: 'Limpa todos os claims e atribui pontos aos utilizadores (apenas owner)',
    async execute(client, message, args) {
        try {
            // Verificar se é o owner do bot
            const ownerId = '358926963446120448'; // Substitua pelo seu ID
            
            if (message.author.id !== ownerId) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sem Permissão')
                    .setDescription('Apenas o owner do bot pode usar este comando!')
                    .setColor('#FF4444')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Obter todos os claims
            const allClaims = await UserClaim.find({});
            
            if (allClaims.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('ℹ️ Nenhum Claim Encontrado')
                    .setDescription('Não há claims para limpar!')
                    .setColor('#FFA500')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Calcular pontos por utilizador
            const userPoints = new Map();
            let totalClaims = 0;
            let totalPoints = 0;

            for (const claim of allClaims) {
                const character = charactersData.find(char => 
                    char.name.toLowerCase() === claim.characterName.toLowerCase()
                );
                
                const points = character ? (character.points || 0) : 0;
                
                if (!userPoints.has(claim.userId)) {
                    userPoints.set(claim.userId, {
                        userId: claim.userId,
                        points: 0,
                        claimsCount: 0
                    });
                }
                
                const userData = userPoints.get(claim.userId);
                userData.points += points;
                userData.claimsCount += 1;
                
                totalClaims += 1;
                totalPoints += points;
            }

            // Criar embed de confirmação com estatísticas
            const confirmEmbed = new EmbedBuilder()
                .setTitle('🧹 Confirmação de Clear')
                .setDescription('Tens a certeza que queres limpar TODOS os claims do sistema?')
                .setColor('#FFA500')
                .addFields(
                    { 
                        name: '📊 Estatísticas', 
                        value: `**Total de Claims:** ${totalClaims}\n**Total de Utilizadores:** ${userPoints.size}\n**Total de Pontos:** ${totalPoints}`, 
                        inline: false 
                    },
                    {
                        name: '⚠️ Aviso',
                        value: 'Esta ação é IRREVERSÍVEL! Todos os claims serão removidos e os pontos correspondentes serão atribuídos aos utilizadores.',
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
                        .setCustomId('confirm_clear')
                        .setLabel('✅ Sim, limpar tudo')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('show_preview')
                        .setLabel('📊 Ver Preview')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('cancel_clear')
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
                time: 60000 // 60 segundos para responder
            });

            collector.on('collect', async interaction => {
                if (interaction.user.id !== message.author.id) {
                    await interaction.reply({ 
                        content: 'Apenas o owner pode confirmar!', 
                        ephemeral: true 
                    });
                    return;
                }

                if (interaction.customId === 'confirm_clear') {
                    await interaction.deferUpdate();
                    
                    // Processar clear usando o serviço
                    const clearResult = await AutoClearService.performManualClear(userPoints);
                    
                    // Criar embed de sucesso
                    const successEmbed = new EmbedBuilder()
                        .setTitle('🧹 Clear Concluído')
                        .setDescription('Todos os claims foram limpos com sucesso!')
                        .setColor('#00FF00')
                        .addFields(
                            { 
                                name: '📊 Resultados', 
                                value: `**Claims removidos:** ${clearResult.claimsRemoved}\n**Utilizadores afetados:** ${clearResult.usersUpdated}\n**Pontos distribuídos:** ${clearResult.totalPointsDistributed}`, 
                                inline: false 
                            },
                            {
                                name: '✅ Status',
                                value: 'Todos os personagens estão agora disponíveis para claim novamente!',
                                inline: false
                            }
                        )
                        .setTimestamp()
                        .setFooter({ 
                            text: 'Clear executado com sucesso!' 
                        });

                    await interaction.editReply({ 
                        embeds: [successEmbed], 
                        components: [] 
                    });

                } else if (interaction.customId === 'show_preview') {
                    // Mostrar preview dos pontos
                    const previewEmbed = await createPreviewEmbed(userPoints, client);
                    
                    await interaction.reply({ 
                        embeds: [previewEmbed], 
                        ephemeral: true 
                    });

                } else if (interaction.customId === 'cancel_clear') {
                    // Cancelar clear
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle('❌ Clear Cancelado')
                        .setDescription('O clear foi cancelado. Nenhum claim foi removido.')
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
                        .setDescription('O pedido de clear expirou. Tenta novamente se ainda quiseres fazer o clear.')
                        .setColor('#808080')
                        .setTimestamp();

                    confirmMessage.edit({ 
                        embeds: [timeoutEmbed], 
                        components: [] 
                    }).catch(() => {});
                }
            });

        } catch (error) {
            console.error('❌ Erro no comando clear:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erro no Sistema')
                .setDescription('Ocorreu um erro ao processar o clear. Tenta novamente!')
                .setColor('#FF4444')
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};

// Função para criar embed de preview
async function createPreviewEmbed(userPoints, client) {
    const embed = new EmbedBuilder()
        .setTitle('📊 Preview do Clear')
        .setDescription('Pontos que serão atribuídos a cada utilizador:')
        .setColor('#5865f2')
        .setTimestamp();

    const userEntries = Array.from(userPoints.values());
    
    // Ordenar por pontos (maior para menor)
    userEntries.sort((a, b) => b.points - a.points);

    // Limitar a 25 campos (limite do Discord)
    const maxEntries = Math.min(userEntries.length, 25);
    
    for (let i = 0; i < maxEntries; i++) {
        const userData = userEntries[i];
        
        try {
            const user = await client.users.fetch(userData.userId).catch(() => null);
            const userName = user ? user.displayName : `User ${userData.userId}`;
            
            embed.addFields({
                name: `${i + 1}. ${userName}`,
                value: `**+${userData.points}** pts (${userData.claimsCount} claims)`,
                inline: true
            });
        } catch (error) {
            console.error(`❌ Erro ao buscar utilizador ${userData.userId}:`, error);
        }
    }

    if (userEntries.length > 25) {
        embed.setFooter({ 
            text: `Mostrando top 25 de ${userEntries.length} utilizadores` 
        });
    }

    return embed;
}
