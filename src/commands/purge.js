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

            // Buscar mensagens para apagar (aumentando em 1 para incluir potencialmente a mensagem do comando)
            const messages = await message.channel.messages.fetch({ 
                limit: Math.min(amount + 1, 100)
            });

            // Garantir que a mensagem do comando seja incluída se não estiver na busca
            if (!messages.has(message.id)) {
                messages.set(message.id, message);
            }

            // Filtrar mensagens que não são muito antigas (Discord só permite apagar mensagens de até 14 dias)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const filteredMessages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);

            if (filteredMessages.size === 0) {
                return message.channel.send('❌ Não há mensagens válidas para apagar (mensagens devem ter menos de 14 dias).')
                    .then(msg => {
                        setTimeout(() => msg.delete().catch(() => {}), 5000);
                    });
            }

            // Apagar as mensagens (incluindo a mensagem do comando)
            await message.channel.bulkDelete(filteredMessages, true);

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

            let errorMessage = '❌ Ocorreu um erro ao tentar apagar as mensagens.';
            
            if (error.code === 50034) {
                errorMessage = '❌ Só posso apagar mensagens de até 14 dias!';
            } else if (error.code === 50013) {
                errorMessage = '❌ Não tenho permissão para apagar mensagens neste canal!';
            }

            // Enviar mensagem de erro no canal (não como resposta para evitar erro de mensagem não encontrada)
            try {
                const errorMsg = await message.channel.send(errorMessage);
                // Apagar a mensagem de erro após 5 segundos
                setTimeout(async () => {
                    try {
                        if (errorMsg.deletable) {
                            await errorMsg.delete();
                        }
                    } catch (deleteError) {
                        console.log('Não foi possível apagar a mensagem de erro:', deleteError.message);
                    }
                }, 5000);
            } catch (sendError) {
                console.error('Erro ao enviar mensagem de erro:', sendError);
            }
        }
    }
};
