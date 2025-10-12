import { Events, AuditLogEvent } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS, getActionExecutor } from '../utils/embedUtils.js';

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const guild = newState.guild;
        const member = newState.member;

        // Ignorar bots
        if (member.user.bot) return;

        // User entrou em um canal de voz
        if (!oldState.channelId && newState.channelId) {
            const embed = createSimpleLogEmbed(
                'Entrou em Canal de Voz',
                `**${member.user.tag}** entrou no canal de voz **${newState.channel.name}**`,
                LOG_COLORS.JOIN,
                member.user
            );
            sendLogEmbed(guild, embed);
            return;
        }

        // User saiu de um canal de voz
        if (oldState.channelId && !newState.channelId) {
            // Verificar se foi desconectado por alguém
            const executor = await getActionExecutor(guild, AuditLogEvent.MemberDisconnect, member.id, 3000);
            
            if (executor && executor.id !== member.id) {
                const embed = createSimpleLogEmbed(
                    'Desconectado de Canal de Voz',
                    `**${executor.tag}** desconectou **${member.user.tag}** do canal de voz **${oldState.channel.name}**`,
                    LOG_COLORS.KICK,
                    executor
                );
                sendLogEmbed(guild, embed);
            } else {
                const embed = createSimpleLogEmbed(
                    'Saiu de Canal de Voz',
                    `**${member.user.tag}** saiu do canal de voz **${oldState.channel.name}**`,
                    LOG_COLORS.LEAVE,
                    member.user
                );
                sendLogEmbed(guild, embed);
            }
            return;
        }

        // User mudou de canal de voz
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            // Verificar se foi movido por alguém
            const executor = await getActionExecutor(guild, AuditLogEvent.MemberMove, member.id, 3000);
            
            if (executor && executor.id !== member.id) {
                const embed = createSimpleLogEmbed(
                    'Movido entre Canais de Voz',
                    `**${executor.tag}** moveu **${member.user.tag}** de **${oldState.channel.name}** para **${newState.channel.name}**`,
                    LOG_COLORS.UPDATE,
                    executor
                );
                sendLogEmbed(guild, embed);
            } else {
                const embed = createSimpleLogEmbed(
                    'Mudou de Canal de Voz',
                    `**${member.user.tag}** mudou de **${oldState.channel.name}** para **${newState.channel.name}**`,
                    LOG_COLORS.UPDATE,
                    member.user
                );
                sendLogEmbed(guild, embed);
            }
            return;
        }

        // Server mute
        if (oldState.serverMute !== newState.serverMute) {
            const executor = await getActionExecutor(guild, AuditLogEvent.MemberUpdate, member.id, 3000);
            
            if (newState.serverMute) {
                if (executor && executor.id !== member.id) {
                    const embed = createSimpleLogEmbed(
                        'Server Mute',
                        `**${executor.tag}** mutou **${member.user.tag}** no servidor`,
                        LOG_COLORS.MODERATE,
                        executor
                    );
                    sendLogEmbed(guild, embed);
                } else {
                    const embed = createSimpleLogEmbed(
                        'Server Mute',
                        `**${member.user.tag}** foi mutado no servidor`,
                        LOG_COLORS.MODERATE,
                        member.user
                    );
                    sendLogEmbed(guild, embed);
                }
            } else {
                if (executor && executor.id !== member.id) {
                    const embed = createSimpleLogEmbed(
                        'Server Unmute',
                        `**${executor.tag}** desmutou **${member.user.tag}** no servidor`,
                        LOG_COLORS.SUCCESS,
                        executor
                    );
                    sendLogEmbed(guild, embed);
                } else {
                    const embed = createSimpleLogEmbed(
                        'Server Unmute',
                        `**${member.user.tag}** foi desmutado no servidor`,
                        LOG_COLORS.SUCCESS,
                        member.user
                    );
                    sendLogEmbed(guild, embed);
                }
            }
            return;
        }

        // Server deafen
        if (oldState.serverDeaf !== newState.serverDeaf) {
            const executor = await getActionExecutor(guild, AuditLogEvent.MemberUpdate, member.id, 3000);
            
            if (newState.serverDeaf) {
                if (executor && executor.id !== member.id) {
                    const embed = createSimpleLogEmbed(
                        'Server Deafen',
                        `**${executor.tag}** ensurdeceu **${member.user.tag}** no servidor`,
                        LOG_COLORS.MODERATE,
                        executor
                    );
                    sendLogEmbed(guild, embed);
                } else {
                    const embed = createSimpleLogEmbed(
                        'Server Deafen',
                        `**${member.user.tag}** foi ensurdecido no servidor`,
                        LOG_COLORS.MODERATE,
                        member.user
                    );
                    sendLogEmbed(guild, embed);
                }
            } else {
                if (executor && executor.id !== member.id) {
                    const embed = createSimpleLogEmbed(
                        'Server Undeafen',
                        `**${executor.tag}** desensurdeceu **${member.user.tag}** no servidor`,
                        LOG_COLORS.SUCCESS,
                        executor
                    );
                    sendLogEmbed(guild, embed);
                } else {
                    const embed = createSimpleLogEmbed(
                        'Server Undeafen',
                        `**${member.user.tag}** foi desensurdecido no servidor`,
                        LOG_COLORS.SUCCESS,
                        member.user
                    );
                    sendLogEmbed(guild, embed);
                }
            }
            return;
        }
    },
};
