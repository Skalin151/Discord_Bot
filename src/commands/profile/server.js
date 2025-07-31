import { EmbedBuilder } from 'discord.js';

export default {
    name: 'server',
    description: 'Mostra informações do servidor Discord.',
    async execute(client, message) {
        const guild = message.guild;
        if (!guild) return message.reply('Este comando só pode ser usado em servidores.');

        // Número de membros
        const totalMembers = guild.memberCount;
        // Número de bots
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        // Número de canais de texto
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size; // 0 = GUILD_TEXT
        // Número de canais de voz
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size; // 2 = GUILD_VOICE

        // Dono do servidor
        let ownerTag = 'Desconhecido';
        try {
            const owner = await guild.fetchOwner();
            ownerTag = owner.user ? `${owner.user.tag}` : `<@${guild.ownerId}>`;
        } catch {}
        // Data de criação
        const createdAt = `<t:${Math.floor(guild.createdTimestamp/1000)}:F>`;

        const desc = [
            `👑 **Dono:** ${ownerTag}`,
            `📅 **Criado em:** ${createdAt}`,
            `👥 **Membros:** ${totalMembers}`,
            `🤖 **Bots:** ${botCount}`,
            `💬 **Canais de Texto:** ${textChannels}`,
            `🔊 **Canais de Voz:** ${voiceChannels}`,
            `**ID:** ${guild.id}`,
            `**???:** 3: ----- .----`

        ].join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`Informações do Servidor: ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .setDescription(desc)
            .setColor(0x5865F2);

        await message.channel.send({ embeds: [embed] });
    }
};
