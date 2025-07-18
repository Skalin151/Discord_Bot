import { Events, AuditLogEvent } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS, getActionExecutor } from '../utils/embedUtils.js';

export default {
    name: Events.GuildBanRemove,
    async execute(ban) {
        const guild = ban.guild;
        const user = ban.user;
        const executor = await getActionExecutor(guild, AuditLogEvent.MemberBanRemove, user.id);

        // Só mostrar se conseguirmos identificar quem desbaniu
        if (!executor) return;

        const embed = createSimpleLogEmbed(
            'Utilizador Desbanido',
            `**${executor.tag}** desbaniu **${user.tag}**`,
            LOG_COLORS.UNBAN,
            executor
        );

        sendLogEmbed(guild, embed);
    },
};
