import { Events } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS } from '../utils/embedUtils.js';

export default {
    name: Events.GuildMemberAdd,
    execute(member) {
        const guild = member.guild;

        const embed = createSimpleLogEmbed(
            'Membro Entrou',
            `**${member.user.tag}** entrou no servidor`,
            LOG_COLORS.JOIN,
            member.user
        );

        sendLogEmbed(guild, embed);
    },
};
