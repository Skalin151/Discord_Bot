import { Events } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS } from '../utils/embedUtils.js';

export default {
    name: Events.MessageUpdate,
    execute(oldMessage, newMessage) {
        if (!newMessage.guild || newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;

        const guild = newMessage.guild;

        const embed = createSimpleLogEmbed(
            'Mensagem Editada',
            `**${newMessage.author.tag}** editou uma mensagem em ${newMessage.channel}`,
            LOG_COLORS.UPDATE,
            newMessage.author
        );

        sendLogEmbed(guild, embed);
    },
};
