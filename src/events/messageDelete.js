import { Events, AuditLogEvent } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS, getActionExecutor } from '../utils/embedUtils.js';

export default {
    name: Events.MessageDelete,
    async execute(message) {
        if (!message.guild || message.author?.bot) return;

        const guild = message.guild;
        const executor = await getActionExecutor(guild, AuditLogEvent.MessageDelete);

        if (executor) {
            const embed = createSimpleLogEmbed(
                'Mensagem Apagada',
                `**${executor.tag}** apagou uma mensagem de **${message.author?.tag || 'Utilizador desconhecido'}** em ${message.channel}`,
                LOG_COLORS.DELETE,
                executor
            );
            sendLogEmbed(guild, embed);
        }
    },
};
