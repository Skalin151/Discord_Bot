import { Events } from 'discord.js';
import { createSimpleLogEmbed, sendLogEmbed, LOG_COLORS } from '../utils/embedUtils.js';

export default {
    name: Events.VoiceStateUpdate,
    execute(oldState, newState) {
        const member = newState.member;
        const guild = newState.guild;

        // Utilizador entrou num canal de voz
        if (!oldState.channel && newState.channel) {
            const embed = createSimpleLogEmbed(
                'Entrou na Chamada',
                `**${member.user.tag}** entrou em **${newState.channel.name}**`,
                LOG_COLORS.VOICE,
                member.user
            );
            sendLogEmbed(guild, embed);
        }

        // Utilizador saiu de um canal de voz
        if (oldState.channel && !newState.channel) {
            const embed = createSimpleLogEmbed(
                'Saiu da Chamada',
                `**${member.user.tag}** saiu de **${oldState.channel.name}**`,
                LOG_COLORS.LEAVE,
                member.user
            );
            sendLogEmbed(guild, embed);
        }

        // Utilizador mudou de canal de voz
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            const embed = createSimpleLogEmbed(
                'Mudou de Canal',
                `**${member.user.tag}** mudou de **${oldState.channel.name}** para **${newState.channel.name}**`,
                LOG_COLORS.UPDATE,
                member.user
            );
            sendLogEmbed(guild, embed);
        }
    },
};
