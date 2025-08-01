import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Ticket from '../models/Ticket.js';

export default {
    name: 'ticketInteraction',
    type: 'buttonInteraction',
    
    async execute(interaction) {
        if (!interaction.customId.startsWith('ticket_')) return;

        const [, action, ticketId] = interaction.customId.split('_');

        try {
            const ticket = await Ticket.findOne({ ticketId: ticketId });

            if (!ticket) {
                return interaction.reply({
                    content: '❌ Ticket não encontrado!',
                    ephemeral: true
                });
            }

            switch (action) {
                case 'view':
                    await this.handleViewTicket(interaction, ticket);
                    break;
                case 'close':
                    await this.handleCloseTicket(interaction, ticket);
                    break;
                default:
                    return interaction.reply({
                        content: '❌ Ação não reconhecida!',
                        ephemeral: true
                    });
            }

        } catch (error) {
            console.error('Erro na interação de ticket:', error);
            interaction.reply({
                content: '❌ Erro ao processar a ação!',
                ephemeral: true
            });
        }
    },

    async handleViewTicket(interaction, ticket) {
        // Verificar permissões (usuário dono ou staff)
        const isOwner = ticket.userId === interaction.user.id;
        const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

        if (!isOwner && !isStaff) {
            return interaction.reply({
                content: '❌ Você não tem permissão para ver este ticket!',
                ephemeral: true
            });
        }

        const statusEmoji = ticket.status === 'open' ? '🟢' : '🔴';
        const typeEmoji = ticket.type === 'bug' ? '🐛' : ticket.type === 'feedback' ? '💬' : ticket.type === 'suggestion' ? '💡' : '❓';

        const viewEmbed = new EmbedBuilder()
            .setTitle(`🎫 ${ticket.ticketId}`)
            .setColor(ticket.status === 'open' ? 0x00FF00 : 0xFF0000)
            .addFields(
                { name: '📂 Tipo', value: `${typeEmoji} ${ticket.type}`, inline: true },
                { name: '📊 Status', value: `${statusEmoji} ${ticket.status}`, inline: true },
                { name: '👤 Usuário', value: `${ticket.username} (${ticket.userId})`, inline: true },
                { name: '📅 Criado em', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`, inline: true },
                { name: '📝 Título', value: ticket.title, inline: false },
                { name: '📄 Descrição', value: ticket.description, inline: false }
            )
            .setTimestamp();

        if (ticket.attachments && ticket.attachments.length > 0) {
            viewEmbed.addFields({
                name: '📎 Anexos',
                value: ticket.attachments.map(a => `[${a.filename}](${a.url})`).join('\n'),
                inline: false
            });
        }

        if (ticket.closedAt) {
            viewEmbed.addFields({
                name: '🔒 Fechado em',
                value: `<t:${Math.floor(ticket.closedAt.getTime() / 1000)}:F>`,
                inline: true
            });

            if (ticket.closedBy) {
                viewEmbed.addFields({
                    name: '👤 Fechado por',
                    value: `<@${ticket.closedBy}>`,
                    inline: true
                });
            }
        }

        await interaction.reply({
            embeds: [viewEmbed],
            ephemeral: true
        });
    },

    async handleCloseTicket(interaction, ticket) {
        // Verificar permissões (usuário dono ou staff)
        const isOwner = ticket.userId === interaction.user.id;
        const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

        if (!isOwner && !isStaff) {
            return interaction.reply({
                content: '❌ Você não tem permissão para fechar este ticket!',
                ephemeral: true
            });
        }

        if (ticket.status === 'closed') {
            return interaction.reply({
                content: '❌ Este ticket já está fechado!',
                ephemeral: true
            });
        }

        // Fechar o ticket
        ticket.status = 'closed';
        ticket.closedAt = new Date();
        ticket.closedBy = interaction.user.id;
        await ticket.save();

        const closeEmbed = new EmbedBuilder()
            .setTitle('🔒 Ticket Fechado')
            .setDescription(`Ticket **${ticket.ticketId}** foi fechado com sucesso!`)
            .setColor(0xFF0000)
            .addFields(
                { name: 'Título', value: ticket.title, inline: false },
                { name: 'Usuário', value: `${ticket.username} (${ticket.userId})`, inline: true },
                { name: 'Fechado por', value: `${interaction.user.username}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [closeEmbed],
            ephemeral: false
        });

        // Notificar o usuário que criou o ticket (se não foi ele mesmo que fechou)
        if (ticket.userId !== interaction.user.id) {
            try {
                const user = await interaction.client.users.fetch(ticket.userId);
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔒 Seu ticket foi fechado')
                    .setDescription(`Seu ticket **${ticket.ticketId}** foi fechado.`)
                    .addFields(
                        { name: 'Título', value: ticket.title, inline: false },
                        { name: 'Fechado por', value: interaction.user.username, inline: true }
                    )
                    .setColor(0xFF0000)
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('Não foi possível enviar DM para o usuário:', dmError.message);
            }
        }

        // Log para canal de staff
        const logChannel = interaction.guild.channels.cache.find(c => 
            c.name.includes('ticket') && c.name.includes('log') || 
            c.name.includes('admin') || 
            c.name.includes('staff')
        );

        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🔒 Ticket Fechado')
                .setColor(0xFF0000)
                .addFields(
                    { name: 'ID', value: ticket.ticketId, inline: true },
                    { name: 'Tipo', value: ticket.type, inline: true },
                    { name: 'Usuário', value: `${ticket.username} (${ticket.userId})`, inline: true },
                    { name: 'Fechado por', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
                    { name: 'Título', value: ticket.title, inline: false }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }
    }
};
