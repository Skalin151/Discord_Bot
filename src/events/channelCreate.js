import { Events, AuditLogEvent } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS, getActionExecutor } from '../utils/embedUtils.js';

export default {
    name: Events.ChannelCreate,
    async execute(channel) {
        if (!channel.guild) return;

        const guild = channel.guild;
        const executor = await getActionExecutor(guild, AuditLogEvent.ChannelCreate, channel.id);

        // Só mostrar se conseguirmos identificar quem criou
        if (!executor) return;

        const channelType = channel.type === 2 ? 'voz' : 'texto';
        
        const embed = createSimpleLogEmbed(
            'Canal Criado',
            `**${executor.tag}** criou o canal de ${channelType} **#${channel.name}**`,
            LOG_COLORS.CREATE,
            executor
        );

        sendLogEmbed(guild, embed);
    },
};
