import { Events, AuditLogEvent } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS, getActionExecutor } from '../utils/embedUtils.js';

export default {
    name: Events.ChannelUpdate,
    async execute(oldChannel, newChannel) {
        const guild = newChannel.guild;

        // Verificar mudança de nome
        if (oldChannel.name !== newChannel.name) {
            const executor = await getActionExecutor(guild, AuditLogEvent.ChannelUpdate, newChannel.id);
            
            // Só mostrar se conseguirmos identificar quem alterou
            if (!executor) return;

            const embed = createSimpleLogEmbed(
                'Canal Renomeado',
                `**${executor.tag}** renomeou **#${oldChannel.name}** para **#${newChannel.name}**`,
                LOG_COLORS.UPDATE,
                executor
            );
            sendLogEmbed(guild, embed);
        }
    },
};
