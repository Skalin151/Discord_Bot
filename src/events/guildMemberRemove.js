import { Events } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS } from '../utils/embedUtils.js';

export default {
    name: Events.GuildMemberRemove,
    execute(member) {
        const guild = member.guild;

        const embed = createSimpleLogEmbed(
            'Membro Saiu',
            `**${member.user.tag}** saiu do servidor`,
            LOG_COLORS.LEAVE,
            member.user
        );

        sendLogEmbed(guild, embed);
    },
};
