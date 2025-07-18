import { Events, AuditLogEvent } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS, getActionExecutor } from '../utils/embedUtils.js';

export default {
    name: Events.ChannelDelete,
    async execute(channel) {
        if (!channel.guild) return;

        const guild = channel.guild;
        const executor = await getActionExecutor(guild, AuditLogEvent.ChannelDelete, channel.id);

        // Só mostrar se conseguirmos identificar quem apagou
        if (!executor) return;

        const embed = createSimpleLogEmbed(
            'Canal Apagado',
            `**${executor.tag}** apagou o canal **#${channel.name}**`,
            LOG_COLORS.DELETE,
            executor
        );

        sendLogEmbed(guild, embed);
    },
};
