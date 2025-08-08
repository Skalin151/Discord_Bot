import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Ticket from '../../models/Ticket.js';

export default {
    name: 'ticket',
    description: 'Sistema de tickets para feedback, bugs e sugestões',
    
    async execute(client, message, args) {
        try {
            if (!args[0]) {
                const helpEmbed = new EmbedBuilder()
                    .setTitle('🎫 Sistema de Tickets')
                    .setDescription('Sistema para reportar bugs, dar feedback ou fazer sugestões')
                    .setColor(0x5865F2)
                    .addFields(
                        {
                            name: '📝 Criar Ticket',
                            value: '`%ticket create [tipo] [título]`\n**Tipos:** `feedback`, `bug`, `suggestion`, `other`',
                            inline: false
                        },
                        {
                            name: '📋 Ver Ticket',
                            value: '`%ticket view [ID]` - Ver detalhes de um ticket específico',
                            inline: false
                        },
                        {
                            name: '🔧 Admin (Staff)',
                            value: '`%ticket admin list` - Ver todos os tickets\n`%ticket admin close [ID]` - Fechar ticket',
                            inline: false
                        },
                        {
                            name: '💡 Exemplos',
                            value: '`%ticket create bug Bot não responde aos comandos`\n`%ticket create feedback Adorei o sistema de corridas!`',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Use os comandos acima para interagir com o sistema de tickets' });
                
                return message.channel.send({ embeds: [helpEmbed] });
            }

            const subcommand = args[0].toLowerCase();

            switch (subcommand) {
                case 'create':
                    await this.createTicket(message, args.slice(1));
                    break;
                case 'view':
                    await this.viewTicket(message, args[1]);
                    break;
                case 'admin':
                    await this.adminCommands(message, args.slice(1));
                    break;
                default:
                    message.channel.send('❌ Subcomando inválido! Use `%ticket` para ver a ajuda.');
            }

        } catch (error) {
            console.error('Erro no comando ticket:', error);
            message.channel.send('❌ Ocorreu um erro ao processar o comando ticket!');
        }
    },

    async createTicket(message, args) {
        if (args.length < 2) {
            return message.channel.send('❌ **Uso:** `%ticket create [tipo] [título]`\n**Tipos:** `feedback`, `bug`, `suggestion`, `other`');
        }

        const type = args[0].toLowerCase();
        const validTypes = ['feedback', 'bug', 'suggestion', 'other'];
        
        if (!validTypes.includes(type)) {
            return message.channel.send(`❌ **Tipo inválido!** Use um dos seguintes: \`${validTypes.join('`, `')}\``);
        }

        const title = args.slice(1).join(' ');
        if (title.length > 100) {
            return message.channel.send('❌ O título não pode ter mais de 100 caracteres!');
        }

        // Verificar se o usuário já tem um ticket aberto do mesmo tipo
        const existingTicket = await Ticket.findOne({
            userId: message.author.id,
            type: type,
            status: 'open'
        });

        if (existingTicket) {
            return message.channel.send(`❌ Você já tem um ticket **${type}** aberto: \`${existingTicket.ticketId}\`\nFeche-o primeiro ou aguarde a resposta da staff.`);
        }

        // Solicitar descrição
        const requestEmbed = new EmbedBuilder()
            .setTitle('📝 Criando Ticket')
            .setDescription(`**Tipo:** ${type}\n**Título:** ${title}\n\nPor favor, forneça uma **descrição detalhada** do seu ${type}.\nVocê tem **5 minutos** para responder.`)
            .setColor(0x5865F2)
            .setFooter({ text: 'Digite sua descrição na próxima mensagem' });

        await message.channel.send({ embeds: [requestEmbed] });

        // Coletar descrição
        const filter = m => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 300000, max: 1 });

        collector.on('collect', async (descMessage) => {
            const description = descMessage.content;
            
            if (description.length > 2000) {
                return message.channel.send('❌ A descrição não pode ter mais de 2000 caracteres!');
            }

            // Processar anexos se existirem
            const attachments = [];
            if (descMessage.attachments.size > 0) {
                descMessage.attachments.forEach(attachment => {
                    attachments.push({
                        url: attachment.url,
                        filename: attachment.name
                    });
                });
            }

            try {
                // Gerar ID único do ticket
                const ticketId = await Ticket.generateTicketId();

                // Salvar ticket na base de dados
                const ticket = new Ticket({
                    ticketId,
                    userId: message.author.id,
                    username: message.author.username,
                    guildId: message.guild.id,
                    type,
                    title,
                    description,
                    attachments
                });

                await ticket.save();

                // Criar embed de confirmação
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('✅ Ticket Criado com Sucesso!')
                    .setColor(0x00FF00)
                    .addFields(
                        { name: '🎫 ID do Ticket', value: ticketId, inline: true },
                        { name: '📂 Tipo', value: type, inline: true },
                        { name: '📝 Título', value: title, inline: false },
                        { name: '📄 Descrição', value: description.length > 200 ? description.substring(0, 200) + '...' : description, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Criado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

                if (attachments.length > 0) {
                    confirmEmbed.addFields({
                        name: '📎 Anexos',
                        value: attachments.map(a => `[${a.filename}](${a.url})`).join('\n'),
                        inline: false
                    });
                }

                // Botões de ação
                const actionRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`ticket_view_${ticketId}`)
                            .setLabel('Ver Ticket')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('👁️'),
                        new ButtonBuilder()
                            .setCustomId(`ticket_close_${ticketId}`)
                            .setLabel('Fechar Ticket')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🔒')
                    );

                await message.channel.send({ embeds: [confirmEmbed], components: [actionRow] });

                // Notificar staff se existir canal específico
                const logChannel = message.guild.channels.cache.find(c => 
                    c.name.includes('ticket') && c.name.includes('log') || 
                    c.name.includes('admin') || 
                    c.name.includes('staff')
                );

                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🎫 Novo Ticket Criado')
                        .setColor(0xFF9900)
                        .addFields(
                            { name: 'ID', value: ticketId, inline: true },
                            { name: 'Tipo', value: type, inline: true },
                            { name: 'Usuário', value: `${message.author.username} (${message.author.id})`, inline: true },
                            { name: 'Título', value: title, inline: false }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }

            } catch (error) {
                console.error('Erro ao criar ticket:', error);
                message.channel.send('❌ Erro ao criar ticket! Tente novamente.');
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.channel.send('⏰ Tempo esgotado! Criação de ticket cancelada.');
            }
        });
    },

    async viewTicket(message, ticketId) {
        if (!ticketId) {
            return message.channel.send('❌ **Uso:** `%ticket view [ID]`');
        }

        try {
            const ticket = await Ticket.findOne({ ticketId: ticketId });

            if (!ticket) {
                return message.channel.send('❌ Ticket não encontrado!');
            }

            // Verificar permissões (usuário dono ou staff)
            const isOwner = ticket.userId === message.author.id;
            const isStaff = message.member.permissions.has(PermissionFlagsBits.ManageMessages);

            if (!isOwner && !isStaff) {
                return message.channel.send('❌ Você não tem permissão para ver este ticket!');
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

            await message.channel.send({ embeds: [viewEmbed] });

        } catch (error) {
            console.error('Erro ao ver ticket:', error);
            message.channel.send('❌ Erro ao buscar ticket!');
        }
    },

    async adminCommands(message, args) {
        // Verificar se o usuário tem permissões de staff
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.channel.send('❌ Você não tem permissão para usar comandos administrativos!');
        }

        if (!args[0]) {
            return message.channel.send('❌ **Uso:** `%ticket admin [list|close] [argumentos]`');
        }

        const adminCommand = args[0].toLowerCase();

        try {
            switch (adminCommand) {
                case 'list':
                    await this.adminListTickets(message, args[1]);
                    break;
                case 'close':
                    await this.adminCloseTicket(message, args[1]);
                    break;
                default:
                    message.channel.send('❌ Comando admin inválido! Use: `list`, `close`');
            }
        } catch (error) {
            console.error('Erro em comando admin:', error);
            message.channel.send('❌ Erro ao executar comando administrativo!');
        }
    },

    async adminListTickets(message, status = 'all') {
        try {
            let query = {};
            if (status && status !== 'all') {
                query.status = status;
            }

            const tickets = await Ticket.find(query).sort({ createdAt: -1 }).limit(15);

            if (tickets.length === 0) {
                return message.channel.send('📋 Nenhum ticket encontrado.');
            }

            const listEmbed = new EmbedBuilder()
                .setTitle(`🛠️ Admin: Tickets ${status === 'all' ? 'Todos' : status} (${tickets.length})`)
                .setColor(0xFF9900)
                .setFooter({ text: `Mostrando ${tickets.length} tickets mais recentes` });

            let description = '';
            tickets.forEach(ticket => {
                const statusEmoji = ticket.status === 'open' ? '🟢' : '🔴';
                const typeEmoji = ticket.type === 'bug' ? '🐛' : ticket.type === 'feedback' ? '💬' : ticket.type === 'suggestion' ? '💡' : '❓';
                
                description += `${statusEmoji} ${typeEmoji} **${ticket.ticketId}** - ${ticket.title.substring(0, 40)}${ticket.title.length > 40 ? '...' : ''}\n`;
                description += `└ *${ticket.username} • ${new Date(ticket.createdAt).toLocaleDateString('pt-PT')}*\n\n`;
            });

            listEmbed.setDescription(description);
            await message.channel.send({ embeds: [listEmbed] });

        } catch (error) {
            console.error('Erro ao listar tickets admin:', error);
            message.channel.send('❌ Erro ao buscar tickets!');
        }
    },

    async adminCloseTicket(message, ticketId) {
        if (!ticketId) {
            return message.channel.send('❌ **Uso:** `%ticket admin close [ID]`');
        }

        try {
            const ticket = await Ticket.findOne({ ticketId: ticketId });

            if (!ticket) {
                return message.channel.send('❌ Ticket não encontrado!');
            }

            if (ticket.status === 'closed') {
                return message.channel.send('❌ Este ticket já está fechado!');
            }

            ticket.status = 'closed';
            ticket.closedAt = new Date();
            ticket.closedBy = message.author.id;
            await ticket.save();

            const closeEmbed = new EmbedBuilder()
                .setTitle('🔒 Ticket Fechado')
                .setDescription(`Ticket **${ticket.ticketId}** foi fechado com sucesso!`)
                .setColor(0xFF0000)
                .addFields(
                    { name: 'Título', value: ticket.title, inline: false },
                    { name: 'Usuário', value: `${ticket.username} (${ticket.userId})`, inline: true },
                    { name: 'Fechado por', value: `${message.author.username}`, inline: true }
                )
                .setTimestamp();

            await message.channel.send({ embeds: [closeEmbed] });

            // Notificar o usuário que criou o ticket
            try {
                const user = await message.client.users.fetch(ticket.userId);
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔒 Seu ticket foi fechado')
                    .setDescription(`Seu ticket **${ticket.ticketId}** foi fechado pela staff.`)
                    .addFields(
                        { name: 'Título', value: ticket.title, inline: false },
                        { name: 'Fechado por', value: message.author.username, inline: true }
                    )
                    .setColor(0xFF0000)
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('Não foi possível enviar DM para o usuário:', dmError.message);
            }

        } catch (error) {
            console.error('Erro ao fechar ticket:', error);
            message.channel.send('❌ Erro ao fechar ticket!');
        }
    }
};
