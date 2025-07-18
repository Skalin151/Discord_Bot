import { Events, AuditLogEvent } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS, getActionExecutor } from '../utils/embedUtils.js';

export default {
    name: Events.GuildBanAdd,
    async execute(ban) {
        const guild = ban.guild;
        const user = ban.user;
        const executor = await getActionExecutor(guild, AuditLogEvent.MemberBanAdd, user.id);

        // Só mostrar se conseguirmos identificar quem baniu
        if (!executor) return;

        const embed = createSimpleLogEmbed(
            'Utilizador Banido',
            `**${executor.tag}** baniu **${user.tag}**`,
            LOG_COLORS.BAN,
            executor
        );

        sendLogEmbed(guild, embed);
    },
};
