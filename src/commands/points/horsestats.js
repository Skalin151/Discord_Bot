import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import Horse from '../../models/Horse.js';

export default {
    name: 'horsestats',
    description: 'Mostra estatísticas dos cavalos por paginação (10 por página)',
    async execute(client, message) {
        const horses = await Horse.find().sort({ horseId: 1 });
        if (horses.length === 0) {
            return message.channel.send('Nenhum cavalo encontrado.');
        }
        let page = 0;
        const pageSize = 10;
        const totalPages = Math.ceil(horses.length / pageSize);

        function getEmbed(page) {
            const start = page * pageSize;
            const end = start + pageSize;
            const horsesPage = horses.slice(start, end);
            const embed = new EmbedBuilder()
                .setTitle('🏇 Estatísticas dos Cavalos')
                .setColor(0x3498DB)
                .setFooter({ text: `Página ${page + 1} de ${totalPages}` });
            let desc = '';
            horsesPage.forEach(horse => {
                // Calcula winrate
                const winrate = horse.races > 0 ? ((horse.wins / horse.races) * 100).toFixed(1) : '0.0';
                // Traits formatados
                const traitsText = horse.traits && horse.traits.length ? horse.traits.join(', ') : 'Nenhum';
                desc += `${horse.emoji} **${horse.name}**\n` +
                    `Odds: **${horse.odds}x** | Vitórias: **${horse.wins}** | Corridas: **${horse.races}** | Winrate: **${winrate}%**\n` +
                    `Traits: *${traitsText}*\n\n`;
            });
            embed.setDescription(desc);
            return embed;
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('⬅️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('next').setLabel('➡️').setStyle(ButtonStyle.Secondary)
            );

        const sentMsg = await message.channel.send({ embeds: [getEmbed(page)], components: [row] });
        const { ComponentType } = await import('discord.js');
        const collector = sentMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) {
                await interaction.reply({ content: 'Só quem executou o comando pode navegar.', flags: MessageFlags.Ephemeral });
                return;
            }
            if (interaction.customId === 'prev') {
                page = page > 0 ? page - 1 : totalPages - 1;
            } else if (interaction.customId === 'next') {
                page = page < totalPages - 1 ? page + 1 : 0;
            }
            await interaction.update({ embeds: [getEmbed(page)], components: [row] });
        });

        collector.on('end', async () => {
            await sentMsg.edit({ components: [] });
        });
    },
};
