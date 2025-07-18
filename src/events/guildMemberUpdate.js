import { Events, AuditLogEvent } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS, getActionExecutor } from '../utils/embedUtils.js';

export default {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        const guild = newMember.guild;

        // Verificar mudança de nickname
        if (oldMember.nickname !== newMember.nickname) {
            const executor = await getActionExecutor(guild, AuditLogEvent.MemberUpdate, newMember.id);
            
            // Só mostrar se conseguirmos identificar quem alterou
            if (!executor) return;
            
            const oldNick = oldMember.nickname || oldMember.user.username;
            const newNick = newMember.nickname || newMember.user.username;

            const embed = createSimpleLogEmbed(
                'Nickname Alterado',
                `**${executor.tag}** alterou o nickname de **${newMember.user.tag}** de **${oldNick}** para **${newNick}**`,
                LOG_COLORS.UPDATE,
                executor
            );
            sendLogEmbed(guild, embed);
        }

        // Verificar mudanças de roles
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        // Role adicionada
        for (const role of newRoles.values()) {
            if (!oldRoles.has(role.id) && role.name !== '@everyone') {
                const executor = await getActionExecutor(guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
                
                // Só mostrar se conseguirmos identificar quem adicionou
                if (!executor) continue;
                
                const embed = createSimpleLogEmbed(
                    'Role Adicionada',
                    `**${executor.tag}** adicionou a role **${role.name}** a **${newMember.user.tag}**`,
                    LOG_COLORS.ROLE,
                    executor
                );
                sendLogEmbed(guild, embed);
            }
        }

        // Role removida
        for (const role of oldRoles.values()) {
            if (!newRoles.has(role.id) && role.name !== '@everyone') {
                const executor = await getActionExecutor(guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
                
                // Só mostrar se conseguirmos identificar quem removeu
                if (!executor) continue;
                
                const embed = createSimpleLogEmbed(
                    'Role Removida',
                    `**${executor.tag}** removeu a role **${role.name}** de **${newMember.user.tag}**`,
                    LOG_COLORS.DELETE,
                    executor
                );
                sendLogEmbed(guild, embed);
            }
        }

        // Verificar timeout
        if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
            const executor = await getActionExecutor(guild, AuditLogEvent.MemberUpdate, newMember.id);
            
            // Só mostrar se conseguirmos identificar quem aplicou/removeu o timeout
            if (!executor) return;
            
            if (newMember.communicationDisabledUntil) {
                const embed = createSimpleLogEmbed(
                    'Timeout Aplicado',
                    `**${executor.tag}** colocou **${newMember.user.tag}** em timeout`,
                    LOG_COLORS.TIMEOUT,
                    executor
                );
                sendLogEmbed(guild, embed);
            } else {
                const embed = createSimpleLogEmbed(
                    'Timeout Removido',
                    `**${executor.tag}** removeu o timeout de **${newMember.user.tag}**`,
                    LOG_COLORS.JOIN,
                    executor
                );
                sendLogEmbed(guild, embed);
            }
        }
    },
};
