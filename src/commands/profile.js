import { EmbedBuilder } from 'discord.js';
import User from '../models/User.js';

export default {
    name: 'profile',
    description: 'Mostra informações do utilizador.',
    async execute(client, message) {
        const userId = message.author.id;
        const user = await User.findOne({ userId });
        const points = user ? user.points : 0;
        const pointsSpent = user ? user.pointsSpent || 0 : 0;
        const createdAt = `<t:${Math.floor(message.author.createdTimestamp / 1000)}:F>`;
        const embed = new EmbedBuilder()
            .setTitle(`Perfil de ${message.author.username}`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: 'Pontos', value: `${points}`, inline: true },
                { name: 'Pontos Gastos', value: `${pointsSpent}`, inline: true },
                { name: 'Data de Criação', value: createdAt, inline: true }
            )
            .setColor(0x9932cc);
        await message.channel.send({ embeds: [embed] });
    }
};
