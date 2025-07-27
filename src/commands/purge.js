import { PermissionFlagsBits } from 'discord.js';

export default {
    name: 'purge',
    description: 'Apaga as últimas 100 mensagens do canal',
    permissions: [PermissionFlagsBits.ManageMessages],

    async execute(client, message, args) {
        try {
            // Verificar se o usuário tem permissão de administrador
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply('❌ Apenas administradores podem usar este comando!');
            }

            // Verificar se o bot tem permissão para gerenciar mensagens
            if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return message.reply('❌ Eu não tenho permissão para gerenciar mensagens neste canal!');
            }

            // Número de mensagens para apagar (máximo 100, mínimo 1)
            let amount = 100;

            // Se um número foi fornecido como argumento, usar ele (máximo 100)
            if (args[0]) {
                const providedAmount = parseInt(args[0]);
                if (!isNaN(providedAmount) && providedAmount > 0 && providedAmount <= 100) {
                    amount = providedAmount;
                } else if (providedAmount > 100) {
                    amount = 100;
                    message.reply('⚠️ Máximo de 100 mensagens por vez. Apagando 100 mensagens...');
                }
            }

            // Buscar mensagens para apagar (incluindo a mensagem do comando)
            const messages = await message.channel.messages.fetch({ 
                limit: amount + 1, // +1 para incluir a mensagem do comando
                before: message.id 
            });

            // Filtrar mensagens que não são muito antigas (Discord só permite apagar mensagens de até 14 dias)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const filteredMessages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);

            if (filteredMessages.size === 0) {
                return message.reply('❌ Não há mensagens válidas para apagar (mensagens devem ter menos de 14 dias).');
            }

            // Apagar as mensagens
            await message.channel.bulkDelete(filteredMessages, true);

            // Apagar também a mensagem do comando
            if (message.deletable) {
                await message.delete();
            }

            // Enviar confirmação (será apagada após alguns segundos)
            const confirmMessage = await message.channel.send(
                `✅ **${filteredMessages.size} mensagem(s) apagada(s) com sucesso!**`
            );

            // Apagar a mensagem de confirmação após 3 segundos
            setTimeout(async () => {
                try {
                    if (confirmMessage.deletable) {
                        await confirmMessage.delete();
                    }
                } catch (error) {
                    console.log('Não foi possível apagar a mensagem de confirmação:', error.message);
                }
            }, 3000);

        } catch (error) {
            console.error('Erro ao executar comando purge:', error);

            if (error.code === 50034) {
                message.reply('❌ Só posso apagar mensagens de até 14 dias!');
            } else if (error.code === 50013) {
                message.reply('❌ Não tenho permissão para apagar mensagens neste canal!');
            } else {
                message.reply('❌ Ocorreu um erro ao tentar apagar as mensagens.');
            }
        }
    }
};
